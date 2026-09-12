# Trial Lab — Free-trial onboarding prototypes (UX specification)

| | |
|---|---|
| **Source** | Confluence [Free Trial flow improvement](https://maropost.atlassian.net/wiki/spaces/PROD/pages/6766919681) (Abhayjit Chauhan) · Jira [MPUP-8667](https://maropost.atlassian.net/browse/MPUP-8667) "Spike: Explore direct Free Trial Login with Email & Password" (epic MPUP-8629 "Improve Free trial conversion") |
| **Prototype** | `/trial-lab` in this repo — `src/views/TrialLab/`, `src/components/triallab/`, `src/stores/useTrialLab.ts` + `src/stores/trialLabData.ts` |
| **Status** | Slice 1 built (shell, signup → verify → prepare → names → goal → sample task → home). Slice 2 (upgrade with MFA + recovery codes) and Slice 3 (reviewer scenarios, event log) pending |
| **Date** | 2026-09-12 |

The Confluence proposal recommends **Option 2** — email → verify → hosted password → into the product, with profile, MFA and recovery codes deferred. This prototype takes that direction as a *hypothesis* and extends it through the user's **first useful action**, because getting more people through the form is an incomplete measure of success. Four variants isolate two decisions; everything else is deliberately identical.

---

## 1. The two decisions and the four variants

| Variant | Verify before entry | Ask names early | Journey |
|---|---|---|---|
| **A** Verify, then personalize | yes | yes | signup → verify → about you → goal → task |
| **B** Verify, then explore *(recommended first release)* | yes | no | signup → verify → goal → task; names via contextual edits |
| **C** Preview, then personalize | no | yes | signup → verify prompt → *explore while you wait* → about you → goal → task |
| **D** Preview, then explore | no | no | signup → verify prompt → *explore while you wait* → goal → task |

Variant configuration is two booleans (`verifyBeforeEntry`, `askNamesEarly`) in `trialLabData.ts`; the screens read them, so there is one implementation, not four.

**Hypotheses (to test, not conversion predictions):** B is the shortest verified route; D tests whether earlier access lifts first-task completion enough to justify the preview complexity; A/C test whether early personalisation aids orientation or merely adds a screen.

## 2. Shared rules (identical across variants)

### Signup
- **Work email + password only.** Free-mail domains are rejected inline with "Use your work email to start a trial" (same list as the real signup). Password: show/hide, minimum 8 characters, `autocomplete="new-password"`.
- The password lives in a component-local ref and is cleared after the simulated submit. It never enters the store, the URL, storage or the event log — the store types make that impossible.
- Copy promises what happens next ("Next: we'll send a verification email. You can change the address later.").
- Existing account → sign-in / resume guidance, never a second workspace (reviewer scenario in Slice 3).

### Verification
- One simulated email carries a **Verify link** and a **6-digit code**. Either completes verification; the user never needs both.
- **Resend replaces the challenge.** The previous link and code become *superseded*; the inbox marks them.
- States: wrong code (clears the boxes, keeps the error), expired code/link, already used, superseded link, delayed email (scenario).
- Change email is inline on the verify surface and issues a fresh challenge.
- **Cross-tab:** the link opens in a new tab, consumes the token and reports; the original tab advances on its own (store sync through the `storage` event). Goal, names and drafts are untouched by verification.
- A/B: verification blocks entry. C/D: the same card plus **Explore while you wait**, which proceeds to workspace preparation unverified.

### Workspace preparation
- Short simulated provisioning with a three-step checklist; progress is derived from the persisted start time, so refresh and a second tab agree.
- Failure state with Retry (reviewer scenario). The account is unaffected.

### Names
- **Two independently optional fields:** *Your name* ("What should we call you?") and *Workspace name* ("A name to help you recognise this account. You can change it later."). Continue saves whatever is filled; Skip for now keeps the defaults. Neither depends on the other; one-word and international names are fine.
- A/C show the screen once during onboarding. B/D never do — names are offered through **Rename workspace** in the switcher and **Add your name** in the profile menu (single-field drawers, Save/Cancel). No post-task modal, no recurring reminder, no profile-completion gate.

| Missing information | Display |
|---|---|
| Workspace name | **Trial workspace**, stable ID beneath (switcher + header) |
| Personal name | Email in the profile menu; neutral user icon |
| Greeting | **Welcome to Maropost** |

- Never infer a person's name from the email or a company from the domain.
- The workspace label is a recognisable label, not the legal company name, sender name or storefront name.
- Renaming updates the switcher and header immediately and never changes IDs, routes, drafts or trial dates. Two unnamed workspaces are told apart by ID.

### First useful action
Same goal chooser and sample tasks everywhere, so the comparison isolates onboarding:

| Goal | Sample task | Completion event |
|---|---|---|
| Explore Marketing | Pick a welcome-email template, edit subject/body, preview | Save draft |
| Explore Commerce | Change the storefront heading and accent colour, preview (real `StorefrontPreview`) | Save draft |
| Explore Service | Open sample ticket S-1042, refine the suggested reply, see it in the thread | Save draft |

Sample data is labelled *Sample*; no invented revenue or customers appear as the user's own. After saving: a concise success state with **Continue** (home) and **Explore another Cloud** (goal chooser). Drafts persist per goal and survive switching.

### Preview mode and trial timing
- Unverified C/D users can edit, preview and save sample work. Connect live store, import real contacts, send a test, publish, invite, upgrade **require verification**: the action opens the verify dialog with a one-line reason ("Sending, importing, publishing and inviting affect real people, so we confirm it's you first.").
- A persistent, non-blocking banner explains preview mode with *Enter code* and *Resend email*.
- **The 14-day trial starts only when the email is verified AND the workspace is ready**, exactly once. Before that the header chip reads *Preview · Trial not started*; after, *Trial · N days left*. Resend, refresh, rename and goal changes never restart it.

### Home
Greeting (fallback-aware), workspace label (+ ID while unnamed), the three goal cards with draft status, and a *Next steps* list of the gated live actions (lock icon until verified).

## 3. Measurement

Events recorded locally per run, with elapsed time since account creation; the property type is a closed union so no email, name, password, code or draft text can be logged:

`signup_completed` · `verification_prompted {method}` · `verification_succeeded {method}` · `preview_entered` · `workspace_ready` / `workspace_failed` · `trial_activated` · `goal_selected {goal}` · `sample_task_completed {goal, first}` · `name_prompt_shown` · `name_saved {field, supplied}` · `gated_action_blocked` · `upgrade_step_*` (Slice 2).

Report per variant: first-useful-action completion per signup · time from account creation to it · verified activation per signup · verification completion among preview users · optional-name completion · upgrade-stage abandonment. The local log validates instrumentation and supports moderated tests; synthetic runs are not evidence of real uplift.

## 4. Implementation notes

- Routes: `/trial-lab` (index) and `/trial-lab/:variant(a|b|c|d)/{signup|verify|verify-link/:token|preparing|names|goal|task/:goal|home}`, all `meta: { fullPage: true, trialLab: true }`. The variant is in the path so every variant has a direct link and refresh/Back follow the URL. A per-child guard blocks only illegal *forward* states.
- Store `useTrialLabStore` (`mp.trial-lab.v1`): one run per variant; the coarse clock (`tick`) is not persisted; provisioning readiness is committed from elapsed time; persistence is a deep watch with an echo guard, and a single `storage` listener syncs other tabs. It never writes to `useAccounts`, `useUserProfile`, `usePlg` or `useOnboarding`.
- Outside the new files only two edits: the `trialLab` route-meta flag and the copilot `copilotAvailable` check in `App.vue`.
- Components: `TrialLabHeader`, `TrialVerifyForm`, `TrialNameDrawer`, `TrialReviewerPanel` (stories under *Product / Trial Lab*). Screens are route views composing `MpWizardSteps`, `MpFormGrid`, `MpFormField` + `v-otp-input`, `MpOptionCard`, `MpWizardShell`, `MpEmptyState`, `MpListRow`, `MpBanner`, `MpDialog`, `MpChatBubble`, `StorefrontPreview`.

## 5. Open questions for Product (carried from the design review)

1. Which option is agreed — immediate access without verification, or faster access with verification retained? (MPUP-8667's latest comment still asks.)
2. What does "conversion" mean here, and what are the baseline and target?
3. Which fields must exist before access, and what breaks without them (names, company, country, website, work-email eligibility)?
4. What can a trial user do before completing MFA — triggers, gate strength, dismissibility, what changes at upgrade?
5. When does the 14-day clock start if setup is delayed?
6. Which users and entry routes are in scope (existing Maropost user, invitee, returning unfinished signup)?
