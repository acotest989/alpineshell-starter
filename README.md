# AlpineShell Starter

A full-stack starter with **no build step**: an [Alpine.js](https://alpinejs.dev) front end — routing, pages, partials and stores — over a [PocketBase](https://pocketbase.io) back end that is the database, the auth, the file storage and the API in a single binary, and that serves the front end too. One process, one origin. Every frontend dependency comes from a CDN as an ES module; there is no package manager and nothing to compile.

What is already built: **the whole account surface** — register, email verification, password reset, changing a name, an email or a password, deleting an account — with guarded routes, rate limits, and a `Dockerfile` that puts all of it in one image.

The framework lives in its own repository — [alpineshell](https://github.com/acotest989/alpineshell) — and is pulled from a CDN, pinned to a tag in the import map in `index.html`. This repository is the app around it.

## Quick start

Press **Use this template** on GitHub, or copy it locally without any history:

```bash
npx degit acotest989/alpineshell-starter my-app
cd my-app/server

./setup.sh                                                  # or .\setup.ps1 — fetches the pinned PocketBase
./pocketbase serve --publicDir=..                           # app and API on http://127.0.0.1:8090
./pocketbase superuser create you@example.com yourpassword  # first run only
```

Open `http://127.0.0.1:8090`, register yourself on `/register`, and find the dashboard at `/_/`.

Shipping it is one image with the binary, the migrations and the frontend inside. Everything lives in `pb_data`, so the volume *is* the deployment:

```bash
docker build -f server/Dockerfile --build-arg PB_VERSION=$(cat server/.pb-version) -t my-app .
docker run -p 8090:8090 -v pb_data:/pb/pb_data my-app
```

One process serves the app and answers its API. Mail setup, the dashboard's mail templates and the list of things to do before the URL is public are in [server/README.md](server/README.md). The binary is not in git — ~33 MB, one per platform — so it is downloaded from the version pinned in `server/.pb-version`, which is also what the Dockerfile builds with.

`--indexFallback` is on by default and is the SPA fallback: an unknown path returns `index.html`, so a refresh on `/some/deep/route` still boots the app. Same origin, so there is nothing to configure for CORS and no host anywhere in the code.

**No account ships with this template.** Records are data, not schema, so nothing in git could carry one — and a starter with known credentials in it would deploy with known credentials in it. Register your own on `/register`.

The home page is a row of things worth clicking: three that raise a toast, one for each temper the partial knows; a dead link, which lands on the `notfound` route; and a guarded one — signed out it bounces you to `/login` and brings you back to `/account` afterwards.

PocketBase serves the files as well as the API, so it is what you run. If you want reload-on-save instead, start Live Server and switch on the proxy in `.vscode/settings.json` — the app then comes from one port and `/api` is forwarded to the other, which is why `services/pb.js` can stay pointed at `/` either way. PocketBase still has to be running: it is the backend, not a dev server.

> **Paths must start from the root** (`/main.js`, `/assets/theme.css`, `/partials/…`). A relative path resolves against the current route and breaks on any multi-segment URL. ES module imports are the exception: they resolve against the module, so they stay relative.

## Make it yours

Five things carry the template's name rather than your project's:

| | |
|---|---|
| `lib/storage.js` | `APP` — the prefix on every persisted key. Two apps served from `localhost` share one storage area, and an unprefixed `auth` would be shared with them. |
| `index.html` | `<title>` and the description; the title is also the suffix after every page title. |
| `partials/header.html` | the brand, which currently reads `App`. |
| `favicon.svg` | drawn for this template — replace it. |
| `server/.pb-version` | leave it, but know it is where PocketBase's version lives. |

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

## Adding data of your own

The first real task after cloning. Say you want notes.

**1. The collection.** In the dashboard, `Collections → New`, called `notes`, with a `title` text field and a `body` editor field. Set the API rules so a note belongs to whoever made it — a `user` relation to `users`, and `@request.auth.id = user.id` on view, update and delete. PocketBase writes a migration into `server/pb_migrations/` as you go; commit it, and a fresh checkout gets the same collection.

**2. The service.** One file that knows the endpoint, and the only file allowed to import `pb`:

```js
// services/notes.js
import { pb } from './pb.js';
import { toNote } from '../models/note.js';

export async function fetchNotes() {
  const records = await pb.collection('notes').getFullList({ sort: '-created' });
  return records.map(toNote);
}
```

**3. The model.** Where PocketBase's shape stops:

```js
// models/note.js
export function toNote(record) {
  return {
    id: record.id,
    title: record.title,
    body: record.body,
    createdAt: record.created,
  };
}
```

**4. The page.** It asks the service and never learns where the answer came from:

```js
// pages/notes.js
import { fetchNotes } from '../services/notes.js';
import { errorMessage } from 'alpineshell';

export const notesPage = () => ({
  notes: [],
  pending: true,
  error: '',

  async init() {
    try {
      this.notes = await fetchNotes();
    } catch (err) {
      this.error = errorMessage(err, 'Could not load your notes.');
    } finally {
      this.pending = false;
    }
  },
});
```

The rule that makes this worth the four files: **a page never imports `pb`.** The moment one does, the app knows which database it is talking to, and swapping it stops being a job for one folder. The account pages follow the same rule — `services/auth.js` is the only thing that touches the SDK's auth.

Filtering user input needs `pb.filter()` rather than string building, for the same reason a SQL query does:

```js
pb.collection('notes').getList(1, 20, { filter: pb.filter('title ~ {:q}', { q }) });
```

## Layout

```
index.html        shell: toast slot and #page render target
main.js           the whole configuration of your app
app.js            state and methods shared by every page
assets/
  main.css        loaded with a <link>: base font, x-cloak, cursor — before any JS runs
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

## Deploying

`server/Dockerfile` builds one image with the binary, the migrations and the frontend inside it — the commands are in [server/README.md](server/README.md), along with the list of things that have to be true before the URL is public. Anywhere that runs a container and gives you a persistent volume will do: PocketBase keeps everything in `pb_data`, so the volume *is* the deployment.

## What the framework gives you

- **Routing** with route params, an auth guard, per-route titles and page-level chrome.
- **Pages** as plain HTML + a component factory, fetched on demand.
- **A root component** every page is nested in, so shared state and methods are one scope away.
- **Sessions** through an Alpine store, so code outside Alpine (the guard) can read them reactively.
- **Navigation manners** the router does not do for you: focus movement, page titles, cleared messages, and a page you arrive at starting at the top while back and forward keep the place they had.
- **Messages** — `notify(text, type)` and one `message` object; errors wait to be dismissed, everything else clears itself. `partials/toast.html` gives four tempers a colour apiece — error, warning, success, info — from the `.toast-*` variants in `theme.css`.
- **Failures that would otherwise be a blank page** — a template that will not load, a partial that will not load, a page whose `init()` throws. Each ends as a message rather than an empty screen.
- **Forms** — `form()` owns the submit sequence, so a page keeps only `validate()` and `save()`. Every account page here is written that way; `pages/login.js` is the shortest example.
- **`http`**, a fetch wrapper that parses JSON, throws `HttpError` with the server's body, and supports timeouts and query params.

Every option is listed commented-out in `main.js`, and documented in the [framework README](https://github.com/acotest989/alpineshell#options).

## Design decisions

**No build step is the point.** Tailwind runs through its browser build, which compiles CSS at runtime and only reads `<style type="text/tailwindcss">` tags — it supports neither `<link>` nor `@import` for local files. That is why `theme.css` is fetched and injected as a style tag. The cost is real and deliberate: the compiler goes to the visitor along with the page. That suits an internal tool, an admin panel, a prototype, a small site, and does not suit a content site living on search traffic. There is no CLI path here — an app that needs a compiled stylesheet has outgrown this starter.

**Data never reaches a page raw.** `services/` fetches, `models/` maps the response into your own shape, pages consume only that. Changing API means changing one file.

**State ownership.** Page state belongs to the page component. State shared across routes and written from outside Alpine belongs in a store. The session is a mirror rather than a copy: the PocketBase SDK owns the token and persists it, and `stores/session.js` only makes it reactive. Two places claiming to know who is signed in is a bug waiting for a slow day.

**One file knows the backend.** `services/pb.js` is the only thing that imports the SDK, and `services/auth.js` is the only thing that talks to its auth. Swapping PocketBase for something else is those two files and the models, never a page.

## Dependencies

Alpine.js, [Pinecone Router](https://github.com/rehhouari/pinecone-router), `@alpinejs/persist` and Tailwind CSS come from jsDelivr, pinned to exact versions by the framework. The [PocketBase SDK](https://github.com/pocketbase/js-sdk) is pinned by this app, in the import map in `index.html`.

## License

MIT
