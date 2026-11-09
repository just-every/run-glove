# Re-publish Glove inventory consolidation

1. Configure fleet Git identity, refresh the launcher, install the decrypted-bundle Git helper and push guard, and read the applicable launcher rules.
2. Make a shallow, blob-filtered clone of just-every/run-glove from main. Configure local fleet identity and preserved repository hooks. Read repository guidance and contract source without changing them.
3. Fetch cloud/sx-glove-suite-cap-2, deepen only if required, and verify that its tip is exactly a9626806a7691019bf0a82bdb979d59b7aa0ce5a. Check out the requested new branch at that unchanged commit.
4. Confirm the existing Verify run 42548981081 completed successfully for exactly that SHA. Do not rerun tests, builds, or CI. Review all candidate commit identities, messages, trailers, and the product diff before publication.
5. Push only cloud/sx-glove-suite-cap-2-push-1 through the required fleet push guard, without a new product commit, rebase, force push, or change to main. Verify the remote branch SHA.
6. Write complete non-secret results and actual receipts outside the product repository. Publish the explicitly selected packet only to evidence/sx-glove-suite-cap-2-push-1 and preserve its exact evidence ref/head.
7. After successful publication and evidence return, delete the temporary product clone as the brief requires. Return the required product provenance, evidence line, lane POST line, and the exact READY line without extra tokens.

Expected product outcome: inventory tests consolidated from 213 to 185 (prior task's reported count), zero clause status changes, zero new product commits, and no DONE claim.
