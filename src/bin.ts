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

import { Connection } from "open-build-service-api";
import { runRepoclosure } from "./generate-config";
import { ArgumentParser } from "argparse";

const parser = new ArgumentParser({
  description:
    "Helper to check for not rpms in a OBS repository, that cannot be installed"
});

parser.add_argument("-P", "--project", {
  type: "str",
  nargs: 1,
  required: true,
  help: "The name of the project that should be checked"
});
parser.add_argument("-r", "--repository", {
  type: "str",
  nargs: 1,
  required: true,
  help: "The name of the repository that should be checked"
});
parser.add_argument("-u", "--url", {
  type: "str",
  nargs: 1,
  default: ["https://api.opensuse.org"],
  help: "Alternative URL to the API (defaults to OBS)"
});
parser.add_argument("-p", "--package", {
  type: "str",
  nargs: "+",
  help:
    "Only check this package for being installable (can be provided multiple times)"
});
parser.add_argument("-a", "--arch", {
  type: "str",
  nargs: "+",
  help:
    "Only check this architecture for being installable (multiple architectures can be supplied)"
});

const args = parser.parse_args();

const con = new Connection(
  process.env.OBS_USERNAME!,
  process.env.OBS_PASSWORD!,
  { url: args.url[0] }
);

runRepoclosure(con, args.project[0], args.repository[0], {
  archs: args.arch,
  pkgs: args.package
})
  .then((res) => {
    if (res === undefined) {
      console.log("repoclosure succeeded!");
    } else {
      process.exitCode = 2;
      console.log(res);
    }
  })
  .catch((reason) => {
    console.error(reason);
    process.exitCode = 1;
  });
