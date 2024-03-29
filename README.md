# njodb-cli

`njodb-cli` is a simple command-line interface (CLI) for [njodb](https://www.npmjs.com/package/njodb).

## Table of contents
- [Install](#install)
- [Introduction](#introduction)
- [Commands](#commands)
  - [clear](#clear)
  - [details](#details)
  - [exit](#exit)
  - [last](#last)
  - [more](#more)

## Install

One needs to install `njodb-cli` as a global package so that it can be executed from the command line directly:
```
npm install -g njodb-cli
```

## Introduction

Start up the CLI and create or connect to an existing NJODB in the current working directory:
```
njodb-cli.js
```

Start up the CLI and create or connect to an existing NJODB in another directory:
```
njodb-cli.js --root /path/to/somewhere
```

Upon successful startup:
```
Connected to the database at /Users/jamesbontempo/github/njodb-cli using njodb 0.4.33
Available database methods (prepend with db. and end with ;):
	aggregate, delete, drop, grow, insert, insertFile, resize, select, shrink, stats, update
Additional commands:
	clear, details, exit, last, more
njodb>
```

For information about the database methods and the data they return see the [njodb documentation](https://www.npmjs.com/package/njodb). By default, `njodb-cli` uses the synchronous versions of the methods (but you don't have to include "Sync"). This allows for easy chaining, like in this example where the data returned from a `select` call is sorted by `id`:
```
db.select(r => r.id <= 100).data.sort((a, b) => a.id - b.id);
```

If for some reason you want to use the asynchronous versions of the methods, you can specify that during start-up:
```
njodb-cli.js --async
```

And then you can achieve the same result as the above example with:
```
db.select(r => r.id <= 100).then(results => results.data.sort((a, b) => a.id - b.id));
```

Some `njodb` method calls can be verbose, so `njodb-cli` allows multi-line entry (and will even try to help auto-indent):
```
njodb> db.aggregate(
 ... >   r => r.id <= 100,
 ... >   r => [r.region, r.state],
 ... >   r => {
 ... >     return {firstName: r.firstName, lastName: r.lastName};
 ... >   }
 ... > );
 ```

## Commands

In addition to the `njodb` methods, there are several commands specific to `njodb-cli`.

### clear

If a mistake is made in the process of writing a database method call (especially a particularly long one), entering `clear` will reset the input, clearing any entered text from memory and resetting the prompt. Typing `clear` while paging through a large data set returned from a `select` or `aggregate` call will also clear the data set from memory.

### details

`njodb` methods generally return a `details` object that provides information specific to each datastore. By default, this information is not provided after making a method call using `njodb-cli`. However, entering `details` will provide that information.

### exit

Typing `exit` will close `njodb-cli`.

### last

One can retrieve the last successfully executed method call by using the `last` command. While one-liners can generally be retrieved by pressing the up arrow key, this is not particularly useful for calls that have been entered across multiple lines. Entering `last` will return the full text of multi-line calls so they can be easily re-run or edited.

### more

For `njodb` method calls that return data (i.e, `select` and `aggregate`), `njodb-cli` will only display the first ten results. Typing `more` will retrieve the next ten records in the data set. This command can be called repeatedly to page through all of the data until there is none left.
