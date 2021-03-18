# arena-core

Arena core module includes all the arena type definitions

## how to publish?

To publish a new package two files on the root folder are needed:

.npmrc

```
    scripts-prepend-node-path=true
    @openforis:registry=https://npm.pkg.github.com
    _authToken = TOKEN
    always-auth = true
```

This TOKEN should have full repo, packages, delete permissions.

.yarnrc

```
    "@openforis:registry" "https://npm.pkg.github.com"
```

After have this files just run

`yarn publish`
