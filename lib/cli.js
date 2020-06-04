#! /usr/bin/env node

// obtain environment, setting default to production.
// used to stub qotd module for testing.
const { NODE_ENV = 'production' } = process.env;

const fs   = require('fs');
const path = require('path');
const yargs = require('yargs');
const Qotd = (NODE_ENV.toLowerCase() === 'test') ? testingHelper : require('./qotd');
const pkg  = require('../package.json');

// set the process title
process.title = 'qotd';

parseArgs();

function parseArgs() {
  const options = {};
  const colors = {
    enabled: true,
  };

  yargs
    .help(false)
    .version(false);

  const argumentsList = yargs.parse(process.argv);

  Object.keys(argumentsList)
    .forEach((arg) => {
      switch (arg) {
        case '$0':
          // yargs default path to script
          break;
        case '_':
          if (argumentsList[arg].includes('?')) {
            options.help = true;
          }
          break;
        case 'm':
        case 'max':
          options.max = argumentsList[arg];
          break;
        case 'q':
        case 'quote-color':
        case 'quoteColor':
          colors.quote = argumentsList[arg];
          break;
        case 'a':
        case 'author-color':
        case 'authorColor':
          colors.author = argumentsList[arg];
          break;
        case 'C':
        case 'colors':
          colors.enabled = false;
          break;
        case 'x':
        case 'offline':
          options.offline = true;
          break;
        case 'v':
        case 'version':
          options.version = true;
          break;
        case 'h':
        case 'help':
          options.help = true;
          break;
        default:
          process.stdout.write(`\nUnkown Option Supplied: ${arg}`);
          options.help = true;
          break;
      }
    });

  // show version if requested
  if (options.version) {
    outputVersion();
    if (!options.help) {
      process.exit();
    }
  }

  // show help if requested
  if (options.help) {
    outputHelp();
  }

  // check if any options were set,
  // or if the colors were disabled
  // or any color setting was set
  if (
    Object.keys(options).length > 0
      || !colors.enabled
      || colors.quote
      || colors.author
  ) {
    // some options were set.
    // apply color information
    options.colors = colors;

    // Go Go Gadget Quote of the Day!!
    // console.log(qotd(options));
    return new Qotd(options);
  }

  // no args supplied. carry on.
  return new Qotd();
}

function outputVersion() {
  const versionString = `qotd:\nv${pkg.version}`;
  process.stdout.write(`\n${versionString}\n`);
}

function outputHelp() {
  const usagePath = path.resolve(__dirname, 'qotd-usage.txt');
  process.stdout.write(`\n${fs.readFileSync(usagePath, 'utf8')}\n`);
  process.exit(0);
}

function testingHelper(...args) {
  const options = JSON.stringify(args[0]) || '';
  process.stdout.write(options);
}
