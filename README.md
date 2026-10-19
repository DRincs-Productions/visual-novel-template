# my-app-project-name

my-app-description

## Install dependencies

Use npm ci --include=optional with the committed lockfile. TypeScript and other native
tools require optional packages for each platform; preserve their lockfile entries for
Windows, Linux and macOS when updating dependencies. A lockfile containing only the
developer's platform can install successfully elsewhere but fail during the build.
