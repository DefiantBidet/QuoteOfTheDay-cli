
const test = require('ava');
const path = require('path');
const { spawn } = require('child_process');
const nock = require('nock');
const querystring = require('querystring');

const pkg = require('../package.json');

const CLI_PATH = path.resolve(process.cwd(), './lib/cli.js');

const mockPostBody = querystring.stringify({
  format: 'json',
  lang:   'en',
  method: 'getQuote',
});

const mockPostHeaders = {
  'Content-Type':     'application/x-www-form-urlencoded',
  'Content-Length':   Buffer.byteLength(mockPostBody),
  'X-Requested-With': 'qotd-cli',
  'User-Agent':       'Qotd',
};

const mockPostResponse = {
  quoteText:   'Foo',
  quoteAuthor: 'Bar',
  senderName:  '',
  senderLink:  '',
  quoteLink:   'http://google.com',
};

const runCli = (qotdArgs = []) => {
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
};

test.before(() => {
  // mock the api calls so we're not spamming the api server.
  nock(
    'http://api.forismatic.com',
    {
      reqHeaders: mockPostHeaders,
    },
  )
    .persist()
    .post('/api/1.0/', mockPostBody)
    .reply(200, JSON.stringify(mockPostResponse));
});


test.after.always(() => {
  nock.cleanAll();
  nock.restore();
});

test.serial('no arguments supplied', async (t) => {
  t.is(await runCli(), '');
});

test.serial('unknown arguments displayed to user', async (t) => {
  const pattern = /Unkown Option Supplied:\sz/;
  const regEx = new RegExp(pattern, 'gm');

  t.true(regEx.test(await runCli(['-z'])));
});

test.serial('unknown arguments shows help', async (t) => {
  const pattern = /Usage:\n\s{4}qotd\s\[options\]\n\nOutputs a Quote of the Day to shell\./;
  const regEx = new RegExp(pattern, 'gm');
  t.true(regEx.test(await runCli(['-z'])));
});

test.serial('-m argument', async (t) => {
  const regEx = new RegExp('"max":400', 'gm');
  t.true(regEx.test(await runCli(['-m=400'])));
});

test.serial('--max argument', async (t) => {
  const regEx = new RegExp('"max":400', 'gm');
  t.true(regEx.test(await runCli(['--max=400'])));
});

test.serial('-q argument', async (t) => {
  const regEx = new RegExp('quote":"bold.magenta.bgBlue"', 'gm');
  t.true(regEx.test(await runCli(['-q=bold.magenta.bgBlue'])));
});

test.serial('--quote-color argument', async (t) => {
  const regEx = new RegExp('"quote":"bold.magenta.bgBlue"', 'gm');
  t.true(regEx.test(await runCli(['--quote-color=bold.magenta.bgBlue'])));
});

test.serial('-a argument', async (t) => {
  const regEx = new RegExp('author":"bold.magenta.bgBlue"', 'gm');
  t.true(regEx.test(await runCli(['-a=bold.magenta.bgBlue'])));
});

test.serial('--author-color argument', async (t) => {
  const regEx = new RegExp('"author":"bold.magenta.bgBlue"', 'gm');
  t.true(regEx.test(await runCli(['--author-color=bold.magenta.bgBlue'])));
});

test.serial('-C argument', async (t) => {
  const regEx = new RegExp('"colors":{"enabled":false}}', 'gm');
  t.true(regEx.test(await runCli(['-C'])));
});

test.serial('--no-colors argument', async (t) => {
  const regEx = new RegExp('"colors":{"enabled":false}}', 'gm');
  t.true(regEx.test(await runCli(['--no-colors'])));
});

test.serial('-x argument', async (t) => {
  const regEx = new RegExp('"offline":true', 'gm');
  t.true(regEx.test(await runCli(['-x'])));
});

test.serial('--offline argument', async (t) => {
  const regEx = new RegExp('"offline":true', 'gm');
  t.true(regEx.test(await runCli(['--offline'])));
});

test.serial('-v argument', async (t) => {
  const version = `\nqotd:\nv${pkg.version}\n`;
  t.is(await runCli(['-v']), version);
});

test.serial('--version argument', async (t) => {
  const version = `\nqotd:\nv${pkg.version}\n`;
  t.is(await runCli(['--version']), version);
});

test.serial('-h argument', async (t) => {
  const pattern = /Usage:\n\s{4}qotd\s\[options\]\n\nOutputs a Quote of the Day to shell\./;
  const regEx = new RegExp(pattern, 'gm');
  t.true(regEx.test(await runCli(['-h'])));
});

test.serial('--help argument', async (t) => {
  const pattern = /Usage:\n\s{4}qotd\s\[options\]\n\nOutputs a Quote of the Day to shell\./;
  const regEx = new RegExp(pattern, 'gm');
  t.true(regEx.test(await runCli(['--help'])));
});

test.serial('? argument', async (t) => {
  const pattern = /Usage:\n\s{4}qotd\s\[options\]\n\nOutputs a Quote of the Day to shell\./;
  const regEx = new RegExp(pattern, 'gm');
  t.true(regEx.test(await runCli(['?'])));
});
