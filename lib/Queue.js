// `protected` queue Symbol
const queue = Symbol('queueData');

/**
 * Creates a Queue DataType.
 * A classic representation of a First-In-First-Out data sturcture.
 */
class Queue {
  /**
   * Constructs a classic Queue representation
   * @param  {Iterable} Iterable  (Optional) Iterable to populate queue
   * @return {Queue}              First-In, First-Out Queue
   */
  constructor(iterable) {
    // instance of queue Symbol
    this[queue] = [];

    // check for iterable constructor argument
    if (iterable) {
      // loop through iterable and enqueue any item
      for (const item of iterable) {
        this.enqueue(item);
      }
    }
  }

  /**
   * Returns the size of the Queue
   * @return {Number} One-based Integer of Queue length
   */
  get size() {
    return this[queue].length;
  }

  /**
   * Add an `item` to the Queue
   * @param  {*}      item  Adds a <DataType> to the end of the Queue
   * @return {Queue}        The Queue instance for chaining
   */
  enqueue(item) {
    // add item to queue
    this[queue].push(item);

    // return instance for chaining
    return this;
  }

  /**
   * Removes and `item` from the Queue
   * @return {*}            The first `item` in the Queue
   */
  dequeue() {
    // Throw error if attempting to dequeue an empty queue
    if (this.isEmpty()) {
      throw new ReferenceError('Queue Underflow');
    }

    // a queuue is a FIFO data type: First In First Out
    // return first item from queue
    return this[queue].shift();
  }

  /**
   * Checks if the Queue is the item enqueued
   * @param  {*}  item      The <DataType> to search the Queue for
   * @return {Boolean}      Boolean representing if search item was found
   */
  has(item) {
    // Brute Force Search through queue to find item
    // TODO: perhaps sort and to a Binary Search
    for (let index = 0; index < this.size; index++) {
      if (item === this[queue][index]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Looks into the Queue to return the first item
   * @return {*} The <DataType> that is next in line to be removed
   */
  peek() {
    // Throw error if attempting to peek into an empty queue
    if (this.isEmpty()) {
      throw new ReferenceError('Queue Underflow');
    }

    // return next item in queue
    return this[queue][0];
  }

  /**
   * Empties the Queue
   * @return {Queue}  The Queue instance for chaining
   */
  clear() {
    // remove items from queue
    this[queue].length = 0;

    // return instance for chaining
    return this;
  }

  /**
   * Returns a Boolean value whether Queue is empty
   * @return {Boolean} Is or Is Not empty
   */
  isEmpty() {
    return this[queue].length < 1;
  }

  /**
   * Iterates over Queue and performs supplied `callback` with (optional) `context`
   * @param  {Function} callback The function to invoke on each item in Queue
   * @param  {Object}   context  The context, or `this`, of the `callback`
   */
  forEach(callback, context) {
    for (const item of this) {
      callback.apply(context, [item, this]);
    }
  }

  /**
   * Returns a String Representation of Queue
   * @return {String} The representation of the Queue as a String
   */
  toString() {
    let outputString = '';

    // iterate through queue and append to output string
    for (let index = 0; index < this.size; index++) {
      outputString += `${this[queue][index]},`;
    }

    // trim trailing comma from output string
    return outputString.slice(0, -1);
  }

  /**
   * The GeneratorFunction/Iterator Factory of the internal Queue Symbol
   * used to keep the internal data storage `protected`
   */
  * [Symbol.iterator]() {
    for (let index = 0; index < this.size; index++) {
      yield this[queue][index];
    }
  }
}

module.exports = Queue;
