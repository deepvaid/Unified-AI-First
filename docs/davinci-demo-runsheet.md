# Da Vinci voice demo — run-sheet

For whoever presents Da Vinci's voice workspace to a prospect. Everything below was checked on
`fix/davinci-demo-readiness` on 2026-11-23, in Chrome, on the demo account (2000290, "Scooter Village").
The figures are what that account shows today; they move with the date.

## Before the call

1. Use **Chrome or Edge**. Voice input needs one of them; Safari and Firefox can only type.
2. Open the app, then open **Da Vinci › AI experience** from the app bar. Opening it from inside the
   app is what lets the greeting play without a click. A pasted link needs one click anywhere first.
3. Allow the microphone when Chrome asks, once, before the prospect joins. A blocked mic shows a red
   line under the mic button; typing still works.
4. Check **Voice on** in the top bar. "Voice off" is remembered between visits and silences the greeting.
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

- **Nothing is heard.** Click anywhere on the page: the browser blocked audio until a click. Then check "Voice on".
- **It does not hear you.** Look for the red line under the mic. Type the question instead; typing over
  a spoken reply interrupts it.
- **It is still talking and you want to move on.** Press **Interrupt**, or just type or say the next thing after it.
- **"Advisor busy" or "Advisor offline".** The open-ended answers need the Gemini connection. Revenue,
  segments, campaigns, journeys and product descriptions work without it. Ask again in a moment.
- **A campaign question keeps coming back.** Click **New chat**.
- **Esc** leaves the voice workspace (in the message box it only clears the text).

## Things to steer around

- Don't ask for something the account has no data for (a competitor, a forecast). The advisor says what
  it would need to look at rather than guess, which is correct but is not a demo moment.
- "Open in journey wizard", "Review editable draft" and the card buttons leave the voice workspace for
  the real page. Do them last, or come back through the app bar.
- Replies other than the greeting take about two seconds to start speaking.
