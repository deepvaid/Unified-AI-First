# Da Vinci — zero-tap voice greeting on link open (demo setup)

Browsers block audio on a cold page load until the user interacts once — that's
Chrome/Safari autoplay policy, not something a site can bypass. The app already:

- **Auto-greets with zero tap** when Da Vinci is opened from inside the app (the
  in-app click carries the activation), and on any browser where autoplay is permitted.
- **Probes for a late autoplay grant** for ~20s on a blocked cold load and greets the
  moment audio is allowed.
- Falls back to **first-interaction-anywhere** (any click/keypress speaks the greeting)
  and the "Tap to start" mic otherwise.

To make a **cold link** (fresh tab, pasted URL) greet with zero tap, put the browser in a
permitted state — one-time setup per demo machine:

## Safari (easiest)
1. Open https://ai-first-maropost.vercel.app once.
2. Safari menu → **Settings for ai-first-maropost.vercel.app…** (or right-click the URL bar)
3. **Auto-Play → Allow All Auto-Play**.

Cold links now speak the greeting immediately.

## Chrome — demo machine (launch flag)
Quit Chrome fully, then launch it with autoplay allowed:

```bash
# macOS
open -a "Google Chrome" --args --autoplay-policy=no-user-gesture-required
```

All tabs in that Chrome session allow autoplay — cold links greet with zero tap.

## Chrome — org-wide (recommended for internal stakeholders)
Ask IT to push the Chrome Enterprise **`AutoplayAllowlist`** policy containing
`https://ai-first-maropost.vercel.app`. Every managed Chrome then auto-plays the
greeting on a cold link with no per-machine setup.

## Notes
- **Chrome MEI:** users who regularly play audio on the site gain autoplay automatically
  over time — the greeting will "start working" untouched for frequent users (e.g. Ross
  after a few sessions).
- **Microphone:** the hands-free listening that follows the greeting needs the site's mic
  permission — grant it once on the demo machine and it persists.
- Everything degrades gracefully: on an unconfigured browser the first click/keypress
  anywhere plays the greeting.
