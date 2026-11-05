PROBE API-001 1 customer creation: real New customer control -> HTTP 200 customer.save, identity 911d9aea-7d80-4ad7-9bd2-f08f2a471d5a, independently specified contact, email, phone and billing address retained.
PROBE API-001 1 customer edit: real Save changes control -> HTTP 200 with the same customer identity and next version; exact new name, contact, email, phone and billing address visible.
PROBE API-001 1 two site creations: real Add site controls -> two distinct returned identities, each linked to the intended customer; exact addresses, access notes, contacts and phones retained.
PROBE API-001 1 two site edits: real Edit site and Save site controls -> HTTP 200 for each original identity and observed version; exact new fields survive reload and authenticated state reads.
PROBE API-001 1 cancel: Edit site, change access notes, Cancel edit -> no changed site or Activity entries.
PROBE API-001 1 direct HTTP edit: permitted native-session customer.save -> HTTP 200, Taylor HTTP and 300 Direct Avenue, Austin TX 78706 visible after reload and in authenticated state.
PROBE API-001 1 captured replay: repeat the first successful site.save envelope under the same native session -> HTTP 200 with the identical saved response; customer records, site records, events and state version unchanged.
