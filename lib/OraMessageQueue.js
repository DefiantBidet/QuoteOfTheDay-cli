const ora = require('ora');
const Queue = require('./Queue');

const recursiveRunner = (context) => {
  const { queue } = context;
  const intervalId = context.queueInterval;
  const innerOra = context.ora;

  if (queue.isEmpty()) {
    clearInterval(intervalId);
    // context.stop();
    return;
  }
  const info = queue.dequeue();

  if (info.color) {
    innerOra.color = info.color;
  }

  if (info.text) {
    innerOra.text = info.text;
  }

  if (info.spinner) {
    innerOra.spinner = info.spinner;
  }
};

const recursiveCheck = (context, resolve) => {
  const { queue } = context;
  const intervalId = context.emptyCheckInterval;

  if (queue.isEmpty()) {
    clearInterval(intervalId);
    resolve();
  }
};


class OraMessageQueue {
  constructor(oraOptions = {}, duration = 1250) {
    this.duration = duration;
    this.oraOptions = oraOptions;
    this.queue = new Queue();
    this.ora = ora(this.oraOptions);
    this.queueInterval = null;
    this.emptyCheckInterval = null;
  }

  /**
   * Adds a <OraQueueObject> to the queue.
   * <OraQueueObject> is an object with optional
   * `text`, `color`, `spinner` members
   * @param {Object} info ora settings to enqueue
   */
  add(info, autoStart = false) {
    const oraData = {};
    if (info.color) {
      oraData.color = info.color;
    }

    if (info.text) {
      oraData.text = info.text;
    }

    this.queue.enqueue(oraData);

    if (autoStart) {
      this.start();
    }
  }

  start() {
    const oraInstance = this.ora;
    const { queue, duration } = this;

    // nothing to start if queue is empty
    if (queue.isEmpty()) {
      return this;
    }
    // don't retrigger setInterval if already running one.
    if (this.queueInterval) {
      return this;
    }

    const info = queue.dequeue();
    oraInstance.start();
    if (info.color) {
      oraInstance.color = info.color;
    }

    if (info.text) {
      oraInstance.text = info.text;
    }

    if (info.spinner) {
      oraInstance.spinner = info.spinner;
    }

    this.queueInterval = setInterval(recursiveRunner, duration, this);

    return this;
  }

  /*********************************************************************
   * NOTE:
   *   The following methods are effectively wrappers to ora's methods.
   *   However, it is worth noting that prior to invoking the ora method,
   *   the wrappers clear the Queue. This causes the ora methods to be
   *   invoked instantaneously, as the queue is flushed.
   *
   ********************************************************************/

  /**
   * Stop and clear the spinner.
   * @return {OraMessageQueue}  The Queue instance for chaining
   */
  stop() {
    this.queue.clear();
    this.ora.stop();

    clearInterval(this.queueInterval);
    return this;
  }

  /**
   * Stop the spinner, change it to a green ✔ and persist the current
   * text, or text if provided.
   * @param  {String} text        Optional text to persist with ✔
   * @return {OraMessageQueue}    The Queue instance for chaining
   */
  succeed(text) {
    this.queue.clear();
    this.ora.succeed(text);
    return this;
  }

  /**
   * Stop the spinner, change it to a red ✖ and persist the current
   * text, or text if provided.
   * @param  {String} text        Optional text to persist with ✖
   * @return {OraMessageQueue}    The Queue instance for chaining
   */
  fail(text) {
    this.queue.clear();
    this.ora.fail(text);
    return this;
  }

  /**
   * Stop the spinner, change it to a yellow ⚠ and persist the current
   * text, or text if provided.
   * @param  {String} text        Optional text to persist with ⚠
   * @return {OraMessageQueue}    The Queue instance for chaining
   */
  warn(text) {
    this.queue.clear();
    this.ora.warn(text);
    return this;
  }

  /**
   * Stop the spinner, change it to a blue ℹ and persist the current
   * text, or text if provided.
   * @param  {String} text        Optional text to persist with ℹ
   * @return {OraMessageQueue}    The Queue instance for chaining
   */
  info(text) {
    this.queue.clear();
    this.ora.info(text);
    return this;
  }

  /**
   * Stop the spinner and change the symbol or text.
   * @param  {Symbol|String} options The Symbol or text to persist with
   * @return {OraMessageQueue}    The Queue instance for chaining
   */
  stopAndPersist(options) {
    this.queue.clear();
    this.ora.stopAndPersist(options);
    return this;
  }

  /**
   * Clear the spinner.
   * @return {OraMessageQueue}  The Queue instance for chaining
   */
  clear() {
    this.queue.clear();
    this.ora.clear();
    clearInterval(this.queueInterval);
    return this;
  }

  onEmpty() {
    if (this.queue.isEmpty()) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.emptyCheckInterval = setInterval(recursiveCheck, this.duration, this, resolve);
    });
  }
}

module.exports = OraMessageQueue;
