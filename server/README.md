# Server

[PocketBase](https://pocketbase.io) — one binary that is the database, the auth provider, the file storage and the API.

The binary is not in git: ~33 MB, one build per platform, and the deploy uses the Linux one. It is fetched instead, from the version pinned in **`.pb-version`** — the only place that number appears, so an upgrade is one line and both the setup script and the Dockerfile follow it.

```bash
./setup.sh                                           # or .\setup.ps1 on Windows
./pocketbase serve --publicDir=..                    # http://127.0.0.1:8090
./pocketbase superuser create you@example.com yourpassword   # first run only
```

Re-running the setup script is how you upgrade: bump `.pb-version`, run it again, read the changelog first.

`uname` decides which build it fetches, so you get the one for the machine you are on. You rarely need another: the Dockerfile downloads the Linux build itself while the image is being built, from `TARGETARCH`, so deploying from Windows or a Mac takes nothing extra. When you do need one by hand, the asset name is the whole trick:

```
https://github.com/pocketbase/pocketbase/releases/download/v<version>/pocketbase_<version>_<os>_<arch>.zip
```

`<os>` is `linux`, `darwin` or `windows`, and `<arch>` is `amd64` or `arm64`. Unzip it somewhere other than `server/`, or you replace the binary you actually run.

`--publicDir=..` makes PocketBase serve the app as well as the API: one origin, no CORS, and `--indexFallback` (on by default) sends unknown paths to `index.html`, which is the SPA fallback the router needs. So `services/pb.js` points at `/` and there is no host anywhere in the code.

The dashboard is at `/_/`. Create your own account through the app's `/register` page — the `users` collection exists in a fresh install.

## What is in git and what is not

| | |
|---|---|
| `pb_migrations/` | **committed** — the schema as code. Change a collection in the dashboard and PocketBase writes the migration itself; commit it, and a fresh checkout gets the same collections. |
| `pb_hooks/` | **committed** — server-side logic; see the README in there. |
| `.pb-version`, `setup.*`, `Dockerfile` | **committed** — how the binary is obtained, in dev and in production. |
| `pb_data/` | ignored — the database and uploaded files. |
| the binary | ignored — see above. |

Records are data, not schema, so no account travels with the repository. That is why this template ships with none: a starter with known credentials in it would deploy with known credentials in it.

Settings are the exception to all of this: unlike collections, PocketBase does not write them to a migration when you change them in the dashboard. Anything that must survive a fresh checkout — the rate limits in `pb_migrations/`, for instance — is a hand-written migration.

## Mail

Password reset, email verification and email changes need SMTP configured under **Settings → Mail settings**; the built-in sendmail will not deliver. [Mailpit](https://mailpit.axllent.org) is the easiest local option — it catches everything and shows it in a browser.

The templates live under **Collections → users → Options**, and by default their links point at PocketBase's own dashboard. Point them here instead — the only required part of the URL is the token:

| | |
|---|---|
| Verification | `{APP_URL}/verify/{TOKEN}` |
| Password reset | `{APP_URL}/reset-password/{TOKEN}` |
| Email change | `{APP_URL}/confirm-email/{TOKEN}` |

`{APP_URL}` comes from **Settings → Application**.

## Before it goes public

None of this matters on `127.0.0.1`, and all of it matters the day the URL is real.

- **Trusted proxy headers** (Settings → Application). Behind a reverse proxy every request appears to come from the proxy, so the rate limiter would count the whole world as one client and one flood would lock everybody out.
- **Restrict the superuser** to your own IP or subnet, and turn on MFA for it.
- **Backups to S3-compatible storage** on a schedule. A single-node SQLite database is exactly as durable as the disk under it.
- **SMTP on the real domain**, with SPF and DKIM, or verification and reset mail lands in spam.
- **`--publicDir` must point at the frontend only.** Serving the repository root would publish `server/pb_data/data.db`.
- **Pin the version** and read the changelog before upgrading. PocketBase is pre-1.0 and its own documentation says backward compatibility is not guaranteed until then.

## Deploying

The `Dockerfile` builds from the repository root, because it has to reach the frontend:

```bash
docker build -f server/Dockerfile --build-arg PB_VERSION=$(cat server/.pb-version) -t app .
docker run -p 8090:8090 -v pb_data:/pb/pb_data app
```

It copies the frontend into `pb_public/` **file by file**, on purpose. Copying the repository and deleting `server/` afterwards works right up until somebody forgets, and then `pb_data/data.db` is a public download.

Mount `pb_data` as a volume or the first redeploy takes every account with it.

## How far it goes

Three gears, and you change up only when the one below runs out.

**The API.** The browser talks to collections through the SDK, and `services/` is the only place that knows it. The rules on a collection decide who may read and write what. For most of an app that is the entire backend.

**Hooks.** Anything the client must not decide goes in `pb_hooks/` as JavaScript — pricing an order, stamping a field, refusing a request. They run inside PocketBase; their shape and their limits are in [pb_hooks/README.md](pb_hooks/README.md).

**Go.** When a hook wants a real library, a transaction across collections or a scheduled job, PocketBase is also a Go module: your own `main.go` imports it, registers routes and hooks, and compiles to one binary that is still PocketBase, with the same database and the same dashboard. What changes is this folder — from then on you build and ship your own binary, so `setup.sh` and `.pb-version`, which fetch an official release, no longer apply.

**The database is SQLite, and only SQLite.** That is a decision and not a gap: PostgreSQL and MySQL are not supported and are not planned. The connection can be pointed at something SQLite-compatible — a replicated build, for instance — but not at another engine. An app that genuinely needs Postgres has two honest options: keep PocketBase for auth and the dashboard while your own Go code owns the Postgres tables, which is two databases and all the bookkeeping that implies, or accept that it has outgrown this.

## Scale, honestly

One server. SQLite in WAL mode outruns a networked database on reads, but writes go through a single writer and there is no clustering — the maintainer says so plainly and has no plans to change it. That is enough for most applications and not enough for some; know which you are building before you need to know.
