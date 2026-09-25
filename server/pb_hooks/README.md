# Hooks

Server-side logic in JavaScript, as `*.pb.js` files. PocketBase picks them up from this directory, and they run in its embedded engine — not Node.

This is where anything the client must not decide belongs. The obvious one: never let a browser post the amount it intends to pay. Price the order here, from the records, and reject what does not match.

```js
// checkout.pb.js — a route of your own, so the collection can stay closed
routerAdd('POST', '/api/checkout', (e) => {
  const body = e.requestInfo().body;
  const item = $app.findRecordById('items', body.itemId);

  // Read here, never taken from the request. The client may send its price, but only
  // so this can refuse a cart that was priced differently.
  const total = item.getInt('price_cents') * body.qty;

  $app.runInTransaction((tx) => { /* write the record and move the stock together */ });
});
```

A route rather than a hook on the collection's create: then `createRule` stays `null` and there is no second way in to keep in step. Use `$app.runInTransaction` whenever one request touches two collections — half a purchase is worse than none.

The engine is goja: ES5 plus most of ES6, CommonJS only (no ES modules without pre-bundling), no `setTimeout`, no `fetch` (`$http.send` does its job), no Node APIs. Each handler runs isolated, so variables declared outside one are not visible inside it — a helper defined at the top of the file is missing at call time. Code two hooks share goes in a file without the `.pb.js`, which PocketBase does not load on its own, and a handler takes it in with `require(__hooks + '/helpers.js')`.

Two things that cost an afternoon if nobody says them: the extension really must be `.pb.js`, and routes are registered when the server starts. The file watcher does not reliably restart it, so restart it yourself after adding or renaming a hook.

One hook ships with the starter: `private.pb.js`, which keeps `server/` and dotfiles out of what `--publicDir=..` serves, the database above all.

A scheduled job (`cronAdd`) and a transaction across collections are both fine here. When a hook grows past a few hundred lines, or needs a real library or cryptography the engine does not have, that is the signal to import PocketBase as a Go module and add routes in your own `main.go` instead. Same binary, same database, no migration.
