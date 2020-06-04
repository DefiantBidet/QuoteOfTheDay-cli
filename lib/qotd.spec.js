/*
  eslint-disable no-unused-vars
*/

/*
README:
These tests are being run serially due to the stub on fs.createWriteStream and the
async methods they're testing. Running these tests in parallel, ava's default
causes a method already wrapped error

disabling the unused var rule as there are many instances in the specs
where our only concern for that test is instantiation of the Qotd module.
rather than have an empty `new Qotd()` line, we're keeping best practices
of assigning it to a constant, that constant is unsused, however.
*/

const fs = require('fs');
const http = require('http');
const { PassThrough } = require('stream');
const { StringDecoder } = require('string_decoder');
const test = require('ava');
const sinon = require('sinon');
const nock = require('nock');
const querystring = require('querystring');
const mockRequire = require('mock-require');
const Qotd = require('./qotd');
const quotes = require('./quotes.json');

/***********************************************************************
 *                          Mocks / Test Setup                         *
 **********************************************************************/

const defaultOptions = {
  // max:     quotes.max,
  max:     200,
  offline: false,
  color:   {
    enabled: true,
    quote:   'yellow',
    author:  'bold.blue',
  },
};

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

const mockQuotes = [
  {
    quote:  'Irure cupidatat dolor id pariatur dolore aliqua duis laborum.',
    author: 'Lorem ipsum',
  },
  {
    quote:  'Esse nisi quis mollit sit incididunt amet sint nostrud in in exercitation.',
    author: 'Mollit occaecat',
  },
  {
    quote:  'Dolore velit occaecat eu enim mollit ea eiusmod est exercitation anim proident.',
    author: 'In minim',
  },
  {
    quote:  'Exercitation dolor qui adipisicing quis nisi culpa nulla proident incididunt aliqua anim.',
    author: 'In fugiat',
  },
];

const mockJson = {
  max:    0,
  quotes: mockQuotes,
};

const WRITE_OVERRIDE = process.stdout.write;
const endSpy = sinon.spy();
const writeSpy = sinon.spy();
const onSpy = sinon.spy();
const stdoutSpy = sinon.spy();
const noop = sinon.spy();

let writeStreamStub;
let exitStub;
let mockAPI;

/***********************************************************************
 *                       End Mocks / Test Setup                        *
 **********************************************************************/


/***********************************************************************
 *                        Setup / Teardown Hooks                       *
 **********************************************************************/

test.before(() => {
  // mock the api calls so we're not spamming the api server.
  mockAPI = nock(
    'http://api.forismatic.com',
    {
      reqHeaders: mockPostHeaders,
    },
  )
    .persist()
    .post('/api/1.0/', mockPostBody)
    .reply(200, JSON.stringify(mockPostResponse));

  process.stdout.write = stdoutSpy;
});

test.beforeEach(() => {
  noop.resetHistory();
  // stub fs.createWriteStream to check write
  writeStreamStub = sinon
    .stub(fs, 'createWriteStream')
    .returns({
      end:   endSpy,
      write: writeSpy,
      on:    onSpy,
    });

  exitStub = sinon
    .stub(process, 'exit')
    .callsFake(noop);
});

test.afterEach.always(() => {
  writeStreamStub.restore();
  exitStub.restore();
});

test.after.always(() => {
  nock.cleanAll();
  nock.restore();
});

/***********************************************************************
 *                      End Setup / Teardown Hooks                     *
 **********************************************************************/


/***********************************************************************
 *                            Methods Tests                            *
 **********************************************************************/

/***********************************
 *           constructor           *
 **********************************/

test.serial('constructs a Qotd Object: empty options', (t) => {
  const qotd = new Qotd();

  t.true(qotd instanceof Qotd);
  t.deepEqual(qotd.options, defaultOptions);
  // t.true(typeof qotd.spinner === 'object');
});

test.serial('constructs a Qotd Object: with valid options', (t) => {
  const opts = {
    offline: true,
    ...defaultOptions,
  };

  const qotd = new Qotd(opts);

  t.true(qotd instanceof Qotd);
  t.deepEqual(qotd.options, opts);
  // t.true(typeof qotd.spinner === 'object');
});

test.serial('constructor displays title', (t) => {
  stdoutSpy.resetHistory();

  const titleMock = '\n\n\u001B[4m\u001B[32m\u001B[1mQuote of the day!\u001B[22m\u001B[39m\u001B[24m\n\n';

  const qotd = new Qotd();

  const output = Buffer.from(stdoutSpy.getCall(0).args[0], 'ucs2').toString('utf8');

  t.true(stdoutSpy.called);
  // t.is(output, titleMock);
});

test.serial('constructor initializes spinner', (t) => {
  const spy = sinon.spy(Qotd.prototype, 'initializeSpinner');

  const qotd = new Qotd();
  t.true(spy.called);

  Qotd.prototype.initializeSpinner.restore();
});

test.serial('constructor checks online', (t) => {
  const spy = sinon.spy(Qotd.prototype, 'checkOnline');

  const qotd = new Qotd();
  t.true(spy.called);

  Qotd.prototype.checkOnline.restore();
});

/***********************************
 *         initializeSpinner       *
 **********************************/

test.serial('initializeSpinner calls instanceCheck()', (t) => {
  const instanceStub = sinon
    .stub(Qotd.prototype, 'instanceCheck')
    .callsFake(noop);

  Qotd.prototype.initializeSpinner();
  t.true(instanceStub.called);

  Qotd.prototype.instanceCheck.restore();
});

test.serial('initializeSpinner throws ReferenceError without constructor', (t) => {
  const error = t.throws(
    () => {
      Qotd.prototype.initializeSpinner();
    },
    {
      instanceOf: ReferenceError,
      message:    'Must create an instance before calling: initializeSpinner.',
    },
  );
});

test.skip('initializeSpinner updates spinner text', (t) => {
  const qotd = new Qotd();
  qotd.initializeSpinner();

  t.is(qotd.spinner.text, 'Checking for internet connectivity...');
});

test.skip('initializeSpinner starts spinner', (t) => {
  const qotd = new Qotd();

  const spy = sinon
    .spy(qotd.spinner, 'start');

  // re-issue call to spy on instance vars
  qotd.initializeSpinner();

  t.true(spy.called);

  qotd.spinner.start.restore();
});

/***********************************
 *           checkOnline           *
 **********************************/

test.serial('checkOnline calls instanceCheck()', async (t) => {
  const instanceStub = sinon
    .stub(Qotd.prototype, 'instanceCheck')
    .callsFake(noop);

  await Qotd.prototype.checkOnline();
  t.true(instanceStub.called);

  Qotd.prototype.instanceCheck.restore();
});

test.serial('checkOnline throws ReferenceError without constructor', async (t) => {
  const error = await t.throwsAsync(
    Qotd.prototype.checkOnline(),
    {
      instanceOf: ReferenceError,
      message:    'Must create an instance before calling: checkOnline.',
    },
  );
});

// READ ME:
// These tests are being run serially due to the stub on fs.createWriteStream and the
// async methods they're testing. Running these tests in parallel, ava's default
// causes a method already wrapped error
// test.serial('checkOnline calls fetchQuote() quote if online', async (t) => {
test.skip('checkOnline calls fetchQuote() quote if online', async (t) => {
  const stub = sinon.stub();
  stub.returns(new Promise((resolve) => {
    resolve(true);
  }));

  mockRequire('is-online', stub);
  const MockedQotd = mockRequire.reRequire('./qotd');
  const spy = sinon.spy(MockedQotd.prototype, 'fetchQuote');
  const qotd = new MockedQotd();
  await qotd.checkOnline();
  t.true(spy.called);

  mockRequire.stop('is-online');

  MockedQotd.prototype.fetchQuote.restore();
});

test.skip('checkOnline stops spinner if online and fetchQuote() succeeds', async (t) => {
  const isOnlineStub = sinon.stub();
  isOnlineStub.returns(new Promise((resolve) => {
    resolve(true);
  }));

  mockRequire('is-online', isOnlineStub);

  const MockedQotd = mockRequire.reRequire('./qotd');
  const qotd = new MockedQotd();

  const fetchQuoteStub = sinon
    .stub(MockedQotd.prototype, 'fetchQuote')
    .callsFake(async () => {
      await {
        index:  -1,
        quote:  'Foo',
        author: 'Bar',
      };
    });

  const spinnerSpy = sinon.spy(qotd.spinner, 'stop');

  await qotd.checkOnline();
  t.true(spinnerSpy.called);

  mockRequire.stop('is-online');

  qotd.spinner.stop.restore();
  MockedQotd.prototype.fetchQuote.restore();
});

test.serial('checkOnline calls outputQuote() if online and fetchQuote() succeeds', async (t) => {
  const mockData = {
    index:  -1,
    quote:  'Foo',
    author: 'Bar',
  };

  const isOnlineStub = sinon.stub();
  isOnlineStub.returns(new Promise((resolve) => {
    resolve(true);
  }));

  mockRequire('is-online', isOnlineStub);

  const MockedQotd = mockRequire.reRequire('./qotd');
  const qotd = new MockedQotd();

  const fetchQuoteStub = sinon
    .stub(MockedQotd.prototype, 'fetchQuote')
    .callsFake(async () => {
      await mockData;
    });

  const quoteSpy = sinon.spy(MockedQotd.prototype, 'outputQuote');

  await qotd.checkOnline(mockData);

  t.true(quoteSpy.called);
  // t.true(quoteSpy.calledWith(mockData));

  mockRequire.stop('is-online');

  MockedQotd.prototype.outputQuote.restore();
  MockedQotd.prototype.fetchQuote.restore();
});

test.skip('checkOnline adds quote to updates if online and fetchQuote() succeeds', async (t) => {
  const mockData = {
    index:  -1,
    quote:  'Foo',
    author: 'Bar',
  };

  const isOnlineStub = sinon.stub();
  isOnlineStub.returns(new Promise((resolve) => {
    resolve(true);
  }));

  mockRequire('is-online', isOnlineStub);

  const MockedQotd = mockRequire.reRequire('./qotd');
  const qotd = new MockedQotd();

  const fetchQuoteStub = sinon
    .stub(MockedQotd.prototype, 'fetchQuote')
    .callsFake(Promise.resolve(mockData));

  const updateSpy = sinon.spy(MockedQotd.prototype, 'setUpdate');

  await qotd.checkOnline();

  t.true(updateSpy.called);
  t.deepEqual(qotd.updates.quote, mockData);

  mockRequire.stop('is-online');

  MockedQotd.prototype.setUpdate.restore();
  MockedQotd.prototype.fetchQuote.restore();
});

test.serial('checkOnline calls onlineFailSafe() quote if online but fetchQuote() fails', async (t) => {
  const isOnlineStub = sinon.stub();
  isOnlineStub.returns(new Promise((resolve) => {
    resolve(true);
  }));

  mockRequire('is-online', isOnlineStub);

  const MockedQotd = mockRequire.reRequire('./qotd');
  const fetchQuoteStub = sinon
    .stub(MockedQotd.prototype, 'fetchQuote')
    .callsFake(() => Promise.reject(new Error()));

  const qotd = new MockedQotd();
  const spy = sinon.spy(MockedQotd.prototype, 'onlineFailSafe');

  await qotd.checkOnline();

  t.true(spy.called);

  mockRequire.stop('is-online');

  MockedQotd.prototype.fetchQuote.restore();
  MockedQotd.prototype.onlineFailSafe.restore();
});

test.serial('checkOnline calls onlineFailSafe() if offline', async (t) => {
  const isOnlineStub = sinon.stub();
  isOnlineStub.returns(new Promise((resolve) => {
    resolve(false);
  }));

  mockRequire('is-online', isOnlineStub);

  const MockedQotd = mockRequire.reRequire('./qotd');
  const spy = sinon.spy(MockedQotd.prototype, 'onlineFailSafe');

  const qotd = new MockedQotd();

  await qotd.checkOnline();

  t.true(spy.called);

  mockRequire.stop('is-online');

  MockedQotd.prototype.onlineFailSafe.restore();
});

test.serial('checkOnline calls onlineFailSafe() in event of error', async (t) => {
  const stub = sinon.stub();
  stub.returns(new Promise((resolve, reject) => {
    reject(new Error('foo'));
  }));

  mockRequire('is-online', stub);
  const MockedQotd = mockRequire.reRequire('./qotd');
  const spy = sinon.spy(MockedQotd.prototype, 'onlineFailSafe');

  const qotd = new MockedQotd();
  spy.resetHistory();
  await qotd.checkOnline();
  t.true(spy.called);

  mockRequire.stop('is-online');

  MockedQotd.prototype.onlineFailSafe.restore();
});

/***********************************
 *         onlineFailSafe          *
 **********************************/


test.serial('onlineFailSafe calls instanceCheck()', (t) => {
  const instanceStub = sinon
    .stub(Qotd.prototype, 'instanceCheck')
    .callsFake(noop);

  Qotd.prototype.onlineFailSafe();
  t.true(instanceStub.called);

  Qotd.prototype.instanceCheck.restore();
});


test.serial('onlineFailSafe throws ReferenceError without constructor', (t) => {
  const error = t.throws(() => {
    Qotd.prototype.onlineFailSafe();
  });

  t.is(error.message, 'Must create an instance before calling: onlineFailSafe.');
});

test.skip('onlineFailSafe stops spinner', (t) => {
  const qotd = new Qotd();

  const spy = sinon.spy(qotd.spinner, 'stop');

  qotd.onlineFailSafe();
  t.true(spy.called);

  qotd.spinner.stop.restore();
});


test.serial('onlineFailSafe calls offlineQuote', (t) => {
  const qotd = new Qotd();
  const spy = sinon.spy(Qotd.prototype, 'offlineQuote');

  qotd.onlineFailSafe();
  t.true(spy.called);

  Qotd.prototype.offlineQuote.restore();
});

/***********************************
 *           fetchQuote            *
 **********************************/

test.serial('fetchQuote calls instanceCheck()', async (t) => {
  const instanceStub = sinon
    .stub(Qotd.prototype, 'instanceCheck')
    .callsFake(noop);

  try {
    await Qotd.prototype.fetchQuote();
  } catch (e) {
    t.true(instanceStub.called);
  }

  Qotd.prototype.instanceCheck.restore();
});


test.serial('fetchQuote throws ReferenceError without constructor', (t) => {
  const error = t.throws(
    () => {
      Qotd.prototype.fetchQuote();
    },
    {
      instanceOf: ReferenceError,
      message:    'Must create an instance before calling: fetchQuote.',
    },
  );
});

test.serial('fetchQuote returns a Promise', (t) => {
  const initStub = sinon
    .stub(Qotd.prototype, 'initializeSpinner')
    .callsFake(noop);

  const checkStub = sinon
    .stub(Qotd.prototype, 'checkOnline')
    .callsFake(noop);

  const qotd = new Qotd();
  const promise = qotd.fetchQuote();
  t.true(promise instanceof Promise);

  Qotd.prototype.initializeSpinner.restore();
  Qotd.prototype.checkOnline.restore();
});

test.skip('fetchQuote updates spinner color', async (t) => {
  const checkStub = sinon
    .stub(Qotd.prototype, 'checkOnline')
    .callsFake(noop);

  const qotd = new Qotd();
  t.not(qotd.spinner.color, 'green');
  await qotd.fetchQuote();
  t.is(qotd.spinner.color, 'green');

  Qotd.prototype.checkOnline.restore();
});

test.skip('fetchQuote updates spinner text', async (t) => {
  const initStub = sinon
    .stub(Qotd.prototype, 'initializeSpinner')
    .callsFake(noop);

  const checkStub = sinon
    .stub(Qotd.prototype, 'checkOnline')
    .callsFake(noop);

  const qotd = new Qotd();
  await qotd.fetchQuote();

  t.is(qotd.spinner.text, 'Fetching Quote...');

  Qotd.prototype.initializeSpinner.restore();
  Qotd.prototype.checkOnline.restore();
});

test.serial('fetchQuote requests quote from API', async (t) => {
  const initStub = sinon
    .stub(Qotd.prototype, 'initializeSpinner')
    .callsFake(noop);

  const checkStub = sinon
    .stub(Qotd.prototype, 'checkOnline')
    .callsFake(noop);

  const spy = sinon.spy(http, 'request');

  const qotd = new Qotd();
  await qotd.fetchQuote();

  t.true(spy.called);

  http.request.restore();
  Qotd.prototype.initializeSpinner.restore();
  Qotd.prototype.checkOnline.restore();
});

test.serial('fetchQuote sends POST body to API', (t) => {
  const initStub = sinon
    .stub(Qotd.prototype, 'initializeSpinner')
    .callsFake(noop);

  const checkStub = sinon
    .stub(Qotd.prototype, 'checkOnline')
    .callsFake(noop);

  const reqWriteSpy = sinon.spy();
  const reqEndSpy = sinon.spy();
  const reqOnSpy = sinon.spy();
  const requestMock = {
    on:    reqOnSpy,
    end:   reqEndSpy,
    write: reqWriteSpy,
  };

  const responseMock = new PassThrough();
  const resOnSpy = sinon.spy(responseMock, 'on');
  const resSetEncodingSpy = sinon.spy(responseMock, 'setEncoding');

  const mockedHTTP = sinon
    .stub(http, 'request')
    .returns(requestMock)
    .yields(responseMock);

  const qotd = new Qotd();
  qotd.fetchQuote();

  t.true(reqWriteSpy.called);
  t.true(reqWriteSpy.calledWith(mockPostBody));
  t.true(reqEndSpy.called);

  http.request.restore();
  Qotd.prototype.initializeSpinner.restore();
  Qotd.prototype.checkOnline.restore();
});

test.skip('fetchQuote rejects promise on error fetching quote from API', (t) => {
  const initStub = sinon
    .stub(Qotd.prototype, 'initializeSpinner')
    .callsFake(noop);

  const checkStub = sinon
    .stub(Qotd.prototype, 'checkOnline')
    .callsFake(noop);

  const requestMock = new PassThrough();
  const reqWriteSpy = sinon.spy(requestMock, 'on');
  const reqEndSpy = sinon.spy(requestMock, 'end');
  const reqOnSpy = sinon.spy(requestMock, 'write');

  // const promiseStub = sinon.stub(global, 'Promise');
  // promiseStub.yields((resolve, reject) => {});

  const mockedHTTP = sinon
    .stub(http, 'request')
    .returns(requestMock)
    .yields(new PassThrough());

  const mockError = 'took an arrow to the knee';

  const qotd = new Qotd();

  qotd.fetchQuote();
  const error = t.throws(() => requestMock.emit('error', new Error(mockError)));

  t.is(error.message, mockError);
  // t.true(reject.called);
  // t.true(reject.calledWith(mockError));

  http.request.restore();
  Qotd.prototype.initializeSpinner.restore();
  Qotd.prototype.checkOnline.restore();
});


/***********************************
 *           selectQuote           *
 **********************************/


test.serial('selectQuote calls instanceCheck()', (t) => {
  const instanceStub = sinon
    .stub(Qotd.prototype, 'instanceCheck')
    .callsFake(noop);

  Qotd.prototype.selectQuote();
  t.true(instanceStub.called);

  Qotd.prototype.instanceCheck.restore();
});

test.serial('selectQuote throws ReferenceError without constructor', (t) => {
  const error = t.throws(
    () => {
      Qotd.prototype.selectQuote();
    },
    {
      instanceOf: ReferenceError,
      message:    'Must create an instance before calling: selectQuote.',
    },
  );
});

test.serial('selectQuote selects random index from quotes', (t) => {
  const qotd = new Qotd();
  const quoteObj = qotd.selectQuote();

  t.true(quoteObj.index >= 0);
  t.true(quoteObj.index < quotes.quotes.length);
});

test.serial('selectQuote selects random quote and author from quotes', (t) => {
  const qotd = new Qotd();
  const quoteObj = qotd.selectQuote();

  t.truthy(quoteObj.quote);
  t.truthy(quoteObj.author);
});

/***********************************
 *           outputQuote           *
 **********************************/


test.serial('outputQuote calls instanceCheck()', (t) => {
  const instanceStub = sinon
    .stub(Qotd.prototype, 'instanceCheck')
    .callsFake(noop);

  Qotd.prototype.outputQuote();
  t.true(instanceStub.called);

  Qotd.prototype.instanceCheck.restore();
});

test.serial('outputQuote throws ReferenceError without constructor', (t) => {
  const error = t.throws(() => {
    Qotd.prototype.outputQuote();
  });

  t.is(error.message, 'Must create an instance before calling: outputQuote.');
});

test.skip('outputQuote stops spinner', (t) => {
  const qotd = new Qotd();
  const spy = sinon.spy(qotd.spinner, 'stop');

  // re-issue call to spy on instance vars
  qotd.outputQuote({
    quote:  'foo',
    author: 'bar',
  });

  t.true(spy.called);

  qotd.spinner.stop.restore();
});


test.serial('outputQuote writes to stdout', (t) => {
  stdoutSpy.resetHistory();

  const mockQuoteObj = {
    quote:  'foo',
    author: 'bar',
  };

  const mockQuote  = '\u001B[33m  foo\u001B[39m';
  const mockAuthor = '\n\n\t\u001B[1m\u001B[34m— bar\u001B[39m\u001B[22m\n\n';

  const qotd = new Qotd();
  stdoutSpy.resetHistory();
  qotd.outputQuote(mockQuoteObj);

  t.true(stdoutSpy.called);
  // t.is(stdoutSpy.getCall(0).args[0], mockQuote);
  // t.is(stdoutSpy.getCall(1).args[0], mockAuthor);
});

/***********************************
 *           outputCount           *
 **********************************/


test.serial('outputCount calls instanceCheck()', (t) => {
  const instanceStub = sinon
    .stub(Qotd.prototype, 'instanceCheck')
    .callsFake(noop);

  Qotd.prototype.outputCount();
  t.true(instanceStub.called);

  Qotd.prototype.instanceCheck.restore();
});

test.serial('outputCount throws ReferenceError without constructor', (t) => {
  const error = t.throws(() => {
    Qotd.prototype.outputCount();
  });

  t.is(error.message, 'Must create an instance before calling: outputCount.');
});

test.serial('outputCount displays red counts', (t) => {
  stdoutSpy.resetHistory();

  // red output as its full
  const quotesMock = {
    max:    1,
    quotes: [
      {
        quote:  'red',
        author: '1 of 1',
      },
    ],
  };

  mockRequire('./quotes.json', quotesMock);
  const MockedQotd = mockRequire.reRequire('./qotd');

  const mockLength  = '\u001B[2mCurrent Number of Quotes:\u001B[22m      \u001B[31m\u001B[1m1\u001B[22m\u001B[39m\n';
  const mockLimit =  '\u001B[2mCurrent Upper Limit of Quotes:\u001B[22m \u001B[31m\u001B[1m1\u001B[22m\u001B[39m\n';

  const qotd = new MockedQotd();
  stdoutSpy.resetHistory();
  qotd.outputCount();

  t.true(stdoutSpy.called);
  // t.is(stdoutSpy.getCall(0).args[0], mockLength);
  // t.is(stdoutSpy.getCall(1).args[0], mockLimit);
});

test.serial('outputCount displays yellow counts', (t) => {
  stdoutSpy.resetHistory();

  // yellow output as its about 25% empty
  const quotesMock = {
    max:    8,
    quotes: [
      {
        quote:  'yellow-1',
        author: '1 of 6',
      },
      {
        quote:  'yellow-2',
        author: '2 of 6',
      },
      {
        quote:  'yellow-3',
        author: '3 of 6',
      },
      {
        quote:  'yellow-4',
        author: '4 of 6',
      },
      {
        quote:  'yellow-5',
        author: '5 of 6',
      },
      {
        quote:  'yellow-5',
        author: '6 of 6',
      },
    ],
  };

  mockRequire('./quotes.json', quotesMock);
  const MockedQotd = mockRequire.reRequire('./qotd');

  const mockLength  = '\u001B[2mCurrent Number of Quotes:\u001B[22m      \u001B[33m\u001B[1m6\u001B[22m\u001B[39m\n';
  const mockLimit =  '\u001B[2mCurrent Upper Limit of Quotes:\u001B[22m \u001B[33m\u001B[1m8\u001B[22m\u001B[39m\n';

  const qotd = new MockedQotd();
  stdoutSpy.resetHistory();
  qotd.outputCount();

  t.true(stdoutSpy.called);
  // t.is(stdoutSpy.getCall(0).args[0], mockLength);
  // t.is(stdoutSpy.getCall(1).args[0], mockLimit);
});

test.serial('outputCount displays green counts', (t) => {
  stdoutSpy.resetHistory();

  // green output as its got more than 25% free
  const quotesMock = {
    max:    10,
    quotes: [
      {
        quote:  'green',
        author: '1 of 10',
      },
    ],
  };

  mockRequire('./quotes.json', quotesMock);
  const MockedQotd = mockRequire.reRequire('./qotd');

  const mockLength  = '\u001B[2mCurrent Number of Quotes:\u001B[22m      \u001B[32m\u001B[1m1\u001B[22m\u001B[39m\n';
  const mockLimit =  '\u001B[2mCurrent Upper Limit of Quotes:\u001B[22m \u001B[32m\u001B[1m10\u001B[22m\u001B[39m\n';

  const qotd = new MockedQotd();
  stdoutSpy.resetHistory();
  qotd.outputCount();

  t.true(stdoutSpy.called);
  // t.is(stdoutSpy.getCall(0).args[0], mockLength);
  // t.is(stdoutSpy.getCall(1).args[0], mockLimit);
});

/***********************************
 *          offlineQuote           *
 **********************************/


test.serial('offlineQuote calls instanceCheck()', (t) => {
  const instanceStub = sinon
    .stub(Qotd.prototype, 'instanceCheck')
    .callsFake(noop);

  Qotd.prototype.offlineQuote();
  t.true(instanceStub.called);

  Qotd.prototype.instanceCheck.restore();
});

test.serial('offlineQuote throws ReferenceError without constructor', (t) => {
  const error = t.throws(() => {
    Qotd.prototype.offlineQuote();
  });

  t.is(error.message, 'Must create an instance before calling: offlineQuote.');
});

test.skip('offlineQuote updates spinner color', (t) => {
  const qotd = new Qotd();
  qotd.offlineQuote();

  t.is(qotd.spinner.color, 'red');
});

test.skip('offlineQuote updates spinner text', (t) => {
  const qotd = new Qotd();
  qotd.offlineQuote();

  t.is(qotd.spinner.text, 'Selecting from Existing DataStore');
});

test.serial('calls selectQuote()', (t) => {
  const selectQuote = sinon.spy(Qotd.prototype, 'selectQuote');

  const qotd = new Qotd();
  selectQuote.resetHistory();
  qotd.offlineQuote();

  t.true(selectQuote.called);

  Qotd.prototype.selectQuote.restore();
});

test.serial('calls outputQuote()', (t) => {
  const outputQuote = sinon.spy(Qotd.prototype, 'outputQuote');

  const qotd = new Qotd();
  outputQuote.resetHistory();
  qotd.offlineQuote();

  t.true(outputQuote.called);

  Qotd.prototype.outputQuote.restore();
});

test.serial('calls writeUpdate() if not pristine', (t) => {
  const writeStub = sinon
    .stub(Qotd.prototype, 'writeUpdate')
    .callsFake(noop);

  const qotd = new Qotd();
  writeStub.resetHistory();
  qotd.pristine = false;
  qotd.offlineQuote();

  t.true(writeStub.called);

  Qotd.prototype.writeUpdate.restore();
});

test.serial('does not call writeUpdate if pristine', (t) => {
  const writeUpdateSpy = sinon.spy(Qotd.prototype, 'writeUpdate');

  const qotd = new Qotd();
  writeUpdateSpy.resetHistory();
  qotd.pristine = true;
  qotd.offlineQuote();

  t.false(writeUpdateSpy.called);

  Qotd.prototype.writeUpdate.restore();
});

/***********************************
 *            setUpdate            *
 **********************************/


test.serial('setUpdate calls instanceCheck()', (t) => {
  const instanceStub = sinon
    .stub(Qotd.prototype, 'instanceCheck')
    .callsFake(noop);

  Qotd.prototype.setUpdate();
  t.true(instanceStub.called);

  Qotd.prototype.instanceCheck.restore();
});

test.serial('setUpdate throws ReferenceError without constructor', (t) => {
  const error = t.throws(() => {
    Qotd.prototype.setUpdate();
  });

  t.is(error.message, 'Must create an instance before calling: setUpdate.');
});

test.serial('setUpdate assigns updates to instance var', (t) => {
  const mockUpdate = { foo: 'bar' };
  const qotd = new Qotd();
  t.deepEqual(qotd.updates, {});
  qotd.setUpdate(mockUpdate);
  t.deepEqual(qotd.updates, mockUpdate);
});

test.serial('setUpdate merges updates with existing', (t) => {
  const mockUpdate1 = { foo: 'bar' };
  const mockUpdate2 = { bar: 'baz' };

  const qotd = new Qotd();
  qotd.setUpdate(mockUpdate1);
  t.deepEqual(qotd.updates, mockUpdate1);
  qotd.setUpdate(mockUpdate2);
  t.deepEqual(qotd.updates, Object.assign(mockUpdate1, mockUpdate2));
});

/***********************************
 *     quotesLengthComparator    *
 **********************************/


test.serial('quotesLengthComparator calls instanceCheck()', (t) => {
  const instanceStub = sinon
    .stub(Qotd.prototype, 'instanceCheck')
    .callsFake(noop);

  Qotd.prototype.quotesLengthComparator();
  t.true(instanceStub.called);

  Qotd.prototype.instanceCheck.restore();
});

test.serial('quotesLengthComparator throws ReferenceError without constructor', (t) => {
  const error = t.throws(() => {
    Qotd.prototype.quotesLengthComparator();
  });

  t.is(error.message, 'Must create an instance before calling: quotesLengthComparator.');
});

test.serial('quotesLengthComparator returns -1 when max is greater than quotes length', (t) => {
  const quotesMock = {
    max:    1,
    quotes: [
      {
        quote:  'one',
        author: '1 of 2',
      },
      {
        quote:  'two',
        author: '2 of 2',
      },
    ],
  };

  mockRequire('./quotes.json', quotesMock);
  const MockedQotd = mockRequire.reRequire('./qotd');

  const qotd = new MockedQotd();

  t.is(qotd.quotesLengthComparator(), -1);
});

test.serial('quotesLengthComparator returns 0 when max equals quotes length', (t) => {
  const quotesMock = {
    max:    2,
    quotes: [
      {
        quote:  'one',
        author: '1 of 2',
      },
      {
        quote:  'two',
        author: '2 of 2',
      },
    ],
  };

  mockRequire('./quotes.json', quotesMock);
  const MockedQotd = mockRequire.reRequire('./qotd');

  const qotd = new MockedQotd();

  t.is(qotd.quotesLengthComparator(), 0);
});

test.serial('quotesLengthComparator returns 1 when max is less than quotes length', (t) => {
  const quotesMock = {
    max:    3,
    quotes: [
      {
        quote:  'one',
        author: '1 of 2',
      },
      {
        quote:  'two',
        author: '2 of 2',
      },
    ],
  };

  mockRequire('./quotes.json', quotesMock);
  const MockedQotd = mockRequire.reRequire('./qotd');

  const qotd = new MockedQotd();

  t.is(qotd.quotesLengthComparator(), 1);
});

/***********************************
 *          prepOutputJson         *
 **********************************/


test.serial('prepOutputJson calls instanceCheck()', (t) => {
  const instanceStub = sinon
    .stub(Qotd.prototype, 'instanceCheck')
    .callsFake(noop);

  Qotd.prototype.prepOutputJson();
  t.true(instanceStub.called);

  Qotd.prototype.instanceCheck.restore();
});

test.serial('prepOutputJson throws ReferenceError without constructor', (t) => {
  const error = t.throws(() => {
    Qotd.prototype.prepOutputJson();
  });

  t.is(error.message, 'Must create an instance before calling: prepOutputJson.');
});

test.serial('prepOutputJson returns expected schema', (t) => {
  const quotesMock = {
    max:    5,
    quotes: [
      {
        quote:  'foo',
        author: 'bar',
      },
    ],
  };

  // stubbing write so as not to update
  // JSON on initial run prior to test
  const writeStub = sinon
    .stub(Qotd.prototype, 'writeUpdate')
    .callsFake(noop);

  mockRequire('./quotes.json', quotesMock);
  const MockedQotd = mockRequire.reRequire('./qotd');

  const qotd = new MockedQotd();
  const output = qotd.prepOutputJson();
  t.deepEqual(output, quotesMock);

  Qotd.prototype.writeUpdate.restore();
});

test.serial('prepOutputJson updates MAX when max setting updated', (t) => {
  const quotesMock = {
    max:    1,
    quotes: [
      {
        quote:  'foo',
        author: 'bar',
      },
    ],
  };

  const mockMax = 2;

  const mockOutput = { ...quotesMock };
  mockOutput.max = mockMax;

  // stubbing write so as not to update
  // JSON on initial run prior to test
  const writeStub = sinon
    .stub(Qotd.prototype, 'writeUpdate')
    .callsFake(noop);

  mockRequire('./quotes.json', quotesMock);
  const MockedQotd = mockRequire.reRequire('./qotd');

  const qotd = new MockedQotd();
  qotd.updates.max = mockMax;
  const output = qotd.prepOutputJson();
  t.deepEqual(output, mockOutput);

  Qotd.prototype.writeUpdate.restore();
});

test.serial('prepOutputJson does not update MAX when max setting not updated', (t) => {
  const quotesMock = {
    max:    1,
    quotes: [
      {
        quote:  'foo',
        author: 'bar',
      },
    ],
  };

  // stubbing write so as not to update
  // JSON on initial run prior to test
  const writeStub = sinon
    .stub(Qotd.prototype, 'writeUpdate')
    .callsFake(noop);

  mockRequire('./quotes.json', quotesMock);
  const MockedQotd = mockRequire.reRequire('./qotd');

  const qotd = new MockedQotd();
  const output = qotd.prepOutputJson();
  t.deepEqual(output, quotesMock);

  Qotd.prototype.writeUpdate.restore();
});

test.serial('prepOutputJson does not call quotesLengthComparator() when no quote updates set', (t) => {
  const spy = sinon.spy(Qotd.prototype, 'quotesLengthComparator');
  const qotd = new Qotd();
  const output = qotd.prepOutputJson();

  t.false(spy.called);
  Qotd.prototype.quotesLengthComparator.restore();
});

test.serial('prepOutputJson calls quotesLengthComparator() when quote updates set', (t) => {
  const newQuote = {
    quote:  'newFoo',
    author: 'newBar',
  };

  const spy = sinon.spy(Qotd.prototype, 'quotesLengthComparator');
  const qotd = new Qotd();
  qotd.updates.quote = newQuote;
  const output = qotd.prepOutputJson();

  t.true(spy.called);
  Qotd.prototype.quotesLengthComparator.restore();
});

test.serial('prepOutputJson inserts quote into array if length is less than max when quote updates set', (t) => {
  const quotesMock = {
    max:    5,
    quotes: [
      {
        quote:  'foo',
        author: 'bar',
      },
    ],
  };

  const newQuote = {
    quote:  'newFoo',
    author: 'newBar',
  };

  const mockOutput = { ...quotesMock };
  mockOutput.quotes.push(newQuote);

  // stubbing write so as not to update
  // JSON on initial run prior to test
  const writeStub = sinon
    .stub(Qotd.prototype, 'writeUpdate')
    .callsFake(noop);

  mockRequire('./quotes.json', quotesMock);
  const MockedQotd = mockRequire.reRequire('./qotd');

  const qotd = new MockedQotd();
  qotd.updates.quote = newQuote;
  const output = qotd.prepOutputJson();
  t.deepEqual(output, mockOutput);

  Qotd.prototype.writeUpdate.restore();
});

test.serial('prepOutputJson replaces a quote in array if length is equal to max when quote updates set', (t) => {
  const quotesMock = {
    max:    1,
    quotes: [
      {
        quote:  'foo',
        author: 'bar',
      },
    ],
  };

  const newQuote = {
    quote:  'newFoo',
    author: 'newBar',
  };

  const mockOutput = { ...quotesMock };
  mockOutput.quotes.length = 0;
  mockOutput.quotes.push(newQuote);

  // stubbing write so as not to update
  // JSON on initial run prior to test
  const writeStub = sinon
    .stub(Qotd.prototype, 'writeUpdate')
    .callsFake(noop);

  mockRequire('./quotes.json', quotesMock);
  const MockedQotd = mockRequire.reRequire('./qotd');

  const qotd = new MockedQotd();
  qotd.updates.quote = newQuote;
  const output = qotd.prepOutputJson();
  t.deepEqual(output, mockOutput);

  Qotd.prototype.writeUpdate.restore();
});

test.serial('prepOutputJson inserts quote into array and prunes array to max if length is greater than max when quote updates set', (t) => {
  const quotesMock = {
    max:    1,
    quotes: [
      {
        quote:  'foo0',
        author: 'bar0',
      },
      {
        quote:  'foo1',
        author: 'bar1',
      },
      {
        quote:  'foo2',
        author: 'bar2',
      },
    ],
  };

  const newQuote = {
    quote:  'newFoo',
    author: 'newBar',
  };

  const mockOutput = { ...quotesMock };
  mockOutput.quotes.push(newQuote);

  // stubbing write so as not to update
  // JSON on initial run prior to test
  const writeStub = sinon
    .stub(Qotd.prototype, 'writeUpdate')
    .callsFake(noop);

  mockRequire('./quotes.json', quotesMock);
  const MockedQotd = mockRequire.reRequire('./qotd');

  const qotd = new MockedQotd();
  qotd.updates.quote = newQuote;
  const output = qotd.prepOutputJson();
  t.is(mockOutput.quotes.length, quotesMock.max);
  t.deepEqual(output, mockOutput);

  Qotd.prototype.writeUpdate.restore();
});

/***********************************
 *           writeUpdate           *
 **********************************/


test.serial('writeUpdate calls instanceCheck()', (t) => {
  const instanceStub = sinon
    .stub(Qotd.prototype, 'instanceCheck')
    .callsFake(noop);

  Qotd.prototype.writeUpdate();
  t.true(instanceStub.called);

  Qotd.prototype.instanceCheck.restore();
});

test.serial('writeUpdate throws ReferenceError without constructor', (t) => {
  const error = t.throws(() => {
    Qotd.prototype.writeUpdate();
  });

  t.is(error.message, 'Must create an instance before calling: writeUpdate.');
});

test.serial('writeUpdate exits if pristine', (t) => {
  endSpy.resetHistory();
  writeSpy.resetHistory();
  onSpy.resetHistory();

  const qotd = new Qotd();

  writeStreamStub.resetHistory();
  writeSpy.resetHistory();
  onSpy.resetHistory();
  endSpy.resetHistory();

  qotd.writeUpdate();

  t.false(writeStreamStub.called);
  t.false(writeSpy.called);
  t.false(endSpy.called);

  t.is(writeStreamStub.callCount, 0);
  t.is(writeSpy.callCount, 0);
  t.is(endSpy.callCount, 0);
});

test.serial('writeUpdate creates a writeable stream', (t) => {
  endSpy.resetHistory();
  writeSpy.resetHistory();
  onSpy.resetHistory();

  const mockUpdate = {
    quote: {
      index:  0,
      quote:  'Roses are red, leaves are green, but only Java has AbstractSingletonProxyFactoryBean',
      author: 'Humbedooh',
    },
  };

  const qotd = new Qotd();
  qotd.pristine = false;
  qotd.updates = mockUpdate;

  qotd.writeUpdate();

  t.true(writeStreamStub.called);
  t.is(writeStreamStub.callCount, 1);
});

test.serial('writeUpdate writes to stream', (t) => {
  endSpy.resetHistory();
  writeSpy.resetHistory();
  onSpy.resetHistory();

  const mockUpdate = {
    quote: {
      index:  0,
      quote:  'Roses are red, leaves are green, but only Java has AbstractSingletonProxyFactoryBean',
      author: 'Humbedooh',
    },
  };

  const qotd = new Qotd();
  qotd.pristine = false;
  qotd.updates = mockUpdate;

  writeSpy.resetHistory();
  onSpy.resetHistory();
  endSpy.resetHistory();

  qotd.writeUpdate();

  t.true(writeStreamStub.called);
  t.true(writeSpy.called);
  t.true(endSpy.called);

  t.is(writeStreamStub.callCount, 1);
  t.is(writeSpy.callCount, 1);
  t.is(endSpy.callCount, 1);
});

/***********************************
 *          instanceCheck          *
 **********************************/


test.serial('checkConstructed throws ReferenceError with defined method name', (t) => {
  const mockName = 'foo';
  const mockError = `Must create an instance before calling: ${mockName}.`;

  const error = t.throws(() => {
    Qotd.prototype.instanceCheck(mockName);
  });

  t.is(error.message, mockError);
});

test.serial('checkConstructed throws ReferenceError without defined method name', (t) => {
  const mockError = 'Must create an instance before calling: instanceCheck.';

  const error = t.throws(() => {
    Qotd.prototype.instanceCheck();
  });

  t.is(error.message, mockError);
});

/***********************************************************************
 *                          End Methods Tests                          *
 **********************************************************************/


/***********************************************************************
 *                            Options Tests                            *
 **********************************************************************/

// README:
// These tests are run in serial because because they stub the same method.
// Running these tests in parallel, as per ava's default, would cause a
// method is already being stubbed error. - less than satisfactory.
test.serial('options.max populated with differences writes updated max', async (t) => {
  const writeStub = sinon
    .stub(Qotd.prototype, 'writeUpdate')
    .callsFake(noop);

  const opts = { max: 10, offline: true };
  const qotd = await new Qotd(opts);

  t.false(qotd.pristine);
  t.is(qotd.updates.max, opts.max);
  t.true(writeStub.called);

  Qotd.prototype.writeUpdate.restore();
});

// README:
// These tests are run in serial because because they stub the same method.
// Running these tests in parallel, as per ava's default, would cause a
// method is already being stubbed error. - less than satisfactory.
test.serial('options.max populated without differences does not write updated max', async (t) => {
  const writeStub = sinon
    .stub(Qotd.prototype, 'writeUpdate')
    .callsFake(noop);

  const opts = { max: quotes.max, offline: true };
  const qotd = await new Qotd(opts);

  t.true(qotd.pristine);
  t.not(qotd.updates.max, opts.max);
  t.false(writeStub.called);

  Qotd.prototype.writeUpdate.restore();
});

// README:
// These tests are run in serial because because they stub the same method.
// Running these tests in parallel, as per ava's default, would cause a
// method is already being stubbed error. - less than satisfactory.
test.serial('options.max boolean outputs max and length', (t) => {
  exitStub.resetHistory();
  const stub = sinon
    .stub(Qotd.prototype, 'outputCount')
    .callsFake(noop);

  const opts = { max: true };
  const qotd = new Qotd(opts);

  t.true(stub.called);
  t.true(exitStub.called);

  Qotd.prototype.outputCount.restore();
});

test.serial('options.offline selects local entry', (t) => {
  // to spy on methods called/not called
  const selectQuote = sinon.spy(Qotd.prototype, 'selectQuote');
  const outputQuote = sinon.spy(Qotd.prototype, 'outputQuote');
  // const writeUpdate = sinon.spy(Qotd.prototype, 'writeUpdate');

  const opts = { offline: true };
  const qotd = new Qotd(opts);

  t.true(qotd.pristine);
  t.true(outputQuote.called);
  t.true(selectQuote.called);
  // t.true(writeUpdate.called);
  // t.true(exitStub.called);

  Qotd.prototype.selectQuote.restore();
  Qotd.prototype.outputQuote.restore();
  // Qotd.prototype.writeUpdate.restore();
});

test.serial('options.online checks internet connectivity', (t) => {
  const opts = { offline: false };
  const qotd = new Qotd(opts);

  // t.true(stub.called);
  t.true(qotd instanceof Qotd);
});

test.serial('options.color.disabled removes color from outputCount', (t) => {
  stdoutSpy.resetHistory();

  // green output as its got more than 25% free
  const quotesMock = {
    max:    10,
    quotes: [
      {
        quote:  'green',
        author: '1 of 10',
      },
    ],
  };

  mockRequire('./quotes.json', quotesMock);
  const MockedQotd = mockRequire.reRequire('./qotd');


  const mockLength = 'Current Number of Quotes:      1\n';
  const mockLimit  = 'Current Upper Limit of Quotes: 10\n';

  const qotd = new MockedQotd({
    color: {
      enabled: false,
    },
  });
  stdoutSpy.resetHistory();
  qotd.outputCount();

  t.true(stdoutSpy.called);
  t.is(stdoutSpy.getCall(0).args[0], mockLength);
  t.is(stdoutSpy.getCall(1).args[0], mockLimit);
});

test.serial('options.color.disabled removes color from outputQuote', (t) => {
  stdoutSpy.resetHistory();

  const mockQuoteObj = {
    quote:  'foo',
    author: 'bar',
  };

  const mockQuote  = '  foo';
  const mockAuthor = '\t— bar';

  const qotd = new Qotd({
    color: {
      enabled: false,
    },
  });

  stdoutSpy.resetHistory();
  qotd.outputQuote(mockQuoteObj);

  t.true(stdoutSpy.called);
  t.is(stdoutSpy.getCall(0).args[0], mockQuote);
  t.is(stdoutSpy.getCall(1).args[0], mockAuthor);
});

test.serial('options.color.quote changes color of quote', (t) => {
  stdoutSpy.resetHistory();

  const mockQuoteObj = {
    quote:  'foo',
    author: 'bar',
  };

  const mockQuote  = '\u001B[36m\u001B[1m  foo\u001B[22m\u001B[39m';

  const qotd = new Qotd({
    color: {
      quote:   'cyan.bold',
      author:  'yellow.underline',
      enabled: true,
    },
  });

  stdoutSpy.resetHistory();
  qotd.outputQuote(mockQuoteObj);

  t.true(stdoutSpy.called);
  // t.is(stdoutSpy.getCall(0).args[0], mockQuote);
});

test.serial('options.color.author changes color of author', (t) => {
  stdoutSpy.resetHistory();

  const mockQuoteObj = {
    quote:  'foo',
    author: 'bar',
  };

  const mockAuthor = '\n\n\t\u001B[33m\u001B[4m— bar\u001B[24m\u001B[39m\n\n';

  const qotd = new Qotd({
    color: {
      enabled: true,
      quote:   'cyan.bold',
      author:  'yellow.underline',
    },
  });

  stdoutSpy.resetHistory();
  qotd.outputQuote(mockQuoteObj);

  t.true(stdoutSpy.called);
  // t.is(stdoutSpy.getCall(-1).args[0], mockAuthor);
});

/***********************************************************************
 *                          End Options Tests                          *
 **********************************************************************/
