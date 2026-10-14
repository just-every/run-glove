Glove keeps everything on the computer it runs on. Take a copy before you rely on it, and before any reset.

## Download the business as JSON

Under **More → Activity**, **Download business export** saves the whole business as one JSON file: customers, sites, services, technicians, quotes, jobs, visits, field evidence, invoices, exports, approvals, move-ins and the complete timeline, with the list of stored photos and signatures. The owner and office can download it. Use it to keep a readable record or to take your data elsewhere.

## Move the whole installation

The complete installation, including people and roles, photos and signatures, command outcomes and the move-in journal, moves as one archive. From the Glove folder:

```sh
rer export --output exports/glove.rer
```

Keep the archive somewhere safe: it holds your customers, staff emails, photos and signatures. The `exports/` folder is ignored by Git, so it is never committed by accident.

## Restore

Restore into an empty installation of the same Glove release, for example a fresh clone on another computer:

```sh
rer import --input exports/glove.rer --yes
rer setup
rer dev
```

Everyone signs in again afterwards: the archive keeps people, roles and records, never sessions, so a sign-in from the old installation does not open the new one.

## Reset

`rer reset --yes` removes the local installation and everything in it. Export first if you want to keep anything.
