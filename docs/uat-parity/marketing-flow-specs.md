# Marketing action-flow specs — UAT deep crawl (2026-07-12)

Source: uat.maropost.com account 116000, live crawl (3 agents + main-loop deep-dives). Basis for the full Marketing-module redesign (no new features). Crawl artifacts left in UAT: draft email campaign "ZZ Crawl Test - do not send" (id 2339, Draft, safe to delete) and one unpublished acquisition-form draft (builder id allocated during step-4→5 walkthrough).

## Marketing nav (complete)
Campaigns → Email Campaigns `/campaigns` · Text Campaigns `/sms_campaigns` · Transactional Email `/transactional_campaigns` · Transactional SMS `/transactional_sms_campaigns` · Campaign Tags `/ctags`
Acquisition → Acquisition Forms `/acquisition/forms` · Landing Pages `/landing_pages` · Lead Ads `/social_leads`
Automation → Journeys `/journeys` · Data Journeys `/data_journeys`
Content → Email Content `/contents` · Dynamic Content `/dynamic_contents` · Image Library `/folders` · Footer Management `/footers` · Optimise on Open `/image_groups` · Content Feeds `/content_feeds` · Coupon Banks `/coupon_banks` · Preference Management `/preference_pages`
**Do NOT exist for this account:** Surveys (`/surveys` → upsell page), Countdown Timers (no nav entry). SignupForms legacy equivalent = Acquisition Forms; PreferencePages = Preference Management (exists, 39 items).

## 1. Email campaign create (`/campaigns/new`)
Type select screen: two cards — **Email Campaign** / **A/B Email Campaign** + CANCEL. Selecting Email → `/campaigns/new/email`, a **4-step wizard** (numbered stepper; completed = check; step panels stack vertically; sequential NEXT navigation enforced; direct stepper jumps blocked until current step saved).
- **Step 1 — Campaign Details**: Campaign Name* ("You cannot use emojis"), Subject* (emoji picker affordance), Preheader (0/100 counter + emoji + info), Select Campaign tag (combobox + info). Note: "Campaign is in draft mode, please Save on Step 2." BACK/NEXT.
- **Step 2 — Contacts**: Brands (select) · Select Segment*(n) · Select Table*(n) · Select List*(n) — multi-select checkboxes w/ Select All + per-list contact counts; rule "Please select either List, Segment or Table". Sender block: From Name* (no special chars/emojis), From Email*, Reply To*, Language* (default English), Address* (autofilled from account). Info: multiple lists → sender fields autofill from last selected list. **Add Suppress Contacts**: Suppress List / Suppress Journey / Suppress Segment / Suppress Secure List (all multi (0)-count selects). NEXT+SAVE disabled until audience chosen. Footer: BACK / NEXT / SAVE ("click save before proceeding").
- **Step 3 — Content**: Content Name* = searchable picker over the Email Content library; selecting renders inline content preview (merge tags visible: {{campaign.address}}, {{contact.first_name}}, {{campaign.unsubscribe_link}}) + pencil → content editor. Toggles: "Show email preview link" (info), "Dynamic content preview" (info) + RENDER PREVIEW. Footer: BACK / **SPAM CHECK** / SAVE (→"SAVED"). No NEXT — Schedule unlocks via save.
- **Step 4 — Schedule** (label from stepper; step gated hard in UAT by a buggy dirty-flag even after save — redesign should NOT copy this). Options corroborated from campaign details page: send now vs schedule; optional toggles Email Preview Link, **Send Time Optimization**, **Time Zone Optimization**, **Conversion Time Optimization**, **Pre-Send Calculation** (all default off).
- Draft persistence: SAVE on any step ≥2 creates/updates a Draft visible in the list; edit route `/campaigns/:id/edit` re-enters the wizard hydrated.
- **A/B**: same wizard family; type card differs (variants/test%/winner criteria surface in ab flow + A/B Campaign Reports exist). Not deep-crawled.

## 2. Email campaigns list (`/campaigns`)
Folders left rail ("Always Open" pin, New Folder, My Campaigns + user folders). Header: title, filter select ("All"), search, **NEW CAMPAIGN**. Columns: Name / Contacts / Status (Draft·Sent chips) / Sent At / Updated At / Actions. Row hover: drag handle + checkbox. Row actions: kebab (Draft → **Edit Campaign**, **Delete Campaign Permanently**; Sent rows → report-oriented) + separate **Duplicate** icon (`/campaigns/:id/duplicate?folder_id=`). Pagination "Rows per page 10 · 1-10 of 466". Footer utility: "Change Content URL".

## 3. SMS campaign create (`/sms_campaigns/new`)
**2-step wizard: 1 MESSAGE / 2 COMPLIANCE** + right-side live phone MESSAGE PREVIEW.
- MESSAGE: Text Campaign Name*, From Number (select of provisioned numbers, e.g. +61481074914), Message* textarea with **segment counter "1 SMS 0/160"**; insert helpers: **Image (MMS), Contact Tags, Keywords, Click Tracking**; Test Phone Number + SEND TEST; BACK/NEXT. Preview auto-composes: account prefix ("Testing UAT 116000:") + message + shortened link (`0.mpt1.co/…` when click tracking) + **"Text STOP to opt-out"** compliance footer. Inline validation "Name is required"/"Message is required".
- COMPLIANCE (gated until MESSAGE valid; not captured field-by-field): compliance/audience/schedule step.
- List (`/sms_campaigns`): columns Name/Contacts/Sends/Replies/Clicks/Status/Sent At/Updated At/Actions; MMS rows labeled; statuses incl. Delivered; create button "COMPOSE YOUR MESSAGE".

## 4. Transactional email create (`/transactional_campaigns/new`)
**Single-page form** (no wizard, no audience — event/API-triggered): Campaign Name* (no emojis), Subject*, Preheader (0/100), From Name*, From Email*, Reply To*, Language, **Content*** (library picker + Preview + "Show email preview link"), Brands, Select Campaign tag, Address*, single **SAVE**.
List: columns Name / Sends / Updated At / Actions.

## 5. Transactional SMS create (`/transactional_sms_campaigns/new`)
Same composer as SMS but **tabs MESSAGE / COMPLIANCE (unnumbered)** and **SAVE** instead of NEXT (single save; no schedule). Helpers reduced: Contact Tags, Keywords, Click Tracking (no Image on load). From Number prefilled. COMPLIANCE tab gated until valid.
List: Name / Sends / Updated At / Actions.

## 6. Acquisition forms
- **Gallery** `/acquisition/forms/select`: "Create from scratch" + templates: First order discount (Popup·Center), Neutral modern (Popup·Center), Looking for something? (Popup·Center), Be the first to know (Embedded), Join the club (Embedded), Welcome coupon (Embedded).
- **Builder** `/acquisition/forms/create`: **5-step vertical stepper**, completed steps collapse to checks; NEXT validation-gated per step.
  1. **New Form**: Name* ("Form Name is required"), Subscription Lists* multi-select (Select All + per-list counts), Domain Name (repeating + ADD DOMAIN).
  2. **Form Settings**: form type radio cards Popup/Embedded (default Popup); "Don't show form again after submission" (default ON); Display On radio Entry/Exit/Percentage Scrolled; "Only show on these URLs" checkbox+URL list; "Don't show pop-up for N days after closing" checkbox+number.
  3. **Form Design**: 8 accordion panels + live device preview (desktop/mobile/fullscreen): Builder Background; Popup Position (Classic center/top right/top left/bottom right/bottom left/Drawer left/right/Bar bottom/top); Drop Shadow (colour #RRGGBBAA, blur, h/v offset); Overlay Colour (+opacity); Dimensions (Width* px required, Height, fit-height checkbox); Padding T/B/L/R*; Border (colour, thickness*, radius*); Background (Colour/Image radio + hex). Plus **Optional functions** accordion: Redirect after submission · Notify email on subscriber · ReCaptcha · Double opt-in.
  4. **Form Content**: sub-pages **Main Form** / **Thank You**, each a **BeeFree drag-drop editor** (CONTENT/ROWS/SETTINGS panels). Forms palette: TITLE, PARAGRAPH, LIST, IMAGE, DIVIDER, SPACER, SOCIAL, HTML, VIDEO, ICONS, TEXT (email+submit is a fixed managed block).
  5. **Form Preview**: DETAILS (name inline-edit, type, Created/Modified/Published At, **website embed `<script>` + manual-integration script, both with copy**) / PREVIEW tabs. Footer: EXIT | BACK | **PUBLISH**. Draft persists server-side before publish.
- **List** `/acquisition/forms`: checkbox multi-select, Name (→ `/acquisition/forms/:id/modify`), Form Type, Status, Updated/Created At, kebab; bulk actions.

## 7. Landing pages
- **Gallery** `/landing_pages/template`: tabs LIBRARY/MY TEMPLATES; filter groups USAGE (newsletter, events, product-promotion, service-promotion, dark-mode-optimized), INDUSTRY (12: e-commerce…small-business), SEASONAL (11: christmas…memorial-day) + Clear All; "Blank Template — Start from scratch → START DESIGNING"; ~18 template cards (thumbnails broken in UAT).
- **Select Builder**: 2 cards — **WYSIWYG** / **Drag & Drop**; BACK.
- **Details step** `/landing_pages/details`: Name*, Page URL* (live "Invalid URL" validation), Publish at Date*+Time*, Expire at Date*+Time* (calendar + 15-min-increment time list), Page Tracking textarea (optional). BACK/NEXT gated on validity.
- **DnD editor** `/landing_pages/editor/:id/edit`: topbar breadcrumb+name · VERIFY DOMAIN · BACK · SAVE AND CLOSE; toolbar PREVIEW · SAVE AS TEMPLATE · SHOW STRUCTURE; BEE canvas w/ desktop/mobile toggles + built-in subscription form block; right CONTENT/ROWS/SETTINGS; LP palette (14): TITLE, PARAGRAPH, LIST, IMAGE, BUTTON, DIVIDER, SPACER, SOCIAL, HTML, VIDEO, FORM, ICONS, MENU, TEXT.
- **Page detail/view**: SEO/meta live here (Description, Page Title, Page URL copy, Redirect after expiry, Meta Keywords, Page Tracking — inline edits) + timestamps + device preview toggles + open-live + EXIT.
- **List** `/landing_pages`: folder tree, NEW PAGE; columns Name / Editor Type (Drag & Drop|WYSIWYG) / Domain / Status (Verified|Unverified) / Publish At / Expire At / Updated At / Actions. Kebab: Verify Domain · Preview · Duplicate · Delete Permanently. 37 items.

## 8. Journeys
- **List** `/journeys`: folders rail; NEW JOURNEY; columns Name (→ builder) / Journey Status / Contacts / Active Contacts / Items / Created At / Updated At / Actions kebab. 346 journeys.
- **Create** `/journeys/new`: two modes — **Create from scratch** (→ builder) and template gallery (**Build with AI** area): Welcome, Abandoned Cart, Nurture, Advocacy, Email Re-engagement, Lapsed Buyer; templates auto-populate canvas.
- **Builder** `/journeys/:id/journey-builder` (Vue Flow canvas): left collapsible palette — Triggers: New Subscription, Product Purchased, Abandoned Cart, Total Revenue, Form Event, Contact Field Updated · Actions: **Send Email** (only) · Delay · End; "Drag & Drop" toggle. Top: name label, zoom ±%, canvas search, **SAVE AS DRAFT / SAVE / DELETE ALL / EXIT**. **No journey-level settings panel exists.** Node hover → Delete/Duplicate badges; **double-click opens config panel** (footer SAVE | DETACH | REMOVE):
  - Send Email: SEND EMAIL/SEND TEST EMAIL toggle, View Journey Campaign Report link; Name*, Subject*, Preheader, From Name*, From Email*, Reply To*, Content* (library picker), Preview Link toggle, Address*, Brand, Campaign Tags multi, Secure Suppression List multi, Language*.
  - Delay: Months/Days/Hours/Minutes (defaults 0/0/0/1) + live "N contact(s) waiting" + View Contacts.
  - Trigger (Contact Field Updated): Contact Fields* multi-chips + live "N contacts entered" + refresh.
  - Node panels embed live journey stats; panel SAVE is local — journey persists only via bottom SAVE/SAVE AS DRAFT.

## 9. Secondary content create flows
| Page | Create flow |
|---|---|
| Email Content `/contents` | NEW CONTENT → step 1 `/contents/template` gallery (LIBRARY/MY TEMPLATES; INDUSTRY/AUTOMATED/SEASONAL/USAGE filters; Blank → START DESIGNING) → step 2 `/contents/select` "Select Builder": **Drag & Drop / WYSIWYG / HTML Code Editor / Pull from URL** → editor. List: folders, VIEW ARCHIVES; Name/Editor Type/Updated/Created/Actions; 403 items |
| Dynamic Content `/dynamic_contents` | NEW → full page: Name* (lowercase/numbers/underscores), "Original Content" WYSIWYG block (fallback) w/ toolbar (Content Feed, Source, Styles/Format/Font/Size, tag-insert menus: Campaign/Contact/Other/Dynamic Areas/Table/Coupon/Product Feed Templates tags, PREVIEW), Rule 1: Segment* + own WYSIWYG, ADD NEW RULE, CANCEL/SAVE. List: Name/#Segments/Created/Updated/Actions; VIEW ARCHIVES; 19 items |
| Footers `/footers` | NEW FOOTER → page "Fill out Details": Name*, 4 preference-page selects (1-Click Unsub / Report Spam / Manage Subscription / Edit Profile), Editor Type radio DnD/WYSIWYG → NEXT → editor. List: Name/Editor Type/Updated/Created/Actions; "Default" tag; 85 items |
| Content Feeds `/content_feeds` | NEW FEED → modal: Feed Type radio Single/Merge, Name*, Update on: Day-of-week + Hour selects, URL*; helper re journey/transactional vs batch pull timing. List: Name/Updated/Created/Action; 19 items |
| Coupon Banks `/coupon_banks` | NEW COUPON → modal: Name*, Coupon Tag (lc/num/underscore), Alert Threshold, Alert Recipients (emails), Default Coupon Codes* textarea. List: Name/Tag/Unused/Redeemed/Assigned/Created/Updated/Actions; 15 items |
| Preference Pages `/preference_pages` | NEW PAGE → modal: Name*, Page Type* (Manage Subscriptions default · One Click Unsubscribe · Confirm Subscription · Edit Profile · Report Spam), Redirect* (for Manage Subs), Editor* radio DnD/WYSIWYG/HTML → CREATE. List adds **Page Type** column + editor/page-type filters; 39 items |
| Campaign Tags `/ctags` | NEW TAG → modal: Tag Name* only, CANCEL/CREATE. List: folders, VIEW ARCHIVES, IMPORT TAGS; Name/Created/Updated/Action; 27 items. (`/campaign_tags` = legacy wrapper) |

## Legacy UX pain points (fair game to fix in redesign)
1. Email wizard forces strictly sequential NEXT + intermediate SAVE; stepper dots block with a confusing "You made changes" toast even when saved (bug). No unified review step.
2. Content step has no NEXT — SAVE doubles as advance; three different footers across steps (NEXT vs SPAM CHECK/SAVE).
3. Step panels stack in the DOM (previous steps remain rendered above the active one) — long scrolling pages.
4. SMS COMPLIANCE step invisible until message valid (no preview of what's required next).
5. Type-select cards (campaigns/new) are image cards with `href="#"` — no keyboard affordance.
6. LP template/builder cards render blank (asset failures); page settings split between editor and a separate detail page.
7. Journey builder has no journey-level settings; save semantics split (node SAVE local vs canvas SAVE global) with no dirty indicator.
8. Secondary creates are inconsistent: modals vs full pages vs 2-step galleries with no pattern logic.
