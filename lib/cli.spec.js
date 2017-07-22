
import test from 'ava';
import path from 'path';
import {
  spawn,
} from 'child_process';

import pkg from '../package.json';

const CLI_PATH = path.resolve(process.cwd(), './lib/cli.js');

test('no arguments supplied', async (t) => {
  t.is(await runCli(), '');
});

test('unknown arguments displayed to user', async (t) => {
  const pattern = /Unkown Option Supplied:\sz/;
  const regEx = new RegExp(pattern, 'gm');

  t.true(regEx.test(await runCli(['-z'])));
});

test('unknown arguments shows help', async (t) => {
  const pattern = /Usage:\n\s{4}qotd\s\[options\]\n\nOutputs a Quote of the Day to shell\./;
  const regEx = new RegExp(pattern, 'gm');
  t.true(regEx.test(await runCli(['-z'])));
});

test('-m argument', async (t) => {
  const regEx = new RegExp('"max":400', 'gm');
  t.true(regEx.test(await runCli(['-m=400'])));
});

test('--max argument', async (t) => {
  const regEx = new RegExp('"max":400', 'gm');
  t.true(regEx.test(await runCli(['--max=400'])));
});

test('-q argument', async (t) => {
  const regEx = new RegExp('quote":"bold.magenta.bgBlue"', 'gm');
  t.true(regEx.test(await runCli(['-q=bold.magenta.bgBlue'])));
});

test('--quote-color argument', async (t) => {
  const regEx = new RegExp('"quote":"bold.magenta.bgBlue"', 'gm');
  t.true(regEx.test(await runCli(['--quote-color=bold.magenta.bgBlue'])));
});

test('-a argument', async (t) => {
  const regEx = new RegExp('author":"bold.magenta.bgBlue"', 'gm');
  t.true(regEx.test(await runCli(['-a=bold.magenta.bgBlue'])));
});

test('--author-color argument', async (t) => {
  const regEx = new RegExp('"author":"bold.magenta.bgBlue"', 'gm');
  t.true(regEx.test(await runCli(['--author-color=bold.magenta.bgBlue'])));
});

test('-C argument', async (t) => {
  const regEx = new RegExp('"color":{"enabled":false}}', 'gm');
  t.true(regEx.test(await runCli(['-C'])));
});

test('--no-colors argument', async (t) => {
  const regEx = new RegExp('"color":{"enabled":false}}', 'gm');
  t.true(regEx.test(await runCli(['--no-colors'])));
});

test('-x argument', async (t) => {
  const regEx = new RegExp('"offline":true', 'gm');
  t.true(regEx.test(await runCli(['-x'])));
});

test('--offline argument', async (t) => {
  const regEx = new RegExp('"offline":true', 'gm');
  t.true(regEx.test(await runCli(['--offline'])));
});

test('-v argument', async (t) => {
  const version = `\nqotd:\nv${pkg.version}\n`;
  t.is(await runCli(['-v']), version);
});

test('--version argument', async (t) => {
  const version = `\nqotd:\nv${pkg.version}\n`;
  t.is(await runCli(['--version']), version);
});

test('-h argument', async (t) => {
  const pattern = /Usage:\n\s{4}qotd\s\[options\]\n\nOutputs a Quote of the Day to shell\./;
  const regEx = new RegExp(pattern, 'gm');
  t.true(regEx.test(await runCli(['-h'])));
});

test('--help argument', async (t) => {
  const pattern = /Usage:\n\s{4}qotd\s\[options\]\n\nOutputs a Quote of the Day to shell\./;
  const regEx = new RegExp(pattern, 'gm');
  t.true(regEx.test(await runCli(['--help'])));
});

test('? argument', async (t) => {
  const pattern = /Usage:\n\s{4}qotd\s\[options\]\n\nOutputs a Quote of the Day to shell\./;
  const regEx = new RegExp(pattern, 'gm');
  t.true(regEx.test(await runCli(['?'])));
});

function runCli(qotdArgs = []) {
  const args = qotdArgs;
  let output = '';

  return new Promise((resolve) => {
    const child = spawn(CLI_PATH, args);
    child.stdout
      .on('data', (response) => {
        output += response;
      });

    child
      .on('close', () => {
        resolve(output);
      });
  });
}
