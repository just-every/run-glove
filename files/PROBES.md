# Runtime public-door probes

Candidate: 5477173bf95446783c433ae4b11c2a9af84d349a. These observations are the named steps in the passing existing privacy API registration, with the separate passing owner browser journey. No extra test registration was added.

PROBE DATA-001 1: privacy.export and privacy.erase on independently seeded merged customers -> opened export, completed erase, enumerated Glove and Base tables and decoded bytes, Activity, business export, saved outcomes and captured logs contain none of the enumerated erased identifiers; peer records remain exact.

PROBE DATA-001 2: export and erasure from Office, Dispatcher, technician, agent, custom role, branch-limited Owner, signed-out caller and a valid integration token -> 403 or 401, every stored table unchanged.

PROBE DATA-001 3: privacy.preview and privacy.export from each of the two merged IDs -> both IDs appear in every receipt and opened download, with both native histories.

PROBE DATA-001 4: opened export, original and certificate file doors, signed-copy door, identical command replay and retained import sources -> full related timeline and byte-exact files; complete customer CSV rows and ServiceM8 objects; peer records withheld and mixed-ownership omission named; download absent from replay, saved outcomes, Activity and logs.

PROBE DATA-001 5: erasure followed by file, signed-copy, booking and quote bearer reads and capture replay -> old doors return 404, replay returns ERASED, personal operational rows and personal text are absent.

PROBE DATA-001 6: anonymous job-cost and tax reports, invoice and payment readback, peer originals, customer and site saves, quote draft and link issuance, invoice preparation and approval, booking offer, export replay and unmerge -> exact money and nonzero tax totals retained, all field captures gone, every attempted resurrection refused without record changes.

PROBE DATA-001 7: erase with an in-progress archive transfer, then actual edition-policy restore attempts -> epoch increments once, pending jobs and parts disappear, both later-journal and destination-checkpoint attempts refuse the old archive with erasure_epoch and leave restored records unchanged. The CI portable job is success on this SHA; the local CLI retry separately failed during post-erasure export before its later-journal assertions.

PROBE DATA-001 8: fresh offline destination receives only the older archive -> personal customer and certificate originals restore, demonstrating the documented limit. Owner browser at 1440 and 390 -> latest-backup instruction visible; opened export and explicit erasure leave both outcomes visible after reload.
