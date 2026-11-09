# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journey.spec.ts >> BOOK-004, BOOK-014, BOOK-015, BOOK-016, BOOK-017 Reserve with Google request intake and external-send attestation at 1440 and 390
- Location: tests/browser/journey.spec.ts:1240:1

# Error details

```
Test timeout of 240000ms exceeded.
```

# Page snapshot

```yaml
- main [ref=e2]:
  - generic [ref=e3]:
    - heading [level=1] [ref=e4]:
      - link "Glove Dev" [ref=e5] [cursor=pointer]:
        - /url: /
    - paragraph [ref=e7]: The owner is set up. Sign in to continue.
    - link "Sign in" [ref=e8] [cursor=pointer]:
      - /url: /signin?login_hint=fleet%40runeditrun.com
    - paragraph [ref=e11]:
      - text: Choose a local persona on the sign-in page, or run
      - code [ref=e12]: rer dev --as owner
      - text: from the project folder.
    - paragraph [ref=e13]:
      - text: Powered by
      - link "Glove" [ref=e14] [cursor=pointer]:
        - /url: https://run-glove.com
      - text: ", free and open source"
```