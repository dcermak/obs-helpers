# OBS helpers

This repository contains various helper scripts for working with OBS.

## repoclosure

This script runs dnf's repoclosure on your OBS project, which checks every
packages in the published repository, whether they can be installed.

Prerequisites:
- dnf
- nodejs >= 10
- yarn or npm

Usage:
```ShellSession
$ yarn install
$ yarn run build
$ node build/bin.js --project $NAME_OF_THE_PROJECT_TO_CHECK --repository $NAME_OF_THE_REPO_TO_CHECK
```

This will try to retrieve the full repository "chain" (i.e. the published
repository of your project and all included repositories from your repository
config) and then run `dnf repoclosure` on that configuration.

Caveats:
- This does not work with repositories based on SLE, as there are no published
  repositories available without a subscription.
- You will very likely get errors due to left over binaries of old builds that
  never got deleted. You can work around that by filtering for specific packages
  and/or architectures:
  `node build/bin.js -P $Proj -r $Repo -a x86_64 i586 -p pkg1 pkg2 pkg3`
