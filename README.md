# Run it locally

Glove is an MIT-licensed, owner-run field-service seed for a 2–10 technician Australian trade business (HVAC, plumbing, electrical, recurring commercial service). A dispatcher turns a customer-approved quote into a booked and assigned visit; the technician records arrival, checklist, notes, photos, materials and the customer's sign-off on a phone, even through a lost signal; the office prepares, approves and exports the invoice for the business's own accounting system, with a correction trail. An agent can prepare quotes, dispatch proposals and invoices for a person to approve. The first move-in kit brings customers, staff and job history from ServiceM8. [CONTRACT.md](CONTRACT.md) has the twelve first-release clauses; [ACCEPTANCE.md](ACCEPTANCE.md) records how each is proven.

Glove starts with no business records. Local operation uses the real Worker and a persistent local D1 with Base's development sign-in. No maps, SMS, payment, accounting or model account is needed. The checkout pins the published `@runeditrun/rer` 0.2.4, Node 22.20.0 and pnpm 10.12.4.

Install the shared command once with either method:

```sh
npx -y @runeditrun/rer cli install
# or
curl -fsSL https://runeditrun.com/install.sh | sh
```

From this checkout:

```sh
rer install
rer setup
rer dev
```

Open the local URL printed by `rer dev` on this computer and finish the first-owner claim at `/setup`; Glove lives at `/app` under the installed Lobby at `/`. Keep the printed `RER_OPEN` link private: it carries the development sign-in key. Start under More → Team: your business name and booking timezone, the price book with its checklists, and your team (technicians sign in on their phones; give each person one role). Stop the server with `rer dev --stop`.

`rer verify` builds, typechecks and runs every flow test, the export/restore proof and the desktop and phone browser journeys. `rer check` checks the declared operations; `rer describe` reports what each command does.

The full installation moves as one archive:

```sh
rer export --output exports/glove.rer
rer import --input exports/glove.rer --yes
```

Restore into an empty installation of the same Glove release, then run `rer setup` and sign in again: the archive keeps people, roles, records, timeline, photos and the move-in journal, never sessions. Moving in from ServiceM8 is a different path, described in [IMPORT.md](IMPORT.md). `rer reset --yes` removes the local installation and is destructive; export first. No hosted deployment is accepted for this seed yet.

Read [the contract](CONTRACT.md), [the API](API.md), [the move-in kit](IMPORT.md) and [operations](OPERATIONS.md) before changing behaviour.

The source code is public at [just-every/run-glove](https://github.com/just-every/run-glove).

The site is at [run-glove.com](https://run-glove.com).

## Commands and the shared runtime

From the checkout root, `rer dev` alone launches it for review: it installs pinned
dependencies, sets up a local owner on a free port, starts the real app and
prints `RER_READY` and a sign-in link. To install for a real owner, run the
verbs yourself:

```sh
rer install
rer setup --owner-email you@example.com
rer dev
```

Commands that run project work select the exact Node version declared by the
project. They use an exact matching installed runtime or a checksum-verified
copy cached at `~/.rer/node/node-vVERSION-PLATFORM-ARCH/`; when needed on
supported platforms, the runner retrieves the official Node release and checks
its SHA-256 against `SHASUMS256.txt`. It does not change global Node installations.
Set `RER_NODE_AUTO=0` to disable automatic selection. If selection is disabled
or acquisition fails, the command reports a repair invocation in this form:
`npm exec --yes --package=node@VERSION -- node SCRIPT VERB --cwd PROJECT`.
Help, check, describe, doctor and stop do not select or acquire Node.

After `RER_READY`, `dev` prints `RER_SIGNED_IN EMAIL` and `RER_OPEN URL`.
Open that URL on this computer: the app opens signed in as the owner and
finishes first-run setup at `/setup`. Treat the line as a credential.
`dev --as PERSONA` starts as a persona or signed out. Local mail is suppressed
silently. Until first-run
completion is stored durably, app routes send the signed-in owner to `/setup`;
signed-out visitors sign in and return there. Once complete, `/setup` opens the
app or settings.

The saved local port is used; a first setup saves the first free port from 8787. Explicit ports are decimal
integers from 1 through 65535 and must be free; a busy requested port fails
instead of silently moving. Only `127.0.0.1`, `localhost` and `::1` are allowed.
Dev applies the selected host and port to both the listener and runtime bindings;
readiness is bounded and failure stops the owned processes.

Missing non-interactive setup answers exit 3 and name the manifest fields.
Read `rer-setup.json` and pass a private, mode-0600 JSON object keyed by those
names using `rer setup --answers PATH --non-interactive`,
for example `{"OWNER_EMAIL":"owner@example.com"}`. Secret values stay in
private inputs and never go in command arguments. A setup rerun with the saved
owner and origin preserves existing owner/data and exact private settings.
Conflicting saved identity or origin reports an actionable recovery path.
Review reset's exact removal inventory before confirmation; export domain data
first if it should be restored, and import only into an empty destination.

Queue waits report immediately with a reason and numeric one-based position,
then refresh about every 15 seconds while waiting. Package mode has no queue status command; a waiting command reports its live position.

Use the setup prompt instead of `--owner-email` when entering the real owner
mailbox. Open the `RER_OPEN` URL printed by `dev` on this computer; the app opens
signed in as the owner. No email is sent. `dev` serves
live editing with HMR and stays in the foreground on its first invocation; a
compatible repeated invocation reuses the server and exits. Stop `dev` with
`rer dev --stop` or Ctrl-C, and stop `preview` with
`rer preview --stop` before build or verification.

```sh
rer verify
rer reset --yes
rer export --output exports/installation.rer
rer import --input exports/installation.rer --yes
rer deploy
rer describe
```

`verify` ends by loading each public page of the production build in Chromium to
prove its sections hydrate as separate units (`src/base/hydration/README.md`); run
`pnpm exec playwright install chromium` once on a new machine.

Reset is destructive local cleanup. Import requires an empty destination and
explicit confirmation. Use `rer describe` to inspect the
checkout's actual commands and flags. The maintained pins are Node 22.20.0 and
pnpm 10.12.4. Read `RUN-LOCALLY.md` for data custody, deploy requirements and
remote-transfer support.

## Stack

Glove runs on Base's foundation: Hono, TanStack Start, Vite, React, Cloudflare
Workers and D1, with real owner/operator authentication and no precreated
owner. The edition owns its product experience and may change its source,
schema, UI, framework, infrastructure and integration method.

Private HTTP routes and Start functions must authorize native sessions inside
every server function, including direct transport calls. Route guards alone are
insufficient. Keep server-only modules and secrets out of client bundles.
Unknown documents and missing assets return real 404s. Keep Queue/Cron handlers
and named Worker exports in `src/server.ts`; the dispatcher only selects HTTP
ownership.

The edition has two homepages. An installed instance's `/` is the Lobby, served
by `src/server.ts` from `src/base/lobby.ts` with `GET /setup/state`: Sign in, or
Finish setup until the owner confirms first-run setup. `src/identity.ts` holds
its edition identity (the name from `src/branding.json`, its purpose, tagline,
sign-in route and run site origin). The run site (`src/site/pages.tsx`, every Run
page string in `src/site/run.json`, the domain in `deploy-site.json`) is Glove's
homepage, whose action is Run Glove, `/run`, the docs built from `docs/*.md`
(listed in `docs/site.json`) and a not-found page: `rer build --site` writes it to
`dist/site`, `rer dev` serves it as `RER_SITE`, and `rer deploy --site` publishes
it (`--dry-run` prints the plan; `.github/workflows/run-site.yml` deploys it only
when the repository variable `RUN_SITE_DEPLOY` is `true`). See `HOMEPAGE-VARIANTS.md`.

The edition owns `rer-setup.json`, application branding and its installer
adapter. Keep one setup manifest and declare actual answers, defaults, managed
secrets, migrations, build targets, health checks and owner behavior there and
in the adapter. Setup must preserve existing local owner/data and exact private
settings on reruns. Never create a second owner or rotate secrets implicitly.

Local durable data lives in `.wrangler/state`; private settings default to
`.dev.vars` with mode 0600. Local export/import covers declared supported
resources and excludes owner/auth, private settings and transient
runtime state. Every first-party seed verifies local export/import/export
equivalence across its supported resources. Preserve applied migration history
and require forward migrations for schema changes. Remote transfer is supported
only when the adapter covers all required resources.

`deploy --dry-run` builds and validates locally without provider requests. Real
deployment uses the owner-account procedure and requires its private account
credentials, declared migrations and a real verified mail configuration. Local
verification does not establish hosted acceptance, remote health or mail
delivery. See `OPERATIONS.md`, `ONBOARDING.md`, `SEED-COMMAND-CONTRACT.md` and
`RUN-LOCALLY.md` for the implemented requirements.
