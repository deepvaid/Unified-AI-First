#!/usr/bin/env node
'use strict';

/**
 * Reproducible generator for the leadership design-system showcase deck
 * (PPT-only presentation; live demo happens in the browser mid-deck).
 *
 * PowerPoint tooling intentionally lives outside the application:
 *   mkdir -p /tmp/monday-showcase-pptx-tools
 *   npm --prefix /tmp/monday-showcase-pptx-tools init -y
 *   npm --prefix /tmp/monday-showcase-pptx-tools install --save-exact pptxgenjs@4.0.1
 *   node scripts/presentations/generate-leadership-showcase.cjs
 *
 * Screenshots are curated in docs/design-system/showcase-assets/ (captured
 * from the running sandbox at 1440x900@2x). Speaker notes mirror
 * docs/design-system/leadership-showcase-script.md.
 */

const fs = require('node:fs');
const path = require('node:path');

function loadPptxGenJS() {
  const candidates = [
    process.env.PPTXGENJS_PATH,
    '/tmp/monday-showcase-pptx-tools/node_modules/pptxgenjs',
    'pptxgenjs',
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch (error) {
      if (error && error.code !== 'MODULE_NOT_FOUND') throw error;
    }
  }

  throw new Error(
    'PptxGenJS was not found. Install pptxgenjs@4.0.1 in /tmp/monday-showcase-pptx-tools or set PPTXGENJS_PATH.',
  );
}

const PptxGenJS = loadPptxGenJS();
const pptx = new PptxGenJS();

const ROOT = path.resolve(__dirname, '../..');
const ASSETS = path.join(ROOT, 'docs/design-system/showcase-assets');
const OUTPUT = path.join(ROOT, 'docs/design-system/leadership-showcase.pptx');

const W = 13.333;
const H = 7.5;
// The app's UI font is Inter, but it is loaded from Google Fonts and is not
// installed on the presentation machine — PowerPoint would substitute a serif.
// Helvetica Neue is the closest system-installed match on macOS (Arial on Windows).
const FONT = 'Helvetica Neue';

// Palette mirrors src/design-tokens/tokens.json (color.light / color.dark).
const C = {
  bg: 'F4F6FA',
  surface: 'FFFFFF',
  surfaceBlue: 'DEF3FF',
  primary: '0073AB',
  primaryDark: '005E8A',
  primaryBright: '2CC4FF',
  text: '1A1814',
  muted: '5A6573',
  faint: '87919E',
  border: 'E5E5E5',
  borderStrong: 'D4D4D4',
  ink: '1A1814',
  inkText: 'F7F5F2',
  inkMuted: 'B8B2A7',
  success: '1A7F54',
  successSoft: 'D6F0E2',
  error: 'C0392B',
  errorSoft: 'FBE1DC',
  violet: '6D28D9',
};

const A = {
  saveButtons: path.join(ASSETS, 'save-buttons-crop.png'),
  uatBefore: path.join(ASSETS, 'uat-before-crop.png'),
  dashboardLight: path.join(ASSETS, 'dashboard-light.png'),
  dashboardDark: path.join(ASSETS, 'dashboard-dark.png'),
  orders: path.join(ASSETS, 'orders-light.png'),
  contact: path.join(ASSETS, 'contact-light.png'),
  journey: path.join(ASSETS, 'journey-light.png'),
  davinci: path.join(ASSETS, 'davinci-light.png'),
  storybook: path.join(ASSETS, 'storybook.png'),
};

for (const [name, assetPath] of Object.entries(A)) {
  if (!fs.existsSync(assetPath)) {
    throw new Error(`Missing curated asset "${name}": ${assetPath}`);
  }
}

pptx.author = 'Maropost Product Design';
pptx.company = 'Maropost';
pptx.subject = 'Design system + design sandbox showcase for product and technology leadership';
pptx.title = 'One design system. Every screen.';
pptx.lang = 'en-US';
pptx.theme = { headFontFace: FONT, bodyFontFace: FONT };
pptx.defineLayout({ name: 'SHOWCASE_WIDE', width: W, height: H });
pptx.layout = 'SHOWCASE_WIDE';

function footerObjects(dark, tag) {
  return [
    {
      rect: {
        x: 0.56, y: 0.35, w: 0.25, h: 0.045,
        line: { color: dark ? C.primaryBright : C.primary, transparency: 100 },
        fill: { color: dark ? C.primaryBright : C.primary },
      },
    },
    {
      line: {
        x: 0.56, y: 7.02, w: 12.2, h: 0,
        line: { color: dark ? '403C35' : C.border, width: 0.8 },
      },
    },
    {
      text: {
        text: 'MAROPOST  /  DESIGN SANDBOX',
        options: {
          x: 0.56, y: 7.11, w: 3.3, h: 0.14, margin: 0,
          fontFace: FONT, fontSize: 8.5, bold: true,
          color: dark ? C.inkMuted : C.muted, charSpacing: 1.2,
        },
      },
    },
    {
      text: {
        text: tag,
        options: {
          x: 9.65, y: 7.11, w: 2.3, h: 0.14, margin: 0,
          fontFace: FONT, fontSize: 8.5, bold: true,
          color: dark ? C.inkMuted : C.faint, charSpacing: 1.1, align: 'right',
        },
      },
    },
  ];
}

const slideNumber = (dark) => ({
  x: 12.34, y: 7.09, w: 0.42, h: 0.18, margin: 0,
  fontFace: FONT, fontSize: 9, bold: true,
  color: dark ? C.inkMuted : C.muted, align: 'right',
});

pptx.defineSlideMaster({
  title: 'COVER',
  background: { color: C.bg },
  objects: [],
});
pptx.defineSlideMaster({
  title: 'CORE',
  background: { color: C.bg },
  objects: footerObjects(false, 'LEADERSHIP SHOWCASE'),
  slideNumber: slideNumber(false),
});
pptx.defineSlideMaster({
  title: 'DARK',
  background: { color: C.ink },
  objects: footerObjects(true, 'LEADERSHIP SHOWCASE'),
  slideNumber: slideNumber(true),
});
pptx.defineSlideMaster({
  title: 'APPENDIX',
  background: { color: C.bg },
  objects: footerObjects(false, 'APPENDIX / DEMO FALLBACK'),
  slideNumber: slideNumber(false),
});

const imageSizeCache = new Map();

function addText(slide, value, x, y, w, h, options = {}) {
  slide.addText(value, {
    x, y, w, h, margin: 0,
    fontFace: FONT, fontSize: 18, color: C.text,
    breakLine: false, fit: 'shrink', valign: 'mid',
    ...options,
  });
}

function addCard(slide, x, y, w, h, options = {}) {
  const { fill = C.surface, line = C.border, radius = 0.08, shadow = false } = options;
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: radius,
    line: { color: line, width: 0.9 },
    fill: { color: fill },
    ...(shadow
      ? { shadow: { type: 'outer', color: '0B3558', opacity: 0.08, blur: 1.5, angle: 45, distance: 0.5 } }
      : {}),
  });
}

function addCircle(slide, x, y, d, fill, line = fill) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x, y, w: d, h: d,
    line: { color: line, width: 0.8 },
    fill: { color: fill },
  });
}

function addPill(slide, label, x, y, w, options = {}) {
  const {
    fill = C.surfaceBlue, color = C.primaryDark, line = fill,
    fontSize = 10.5, bold = true, h = 0.3, align = 'center',
  } = options;
  addCard(slide, x, y, w, h, { fill, line });
  addText(slide, label, x + 0.08, y, w - 0.16, h, { fontSize, bold, color, align });
}

function readPngSize(filePath) {
  if (imageSizeCache.has(filePath)) return imageSizeCache.get(filePath);
  const data = fs.readFileSync(filePath);
  const signature = data.subarray(1, 4).toString('ascii');
  if (signature !== 'PNG') throw new Error(`Expected PNG asset: ${filePath}`);
  const size = { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  imageSizeCache.set(filePath, size);
  return size;
}

function addImageContain(slide, filePath, x, y, w, h, altText) {
  const size = readPngSize(filePath);
  const sourceRatio = size.width / size.height;
  const boxRatio = w / h;
  const imageW = sourceRatio > boxRatio ? w : h * sourceRatio;
  const imageH = sourceRatio > boxRatio ? w / sourceRatio : h;
  slide.addImage({
    path: filePath,
    x: x + (w - imageW) / 2,
    y: y + (h - imageH) / 2,
    w: imageW,
    h: imageH,
    altText,
    objectName: altText,
  });
}

function addImageCrop(slide, filePath, x, y, w, h, altText, focusX = 0.5, focusY = 0) {
  const size = readPngSize(filePath);
  const sourceRatio = size.width / size.height;
  const boxRatio = w / h;
  let cropX = 0;
  let cropY = 0;
  let cropW = size.width;
  let cropH = size.height;

  if (sourceRatio > boxRatio) {
    cropW = size.height * boxRatio;
    cropX = (size.width - cropW) * focusX;
  } else {
    cropH = size.width / boxRatio;
    cropY = (size.height - cropH) * focusY;
  }

  const naturalW = (size.width / cropW) * w;
  const naturalH = (size.height / cropH) * h;
  const cropXInches = (cropX / cropW) * w;
  const cropYInches = (cropY / cropH) * h;

  slide.addImage({
    path: filePath,
    x, y,
    w: naturalW,
    h: naturalH,
    sizing: { type: 'crop', x: cropXInches, y: cropYInches, w, h },
    altText,
    objectName: altText,
  });
}

function addScreenshot(slide, filePath, x, y, w, h, altText, options = {}) {
  const { mode = 'crop', focusY = 0, label, labelWidth = 2.6 } = options;
  addCard(slide, x - 0.035, y - 0.035, w + 0.07, h + 0.07, {
    fill: C.surface, line: C.borderStrong, shadow: true,
  });
  if (mode === 'contain') {
    addImageContain(slide, filePath, x, y, w, h, altText);
  } else {
    addImageCrop(slide, filePath, x, y, w, h, altText, 0.5, focusY);
  }
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w, h,
    line: { color: C.border, width: 0.7 },
    fill: { color: C.surface, transparency: 100 },
  });
  if (label) {
    addPill(slide, label, x + 0.14, y + 0.14, labelWidth, {
      fill: C.surface, color: C.text, line: C.border, fontSize: 9.5, h: 0.28,
    });
  }
}

function addTitleBlock(slide, kicker, title, subtitle, options = {}) {
  const { dark = false, titleW = 11.8, titleSize = 28, titleY = 0.52 } = options;
  addText(slide, kicker.toUpperCase(), 0.56, titleY, 5.5, 0.22, {
    fontSize: 9.5, bold: true,
    color: dark ? C.primaryBright : C.primary,
    charSpacing: 1.4,
  });
  addText(slide, title, 0.56, titleY + 0.24, titleW, 0.5, {
    fontSize: titleSize, bold: true,
    color: dark ? C.inkText : C.text,
    breakLine: false, valign: 'top',
  });
  if (subtitle) {
    addText(slide, subtitle, 0.56, titleY + 0.74, 11.9, 0.35, {
      fontSize: 13, color: dark ? C.inkMuted : C.muted, valign: 'top',
    });
  }
}

function addNumberBadge(slide, number, x, y, options = {}) {
  const { fill = C.primary, color = C.surface, size = 0.34 } = options;
  addCircle(slide, x, y, size, fill);
  addText(slide, String(number), x, y, size, size, {
    fontSize: 11, bold: true, color, align: 'center',
  });
}

let notesCount = 0;
const slideTitles = [];

function createSlide(master, title, notes) {
  const slide = pptx.addSlide(master);
  slideTitles.push(title);
  if (notes) {
    slide.addNotes(notes);
    notesCount += 1;
  }
  return slide;
}

/* ------------------------------------------------------------------ */
/* 1 · Cover                                                           */
/* ------------------------------------------------------------------ */
{
  const s = createSlide(
    'COVER',
    'Cover',
    [
      'Thanks for making the time — 45 minutes, and I will keep us on schedule.',
      'One sentence to remember: we built a full working copy of our product, where every screen follows one shared set of rules. Looks like our product, clicks like our product — runs on pretend data, so it is completely safe to play with.',
      'Promise: nothing today is a picture. Every screen is real, running software. If you think something is a mockup, say so and I will click on it.',
    ].join('\n\n'),
  );
  addText(s, 'MAROPOST  ·  DESIGN SANDBOX SHOWCASE', 0.9, 1.5, 8, 0.3, {
    fontSize: 12, bold: true, color: C.primary, charSpacing: 2,
  });
  addText(s, 'One design system.', 0.86, 2.15, 11.6, 1.05, {
    fontSize: 54, bold: true, color: C.text, valign: 'top',
  });
  addText(s, 'Every screen.', 0.86, 3.2, 11.6, 1.05, {
    fontSize: 54, bold: true, color: C.primary, valign: 'top',
  });
  addText(
    s,
    'A working copy of our product, where every screen follows one shared set of rules.',
    0.9, 4.55, 10.5, 0.4,
    { fontSize: 16, color: C.muted },
  );
  addPill(s, 'EVERYTHING SHOWN TODAY IS LIVE SOFTWARE — NOT MOCKUPS', 0.9, 5.35, 5.6, {
    fill: C.surfaceBlue, color: C.primaryDark, fontSize: 10, h: 0.36,
  });
  addText(s, 'Deepak · UX  —  July 2026 · 45 minutes', 0.9, 6.15, 6, 0.3, {
    fontSize: 12, color: C.faint,
  });
}

/* ------------------------------------------------------------------ */
/* 2 · Agenda                                                          */
/* ------------------------------------------------------------------ */
{
  const s = createSlide(
    'CORE',
    'Agenda',
    [
      'Here is the plan for our time. First, why we did this. Then a short film. Then the part that matters most — five real screens, live. Then how it works in plain terms, the plan from here, and your questions.',
      'Ask questions as they come up — this works better as a conversation.',
    ].join('\n\n'),
  );
  addTitleBlock(s, 'Agenda', 'What we’ll cover in 45 minutes.', null);
  const items = [
    ['Why we did this', 'The problem, in one image — and what it costs us.'],
    ['A 75-second film', 'The whole story, compressed.'],
    ['Five screens, live', 'The heart of the session — a real walkthrough, not slides.'],
    ['How it works', 'Five layers, explained without jargon.'],
    ['The plan + six decisions', 'What happens next, and what I need from this room.'],
  ];
  items.forEach(([title, body], i) => {
    const y = 1.85 + i * 0.98;
    addCard(s, 0.56, y, 12.2, 0.84, { fill: C.surface, line: C.border });
    addNumberBadge(s, i + 1, 0.78, y + 0.25, { size: 0.34 });
    addText(s, title, 1.35, y + 0.13, 4.4, 0.28, { fontSize: 15, bold: true });
    addText(s, body, 1.35, y + 0.44, 10.9, 0.26, { fontSize: 11.5, color: C.muted });
  });
}

/* ------------------------------------------------------------------ */
/* 3 · The problem                                                     */
/* ------------------------------------------------------------------ */
{
  const s = createSlide(
    'CORE',
    'The problem',
    [
      'These are five Save buttons, all from patterns in our current product. Five shapes, five blues, five fonts — for the same action.',
      'Nobody chose this. Screens were built at different times, by different teams, with no shared rulebook. Each team made sensible decisions — just different ones.',
      'Second problem: trying an idea took weeks, so decisions were made from static pictures — and pictures are always on their best behavior.',
      'Customers feel the result, even if they cannot name it: the product does not feel like one product.',
    ].join('\n\n'),
  );
  addTitleBlock(s, 'The problem', 'Every screen does its own thing.', null);
  addScreenshot(s, A.saveButtons, 0.75, 2.3, 5.5, 2.31, 'Five different Save buttons from current product patterns', {
    mode: 'contain',
  });
  addText(
    s,
    'Five Save buttons, recreated from patterns in our current product.',
    0.75, 4.85, 5.5, 0.3,
    { fontSize: 10.5, color: C.faint, align: 'center' },
  );
  const pains = [
    ['Built apart, without a rulebook', 'Screens came from different teams at different times, each making its own sensible — but different — decisions.'],
    ['Ideas took weeks to try', 'So most design decisions were made from static pictures, which never show loading states, empty tables, or small screens.'],
    ['Customers feel it', 'They may not name it, but they notice: the product doesn’t feel like one product.'],
  ];
  pains.forEach(([title, body], i) => {
    const y = 2.3 + i * 1.36;
    addCard(s, 6.9, y, 5.85, 1.16, { fill: C.surface, line: C.border });
    addCircle(s, 7.1, y + 0.18, 0.26, C.errorSoft);
    addText(s, '!', 7.1, y + 0.17, 0.26, 0.26, { fontSize: 12, bold: true, color: C.error, align: 'center' });
    addText(s, title, 7.52, y + 0.13, 5.05, 0.27, { fontSize: 13.5, bold: true });
    addText(s, body, 7.52, y + 0.43, 5.05, 0.62, { fontSize: 10.8, color: C.muted, valign: 'top' });
  });
}

/* ------------------------------------------------------------------ */
/* 4 · Before / after                                                  */
/* ------------------------------------------------------------------ */
{
  const s = createSlide(
    'CORE',
    'Before / after',
    [
      'Left: our dashboard as it looks today — a faithful recreation of my actual account. It works, but it is not telling me much, and every box looks a little different.',
      'Right: the same screen, same account, same numbers — rebuilt in the sandbox. Every card comes from one shared kit of parts.',
      'This is the only jargon today: a design system is a shared kit of parts plus a rulebook. Build every screen from the same kit and everything matches, automatically.',
      'DO: if the room leans in, Cmd-Tab to the logged-in UAT tab for ten seconds — "this is the real product, live, compare for yourself" — then back.',
    ].join('\n\n'),
  );
  addTitleBlock(s, 'Before / after', 'Our dashboard today vs. the sandbox.', null);
  addScreenshot(s, A.uatBefore, 0.62, 2.1, 5.95, 3.75, 'Current dashboard, recreated from UAT', {
    mode: 'contain', label: 'TODAY — RECREATED FROM UAT', labelWidth: 2.5,
  });
  addScreenshot(s, A.dashboardLight, 6.78, 2.1, 5.95, 3.75, 'The same dashboard rebuilt in the sandbox', {
    mode: 'crop', focusY: 0, label: 'THE SANDBOX — SAME ACCOUNT', labelWidth: 2.5,
  });
  addText(
    s,
    'Same account, same numbers. The right side is live, running software — every card comes from one shared kit of parts.',
    0.62, 6.15, 12.1, 0.3,
    { fontSize: 11.5, color: C.muted, align: 'center' },
  );
}

/* ------------------------------------------------------------------ */
/* 5 · Video cue                                                       */
/* ------------------------------------------------------------------ */
{
  const s = createSlide(
    'DARK',
    'The film',
    [
      'Before I start clicking around, here is the whole story in 75 seconds.',
      'DO: play the reel MP4 from the desktop, full-screen. When it ends, pause a beat before speaking. Fallback: the /reel tab shows the same cards live — arrow through them.',
    ].join('\n\n'),
  );
  addText(s, 'THE FILM', 0.9, 2.5, 4, 0.3, {
    fontSize: 11, bold: true, color: C.primaryBright, charSpacing: 2,
  });
  addText(s, '75 seconds.', 0.86, 2.95, 11.6, 1.2, {
    fontSize: 60, bold: true, color: C.inkText, valign: 'top',
  });
  addText(s, 'The whole story, before we go hands-on.', 0.9, 4.35, 10, 0.4, {
    fontSize: 16, color: C.inkMuted,
  });
}

/* ------------------------------------------------------------------ */
/* 6 · What it is / what it isn't                                      */
/* ------------------------------------------------------------------ */
{
  const s = createSlide(
    'CORE',
    'What this is — and what it isn’t',
    [
      'IT IS: a working prototype environment — 171 real screens on the same technology our product uses. One shared kit of parts behind all of them. Live on the web right now — click it after this call.',
      'IT ISN’T: a rewrite — nothing changes for customers tomorrow. Not connected to real data — pretend data, on purpose, so nothing can break. Not a second system to maintain forever — the plan is to fold the good parts into LiquidSky, and I will show you how.',
    ].join('\n\n'),
  );
  addTitleBlock(s, 'Scope', 'What this is — and what it isn’t.', null);
  const isItems = [
    ['A working prototype environment', '171 real screens, on the same technology our product uses.'],
    ['One shared kit of parts', 'Every screen draws from the same components and rules.'],
    ['Live on the web, right now', 'Every one of you can click through it after this call.'],
  ];
  const isntItems = [
    ['A rewrite of our product', 'Nothing changes for customers tomorrow.'],
    ['Connected to real data', 'Everything is pretend data — on purpose, so nothing can break.'],
    ['A second system to maintain', 'The good parts converge into LiquidSky, our shared foundation.'],
  ];
  addCard(s, 0.56, 1.9, 6.0, 4.75, { fill: C.surface, line: C.border });
  addPill(s, 'IT IS', 0.85, 2.2, 1.2, { fill: C.successSoft, color: C.success, fontSize: 10.5 });
  isItems.forEach(([title, body], i) => {
    const y = 2.85 + i * 1.2;
    addCircle(s, 0.9, y + 0.02, 0.26, C.successSoft);
    addText(s, '✓', 0.9, y + 0.01, 0.26, 0.26, { fontSize: 11, bold: true, color: C.success, align: 'center' });
    addText(s, title, 1.32, y - 0.04, 5.0, 0.28, { fontSize: 13.5, bold: true });
    addText(s, body, 1.32, y + 0.26, 5.0, 0.55, { fontSize: 10.8, color: C.muted, valign: 'top' });
  });
  addCard(s, 6.78, 1.9, 6.0, 4.75, { fill: C.surface, line: C.border });
  addPill(s, 'IT ISN’T', 7.07, 2.2, 1.35, { fill: C.errorSoft, color: C.error, fontSize: 10.5 });
  isntItems.forEach(([title, body], i) => {
    const y = 2.85 + i * 1.2;
    addCircle(s, 7.12, y + 0.02, 0.26, C.errorSoft);
    addText(s, '✕', 7.12, y + 0.01, 0.26, 0.26, { fontSize: 11, bold: true, color: C.error, align: 'center' });
    addText(s, title, 7.54, y - 0.04, 5.0, 0.28, { fontSize: 13.5, bold: true });
    addText(s, body, 7.54, y + 0.26, 5.0, 0.55, { fontSize: 10.8, color: C.muted, valign: 'top' });
  });
}

/* ------------------------------------------------------------------ */
/* 7 · The numbers                                                     */
/* ------------------------------------------------------------------ */
{
  const s = createSlide(
    'CORE',
    'The numbers',
    [
      '89 shared components — the parts in the kit. 84 fully documented. 171 screens built from those parts. 297 design decisions — every color, every spacing size — written down once, in one place. Two complete themes from one switch.',
      'These are not estimates; they are counted from the actual project. If the count changes, this slide changes.',
    ].join('\n\n'),
  );
  addTitleBlock(s, 'Current state', 'What’s in the sandbox today.', null);
  const stats = [
    ['89', 'shared components', 'the parts in the kit'],
    ['84', 'documented parts', 'each with its own instruction page'],
    ['171', 'real screens', 'built from the same kit'],
    ['297', 'design decisions', 'written down once, used everywhere'],
    ['2', 'complete themes', 'light and dark, from one switch'],
  ];
  const cardW = 2.32;
  stats.forEach(([num, label, sub], i) => {
    const x = 0.56 + i * (cardW + 0.15);
    addCard(s, x, 2.35, cardW, 2.6, { fill: C.surface, line: C.border, shadow: true });
    addText(s, num, x + 0.15, 2.75, cardW - 0.3, 0.85, {
      fontSize: 44, bold: true, color: C.primary, align: 'center',
    });
    addText(s, label, x + 0.15, 3.7, cardW - 0.3, 0.3, {
      fontSize: 12.5, bold: true, align: 'center',
    });
    addText(s, sub, x + 0.18, 4.02, cardW - 0.36, 0.6, {
      fontSize: 9.8, color: C.muted, align: 'center', valign: 'top',
    });
  });
  addCard(s, 3.42, 5.5, 6.5, 0.62, { fill: C.surfaceBlue, line: C.surfaceBlue });
  addText(s, 'Counted from the project — not estimated. If the count changes, this slide changes.', 3.62, 5.5, 6.1, 0.62, {
    fontSize: 11.5, bold: true, color: C.primaryDark, align: 'center',
  });
}

/* ------------------------------------------------------------------ */
/* 8 · Demo map                                                        */
/* ------------------------------------------------------------------ */
{
  const s = createSlide(
    'CORE',
    'Live demo map',
    [
      'Now the part I actually came here to do. Five screens, all live. Ten seconds on this map, then switch to the browser.',
      'Demo rules: open and close things freely — never save, never delete. If a screen misbehaves: "I’ll come back to that one," move on. Every stop has a backup screenshot in the appendix.',
      'Stop 1 Dashboard (3 min): drag a widget, change the date range. "Notice how calm it is — three hundred tiny decisions made once."',
      'Stop 2 Sales Orders (4 min): tabs, search, filter panel, tick a row for the bulk bar. "Learn this screen once and you know half the product."',
      'Stop 3 Contact detail (2 min): open Edit, close it. "One way to edit things, not thirty."',
      'Stop 4 Journey builder (3 min): click a node. "A canvas, not a table — same kit underneath. Same family, different room."',
      'Stop 5 Da Vinci (2 min), then THE FINALE: press D — the whole app flips dark. Pause. Press L. "297 written-down decisions flipping at once. One change, every screen updates."',
    ].join('\n\n'),
  );
  addTitleBlock(s, 'Live demo', 'Five screens, all live.', 'Switching to the browser — everything real, pretend data.');
  const stops = [
    ['Dashboard', 'The calm version of our busiest screen.'],
    ['Sales Orders', 'Learn one list screen, know half the product.'],
    ['Contact detail', 'One way to edit things — not thirty.'],
    ['Journey builder', 'Same family, different room.'],
    ['Da Vinci + the flip', 'One keypress: every screen changes its clothes.'],
  ];
  const cardW = 2.32;
  stops.forEach(([title, body], i) => {
    const x = 0.56 + i * (cardW + 0.15);
    addCard(s, x, 2.5, cardW, 2.85, { fill: C.surface, line: C.border, shadow: true });
    addNumberBadge(s, i + 1, x + 0.18, 2.72, { size: 0.38 });
    addText(s, title, x + 0.18, 3.35, cardW - 0.36, 0.55, {
      fontSize: 14.5, bold: true, valign: 'top',
    });
    addText(s, body, x + 0.18, 4.0, cardW - 0.36, 1.1, {
      fontSize: 10.8, color: C.muted, valign: 'top',
    });
    if (i < stops.length - 1) {
      addText(s, '→', x + cardW + 0.005, 3.7, 0.15, 0.3, { fontSize: 13, color: C.faint, align: 'center' });
    }
  });
  addText(
    s,
    'Rules of the road: open and close anything — never save, never delete. Backup screenshots of every stop live in the appendix.',
    0.56, 5.75, 12.2, 0.3,
    { fontSize: 11, color: C.faint, align: 'center' },
  );
}

/* ------------------------------------------------------------------ */
/* 9 · Five layers                                                     */
/* ------------------------------------------------------------------ */
{
  const s = createSlide(
    'CORE',
    'How it’s built',
    [
      'Five layers, bottom to top. Decisions: every color and spacing size, written down once. Parts: buttons, fields, cards — built from those decisions. Patterns: bigger assemblies like page headers and toolbars. Page recipes: list pages, detail pages. Product areas: dashboards and builders — own layouts, same foundations.',
      'Change a decision at the bottom and it flows up through everything. That is what you saw in the dark-mode flip.',
    ].join('\n\n'),
  );
  addTitleBlock(s, 'How it’s built', 'Five layers, from decisions to screens.', null);
  const layers = [
    ['5 · Product areas', 'Dashboards, builders — their own layouts, on the same foundations', 7.6],
    ['4 · Page recipes', 'A list page, a detail page — assembled from the patterns', 8.8],
    ['3 · Patterns', 'Page headers, search-and-filter bars — snapped together from parts', 10.0],
    ['2 · Parts', '89 components: buttons, fields, cards, tables', 11.2],
    ['1 · Decisions', '297 values: every color, size, and spacing — written down once', 12.4],
  ];
  layers.forEach(([title, body], i) => {
    const y = 1.95 + i * 0.92;
    const w = layers[i][2];
    const x = 0.56 + (12.4 - w) / 2;
    const isBase = i === layers.length - 1;
    addCard(s, x, y, w, 0.78, {
      fill: isBase ? C.primary : C.surface,
      line: isBase ? C.primary : C.border,
      shadow: isBase,
    });
    addText(s, title, x + 0.25, y + 0.1, 2.9, 0.26, {
      fontSize: 13, bold: true, color: isBase ? C.surface : C.text,
    });
    addText(s, body, x + 0.25, y + 0.38, w - 0.5, 0.3, {
      fontSize: 10.5, color: isBase ? C.surfaceBlue : C.muted,
    });
  });
  addText(s, 'Change a decision at the bottom → it flows up through everything. That’s the dark-mode flip you just watched.', 0.56, 6.6, 12.2, 0.3, {
    fontSize: 11.5, bold: true, color: C.primaryDark, align: 'center',
  });
}

/* ------------------------------------------------------------------ */
/* 10 · Documentation                                                  */
/* ------------------------------------------------------------------ */
{
  const s = createSlide(
    'CORE',
    'Documentation',
    [
      'Every part in the kit has its own instruction page: what it is for, when to use it, when not to.',
      'The clever bit: the page renders the actual part — the same one the screens use — not a drawing of it. So the documentation physically cannot go out of date.',
      'House rule: if a part has no instruction page, it does not exist yet.',
    ].join('\n\n'),
  );
  addTitleBlock(s, 'Documentation', 'Every part comes with instructions.', null);
  const points = [
    ['A page per part', 'What it’s for, when to use it — and when not to.'],
    ['It can’t go stale', 'The page renders the actual part, not a drawing of it. If the part changes, the page changes.'],
    ['The house rule', 'No instruction page, no component. 84 of 89 parts are fully documented today.'],
  ];
  points.forEach(([title, body], i) => {
    const y = 2.3 + i * 1.36;
    addCard(s, 0.56, y, 4.9, 1.16, { fill: C.surface, line: C.border });
    addNumberBadge(s, i + 1, 0.76, y + 0.18, { size: 0.32 });
    addText(s, title, 1.26, y + 0.13, 4.0, 0.27, { fontSize: 13.5, bold: true });
    addText(s, body, 1.26, y + 0.43, 4.0, 0.62, { fontSize: 10.6, color: C.muted, valign: 'top' });
  });
  addScreenshot(s, A.storybook, 5.85, 2.15, 6.9, 4.3, 'Component documentation: the MpPageHeader instruction page', {
    mode: 'crop', focusY: 0, label: 'THE INSTRUCTION MANUAL', labelWidth: 2.2,
  });
}

/* ------------------------------------------------------------------ */
/* 11 · Why this matters                                               */
/* ------------------------------------------------------------------ */
{
  const s = createSlide(
    'CORE',
    'Why this matters',
    [
      'What all of it buys you, whatever your role: an idea can become a clickable prototype in a day, because the parts already exist.',
      'Instead of debating a static picture in a meeting, you click a link on your own laptop and try the real flow.',
      'I can vouch for this personally — this sandbox was built exactly that way.',
    ].join('\n\n'),
  );
  addTitleBlock(s, 'Why this matters', 'An idea becomes clickable in a day.', null);
  const loops = [
    ['Try', 'A new screen is clickable in a day — the parts already exist, so building a prototype is assembly, not construction.'],
    ['Review', 'Every change gets a private web link. You click the real flow on your own laptop — not a picture in a meeting.'],
    ['Build', 'Engineers start from a working reference they can copy, instead of a mockup they have to interpret.'],
  ];
  loops.forEach(([title, body], i) => {
    const x = 0.56 + i * 4.18;
    addCard(s, x, 2.4, 3.9, 2.7, { fill: C.surface, line: C.border, shadow: true });
    addText(s, title, x + 0.3, 2.75, 3.3, 0.45, { fontSize: 21, bold: true, color: C.primary });
    addText(s, body, x + 0.3, 3.35, 3.3, 1.5, { fontSize: 12, color: C.muted, valign: 'top' });
  });
  addCard(s, 2.42, 5.55, 8.5, 0.62, { fill: C.surfaceBlue, line: C.surfaceBlue });
  addText(s, 'This sandbox — all 171 screens of it — was built exactly this way.', 2.62, 5.55, 8.1, 0.62, {
    fontSize: 12, bold: true, color: C.primaryDark, align: 'center',
  });
}

/* ------------------------------------------------------------------ */
/* 12 · The plan                                                       */
/* ------------------------------------------------------------------ */
{
  const s = createSlide(
    'CORE',
    'The plan',
    [
      'The plan is deliberately boring — that is a compliment.',
      'Step 1: compatibility review — two named people sort every part into four buckets: use LiquidSky’s version, wrap it, contribute ours, or keep it local. About two weeks.',
      'Step 2: pilot the low-risk parts. Step 3: one full page — Sales Orders — built the new way in the real product. Step 4: area by area, at the pace the evidence supports.',
      'No dates on this slide, deliberately. Anyone quoting a migration date before the pilots is guessing. The pilots turn my guesses into numbers you can hold me to.',
    ].join('\n\n'),
  );
  addTitleBlock(s, 'Implementation plan', 'Converge into LiquidSky — step by step.', null);
  const steps = [
    ['Compatibility review', 'Two named people sort every part: use as-is, wrap, contribute, or keep local. About two weeks.'],
    ['Pilot the safe parts', 'Start with the simple, self-contained pieces — headers, dialogs, empty states.'],
    ['One full page', 'Sales Orders, built the new way inside the real product.'],
    ['Area by area', 'Adopt at the pace the evidence supports. Shell last.'],
  ];
  steps.forEach(([title, body], i) => {
    const x = 0.56 + i * 3.13;
    addCard(s, x, 2.3, 2.95, 2.55, { fill: C.surface, line: C.border });
    addPill(s, String(i + 1).padStart(2, '0'), x + 0.2, 2.5, 0.55, {
      fill: C.surfaceBlue, color: C.primaryDark, fontSize: 10, h: 0.28,
    });
    addText(s, title, x + 0.2, 2.95, 2.55, 0.5, { fontSize: 13.5, bold: true, valign: 'top' });
    addText(s, body, x + 0.2, 3.5, 2.55, 1.2, { fontSize: 10.6, color: C.muted, valign: 'top' });
    if (i < steps.length - 1) {
      addText(s, '→', x + 2.95, 3.4, 0.2, 0.3, { fontSize: 14, color: C.faint, align: 'center' });
    }
  });
  addCard(s, 1.92, 5.35, 9.5, 0.85, { fill: C.surface, line: C.borderStrong });
  addText(s, 'No dates on this slide — deliberately.', 2.22, 5.5, 8.9, 0.28, {
    fontSize: 13, bold: true,
  });
  addText(s, 'The two pilots turn guesses into numbers you can hold me to. I’d rather be accurate than fast.', 2.22, 5.78, 8.9, 0.26, {
    fontSize: 11, color: C.muted,
  });
}

/* ------------------------------------------------------------------ */
/* 13 · Six asks                                                       */
/* ------------------------------------------------------------------ */
{
  const s = createSlide(
    'CORE',
    'Six asks',
    [
      'What I need from this room today — six decisions, none of which cost budget or headcount this quarter.',
      'Walk through them one by one. Number six is me volunteering a constraint: one shared foundation, no second one.',
    ].join('\n\n'),
  );
  addTitleBlock(s, 'Decisions I need today', 'Six asks — none need budget this quarter.', null);
  const asks = [
    ['Sign off on the direction', 'The look and behavior you saw today becomes our agreed direction.'],
    ['Make this the shared reference', 'When we discuss design, the sandbox and its docs are what we point at.'],
    ['Two names for the review', 'One LiquidSky maintainer + one product engineer, for the two-week review.'],
    ['Access to LiquidSky', 'The repository and its normal contribution process.'],
    ['Approve the two pilots', 'The safe parts first, then the Sales Orders page.'],
    ['No second library — ever', 'Nothing ships from the sandbox as a separate package. One foundation.'],
  ];
  asks.forEach(([title, body], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.56 + col * 4.18;
    const y = 2.2 + row * 2.15;
    addCard(s, x, y, 3.9, 1.9, { fill: C.surface, line: C.border, shadow: true });
    addNumberBadge(s, i + 1, x + 0.22, y + 0.22, { size: 0.36 });
    addText(s, title, x + 0.75, y + 0.2, 3.0, 0.42, { fontSize: 13.2, bold: true, valign: 'top' });
    addText(s, body, x + 0.22, y + 0.75, 3.45, 1.0, { fontSize: 10.8, color: C.muted, valign: 'top' });
  });
}

/* ------------------------------------------------------------------ */
/* 14 · Q&A                                                            */
/* ------------------------------------------------------------------ */
{
  const s = createSlide(
    'DARK',
    'Q&A',
    [
      'Keep the FAQ crib sheet within reach (docs/design-system/showcase-faq-crib-sheet.md).',
      'If the room is quiet, open with: "The question I’d be asking in your seats is: aren’t we building everything twice? Let me answer that one first, because it’s fair." (Crib sheet #21.)',
      'Parking-lot phrase: "Great question — I don’t want to hand-wave it. Let me take it into the compatibility review and come back with evidence instead of adjectives."',
    ].join('\n\n'),
  );
  addText(s, 'OVER TO YOU', 0.9, 2.6, 4, 0.3, {
    fontSize: 11, bold: true, color: C.primaryBright, charSpacing: 2,
  });
  addText(s, 'Questions.', 0.86, 3.05, 11.6, 1.2, {
    fontSize: 60, bold: true, color: C.inkText, valign: 'top',
  });
  addText(s, 'Ask me the hard ones — they’re the reason we’re all here.', 0.9, 4.45, 10, 0.4, {
    fontSize: 16, color: C.inkMuted,
  });
}

/* ------------------------------------------------------------------ */
/* 15 · Close                                                          */
/* ------------------------------------------------------------------ */
{
  const s = createSlide(
    'CORE',
    'Close',
    [
      'Everything I showed you is live right now. The sandbox stays open — go click the things I did not get to.',
      'Try to break it: it is pretend data, you cannot hurt anything.',
      'DO: drop the sandbox link in the meeting chat, and leave this slide up while people drop off.',
    ].join('\n\n'),
  );
  addTitleBlock(s, 'Keep clicking', 'Everything you saw is live.', null);
  const links = [
    ['The sandbox', 'Link in the meeting chat — every screen from today’s demo.'],
    ['The component wall', '/showcase — all 89 parts on one page.'],
    ['The instruction manual', 'Storybook — every part’s documentation, live.'],
  ];
  links.forEach(([title, body], i) => {
    const y = 2.3 + i * 1.15;
    addCard(s, 0.56, y, 12.2, 0.95, { fill: C.surface, line: C.border });
    addText(s, title, 0.92, y + 0.16, 3.6, 0.3, { fontSize: 15, bold: true, color: C.primary });
    addText(s, body, 4.7, y + 0.16, 7.8, 0.6, { fontSize: 12, color: C.muted, valign: 'top' });
  });
  addCard(s, 3.17, 6.0, 7.0, 0.62, { fill: C.surfaceBlue, line: C.surfaceBlue });
  addText(s, 'Pretend data — you can’t break anything. Please try.', 3.37, 6.0, 6.6, 0.62, {
    fontSize: 12.5, bold: true, color: C.primaryDark, align: 'center',
  });
  addText(s, 'Thank you.', 0.56, 6.0, 2.4, 0.62, { fontSize: 13, bold: true, color: C.faint });
}

/* ------------------------------------------------------------------ */
/* Appendix — demo fallback screenshots                                */
/* ------------------------------------------------------------------ */
const fallbackSlides = [
  ['Stop 1 · Dashboard', A.dashboardLight, 'Dashboard — KPI cards, chart, setup guide, all from the shared kit'],
  ['Stop 2 · Sales Orders', A.orders, 'Sales Orders — the list pattern: tabs, search, filters, bulk actions'],
  ['Stop 3 · Contact detail', A.contact, 'Contact detail — shared header, facts left, activity right'],
  ['Stop 4 · Journey builder', A.journey, 'Journey builder — a canvas, same parts underneath'],
  ['Stop 5 · Da Vinci', A.davinci, 'Da Vinci — the AI surface on the same foundations'],
];

fallbackSlides.forEach(([title, asset, alt]) => {
  const s = createSlide(
    'APPENDIX',
    `Appendix · ${title}`,
    'Demo fallback: narrate over this screenshot if the live demo misbehaves. Captured from the running sandbox on 2026-07-20.',
  );
  addTitleBlock(s, 'Demo fallback', title, 'Captured live from the sandbox — July 20, 2026.');
  addScreenshot(s, asset, 1.77, 2.05, 9.8, 4.55, alt, { mode: 'contain' });
});

{
  const s = createSlide(
    'APPENDIX',
    'Appendix · The theme flip',
    'Demo fallback for the finale: the same dashboard in light and dark. One keypress, 297 written-down decisions flip at once — no screen is special-cased.',
  );
  addTitleBlock(s, 'Demo fallback', 'The theme flip — one change, every screen.', 'Same screen, same data. 297 decisions flip to their dark values at once.');
  addScreenshot(s, A.dashboardLight, 0.62, 2.15, 5.95, 3.75, 'Dashboard in light theme', {
    mode: 'crop', focusY: 0, label: 'LIGHT', labelWidth: 0.95,
  });
  addScreenshot(s, A.dashboardDark, 6.78, 2.15, 5.95, 3.75, 'Dashboard in dark theme', {
    mode: 'crop', focusY: 0, label: 'DARK', labelWidth: 0.95,
  });
}

/* ------------------------------------------------------------------ */

async function main() {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  await pptx.writeFile({ fileName: OUTPUT, compression: true });
  console.log(`Wrote ${OUTPUT}`);
  console.log(`Slides: ${slideTitles.length} (${notesCount} with speaker notes)`);
  slideTitles.forEach((t, i) => console.log(`  ${String(i + 1).padStart(2)} · ${t}`));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
