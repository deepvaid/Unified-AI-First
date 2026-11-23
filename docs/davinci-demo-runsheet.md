# Da Vinci voice demo — run-sheet

For whoever presents Da Vinci's voice workspace to a prospect. Everything below was checked on
`fix/davinci-demo-readiness` on 2026-11-23, in Chrome (and by voice in Safari), on the demo account (2000290, "Scooter Village").
The figures are what that account shows today; they move with the date.

## Before the call

1. Use **Chrome, Edge or Safari**. Firefox can only type.
   - **One voice tab only.** A second tab or window that is listening cuts the first one off. Close every
     other Da Vinci tab in that browser before you start.
   - **Chrome and Edge use the microphone picked in their own settings**, not the system's (Safari follows
     the system). Check it from the mic icon in the address bar. If that microphone is dead, Da Vinci moves
     to the system microphone after a few seconds and says so under the mic.
2. Open the app, then open **Da Vinci › AI experience** from the app bar. Opening it from inside the
   app is what lets the greeting play without a click. A pasted or shared link shows a **Start Da Vinci**
   button instead of the mic: no browser lets a page speak before one click, and the greeting plays from it.
3. Allow the microphone when Chrome asks, once, before the prospect joins. A blocked mic shows a red
   line under the mic button; typing still works.
4. Check the top bar says **Voice on**. That button shows the current state, so clicking it turns voice
   OFF, and that is remembered between visits. When it is off, a line under the mic says so.
5. Click **New chat** so the thread is empty and no earlier campaign brief is open.
6. Share the **tab with audio** (Chrome's "Share tab audio"), or the prospect hears nothing.
7. Use a full-screen window. On a 13-inch laptop the thread is about 370px tall.

## What to say

Say these in order. Each one is answered from the account's own data.

| Say | What comes back |
|---|---|
| "How's revenue this week?" | Revenue, orders and average order value for the last 7 days against the 7 before, with the dashboard's own chart. The same numbers as the Overview dashboard. |
| "What are my top selling products?" | The same three products, to the dollar, as the dashboard's "Sales by product name" widget. |
| "What needs my attention today?" | Orders waiting to be fulfilled, returns, and the product running low, with a button to the page. |
| "How did my last campaign perform?" | The last sent campaign by name, with its open rate, click rate and revenue. |
| "Create a segment of customers who haven't purchased in 90 days" | The account already has it: "Lapsed 90 Days", 4,201 contacts. Try "60 days" to see a new one drafted with an estimate. |
| "Draft a flash sale campaign for my VIP customers" | Straight to the readiness check for VIP Customer Circle. Say "yes, continue" for the draft, named "Flash Sale — Special offer". |
| "Win back customers who haven't bought in 90 days" | The Lapsed Buyer journey template. Say "open it" to go to the journey wizard (this leaves the voice workspace). |
| "Write a product description for the Nike Air Max 270" | A draft for that catalogue product, with a button to its editor. |
| "Thanks, that's all" | A short goodbye, and the mic closes. |

The four prompts under the message box ("Try saying") are safe to read out or click.

## If something goes wrong

- **Nothing is heard.** Press **Start Da Vinci** if it is showing (the browser blocked sound until a click). Then check "Voice on".
- **It does not hear you.** Read the line under the mic: it names a blocked or silent microphone, or says
  voice input keeps being cut off (another tab is listening — close it, then tap the mic). Type the
  question meanwhile; typing over a spoken reply interrupts it.
- **It is still talking and you want to move on.** Press **Interrupt**, or just type or say the next thing after it.
- **"Advisor busy" or "Advisor offline".** The open-ended answers need the Gemini connection. Revenue,
  segments, campaigns, journeys and product descriptions work without it. Ask again in a moment.
- **A campaign question keeps coming back.** Click **New chat**.
- **Esc** leaves the voice workspace (in the message box it only clears the text).
- **It works for you but not for someone else.** Ask them to open the link with `?debug=1` on the end and
  send a screenshot. The box at the top left names their browser, the version they loaded, whether voice is
  switched off, what became of the greeting, and whether sound and the microphone are allowed.

## Things to steer around

- Don't ask for something the account has no data for (a competitor, a forecast). The advisor says what
  it would need to look at rather than guess, which is correct but is not a demo moment.
- "Open in journey wizard", "Review editable draft" and the card buttons leave the voice workspace for
  the real page. Do them last, or come back through the app bar.
- Replies other than the greeting take about two seconds to start speaking.
