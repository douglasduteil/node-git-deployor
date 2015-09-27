#! /usr/bin/env node

var Deployor = require('../')
var path = require('path')
var yargs = require('yargs')
var _defaults = require('lodash.defaults')

var argv = yargs
  .usage('Usage: $0 [directory] [options]')
  .example('$0 --orphan -b gh-pages -d pages', 'Deploy on an orphan gh-pages')
  // --directory
  .option('d', {
    alias: 'directory',
    default: path.join('/', 'tmp', path.basename(process.cwd())),
    nargs: 1,
    describe: 'The directory to copy.',
    type: 'string'
  })
  // --branch
  .option('b', {
    alias: 'branch',
    default: 'master',
    nargs: 1,
    describe: 'The branch to deploy to.',
    type: 'string'
  })
  // --help
  .help('h')
  .alias('h', 'help')
  // --orphan
  .option('orphan', {
    default: false,
    nargs: 0,
    describe: 'Use orphan branch',
    type: 'boolean'
  })
  // --push
  .option('push', {
    default: false,
    nargs: 0,
    describe: 'Push the result',
    type: 'boolean'
  })
  // --tag
  .option('tag', {
    default: false,
    describe: 'Tag the deployed commit'
  })
  // --verbose
  .option('verbose', {
    default: true,
    nargs: 0,
    type: 'boolean'
  })
  // --version
  .version(function () {
    return require('../package').version
  })
  .argv

deployment(argv)

//

function deployment (options) {
  options = _defaults(options, {
    commit: 'Update ' + new Date().toISOString()
  })

  Deployor.verbose = options.verbose
  if (typeof options.tag === 'boolean' && options.tag) {
    var clientPkg = getClientPackageJSON()
    options.tag = 'v' + clientPkg.version
  }

  var workspace = Deployor.cloneRepoBranch(options)

  workspace.extraCleanUp()
  workspace.copy(options.directory)
  workspace.commit(options.commit)

  if (options.tag) {
    workspace.tag(options.tag)
  }

  if (options.push) {
    workspace.push()
  }
}

function getClientPackageJSON () {
  var pkg
  var clientPackageJSONPath = path.join(process.cwd(), 'package')
  try {
    pkg = require(clientPackageJSONPath)
  } catch (e) {
    throw new Error('Cannot find ' + clientPackageJSONPath)
  }
  return pkg
}
