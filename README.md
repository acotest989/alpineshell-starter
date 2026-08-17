# AlpineShell Starter

Structure and conventions for [Alpine.js](https://alpinejs.dev) apps: routing, pages, partials and stores — **without a build step**. Every dependency comes from a CDN as an ES module; there is no package manager and nothing to compile.

The framework lives in its own repository — [alpineshell](https://github.com/acotest989/alpineshell) — and is pulled from a CDN, pinned to a tag in the import map in `index.html`. This repository is the app around it.

## Start a project

Press **Use this template** on GitHub, or copy it locally without any history:

```bash
npx degit acotest989/alpineshell-starter my-app
```

## Getting started

One process serves the app and answers its API — see [server/README.md](server/README.md):

```bash
cd server
./setup.sh                 # or .\setup.ps1 — fetches the pinned PocketBase build
./pocketbase serve --publicDir=..
./pocketbase superuser create you@example.com yourpassword
```

Then open `http://127.0.0.1:8090`. The binary is not in git — ~33 MB, one per platform — so it is downloaded from the version pinned in `server/.pb-version`, which is also what the Dockerfile builds with.

`--indexFallback` is on by default and is the SPA fallback: an unknown path returns `index.html`, so a refresh on `/some/deep/route` still boots the app. Same origin, so there is nothing to configure for CORS and no host anywhere in the code.

**No account ships with this template.** Records are data, not schema, so nothing in git could carry one — and a starter with known credentials in it would deploy with known credentials in it. Register your own on `/register`. Everything except the account pages works signed out, so you can also leave the server off while you build the front.

The home page has two buttons worth clicking: a dead link, which lands on the `notfound` route, and a guarded one — signed out it bounces you to `/login` and brings you back to `/account` afterwards.

Live Server still works if you want reload-on-save, but then the API is on another origin: switch on the proxy in `.vscode/settings.json`.

> **Paths must start from the root** (`/main.js`, `/assets/theme.css`, `/partials/…`). A relative path resolves against the current route and breaks on any multi-segment URL. ES module imports are the exception: they resolve against the module, so they stay relative.

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
assets/
  main.css        loaded with a <link>: base font and x-cloak, before any JS runs
  theme.css       design system (.card, .btn, .input, .badge, .skeleton…)

pages/            one .html + one .js per route
partials/         markup reused across routes
stores/           Alpine stores — state that outlives a page
models/           maps API payloads into the app's own shapes
services/         talks to the outside world; the only place that knows endpoints
lib/              helpers, portable to any project
server/           PocketBase: database, auth, files and API in one binary
```

## Accounts

The whole surface is here and none of it is stubbed: register, email verification, password reset, changing your name, email or password, and deleting the account. `/account` is the only guarded route.

Three of those arrive by email, so PocketBase's mail templates have to link back to this app rather than to its own dashboard — the table is in [server/README.md](server/README.md), along with SMTP.

Two behaviours worth knowing before they surprise you. Changing a password or an email invalidates every token the account has, so the app signs itself out on purpose. And `/forgot-password` answers the same way whether or not the address is registered, because the honest answer would tell a stranger who has an account here.

Rate limits are on, as a migration rather than a dashboard toggle — settings are the one thing PocketBase does not write to `pb_migrations/` by itself. The mail endpoints are the reason: each call sends a message to whatever address was posted, so without a limit anyone can flood a stranger's inbox from your server.

## What the framework gives you

- **Routing** with route params, an auth guard, per-route titles and page-level chrome.
- **Pages** as plain HTML + a component factory, fetched on demand.
- **A root component** every page is nested in, so shared state and methods are one scope away.
- **Sessions** through an Alpine store, so code outside Alpine (the guard) can read them reactively.
- **Navigation manners** the router does not do for you: scroll reset, focus movement, page titles, cleared messages.
- **Messages** — `notify(text, type)` and one `message` object; errors wait to be dismissed, everything else clears itself. `partials/toast.html` decides how each type looks.
- **`http`**, a fetch wrapper that parses JSON, throws `HttpError` with the server's body, and supports timeouts and query params.

Every option is listed commented-out in `main.js`, and documented in the [framework README](https://github.com/acotest989/alpineshell#options).

## Design decisions

**No build step is the point.** Tailwind runs through its browser build, which compiles CSS at runtime and only reads `<style type="text/tailwindcss">` tags — it supports neither `<link>` nor `@import` for local files. That is why `theme.css` is fetched and injected as a style tag. For production, swap in the Tailwind CLI and ship a compiled stylesheet.

**Data never reaches a page raw.** `services/` fetches, `models/` maps the response into your own shape, pages consume only that. Changing API means changing one file.

**State ownership.** Page state belongs to the page component. State shared across routes and written from outside Alpine belongs in a store. The session is a mirror rather than a copy: the PocketBase SDK owns the token and persists it, and `stores/session.js` only makes it reactive. Two places claiming to know who is signed in is a bug waiting for a slow day.

**One file knows the backend.** `services/pb.js` is the only thing that imports the SDK, and `services/auth.js` is the only thing that talks to its auth. Swapping PocketBase for something else is those two files and the models, never a page.

## Dependencies

Alpine.js, [Pinecone Router](https://github.com/rehhouari/pinecone-router), `@alpinejs/persist` and Tailwind CSS come from jsDelivr, pinned to exact versions by the framework. The [PocketBase SDK](https://github.com/pocketbase/js-sdk) is pinned by this app, in the import map in `index.html`.

## License

MIT
