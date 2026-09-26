# Hooks

Server-side logic in JavaScript. PocketBase runs it in its embedded engine — not Node — from the `*.pb.js` files at the top of this directory, and only those. The starter ships with none: an app needs its first one when the client has something it must not decide.

The obvious one: never let a browser post the amount it intends to pay. Price the order here, from the records, and reject what does not match.

```js
// app.pb.js — a route of your own, so the collection can stay closed
routerAdd('POST', '/api/checkout', (e) => require(__hooks + '/lib/checkout.js').place(e));
```

```js
// lib/checkout.js
function place(e) {
  const body = e.requestInfo().body;
  const item = $app.findRecordById('items', body.itemId);

  // Read here, never taken from the request. The client may send its price, but only
  // so this can refuse a cart that was priced differently.
  const total = item.getInt('price_cents') * body.qty;

  $app.runInTransaction((tx) => { /* write the record and move the stock together */ });
  return e.json(200, { total: total });
}

module.exports = { place };
```

A route rather than a hook on the collection's create: then `createRule` stays `null` and there is no second way in to keep in step. Use `$app.runInTransaction` whenever one request touches two collections — half a purchase is worse than none.

Why the two files: a handler in a `.pb.js` file runs in a runtime of its own, without the file around it, so a helper declared beside it is missing when it runs. A module taken in with `require()` is ordinary CommonJS, and its functions share what they like. Keeping every route in one `.pb.js` file, a line each, and the code in `lib/`, gives the whole server one page to read — the shop built on this starter, [shop-template](https://github.com/acotest989/shop-template), does exactly that.

The engine is goja: ES5 plus most of ES6, CommonJS only (no ES modules without pre-bundling), no `setTimeout`, no `fetch` (`$http.send` does its job), no Node APIs.

Two things that cost an afternoon if nobody says them: the extension of a file PocketBase should run really must be `.pb.js`, and routes are registered when the server starts. The file watcher does not reliably restart it, so restart it yourself after changing anything here — `lib/` included, since a module is read once.

A scheduled job (`cronAdd`) and a transaction across collections are both fine here. When the code needs a real library or cryptography the engine does not have, that is the signal to import PocketBase as a Go module and add routes in your own `main.go` instead. Same binary, same database, no migration.
