# OBS helpers

This repository contains various helper scripts for working with OBS.

## repoclosure

This script runs dnf's repoclosure on the published repository of your OBS
project, which checks whether every package in the repository can be installed.

Prerequisites:
- `dnf`
- `nodejs` >= 10
- `yarn` or `npm`

Usage:
```ShellSession
$ yarn install
$ yarn run build
$ EXPORT OBS_USERNAME="your_username"
$ EXPORT OBS_PASSWORD="your_obs_password" # you might want to unset histfile before doing this
$ node build/bin.js --project $NAME_OF_THE_PROJECT_TO_CHECK --repository $NAME_OF_THE_REPO_TO_CHECK
```

This will try to retrieve the full repository "chain". OBS will automatically
recursively include the repositories from the last path in your repositories
configuration. E.g. if your repository configuration is the following:
```xml
<repository name="openSUSE_Tumbleweed_and_ruby">
  <path project="devel:languages:ruby:extensions" repository="openSUSE_Tumbleweed"/>
  <path project="openSUSE:Factory" repository="snapshot"/>
  <arch>x86_64</arch>
</repository>
```
then OBS will include all repositories defined in the repository
`openSUSE:Factory/snapshot` in the build root (and it will continue this
expansion in `openSUSE:Factory` until there is nothing to expand).

This script tries to fetch the repository configuration for all projects in this
expanded chain, dumps them into a temporary dnf configuration file and then runs
repoclosure on that.

Caveats:
- This does not work with repositories based on SLE, as there are no published
  repositories available without a subscription.
- You will very likely get errors due to left over binaries of old builds that
  never got deleted (you might want to delete these though). You can work around
  that by filtering for specific packages and/or architectures:
  `node build/bin.js -P $Proj -r $Repo -a x86_64 i586 -p pkg1 pkg2 pkg3`
