# node-git-deployor [![NPM version][npm-image]][npm-url]

> A git pusher helper in node. 

## Install

```sh
$ npm install --save-dev node-git-deployor
```


## Usage

```js

'use strict';

var pkg = require('package.json');

var Deployor = require('node-git-deployor');

function publishBuiltFiles() {

  var distWorkspace = Deployor.cloneRepoBranch({
    orphan: true,
    branch: 'dist',
    cloneLocation: '/tmp/dist'
  });

  distWorkspace.extraCleanUp();
  distWorkspace.copy('./dist');
  distWorkspace.commit('Update ' + new Date().toISOString());
  distWorkspace.tag('v' + pkg.version);
  distWorkspace.push();

}


function publishNewSourceRelease() {

  var srcWorkspace = new Deployor();
  srcWorkspace.commit('chore(release): v' + pkg.version);
  srcWorkspace.tag('src' + pkg.version);
  srcWorkspace.push();

}

```


## License

    Copyright © 2014 Douglas Duteil <douglasduteil@gmail.com>
    This work is free. You can redistribute it and/or modify it under the
    terms of the Do What The Fuck You Want To Public License, Version 2,
    as published by Sam Hocevar. See the LICENCE file for more details.



[npm-url]: https://npmjs.org/package/node-git-deployor
[npm-image]: http://img.shields.io/npm/v/node-git-deployor.svg
