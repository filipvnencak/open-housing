---
description: Generate PR description for open-housing
allowed-tools: Bash(git diff:*), Bash(git log:*)
---
Run `git diff main...HEAD` and `git log main...HEAD --oneline`.

Generate a PR description:

## Description of changes
[what changed and why — max 3 sentences]

## Technical details
- [file/module] — [what changed]

## Checklist
- [ ] i18n — new strings added to both sk.json and en.json
- [ ] DB change — migration generated and committed
- [ ] Env vars — added to .env.example

Keep it short. No "This PR...". Imperative title, max 60 chars.
