An agent is an invited sign-in with the Agent role. It uses the same commands a person does, and everything it prepares waits for a person.

## What an agent can prepare

- Requests.
- Quote drafts and revisions. A person approves the price.
- Dispatch proposals: a job, a technician and a time, with its reasons and evidence. A dispatcher or the owner approves or declines it on the dispatch board.
- Invoice drafts and revisions. The owner or office approves them.

## What an agent can never do

Approve anything, record a customer's answer, book or change a visit, export invoices, move records in, or change roles. An agent never decides its own preparation, even if its sign-in is later given a person's role.

## The record

Under **More → Activity**, **Approvals** lists every decision: what was prepared, by whom, who decided and when. The job timeline shows each step with who did it and in which role.

## Connecting an agent

Invite the agent like a person (More → Team → People and roles, role Agent). It signs in with its own link and reads `GET /api/glove/state`, then sends commands to `POST /api/glove/commands`. The full list of commands and who may send each is in the repository's [API reference](https://github.com/just-every/run-glove/blob/main/API.md).
