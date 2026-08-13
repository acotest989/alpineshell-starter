# AlpineShell

Structure and conventions for [Alpine.js](https://alpinejs.dev) apps: routing, pages, partials and stores — **without a build step**. Every dependency comes from a CDN as an ES module; there is no package manager and nothing to compile.

This repository is both the framework (`alpineshell/`) and a starter you can build on.

## Getting started

1. Open this folder in VS Code (as the workspace root, so `.vscode/settings.json` applies).
2. Start Live Server.

That is it. `liveServer.settings.file` is the SPA fallback: every 404 returns `index.html`, so a refresh on `/some/deep/route` still boots the app.

Sign in on `/login` with `demo@shop.test` / `test1234` — that user lives in `services/auth.js`.

> **Paths must start from the root** (`/main.js`, `/theme.css`, `/partials/…`). A relative path resolves against the current route and breaks on any multi-segment URL. ES module imports are the exception: they resolve against the module, so they stay relative.

## Adding a page

Three steps, no framework file touched:

```html
<!-- pages/about.html -->
<main class="mx-auto w-full max-w-3xl p-4" x-data="aboutPage">
  <h1 class="text-xl font-semibold" x-text="heading"></h1>
</main>
```

```js
// pages/about.js
export const aboutPage = () => ({
  heading: 'About',
});
```

```js
// main.js
routes: { '/about': 'about' },
pages: { aboutPage },
```

The route value is a **page name**. From it the framework derives the template (`/pages/about.html`) and the title (`About`, overridable in `titles`). The page's own markup names its component.

## Layout

```
index.html        shell: toast slot and #page render target
main.js           the whole configuration of your app
app.js            state and methods shared by every page
theme.css         design system (.card, .btn, .input, .badge, .skeleton…)

alpineshell/      the framework
  index.js        createApp() — the only entry point an app needs
  router.js       routes, guards, titles, navigation events
  root.js         root component and partial loading
  http.js         fetch wrapper: auto JSON, throws on !ok, timeout, query params

pages/            one .html + one .js per route
partials/         markup reused across routes
stores/           Alpine stores — state that outlives a page
services/         talks to the outside world; the only place that knows endpoints
lib/              helpers, portable to any project
```

## What the framework gives you

- **Routing** with route params, an auth guard, per-route titles and page-level chrome.
- **Pages** as plain HTML + a component factory, fetched on demand.
- **A root component** every page is nested in, so shared state and methods are one scope away.
- **Sessions** through an Alpine store, so code outside Alpine (the guard) can read them reactively.
- **Navigation manners** the router does not do for you: scroll reset, focus movement, page titles, cleared errors.
- **`http`**, a fetch wrapper that parses JSON, throws `HttpError` with the server's body, and supports timeouts and query params.

Every option, with defaults, is documented above `createApp()` in `alpineshell/index.js` and listed commented-out in `main.js`.

## Design decisions

**No build step is the point.** Tailwind runs through its browser build, which compiles CSS at runtime and only reads `<style type="text/tailwindcss">` tags — it supports neither `<link>` nor `@import` for local files. That is why `theme.css` is fetched and injected as a style tag. For production, swap in the Tailwind CLI and ship a compiled stylesheet.

**Data never reaches a page raw.** `services/` fetches, `models/` maps the response into your own shape, pages consume only that. Changing API means changing one file.

**State ownership.** Page state belongs to the page component. State shared across routes and written from outside Alpine belongs in a store.

## Dependencies

Alpine.js, [Pinecone Router](https://github.com/rehhouari/pinecone-router), `@alpinejs/persist`, Tailwind CSS — all from jsDelivr, all pinned in `alpineshell/index.js`.

## License

MIT
