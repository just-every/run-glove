Glove runs on your own computer with the `rer` command. You need Node 22 or later and pnpm 10.12.4, on macOS, Linux or Windows with WSL2. No account with any service is needed.

## Install and start Glove

One line installs `rer`, gets Glove and starts it:

```sh
npx -y @runeditrun/rer dev just-every/run-glove
```

To start it again later, run `cd run-glove && rer dev`. `rer dev` installs everything, sets up a local owner and prints a link (`RER_OPEN`) that opens Glove signed in. Keep that link private: it carries this computer's sign-in key. Stop Glove with `rer dev --stop`; start it again with `rer dev`.

To use your own email address as the owner instead of the local one, run the steps yourself:

```sh
rer install
rer setup --owner-email you@example.com
rer dev
```

## Finish setup

The first time you open Glove it asks you to confirm the owner of this installation. Check the name and email, tick **I confirm this owner account is ready to use** and choose **Finish setup**. Glove then opens at `/app`.

The installation's own front page (`/`) is its Lobby: one **Sign in** button for everyone you invite.

## Set up your business

Glove shows **Set up Glove** with three steps until the business exists:

1. **Add your business name and booking timezone** under More → Team. Visits are booked in this timezone.
2. **Add your price book and technicians, and invite your team.** Each service has a price ex GST and a checklist; start a checklist line with `*` to make it required before a job can be completed.
3. **Add a customer and site**, or [move in from ServiceM8](/docs/move-in).

## Invite your team

Under More → Team → **People and roles**, enter a name and email, choose a role and **Send invitation**. Each person gets a sign-in link by email. On your own computer no email leaves it.

For a technician, add them under **Technicians** with the name shown on the board and link the person they sign in as. Their phone then shows their visits.

## Next

- [Enquiries and quotes](/docs/quotes)
- [Dispatch and visits](/docs/dispatch)
- [Back up and restore](/docs/backup-and-restore) before you rely on it
