const test = require('ava');
const sinon = require('sinon');
const OraMessageQueue = require('./OraMessageQueue');
const Queue = require('./Queue');

const defaultDuration = 1250;

const WRITE_OVERRIDE = process.stderr.write;

test.before(() => {
  // silence ora output
  process.stderr.write = sinon.spy();
});

test.after(() => {
  process.stderr.write = WRITE_OVERRIDE;
});

test('OraMessageQueue::constructor() returns an OraMessageQueue', (t) => {
  const q = new OraMessageQueue();
  t.true(q instanceof OraMessageQueue);
});

test('OraMessageQueue::constructor() initializes \'duration\' instance variable', (t) => {
  const q = new OraMessageQueue();
  t.is(q.duration, defaultDuration);
});

test('OraMessageQueue::constructor() initializes \'oraOptions\' instance variable', (t) => {
  const q = new OraMessageQueue();
  t.deepEqual(q.oraOptions, {});
});

test('OraMessageQueue::constructor() initializes \'queue\' instance variable', (t) => {
  const q = new OraMessageQueue();
  t.true(q.queue instanceof Queue);
  t.is(q.queue.size, 0);
});

test('OraMessageQueue::constructor() initializes \'ora\' instance variable', (t) => {
  const q = new OraMessageQueue();
  t.truthy(q.ora);
});

test('OraMessageQueue::constructor() initializes \'queueInterval\' instance variable', (t) => {
  const q = new OraMessageQueue();
  t.is(q.queueInterval, null);
});

test('OraMessageQueue::constructor() initializes \'emptyCheckInterval\' instance variable', (t) => {
  const q = new OraMessageQueue();
  t.is(q.emptyCheckInterval, null);
});

// test.todo('OraMessageQueue::methodName()');
