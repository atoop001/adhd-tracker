---
name: logging-test-issues
description: Use when the user reports a bug, glitch, crash, visual problem, or unexpected behavior while smoke-testing the Flux app on a device and it should be recorded for a later batch fix rather than fixed immediately.
---

# Logging Test Issues

## Overview

During a device testing pass, issues get **logged, not fixed**. Fixing
mid-test destroys the test flow and risks masking related issues. Each report
is clarified with the user, then written to `docs/testing/smoke-test-issues.md`
by the cheap `issue-scribe` agent (haiku).

## Workflow

1. **Clarify before logging.** Check the user's report against the template
   fields (screen/area, steps to reproduce, expected, actual, frequency, error
   text). Ask about the fields you cannot fill from their report — usually 2–4
   questions, via AskUserQuestion or prose. Skip questions whose answers are
   already clear. Good probes:
   - Which screen were you on, and what did you tap right before it happened?
   - What did you expect instead?
   - Does it happen every time you retry, or only once?
   - Any red error screen or text in the Metro terminal?
2. **Dispatch the scribe.** Send the `issue-scribe` agent (Agent tool,
   `subagent_type: "issue-scribe"`) a prompt containing every template field
   plus the user's verbatim description. First dispatch of the session: use the
   Agent tool. Later issues in the same session: continue the SAME agent with
   SendMessage — it already knows the template and file.
3. **Relay the assigned ID** back to the user in one line, then return to
   testing. Include a hypothesis in the dispatch only if you already have
   evidence for one — do not investigate now.

## Rules

- No fixes, no code edits, no investigation during the testing pass. The only
  output of a report is a logged entry. (Exception: the user explicitly asks
  for an immediate fix.)
- The scribe writes only what you send it. If the user couldn't answer a
  question, send "not specified" for that field rather than a guess.
- Crashes that block further testing are still just logged — but tell the user
  which already-logged issue(s) may block the rest of the checklist.

## Batch-fix phase

When the user says testing is done, read the tracker, propose an order
(startup/data-loss issues first, cosmetic last), and work through entries one
at a time, flipping **Status** as you go (`open` → `in-progress` → `fixed`).
