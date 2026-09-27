# AlpineShell Starter

A full-stack starter with **no build step**: an [Alpine.js](https://alpinejs.dev) front end — routing, pages, partials and stores — over a [PocketBase](https://pocketbase.io) back end that is the database, the auth, the file storage and the API in a single binary, and that serves the front end too. One process, one origin. Every frontend dependency comes from a CDN as an ES module; there is no package manager and nothing to compile.

What is already built: **the whole account surface** — register, email verification, password reset, changing a name, an email or a password, deleting an account — with guarded routes, rate limits, and a `Dockerfile` that puts all of it in one image.

The framework lives in its own repository — [alpineshell](https://github.com/acotest989/alpineshell) — and is pulled from a CDN, pinned to a tag in the import map in `pb_public/index.html`. This repository is the app around it.

## Quick start

Press **Use this template** on GitHub, or copy it locally without any history:

```bash
npx degit acotest989/alpineshell-starter my-app
cd my-app

./setup.sh                    # downloads PocketBase — .\setup.ps1 in PowerShell
./pocketbase serve            # app and API on http://127.0.0.1:8090
./pocketbase superuser create you@example.com yourpassword   # first run only
```

Open `http://127.0.0.1:8090`, register yourself on `/register`, and find the dashboard at `/_/`.

The repository is a PocketBase app, laid out the way PocketBase looks for one: the front end in `pb_public/`, server code in `pb_hooks/`, the schema in `pb_migrations/`, and the database in `pb_data/` beside them. So serving it needs no flags, and the database is never among the files it serves.

**Mail is the one thing not already wired**, and it is worth doing before you wonder why nothing arrives. Verification, password reset and email changes each send a message, and PocketBase's built-in sendmail will not deliver — so registering succeeds and the email never comes until SMTP is set under **Settings → Mail settings**. [Mailpit](https://mailpit.axllent.org) is the easiest local option: it catches everything and shows it in a browser. The templates themselves already link here rather than into PocketBase's dashboard; that arrives as a migration, so there is nothing to click. See [Mail](#mail).

Shipping it is one image with the binary, the migrations and the frontend inside. Everything lives in `pb_data`, so the volume *is* the deployment:

```bash
docker build --build-arg PB_VERSION=$(cat .pb-version) -t my-app .
docker run -p 8090:8090 -v pb_data:/pb/pb_data my-app
```

One process serves the app and answers its API. The binary is not in git — ~33 MB, one per platform — so it is downloaded from the version pinned in `.pb-version`, which is also what the Dockerfile builds with.

`--indexFallback` is on by default and is the SPA fallback: an unknown path returns `index.html`, so a refresh on `/some/deep/route` still boots the app. Same origin, so there is nothing to configure for CORS and no host anywhere in the code.

**No account ships with this template.** Records are data, not schema, so nothing in git could carry one — and a starter with known credentials in it would deploy with known credentials in it. Register your own on `/register`.

The home page is the tour: what is already built, a panel of things worth clicking — four raise a toast, one for each temper the partial knows, one is a dead link that lands on the `notfound` route, and one is guarded, so signed out it bounces you to `/login` and brings you back afterwards — then every command there is, and where to start editing. Delete it once it has done its job.

PocketBase serves the files as well as the API, so it is what you run. If you want reload-on-save instead, start Live Server — `.vscode/settings.json` points it at `pb_public/` — and switch on the proxy there: the app then comes from one port and `/api` is forwarded to the other, which is why `services/pb.js` can stay pointed at `/` either way. PocketBase still has to be running: it is the backend, not a dev server.

> **Paths must start from the root** (`/main.js`, `/assets/theme.css`, `/partials/…`), which is `pb_public/`. A relative path resolves against the current route and breaks on any multi-segment URL. ES module imports are the exception: they resolve against the module, so they stay relative.

## Make it yours

Seven things carry the template's name rather than your project's:

| | |
|---|---|
| `pb_public/lib/storage.js` | `APP` — the prefix on every persisted key. Two apps served from `localhost` share one storage area, and an unprefixed `auth` would be shared with them. |
| `pb_public/index.html` | `<title>` and the description; the title is also the suffix after every page title. |
| `pb_public/partials/header.html` | the brand, which currently reads `App`. |
| `pb_public/favicon.svg` | drawn for this template — replace it. |
| `fly.toml` | the app name, and the region. Delete the file if you deploy elsewhere. |
| `.pb-version` | leave it, but know it is where PocketBase's version lives. |
| `renovate.json5` | the `timezone` its Monday runs by. Delete the file if you do not use [Renovate](#the-server). |

## Adding a page

Three steps, no framework file touched:

```html
<!-- pb_public/pages/about.html -->
<main class="mx-auto w-full max-w-3xl p-4" x-data="aboutPage">
  <h1 class="text-xl font-semibold" x-text="heading"></h1>
</main>
```

```js
// pb_public/pages/about.js
export const aboutPage = () => ({
  heading: 'About',
});
```

```js
// pb_public/main.js
routes: { '/about': 'about' },
pages: { aboutPage },
```

The route value is a **page name**. From it the framework derives the template (`/pages/about.html`) and the title (`About`, overridable in `titles`). The page's own markup names its component. Pages that belong together share a folder, and their names say so: the account's are in `pages/account/`, so the login page is `'account/login'`.

## Adding data of your own

The first real task after cloning. Say you want notes.

**1. The collection.** In the dashboard, `Collections → New`, called `notes`, with a `title` text field and a `body` editor field. Set the API rules so a note belongs to whoever made it — a `user` relation to `users`, and `@request.auth.id = user.id` on view, update and delete. PocketBase writes a migration into `pb_migrations/` as you go; commit it, and a fresh checkout gets the same collection.

**2. The service.** One file per topic: the only one that knows the endpoint, the only one allowed to import `pb`, and where PocketBase's shape stops:

```js
// pb_public/services/notes.js
import { pb } from './pb.js';

export async function fetchNotes() {
  const records = await pb.collection('notes').getFullList({ sort: '-created' });
  return records.map(toNote);
}

// What a note is in this app. The record's field names go no further.
function toNote(record) {
  return {
    id: record.id,
    title: record.title,
    body: record.body,
    createdAt: record.created,
  };
}
```

**3. The page.** It asks the service and never learns where the answer came from:

```js
// pb_public/pages/notes.js
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

The rule that makes this worth the two files: **a page never imports `pb`.** The moment one does, the app knows which database it is talking to, and swapping it stops being a job for one folder. The account pages follow the same rule — `services/auth.js` is the only thing that touches the SDK's auth, and the only thing that knows what a user record looks like.

Filtering user input needs `pb.filter()` rather than string building, for the same reason a SQL query does:

```js
pb.collection('notes').getList(1, 20, { filter: pb.filter('title ~ {:q}', { q }) });
```

## Layout

```
pb_public/          what the browser gets, served as it is
  index.html        shell: partial slots and the #page render target
  main.js           the whole configuration of your app
  app.js            state and methods shared by every page
  assets/
    main.css        loaded with a <link>: base font, x-cloak, cursor — before any JS runs
    theme.css       design system (.card, .btn, .input, .toast, .terminal…)
  pages/            one .html + one .js per route; account/ has the account's
  partials/         markup reused across routes, and chrome that outlives them
  stores/           Alpine stores — state that outlives a page
  services/         talks to the outside world: the only place that knows endpoints, and
                    where their answers become the app's own shapes
  lib/              helpers, portable to any project; helpers.js is the drawer
pb_hooks/           server-side logic in JavaScript, once there is some; see the README there
pb_migrations/      the schema as code, and the settings a fresh install needs
Dockerfile          the same three folders, beside the Linux binary
setup.ps1, setup.sh, .pb-version    the pinned PocketBase, fetched for this machine
renovate.json5      where the versions are, for Renovate to watch
fly.toml            one deployment spelled out; delete it if you host elsewhere
```

## Accounts

The whole surface is here and none of it is stubbed: register, email verification, password reset, changing your name, email or password, and deleting the account. `/account` is the only guarded route.

Three of those arrive by email, and their templates already link back to this app rather than to PocketBase's dashboard — that ships as a migration. SMTP is the part still left to you; both are under [Mail](#mail).

Email and password is what this app wires, not what PocketBase can do. OAuth2 providers, one-time codes and multi-factor are all there and each starts as a switch under **Settings → Auth providers** — enabling one is settings, and giving it a button is a call in `services/auth.js`, where every other auth call already lives. [PocketBase's documentation](https://pocketbase.io/docs/authentication/) has the list.

Two behaviours worth knowing before they surprise you. Changing a password or an email invalidates every token the account has, so the app signs itself out on purpose. And `/forgot-password` answers the same way whether or not the address is registered, because the honest answer would tell a stranger who has an account here.

Rate limits are on, as a migration rather than a dashboard toggle — settings are the one thing PocketBase does not write to `pb_migrations/` by itself. The mail endpoints are the reason: each call sends a message to whatever address was posted, so without a limit anyone can flood a stranger's inbox from your server.

## Mail

Password reset, email verification and email changes need SMTP configured under **Settings → Mail settings**; the built-in sendmail will not deliver. [Mailpit](https://mailpit.axllent.org) is the easiest local option — it catches everything and shows it in a browser.

The templates live under **Collections → users → Options**, and by default their links point at PocketBase's own dashboard, which a visitor has no account for. `pb_migrations/1787306200_mail_templates.js` already points them here, so a fresh checkout needs no clicking. What it sets, and what to keep if you rewrite the wording — the token is the only required part of the URL:

| | |
|---|---|
| Verification | `{APP_URL}/verify/{TOKEN}` |
| Password reset | `{APP_URL}/reset-password/{TOKEN}` |
| Email change | `{APP_URL}/confirm-email/{TOKEN}` |

`{APP_URL}` comes from **Settings → Application**.

## The server

The binary is not in git: ~33 MB, one build per platform, and the deploy uses the Linux one. It is fetched instead, from the version pinned in **`.pb-version`** — the only place that number appears, so an upgrade is one line and both the setup script and the Dockerfile follow it.

Re-running the setup script is how you upgrade: bump `.pb-version`, stop the server (Windows will not overwrite a running binary), run it again, read the changelog first. To hear of a release as it comes out, watch the repository on GitHub (Watch → Custom → Releases). What the newest one is:

```bash
curl -s https://api.github.com/repos/pocketbase/pocketbase/releases/latest | grep tag_name
# PowerShell: (Invoke-RestMethod https://api.github.com/repos/pocketbase/pocketbase/releases/latest).tag_name
```

`renovate.json5` does the watching for all three versions the app pins: PocketBase in `.pb-version`, the SDK and AlpineShell in the import map. With the [Renovate app](https://github.com/apps/renovate) installed on the repository, a newer release becomes a pull request on a Monday, changelog included, and nothing merges itself. PocketBase waits three days before it is offered, since a fix often follows a release within that time. Merging one moves the pin, not your binary: pull, then re-run the setup script. Not using Renovate? Delete the file; nothing else reads it.

`uname` decides which build it fetches, so you get the one for the machine you are on. You rarely need another: the Dockerfile downloads the Linux build itself while the image is being built, from `TARGETARCH`, so deploying from Windows or a Mac takes nothing extra. When you do need one by hand, the asset name is the whole trick:

```
https://github.com/pocketbase/pocketbase/releases/download/v<version>/pocketbase_<version>_<os>_<arch>.zip
```

`<os>` is `linux`, `darwin` or `windows`, and `<arch>` is `amd64` or `arm64`. Unzip it somewhere other than this folder, or you replace the binary you actually run.

| | |
|---|---|
| `pb_public/` | **committed** — the front end, served as it is. |
| `pb_migrations/` | **committed** — the schema as code. Change a collection in the dashboard and PocketBase writes the migration itself; commit it, and a fresh checkout gets the same collections. |
| `pb_hooks/` | **committed** — server-side logic; see the README in there. |
| `.pb-version`, `setup.*`, `Dockerfile` | **committed** — how the binary is obtained, in dev and in production. |
| `pb_data/` | ignored — the database and uploaded files. It sits beside `pb_public/`, not in it, so nothing serves it. |
| the binary | ignored — see above. |

Settings are the exception to all of this: unlike collections, PocketBase does not write them to a migration when you change them in the dashboard. Anything that must survive a fresh checkout — the rate limits in `pb_migrations/`, for instance — is a hand-written migration.

## Before it goes public

None of this matters on `127.0.0.1`, and all of it matters the day the URL is real.

- **Trusted proxy headers** (Settings → Application). Behind a reverse proxy every request appears to come from the proxy, so the rate limiter would count the whole world as one client and one flood would lock everybody out.
- **Restrict the superuser** to your own IP or subnet, and turn on MFA for it.
- **Backups to S3-compatible storage** on a schedule. A single-node SQLite database is exactly as durable as the disk under it.
- **`{APP_URL}` under Settings → Application.** A fresh install sets it to `http://localhost:8090`, and every mail template builds its link from it — so locally nothing ever complains, and in production every verification and reset link sends your users to their own machine. Nothing fails loudly; you find out from the first real account.
- **SMTP on the real domain**, with SPF and DKIM, or verification and reset mail lands in spam.
- **Pin the version** and read the changelog before upgrading. PocketBase is pre-1.0 and its own documentation says backward compatibility is not guaranteed until then.

## Deploying

The `Dockerfile` builds one image with the binary, the migrations and the frontend inside it, from this folder:

```bash
docker build --build-arg PB_VERSION=$(cat .pb-version) -t app .
docker run -p 8090:8090 -v pb_data:/pb/pb_data app
```

It puts `pb_public/`, `pb_hooks/` and `pb_migrations/` beside the binary, where they are here, so what runs there is what runs on your machine. Anywhere that runs a container and gives you a persistent volume will do: PocketBase keeps everything in `pb_data`, so mount it as a volume or the first redeploy takes every account with it.

`fly.toml` is one of those spelled out, for [Fly.io](https://fly.io), and three commands is the whole of it:

```bash
fly apps create my-app
fly volumes create pb_data --size 1 --region fra
fly deploy --build-arg PB_VERSION=$(cat .pb-version)
```

Then set the application URL and SMTP in the dashboard on the real domain, and walk [the list above](#before-it-goes-public) before you hand the URL to anybody. Delete the file if you deploy somewhere else — nothing reads it but Fly.

## What the framework gives you

- **Routing** with route params, an auth guard, per-route titles and page-level chrome.
- **Pages** as plain HTML + a component factory, fetched on demand.
- **A root component** every page is nested in, so shared state and methods are one scope away.
- **Sessions** through an Alpine store, so code outside Alpine (the guard) can read them reactively.
- **Navigation manners** the router does not do for you: focus movement, page titles, cleared messages, and a page you arrive at starting at the top while back and forward keep the place they had.
- **Messages** — `notify(text, type)` and one `message` object; errors wait to be dismissed, everything else clears itself. `partials/toast.html` gives four tempers a colour apiece — error, warning, success, info — from the `.toast-*` variants in `theme.css`.
- **Failures that would otherwise be a blank page** — a template that will not load, a partial that will not load, a page whose `init()` throws. Each ends as a message rather than an empty screen.
- **Forms** — `form()` owns the submit sequence, so a page keeps only `validate()` and `save()`. Every account page here is written that way; `pages/account/login.js` is the shortest example.
- **`http`**, a fetch wrapper that parses JSON, throws `HttpError` with the server's body, and supports timeouts and query params.

Every option is listed commented-out in `main.js`, and documented in the [framework README](https://github.com/acotest989/alpineshell#options).

## Design decisions

**No build step is the point.** Tailwind runs through its browser build, which compiles CSS at runtime and only reads `<style type="text/tailwindcss">` tags — it supports neither `<link>` nor `@import` for local files. That is why `theme.css` is fetched and injected as a style tag. The cost is real and deliberate: the compiler goes to the visitor along with the page. That suits an internal tool, an admin panel, a prototype, a small site, and does not suit a content site living on search traffic. There is no CLI path here — an app that needs a compiled stylesheet has outgrown this starter.

**Data never reaches a page raw.** A service fetches and maps the response into your own shape, and pages consume only that. Changing API means changing one file per topic.

**State ownership.** Page state belongs to the page component. State shared across routes and written from outside Alpine belongs in a store. The session is a mirror rather than a copy: the PocketBase SDK owns the token and persists it, and `stores/session.js` only makes it reactive. Two places claiming to know who is signed in is a bug waiting for a slow day.

**One file knows the backend.** `services/pb.js` is the only thing that imports the SDK, and `services/auth.js` is the only thing that talks to its auth. Swapping PocketBase for something else is the services, never a page.

**The backend has three gears.** Collection rules and the SDK cover most of it; `pb_hooks/` takes anything the client must not decide, in JavaScript; and when that runs out, PocketBase is a Go module you import into your own `main.go` — same database, same dashboard, your own binary. The database is SQLite throughout, which is a decision rather than a gap: Postgres is not supported and not planned. Worth knowing the ceiling before you build against it — [How far it goes](#how-far-it-goes) has the detail.

## How far it goes

Three gears, and you change up only when the one below runs out.

**The API.** The browser talks to collections through the SDK, and `services/` is the only place that knows it. The rules on a collection decide who may read and write what. For most of an app that is the entire backend.

**Hooks.** Anything the client must not decide goes in `pb_hooks/` as JavaScript — pricing an order, stamping a field, refusing a request. They run inside PocketBase; their shape and their limits are in [pb_hooks/README.md](pb_hooks/README.md).

**Go.** A transaction across collections and a scheduled job are both within a hook's reach, as `$app.runInTransaction` and `cronAdd`. When a hook wants a real library, or cryptography the engine does not have, PocketBase is also a Go module: your own `main.go` imports it, registers routes and hooks, and compiles to one binary that is still PocketBase, with the same database and the same dashboard. What changes is how the binary arrives — from then on you build and ship your own, so `setup.sh` and `.pb-version`, which fetch an official release, no longer apply.

**The database is SQLite, and only SQLite.** That is a decision and not a gap: PostgreSQL and MySQL are not supported and are not planned. The connection can be pointed at something SQLite-compatible — a replicated build, for instance — but not at another engine. An app that genuinely needs Postgres has two honest options: keep PocketBase for auth and the dashboard while your own Go code owns the Postgres tables, which is two databases and all the bookkeeping that implies, or accept that it has outgrown this.

## Scale, honestly

One server. SQLite in WAL mode outruns a networked database on reads, but writes go through a single writer and there is no clustering — the maintainer says so plainly and has no plans to change it. That is enough for most applications and not enough for some; know which you are building before you need to know.

## Dependencies

Alpine.js, [Pinecone Router](https://github.com/rehhouari/pinecone-router), `@alpinejs/persist` and Tailwind CSS come from jsDelivr, pinned to exact versions by the framework. The [PocketBase SDK](https://github.com/pocketbase/js-sdk) is pinned by this app, in the import map in `pb_public/index.html`.

## License

MIT
