# QOTD - Quote of the Day
Outputs a random quote of the day.  

By default, `qotd` will try to determine if the system is connected to the internet or not.  
If a connection is present, `qotd` will do the following:
  - request a quote from a public API
  - output quote and author to the terminal
  - compare length of existing quotes against maximum setting
    - if below threshold, simply add to random index of quotes
    - if equal to threshold, replace a quote at a random index of quotes
    - if above threshold, add to random index (against maximum) - and prune quotes

If, however, a connection is not present, or the request for a quote failed, `qotd` will do the following:
  - select a random quote from the existing data store
  - output quote to shell



## Options

#### Maximum Number of Quotes 
> Default 200  

The `max` option provides a way increase, or decrease the maximum number of quotes the local data store should hold. Additionally the `max` option provides a way to infer how close your current data store is to the maximum threshold.

###### Output Data Store Information
By suppling a boolean value to the `max` option, or simply using the `-m` flag, `qotd` will output both the current number of quotes in your data store, and the maximum number of quotes.
> Note: This will only output the information from the data store and exit. This will not request a quote or continue the normal flow of the application.


```bash
qotd --max=true 
# or
qotd -m

# outputs:
Current Number of Quotes:      <current>
Current Upper Limit of Quotes: <maximum>
```

###### Change Maximum Threshold
By supplying a numeric value to the `max` option you will change the maximum number stored in the local data store. 
> Note: This will request a quote and continue the typical application flow; writing the change at the end of application flow.

```bash
qotd --max=<Integer>
# or
qotd -m <Integer>
```

#### Quote Color
> Default 'yellow'  

The `quote-color` option provides a way to augment the color of the quote output. `qotd` uses [Chalk](https://www.npmjs.com/package/chalk) for styling output, therefore any valid chalk style can be supplied, including chained styles (e.g. 'blue.bold.underline.bgGreen')

```bash
qotd --quote-color=<String>
# or
qotd -q <String>
```

#### Author Color
> Default 'bold.blue'  

The `author-color` option provides a way to augment the color of the author output. `qotd` uses [Chalk](https://www.npmjs.com/package/chalk) for styling output, therefore any valid chalk style can be supplied, including chained styles (e.g. 'blue.bold.underline.bgGreen')

```bash
qotd --author-color=<String>
# or
qotd -a <String>
```

#### Disable Color

The `no-color` option provides a way to disable color output entirely.

```bash
qotd --no-colors
# or
qotd -C
```

#### Offline Mode

The `offline` options provides a way to skip the request of a quote from the API and instead use the local data store.

```bash
qotd --offline
# or
qotd -x
```

#### Output Version

The `version` option outputs the current `qotd` version and exits.

```bash
qotd --offline
# or
qotd -x

# outputs:
qotd:
v[MAJOR].[MINOR].[PATCH]
```

#### Output Help

The `help` option outputs the usage text and exits.

```bash
qotd --help
# or
qotd -h
# or
qotd ?

# outputs usage document
```


## API
`qotd` uses a public api provided by [forismatic](http://forismatic.com/en/api/)

## Local JSON Data Store
`qotd` uses a local JSON file prepopulated with a number of quotes, should you qish only to use offline mode. Most of these quotes were orginially from this [gist: signed0/quotes.json](https://gist.github.com/signed0/d70780518341e1396e11).

## Application Flow:  
![FlowChart](./assets/qotd-diagram.jpg)  


## Testing:

This project uses [AVA](https://github.com/avajs/ava) for tests. Due to the nature of how some of the mocking of the tests are written, some tests may need to be run `serial`. Additionally, it is worth noting that if errors occur in testing, its worth paying attention to the local data store. Unfortunately, there's a chance it can get deleted should something go awry. Precatutions were made to limit that from happening, but it's worthwhile to mention.
