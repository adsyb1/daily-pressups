# CLAUDE.md — Daily Pressups

## What is this?

A minimal PWA for tracking daily pressup (push-up) counts on iPhone. The user logs sets throughout the day and the app shows a running total. It's designed to be fast and frictionless — no fitness-app complexity.

## Who is the user?

Adam. He does pressups across multiple sessions throughout the day and needs a quick way to log each set from his phone. He doesn't write code directly — all development happens through natural language prompts.

## Architecture

- **Single-file app**: `index.html` contains all HTML, CSS, and JS inline. No build step, no bundler.
- **No frameworks**: Vanilla HTML/CSS/JS only.
- **Data storage**: localStorage is the source of truth for the UI (key `daily-pressups-v1`). When signed in to Google, changes sync to a Google Sheet (Sheets API v4). Sheet ID persists under `daily-pressups-sheet-id`.
- **Auth**: Google Identity Services (`accounts.google.com/gsi/client`) with OAuth client ID embedded in the page (safe — protected by Authorized JavaScript Origins in Google Cloud Console). Scope: `drive.file` — app only sees files it created.
- **PWA**: `manifest.json` + `sw.js` for home screen install and offline use on iOS Safari. SW skips caching for Google domains.
- **Hosting**: GitHub Pages at `https://<username>.github.io/daily-pressups/`
- **Fonts**: DM Mono (numbers/labels) and DM Sans (body) loaded from Google Fonts.

## Data model

```json
{
  "id": "1713280800000-a3f9k",
  "count": 15,
  "timestamp": "2026-04-16T14:00:00.000Z",
  "date": "2026-04-16"
}
```

Entries stored as a flat array. `date` is local date (YYYY-MM-DD), used to filter today's entries.

## File structure

```
index.html              # The entire app (HTML + CSS + JS inline)
manifest.json           # PWA manifest (scoped to /daily-pressups/)
sw.js                   # Service worker — cache-first offline strategy
icon-192.png            # Home screen icon
icon-512.png            # Splash screen icon
icon-512-maskable.png   # Maskable icon variant
```

## Design principles

- **iPhone-first**: Must work as a standalone PWA on iOS Safari. Use `position: fixed` on body, `overscroll-behavior: contain`, and touch-move prevention to feel native.
- **Dark theme**: Slate colour palette (Tailwind naming). Background `#0f172a`, cards `#1e293b`, accent `#34d399` (emerald).
- **Keep it simple**: No new files, no dependencies, no build tools. If it can stay in `index.html`, it should.
- **Respect existing data**: Never change the localStorage key or entry schema without a migration path.

## Service worker

The SW caches all assets under a versioned cache name (`pressups-v1`). When making changes:

- Bump the `CACHE_NAME` in `sw.js` (e.g. `pressups-v2`) so returning users pick up the new version.
- Keep the asset list in `ASSETS` up to date if new files are added.

## Planned phases

- **Phase 1** ✅ Core tracker (number input, sessions list, daily total, PWA)
- **Phase 3** ✅ Google Sheets sync (write-through from localStorage to a private Sheet). Tackled before Phase 2 because history/trends need real data across days.
- **Phase 2**: History & trends (past days list, bar chart, calendar heatmap, streaks) — now builds on top of the Sheets-backed data.
- **Phase 4**: Polish (milestones, weekly summaries, export, daily target ring)

## Sheets sync notes

- Spreadsheet is named "Daily Pressups" with a single sheet "Entries" (columns: id, count, timestamp, date).
- Writes are optimistic: localStorage updates immediately, Sheets is updated in the background. Sync status is shown in the small top-right button.
- `drive.file` scope means the app can only see files it has created. If the stored sheet ID is lost from localStorage, the app will create a new sheet on next sign-in; users can manually delete any orphaned sheets.
- Tokens are held in memory only (1h lifetime). Silent refresh is attempted on load; otherwise the user taps "connect".

## Style guide

- Use CSS custom properties defined in `:root` for all colours
- Font sizes in `px` for predictability on mobile
- Border radius: `12px` for cards, `14px` for inputs/buttons
- Spacing: `20px` horizontal page padding
- Animations: subtle and fast (150–300ms). No gratuitous motion.
- Monospace (`DM Mono`) for numbers and data labels. Sans (`DM Sans`) for everything else.

## Testing

No automated tests. Test manually on iPhone Safari (standalone PWA mode). Key flows to check after any change:

1. Add a set → total updates, session appears, toast shows
1. Delete a set → total updates, session removed, toast shows
1. Sessions persist after closing and reopening the app
1. No horizontal scroll or bounce — app feels locked in
1. Works offline after first load
