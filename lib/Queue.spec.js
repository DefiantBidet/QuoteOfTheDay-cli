const test = require('ava');
const sinon = require('sinon');
const Queue = require('./Queue');

const iterableFixture = [1, 2, 3, 4, 5];

test('Queue::constructor() returns a Queue', (t) => {
  const q = new Queue();
  t.true(q instanceof Queue);
  t.is(q.size, 0);
});

test('Queue::constructor() supplied an iterable returns a Queue of iterables', (t) => {
  const q = new Queue(iterableFixture);
  t.true(q instanceof Queue);
  t.is(q.size, iterableFixture.length);
  t.is(q.toString(), iterableFixture.toString());
});

test('Queue::get:size() returns size of Queue', (t) => {
  const q = new Queue();
  t.is(q.size, 0);

  q.enqueue(1);
  t.is(q.size, 1);

  q.enqueue(2);
  t.is(q.size, 2);
});

test('Queue::enqueue() returns instance for chaining', (t) => {
  const q = new Queue();
  t.is(q.enqueue(1), q);
});

test('Queue::enqueue() adds items to end of Queue', (t) => {
  const q = new Queue();
  t.is(q.toString(), '');

  q.enqueue(1);
  t.is(q.toString(), '1');

  q.enqueue(2);
  t.is(q.toString(), '1,2');
});

test('Queue::enqueue() chained calls add items to end of Queue', (t) => {
  const q = new Queue();
  t.is(q.toString(), '');

  q.enqueue(1)
    .enqueue(2)
    .enqueue(3);

  t.is(q.toString(), '1,2,3');
});

test('Queue::dequeue() throws ReferenceError when Queue is empty', (t) => {
  const error = () => {
    const q = new Queue();
    q.dequeue();
  };
  t.throws(error);
});

test('Queue::dequeue() removes items from front of Queue', (t) => {
  const q = new Queue();
  q.enqueue(1)
    .enqueue(2)
    .enqueue(3);

  const removed = q.dequeue();

  t.is(removed, 1);
  t.is(q.toString(), '2,3');
});

test('Queue::has() returns \'true\' when Queue has item enqueued', (t) => {
  const fixture = 1;
  const q = new Queue();
  q.enqueue(fixture);
  t.true(q.has(fixture));
});

test('Queue::has() returns \'false\' when Queue doesn\'t have item enqueued', (t) => {
  const fixture = 1;
  const q = new Queue();
  t.false(q.has(fixture));

  q.enqueue('foo');
  t.false(q.has(fixture));
});

test('Queue::peek() throws ReferenceError when Queue is empty', (t) => {
  const error = () => {
    const q = new Queue();
    q.peek();
  };
  t.throws(error);
});

test('Queue::peek() returns next item in queue', (t) => {
  const fixture = 1;
  const q = new Queue();
  q.enqueue(fixture);
  t.is(q.peek(), fixture);
});

test('Queue::clear() returns instance for chaining', (t) => {
  const q = new Queue(iterableFixture);
  t.is(q.clear(), q);
  t.is(q.size, 0);
});

test('Queue::clear() empties the Queue', (t) => {
  const q = new Queue(iterableFixture);
  t.is(q.size, 5);
  q.clear();
  t.is(q.size, 0);
});

test('Queue::isEmpty() returns \'true\' when Queue is empty', (t) => {
  const q = new Queue();
  t.true(q.isEmpty());
});

test('Queue::isEmpty() returns \'false\' when Queue is not empty', (t) => {
  const q = new Queue(iterableFixture);
  t.false(q.isEmpty());
});

test('Queue::forEach() iterates through Queue and invokes \'callback \' on each item', (t) => {
  let index = 0;
  const q = new Queue(iterableFixture);
  const mockCallBack = (item, context) => {
    const itemMock = iterableFixture[index];
    t.is(item, itemMock);
    t.is(context, q);
    index += 1;
  };

  const spy = sinon.spy(mockCallBack);

  q.forEach(spy);

  t.true(spy.called);
  t.is(spy.callCount, iterableFixture.length);
});

test('Queue::forEach() iterates through Queue and invokes \'callback \' on each item with supplied \'context\'', (t) => {
  const q = new Queue(iterableFixture);
  let index = 0;

  q.forEach((item, context) => {
    const itemMock = iterableFixture[index];
    t.is(item, itemMock);
    t.is(context, q);
    index += 1;
  }, q);
});

test('Queue::toString() returns String', (t) => {
  const q = new Queue(iterableFixture);
  t.is(typeof q.toString(), 'string');
});

test('Queue::toString() returns String representation of Queue', (t) => {
  const q = new Queue(iterableFixture);
  t.is(q.toString(), iterableFixture.toString());
});
