/**
 * Copyright (c) 2020 SUSE LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { ConfigIniParser } from "config-ini-parser";
import { promises as fsPromises } from "fs";
import {
  Connection,
  fetchProjectsPathsRecursively,
  fetchProjectsRpmRepositoryConfigFile,
  isProcessError,
  rmRf,
  runProcess
} from "open-build-service-api";
import { tmpdir } from "os";
import { join } from "path";

function getMainSection(tmpDir: string): string {
  return `[main]
keepcache=1
debuglevel=2
reposdir=/dev/null
logdir=${tmpDir}
retries=20
obsoletes=1
gpgcheck=0
assumeyes=1
best=1
install_weak_deps=0
metadata_expire=0
mdpolicy=group:primary

`;
}

export async function runRepoclosure(
  con: Connection,
  projectName: string,
  repositoryName: string,
  { archs, pkgs }: { archs?: string[]; pkgs?: string[] } = {}
): Promise<string | undefined> {
  const paths = await fetchProjectsPathsRecursively(
    con,
    projectName,
    repositoryName
  );

  const firstPath = paths.shift();

  if (firstPath === undefined) {
    throw new Error(
      `cannot run repoclosure: no paths received for ${projectName}/${repositoryName}`
    );
  }

  const firstRepo = await fetchProjectsRpmRepositoryConfigFile(
    con,
    firstPath.project,
    firstPath.repository
  );

  if (firstRepo === undefined) {
    throw new Error(
      `cannot run repoclosure: no valid repository was retrieved for ${firstPath.project}/${firstPath.repository}`
    );
  }

  const parser = new ConfigIniParser();
  const firstRepoSections = parser.parse(firstRepo).sections();

  const repos: string[] = [firstRepo];

  for (const path of paths) {
    const repo = await fetchProjectsRpmRepositoryConfigFile(
      con,
      path.project,
      path.repository
    );
    if (repo !== undefined) {
      repos.push(repo);
    }
  }

  const tempdir = await fsPromises.mkdtemp(
    join(tmpdir(), `dnf_repo_${projectName}_${repositoryName}`)
  );

  try {
    const confFile = join(tempdir, "dnf.conf");
    await fsPromises.writeFile(
      confFile,
      `${getMainSection(tempdir)}${repos.join("\n")}`
    );
    const args = ["--config", confFile, "repoclosure"];
    firstRepoSections.forEach((repoName) => args.push("--check", repoName));

    (pkgs ?? []).forEach((pkg) => args.push("--pkg", pkg));
    (archs ?? []).forEach((arch) => args.push("--arch", arch));

    await runProcess("dnf", { args });
    return undefined;
  } catch (err) {
    if (isProcessError(err)) {
      return err.stdout.join("\n");
    }
    throw err;
  } finally {
    await rmRf(tempdir);
  }
}
