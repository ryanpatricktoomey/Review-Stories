# Reps weekly update guide

Read this guide and inspect current data before each update. The teacher supplies lesson files and actual class dates. Never assume five classes.

## Quick Reps
Use `quick-reps/YYYY-MM.json`, with `enabled: true` and `weeks` containing `releaseAt` (ISO timestamp with +09:00) and `questions`. Append rather than replace previous weeks. Split across calendar months; enable a new month when populated. Target 20 questions per lesson (previous week: 100 for five lessons). Release weekly at Monday noon KST; for a month transition use the first lesson day of the new month at noon unless teacher specifies otherwise. Each question has `type`, `prompt`, `answers` (array), `explanation`, `lessonDate`; multiple choice also has `options`. Inspect existing examples for all supported types before generating. Use varied formats and exclusively lesson-derived targets, natural contexts, unambiguous answers and Korean explanations.

## Daily Challenge
Append to `daily-challenge/schedule.json` under `challenges`, preserving existing entries. Each entry has `id` (YYYY-MM-DD), `title`, `openAt`, `closeAt`, `questions` (exactly 10). Each question has `prompt`, `answer`, `options` (four choices including answer), `explanation`. Open noon KST and close at next actual lesson noon; confirm next lesson date rather than assume. Timer is already 120 seconds for dates from 2026-11-27, implemented in daily-challenge.js. Preserve one attempt, leaderboard, existing authentication and scoring.

## Publishing
Read original lesson files; verify dates, targets, translations, unique correct choices, schemas, counts, nonoverlapping schedule and preserved historical data. Inspect current branch and commit content files together where possible. Teacher syncs challenge dates to Firebase using dashboard; verify this procedure against current dashboard before instructing. Report commit and any outstanding sync or verification. Do not change UI, Word Bank, Bonus Activity, review stories, authentication, Firebase rules or quiz mechanics during routine updates unless explicitly requested.

## Current transition
2026-11-30 belongs to November; 2026-12-01 and 2026-12-02 belong to December. No lessons December 3–4. Next lesson date must be confirmed. This guide records the recovered workflow and verified JSON structure; exact additional question types and dashboard sync implementation should be checked against source before publication.
