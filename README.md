# arena-core

Arena core module includes all the arena type definitions

## Installation

### 1. Authentication

You must use a personal access token with the appropriate scopes to install the package from GitHub Packages.

You can authenticate to GitHub Packages with npm by either editing your per-user ~/.npmrc file to include your personal access token or by logging in to npm on the command line using your username and personal access token.

To authenticate by adding your personal access token to your ~/.npmrc file, edit the ~/.npmrc file for your project to include the following line, replacing TOKEN with your personal access token. Create a new ~/.npmrc file if one doesn't exist.

```shell
//npm.pkg.github.com/:_authToken=TOKEN
```

To authenticate by logging in to npm, use the npm login command, replacing USERNAME with your GitHub username, TOKEN with your personal access token, and PUBLIC-EMAIL-ADDRESS with your email address.

If GitHub Packages is not your default package registry for using npm and you want to use the npm audit command, we recommend you use the --scope flag with the owner of the package when you authenticate to GitHub Packages.

```shell
$ npm login --scope=@OWNER --registry=https://npm.pkg.github.com

> Username: USERNAME
> Password: TOKEN
> Email: PUBLIC-EMAIL-ADDRESS
```

> For more information see [Authenticating to GitHub Packages](https://docs.github.com/en/packages/guides/configuring-npm-for-use-with-github-packages#authenticating-to-github-packages)

### 2. .npmrc

Create a new .npmrc file if one doesn't exist and add:

```shell
@openforis:registry=https://npm.pkg.github.com
always-auth = true
```

### 3. .yarnrc

Create a new .yarnrc file if one doesn't exist and add:

```shell
"@openforis:registry" "https://npm.pkg.github.com"
```

### 4. Add the package

```shell
yarn add @openforis/arena-core
```

or

```shell
npm install @openforis/arena-core
```
