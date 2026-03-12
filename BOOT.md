# BOOT.md - Mail Tool Routing Policy

## Goal
- For Gmail checks, use API/script tooling first.
- Avoid browser-based Gmail checks unless explicitly requested by user.

## Required Tool Priority (for mail tasks)
1. `/Users/lily/.openclaw/google-scripts/gmail-tool ...`
2. `gog gmail ...` (if gog auth is fully configured)
3. Browser only as last resort, and only with explicit note that API path failed.

## Allowed Gmail Commands
- Recent inbox:
  - `/Users/lily/.openclaw/google-scripts/gmail-tool list --max 10 --json`
- Query search:
  - `/Users/lily/.openclaw/google-scripts/gmail-tool search --q "newer_than:7d in:inbox" --max 20 --json`
- Read one message:
  - `/Users/lily/.openclaw/google-scripts/gmail-tool read --id <MESSAGE_ID> --json`

## Prohibited Default
- Do NOT open Gmail in browser for routine read/search tasks.
- Do NOT claim mail read success without API/tool output.

## Response Rule
- When handling mail requests, include:
  - number of matched messages,
  - top senders/subjects,
  - and whether the data came from API script or browser fallback.
