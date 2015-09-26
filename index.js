'use strict'

var path = require('path')
var _assign = require('lodash.assign')
var sh = require('shelljs')
var snakeCase = require('snake-case')

module.exports = Deployor

/**
 * @description
 * This is the deployor system
 *
 * @param {Object} options - The deployment options
 *
 * @constructor
 */
function Deployor (options) {
  this.options = _assign(
    {},
    Deployor.defaults,
    options
  )

  // TODO move this
  Object.keys(this.options).forEach(function (key) {
    process.env[snakeCase(key).toUpperCase()] = this.options[key]
  }.bind(this))
}

Deployor.defaults = {
  cwd : process.cwd(),
  branch: 'master'
}

Deployor.verbose = false
sh.config.silent = !Deployor.verbose

var e = Deployor.exec = function (cmd) {
  if (Deployor.verbose) {
    console.log('$ ', cmd)
  }
  return sh.exec(cmd)
}

Deployor.cloneRepoBranch = function cloneRepoBranch (options) {
  options.cloneLocation = path.resolve(options.cloneLocation)

  var res

  // Get the remote.origin.url
  res = e('git config --get remote.origin.url')
  if (res.code > 0) throw new Error('Can\'t get no remote.origin.url !')

  options.repoUrl = process.env.REPO || String(res.output).split(/[\n\r]/).shift()
  if (!options.repoUrl) throw new Error('No repo link !')

  ///

  // TODO move this
  Object.keys(options).forEach(function (key) {
    process.env[snakeCase(key).toUpperCase()] = options[key]
  })

  ///

  // Remove tmp file
  e('rm -rf $CLONE_LOCATION')

  ///

  // Clone the repo branch to a special location (clonedRepoLocation)
  res = e('git clone --branch=$BRANCH --single-branch $REPO_URL $CLONE_LOCATION')
  if (res.code > 0) {
    // try again without banch options
    res = e('git clone $REPO_URL $CLONE_LOCATION')
    if (res.code > 0) throw new Error('Can\'t clone !')
  }

  ///

  // Go to the cloneLocation
  sh.cd(options.cloneLocation)

  if (sh.pwd() !== options.cloneLocation) {
    throw new Error('Can\'t access to the clone location : ' + options.cloneLocation + ' from ' + sh.pwd())
  }

  e('git clean -f -d')
  e('git fetch origin')

  // Checkout a branch (create an orphan if it doesn't exist on the remote).
  res = e('git ls-remote --exit-code . origin/$BRANCH')
  if (res.code > 0) {
    // branch doesn't exist, create an orphan
    res = e('git checkout --orphan $BRANCH')
    if (res.code > 0) throw new Error('Can\'t clone !')
  } else {
    // branch exists on remote, hard reset
    e('git checkout $BRANCH')
  }

  return new Deployor(options)
}

Deployor.prototype = {
  extraCleanUp: function () {
    // Empty the clone
    e('git rm --ignore-unmatch -rfq \'\\.[^\\.]*\' *')
  },
  copy: function (srcPath) {
    process.env.SRC_PATH = path.resolve(path.join(this.options.cwd, srcPath))

    var res
    // Copie the targeted files
    res = e('cp -rf $SRC_PATH/* ./')
    if (res && res.code > 0) throw new Error(res.output)
    res = e('cp -rf "$SRC_PATH/.[a-zA-Z0-9]*" ./')
  },
  commit: function (commitMessage) {
    process.env.COMMIT_MESSAGE = commitMessage
    e('git add .')
    e('git commit -m "$COMMIT_MESSAGE"')
  },
  tag: function (tagMessage) {
    process.env.TAG_MESSAGE = tagMessage
    var res = e('git tag $TAG_MESSAGE')
    if (res && res.code > 0) console.log('Can\'t tag failed, continuing !')
  },
  push: function () {
    var res = e('git push --tags origin $BRANCH')
    if (res && res.code > 0) throw new Error(res.output)
  }
}
