
const fs              = require('fs');
const path            = require('path');
const http            = require('http');
const querystring     = require('querystring');
const cliSpinners     = require('cli-spinners');
const isOnline        = require('is-online');
const chalk           = require('chalk');
const OraMessageQueue = require('./OraMessageQueue');
const quotesJson      = require('./quotes.json');

const defaultOptions = {
  max:     quotesJson.max,
  offline: false,
  color:   {
    enabled: true,
    quote:   'yellow',
    author:  'bold.blue',
  },
};

class Qotd {
  constructor(options = {}) {
    const colors = Object.assign(defaultOptions.color, options.color);
    this.options = { ...defaultOptions, ...options };
    this.options.color = colors;
    this.pristine = true;
    this.constructed = true;
    this.updates = {};
    this.queue = new OraMessageQueue({
      spinner: cliSpinners.toggle,
    });

    // display Title
    process.stdout.write(chalk.underline('\n\nQuote of the day!\n\n'), 'utf8');

    // check if max is a boolean
    if (typeof this.options.max === 'boolean') {
      // display counts and exit
      this.outputCount();
      process.exit();
      return;
    }

    // if max has changed, update that first.
    // max cannot change to boolean
    if (this.options.max !== defaultOptions.max && typeof this.options.max !== 'boolean') {
      this.setUpdate({ max: this.options.max });
    }

    if (this.options.offline) {
      this.offlineQuote();
      return;
    }

    // init spinner
    this.initializeSpinner();

    // check connectivity
    this.checkOnline();

    // TODO:
    //   - parse / check if quotes puts over max
    //   - update / prune quotes
  }

  initializeSpinner() {
    // Bail if not constructed - for testing purposes.
    if (!this.constructed) {
      return;
    }

    // prep spinner and start it
    this.queue.add({
      text:  'Checking for internet connectivity...',
      color: 'gray',
    }, true);
  }

  async checkOnline() {
    // Bail if not constructed - for testing purposes.
    if (!this.constructed) {
      return;
    }

    try {
      const online = await isOnline();
      if (online) {
        try {
          const quoteObj = await this.fetchQuote();

          // display quote
          await this.queue.onEmpty();
          this.queue.stop();
          this.outputQuote(quoteObj);

          // add to updates so it gets written later
          this.setUpdate({ quote: quoteObj });

          this.writeUpdate();

          // check if above/below max threshold
          // this.checkThreshold();
        } catch (e) {
          this.onlineFailSafe();
        }
      } else {
        // not online
        this.onlineFailSafe();
      }
    } catch (e) {
      this.onlineFailSafe();
    }
  }

  onlineFailSafe() {
    // Bail if not constructed - for testing purposes.
    if (!this.constructed) {
      return;
    }

    // this.queue.stop();
    this.offlineQuote();
  }

  fetchQuote() {
    // Bail if not constructed - for testing purposes.
    if (!this.constructed) {
      return Promise.reject(new Error());
    }

    this.queue.add({
      text:  'Fetching Quote...',
      color: 'green',
    }, true);


    const promise = new Promise((resolve, reject) => {
      // POST body to send to API
      const postBody = querystring.stringify({
        format: 'json',
        lang:   'en',
        method: 'getQuote',
      });

      // Options of request to API
      const requestOptions = {
        hostname: 'api.forismatic.com',
        path:     '/api/1.0/',
        method:   'POST',
        headers:  {
          'Content-Type':     'application/x-www-form-urlencoded',
          'Content-Length':   Buffer.byteLength(postBody),
          'X-Requested-With': 'qotd-cli',
          'User-Agent':       'Qotd',
        },
      };

      const request = http.request(requestOptions, (response) => {
        let responseString = '';
        response.setEncoding('utf8');

        response.on('data', (chunk) => {
          responseString += chunk;
        });

        response.on('end', () => {
          const safeStr = responseString.replace(/\\'/g, "'");
          const respObj = JSON.parse(safeStr);
          resolve({
            index:  null,
            quote:  respObj.quoteText,
            author: respObj.quoteAuthor,
          });
        });
      });

      // error handler
      request.on('error', (error) => {
        reject(error);
      });

      // write post data to request body
      request.write(postBody);
      request.end();
    });

    return promise;
  }

  selectQuote() {
    // Bail if not constructed - for testing purposes.
    if (!this.constructed) {
      return {};
    }

    const { quotes } = quotesJson;
    const idx = Math.floor(Math.random() * quotes.length);
    const { quote, author } = quotes[idx];

    return {
      index: idx,
      quote,
      author,
    };
  }

  outputQuote(quoteObj) {
    // Bail if not constructed - or no quoteObj
    if (!this.constructed) {
      return;
    }

    const { quote, author } = quoteObj;
    const { color } = this.options;
    const newLine = '\n';
    const newLinePadding = '  ';
    const formattedQuote = quote.split(newLine).join(newLine + newLinePadding);

    // if (this.spinner) {}
    // this.queue.stop();

    if (color.enabled) {
      // attach style to chalk object - represents chalk['bold']['green']
      const quoteOuput = color
        .quote
        .split('.')
        .reduce((a, b) => a[b], chalk);

      const authorOuput = color
        .author
        .split('.')
        .reduce((a, b) => a[b], chalk);

      // output to stdout
      process.stdout.write(quoteOuput(`${newLinePadding}${formattedQuote}`));
      process.stdout.write(authorOuput(`\n\n\t— ${author}\n\n`));

      return;
    }

    process.stdout.write(`${newLinePadding}${formattedQuote}`);
    process.stdout.write(`\t— ${author}`);
  }

  outputCount() {
    // Bail if not constructed - for testing purposes.
    if (!this.constructed) {
      return;
    }

    const limitString  = 'Current Upper Limit of Quotes:';
    const lengthString = 'Current Number of Quotes:';
    const limit        = quotesJson.max;
    const { length }   = quotesJson.quotes;
    // going for about 3/4 of the size of the max
    const warnRange = Math.max(Math.min(2, limit), Math.floor(limit * 0.25));
    // going for about 1/10 of the size of the max
    const errRange = Math.max(Math.min(1, limit), Math.floor(limit * 0.1));

    if (this.options.color.enabled) {
      if (limit - length <= errRange) {
        // red notification
        process.stdout.write(`${chalk.dim(lengthString)}      ${chalk.red.bold(length)}\n`);
        process.stdout.write(`${chalk.dim(limitString)} ${chalk.red.bold(limit)}\n`);
        return;
      }

      if (limit - length > errRange && limit - length <= warnRange) {
        // yellow notification
        process.stdout.write(`${chalk.dim(lengthString)}      ${chalk.yellow.bold(length)}\n`);
        process.stdout.write(`${chalk.dim(limitString)} ${chalk.yellow.bold(limit)}\n`);
        return;
      }

      // green notification
      process.stdout.write(`${chalk.dim(lengthString)}      ${chalk.green.bold(length)}\n`);
      process.stdout.write(`${chalk.dim(limitString)} ${chalk.green.bold(limit)}\n`);
      return;
    }

    process.stdout.write(`${lengthString}      ${length}\n`);
    process.stdout.write(`${limitString} ${limit}\n`);
  }

  offlineQuote() {
    // Bail if not constructed - for testing purposes.
    if (!this.constructed) {
      return;
    }

    // if (this.spinner) {}
    this.queue.add({
      text:  'Selecting from Existing DataStore',
      color: 'red',
    }, true);

    this.outputQuote(this.selectQuote());

    if (!this.pristine) {
      this.writeUpdate();
    }
  }

  setUpdate(updateObj = {}) {
    // Bail if not constructed - for testing purposes.
    if (!this.constructed) {
      return;
    }

    // set the pristine flag to false
    if (this.pristine) {
      this.pristine = false;
    }

    this.updates = Object.assign(this.updates, updateObj);
  }

  quotesLengthComparator() {
    // Bail if not constructed - for testing purposes.
    if (!this.constructed) {
      return Number.NaN;
    }

    const { max } = quotesJson;
    const len = quotesJson.quotes.length;

    if (max > len) {
      return 1;
    }

    if (max < len) {
      return -1;
    }

    return 0;
  }

  prepOutputJson() {
    // Bail if not constructed - for testing purposes.
    if (!this.constructed) {
      return {};
    }

    const { updates, options } = this;
    const output = { ...quotesJson };

    if (updates.max) {
      output.max = updates.max;
    }

    if (updates.quote) {
      const comparator = this.quotesLengthComparator();
      const newQuote = updates.quote;
      let random;

      // Quotes Length < Max Length
      if (comparator > 0) {
        random = Math.floor(Math.random() * Math.floor(quotesJson.quotes.length));
        output.quotes.splice(random, 0, {
          quote:  newQuote.quote,
          author: newQuote.author,
        });

        return output;
      }

      random = Math.floor(Math.random() * Math.floor(options.max));

      // Quotes Length = Max Length
      if (comparator === 0) {
        // select a quote and replace it
        output.quotes.splice(random, 1, {
          quote:  newQuote.quote,
          author: newQuote.author,
        });
      }

      // Quotes Length > Max Length
      if (comparator < 0) {
        // prune quotes and add new quote
        output.quotes.splice(random, 0, {
          quote:  newQuote.quote,
          author: newQuote.author,
        });

        output.quotes.length = quotesJson.max;
      }
    }

    return output;
  }

  writeUpdate() {
    // Bail if not constructed - for testing purposes.
    if (!this.constructed) {
      return;
    }

    const { pristine } = this;

    if (pristine) {
      process.exit();
      return;
    }

    const outputJSON = this.prepOutputJson();
    const outputPath = path.resolve(__dirname, 'quotes.json');
    const jsonString = JSON.stringify(outputJSON, null, 2);

    const writeStream = fs.createWriteStream(outputPath);
    writeStream.write(jsonString);
    writeStream.end();
    writeStream.on('finish', () => {
      process.exit();
    });
  }
}

module.exports = Qotd;
