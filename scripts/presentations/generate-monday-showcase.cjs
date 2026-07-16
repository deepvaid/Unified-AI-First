#!/usr/bin/env node
'use strict';

/**
 * Reproducible generator for the Monday design-sandbox showcase.
 *
 * PowerPoint tooling intentionally lives outside the application:
 *   mkdir -p /tmp/monday-showcase-pptx-tools
 *   npm --prefix /tmp/monday-showcase-pptx-tools init -y
 *   npm --prefix /tmp/monday-showcase-pptx-tools install --save-exact pptxgenjs@4.0.1
 *   node scripts/presentations/generate-monday-showcase.cjs
 *
 * Override the module location when needed:
 *   PPTXGENJS_PATH=/another/temp/node_modules/pptxgenjs node scripts/presentations/generate-monday-showcase.cjs
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
const AFTER = path.join(ROOT, 'docs/design-system/evolution/after');
const BEFORE = path.join(ROOT, 'docs/design-system/evolution/before');
const OUTPUT = path.join(ROOT, 'docs/presentations/monday-design-sandbox-showcase.pptx');

const W = 13.333;
const H = 7.5;
const FONT = 'Inter';
const MONO = 'JetBrains Mono';

const C = {
  bg: 'F4F6FA',
  surface: 'FFFFFF',
  surfaceAlt: 'EEF0F4',
  surfaceBlue: 'EBF8FE',
  primary: '0073AB',
  primaryDark: '005E8A',
  primaryBright: '2CC4FF',
  text: '1A1814',
  muted: '5A6573',
  faint: '87919E',
  border: 'E2E8F0',
  borderStrong: 'D4D4D4',
  ink: '1A1814',
  inkSoft: '26231E',
  inkText: 'F7F5F2',
  inkMuted: 'B8B2A7',
  success: '1A7F54',
  successSoft: 'D6F0E2',
  warning: 'A8630F',
  warningSoft: 'FBE7C8',
  error: 'C0392B',
  errorSoft: 'FBE1DC',
  violet: '6D28D9',
  violetSoft: 'EDE9FE',
  ai: '2563EB',
  aiSoft: 'EBF2FE',
};

const A = {
  dashboardLight: path.join(AFTER, 'dashboard-home--1440--light.png'),
  dashboardLight820: path.join(AFTER, 'dashboard-home--820--light.png'),
  dashboardDark: path.join(AFTER, 'dashboard-home--1440--dark.png'),
  marketing: path.join(AFTER, 'marketing-landing--1440--light.png'),
  sales: path.join(AFTER, 'sales-orders--1440--light.png'),
  sales820: path.join(AFTER, 'sales-orders--820--light.png'),
  salesDark: path.join(AFTER, 'sales-orders--1440--dark.png'),
  salesBefore: path.join(BEFORE, 'sales-orders--1440--light.png'),
  contacts: path.join(AFTER, 'all-contacts--1440--light.png'),
  contactLists: path.join(AFTER, 'contact-lists--1440--light.png'),
  campaigns: path.join(AFTER, 'email-campaigns--1440--light.png'),
  products: path.join(AFTER, 'products-list--1440--light.png'),
  orderDetail: path.join(AFTER, 'order-detail--1440--light.png'),
  settings: path.join(AFTER, 'settings-general--1440--light.png'),
  journey: path.join(AFTER, 'journey-builder--1440--light.png'),
  ai: path.join(AFTER, 'da-vinci-experience--1440--light.png'),
};

for (const [name, assetPath] of Object.entries(A)) {
  if (!fs.existsSync(assetPath)) {
    throw new Error(`Missing curated asset "${name}": ${assetPath}`);
  }
}

pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Maropost Product Design';
pptx.company = 'Maropost';
pptx.subject = 'Approved visual direction and LiquidSky convergence strategy';
pptx.title = 'From sandbox to shared product system';
pptx.lang = 'en-US';
pptx.theme = {
  headFontFace: FONT,
  bodyFontFace: FONT,
};
pptx.defineLayout({ name: 'MONDAY_WIDE', width: W, height: H });
pptx.layout = 'MONDAY_WIDE';

pptx.defineSlideMaster({
  title: 'COVER',
  background: { color: C.bg },
  objects: [
    {
      text: {
        text: 'MAROPOST  /  DESIGN SANDBOX',
        options: {
          x: 0.58,
          y: 7.12,
          w: 3.4,
          h: 0.16,
          margin: 0,
          fontFace: FONT,
          fontSize: 8.5,
          bold: true,
          color: C.muted,
          charSpacing: 1.4,
        },
      },
    },
  ],
  slideNumber: {
    x: 12.34,
    y: 7.1,
    w: 0.42,
    h: 0.18,
    margin: 0,
    fontFace: FONT,
    fontSize: 9,
    bold: true,
    color: C.muted,
    align: 'right',
  },
});

pptx.defineSlideMaster({
  title: 'CORE',
  background: { color: C.bg },
  objects: [
    {
      rect: {
        x: 0.56,
        y: 0.35,
        w: 0.25,
        h: 0.045,
        line: { color: C.primary, transparency: 100 },
        fill: { color: C.primary },
      },
    },
    {
      line: {
        x: 0.56,
        y: 7.02,
        w: 12.2,
        h: 0,
        line: { color: C.border, width: 0.8 },
      },
    },
    {
      text: {
        text: 'MAROPOST  /  DESIGN SANDBOX',
        options: {
          x: 0.56,
          y: 7.11,
          w: 3.3,
          h: 0.14,
          margin: 0,
          fontFace: FONT,
          fontSize: 8.5,
          bold: true,
          color: C.muted,
          charSpacing: 1.2,
        },
      },
    },
    {
      text: {
        text: 'MONDAY SHOWCASE',
        options: {
          x: 9.65,
          y: 7.11,
          w: 2.3,
          h: 0.14,
          margin: 0,
          fontFace: FONT,
          fontSize: 8.5,
          bold: true,
          color: C.faint,
          charSpacing: 1.1,
          align: 'right',
        },
      },
    },
  ],
  slideNumber: {
    x: 12.34,
    y: 7.09,
    w: 0.42,
    h: 0.18,
    margin: 0,
    fontFace: FONT,
    fontSize: 9,
    bold: true,
    color: C.muted,
    align: 'right',
  },
});

pptx.defineSlideMaster({
  title: 'DARK',
  background: { color: C.ink },
  objects: [
    {
      rect: {
        x: 0.56,
        y: 0.35,
        w: 0.25,
        h: 0.045,
        line: { color: C.primaryBright, transparency: 100 },
        fill: { color: C.primaryBright },
      },
    },
    {
      line: {
        x: 0.56,
        y: 7.02,
        w: 12.2,
        h: 0,
        line: { color: '403C35', width: 0.8 },
      },
    },
    {
      text: {
        text: 'MAROPOST  /  DESIGN SANDBOX',
        options: {
          x: 0.56,
          y: 7.11,
          w: 3.3,
          h: 0.14,
          margin: 0,
          fontFace: FONT,
          fontSize: 8.5,
          bold: true,
          color: C.inkMuted,
          charSpacing: 1.2,
        },
      },
    },
    {
      text: {
        text: 'MONDAY SHOWCASE',
        options: {
          x: 9.65,
          y: 7.11,
          w: 2.3,
          h: 0.14,
          margin: 0,
          fontFace: FONT,
          fontSize: 8.5,
          bold: true,
          color: C.inkMuted,
          charSpacing: 1.1,
          align: 'right',
        },
      },
    },
  ],
  slideNumber: {
    x: 12.34,
    y: 7.09,
    w: 0.42,
    h: 0.18,
    margin: 0,
    fontFace: FONT,
    fontSize: 9,
    bold: true,
    color: C.inkMuted,
    align: 'right',
  },
});

pptx.defineSlideMaster({
  title: 'APPENDIX',
  background: { color: C.bg },
  objects: [
    {
      rect: {
        x: 0.56,
        y: 0.35,
        w: 0.25,
        h: 0.045,
        line: { color: C.violet, transparency: 100 },
        fill: { color: C.violet },
      },
    },
    {
      line: {
        x: 0.56,
        y: 7.02,
        w: 12.2,
        h: 0,
        line: { color: C.border, width: 0.8 },
      },
    },
    {
      text: {
        text: 'APPENDIX  /  MONDAY SHOWCASE',
        options: {
          x: 0.56,
          y: 7.11,
          w: 3.3,
          h: 0.14,
          margin: 0,
          fontFace: FONT,
          fontSize: 8.5,
          bold: true,
          color: C.muted,
          charSpacing: 1.2,
        },
      },
    },
  ],
  slideNumber: {
    x: 12.34,
    y: 7.09,
    w: 0.42,
    h: 0.18,
    margin: 0,
    fontFace: FONT,
    fontSize: 9,
    bold: true,
    color: C.muted,
    align: 'right',
  },
});

const imageSizeCache = new Map();
let coreSlides = 0;
let appendixSlides = 0;
let notesCount = 0;
const slideTitles = [];

function addText(slide, value, x, y, w, h, options = {}) {
  slide.addText(value, {
    x,
    y,
    w,
    h,
    margin: 0,
    fontFace: FONT,
    fontSize: 18,
    color: C.text,
    breakLine: false,
    fit: 'shrink',
    valign: 'mid',
    ...options,
  });
}

function addRect(slide, x, y, w, h, options = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    line: { color: C.border, width: 0.9 },
    fill: { color: C.surface },
    ...options,
  });
}

function addLine(slide, x, y, w, h, options = {}) {
  slide.addShape(pptx.ShapeType.line, {
    x,
    y,
    w,
    h,
    line: { color: C.borderStrong, width: 1.2, ...options },
  });
}

function addCircle(slide, x, y, d, fill, line = fill) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x,
    y,
    w: d,
    h: d,
    line: { color: line, width: 0.8 },
    fill: { color: fill },
  });
}

function addPill(slide, label, x, y, w, options = {}) {
  const {
    fill = C.surfaceBlue,
    color = C.primaryDark,
    line = fill,
    fontSize = 10.5,
    bold = true,
    h = 0.3,
    align = 'center',
  } = options;
  addRect(slide, x, y, w, h, {
    line: { color: line, width: 0.8 },
    fill: { color: fill },
  });
  addText(slide, label, x + 0.08, y, w - 0.16, h, {
    fontSize,
    bold,
    color,
    align,
  });
}

function addCard(slide, x, y, w, h, options = {}) {
  const {
    fill = C.surface,
    line = C.border,
    radius = 0.08,
    shadow = false,
  } = options;
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: radius,
    line: { color: line, width: 0.9 },
    fill: { color: fill },
    ...(shadow
      ? {
          shadow: {
            type: 'outer',
            color: '0B3558',
            opacity: 0.08,
            blur: 1.5,
            angle: 45,
            distance: 0.5,
          },
        }
      : {}),
  });
}

function readPngSize(filePath) {
  if (imageSizeCache.has(filePath)) return imageSizeCache.get(filePath);
  const data = fs.readFileSync(filePath);
  const signature = data.subarray(1, 4).toString('ascii');
  if (signature !== 'PNG') throw new Error(`Expected PNG asset: ${filePath}`);
  const size = {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
  };
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

function addImageCrop(slide, filePath, x, y, w, h, altText, focusX = 0.5, focusY = 0.5) {
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
    x,
    y,
    w: naturalW,
    h: naturalH,
    sizing: {
      type: 'crop',
      x: cropXInches,
      y: cropYInches,
      w,
      h,
    },
    altText,
    objectName: altText,
  });
}

function addScreenshot(slide, filePath, x, y, w, h, altText, options = {}) {
  const {
    mode = 'crop',
    focusX = 0.5,
    focusY = 0.5,
    label,
    labelWidth = 1.45,
    darkLabel = false,
  } = options;

  addCard(slide, x - 0.035, y - 0.035, w + 0.07, h + 0.07, {
    fill: C.surface,
    line: C.borderStrong,
    shadow: true,
  });
  if (mode === 'contain') {
    addImageContain(slide, filePath, x, y, w, h, altText);
  } else {
    addImageCrop(slide, filePath, x, y, w, h, altText, focusX, focusY);
  }
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h,
    line: { color: C.border, width: 0.7 },
    fill: { color: C.surface, transparency: 100 },
  });
  if (label) {
    addPill(slide, label, x + 0.14, y + 0.14, labelWidth, {
      fill: darkLabel ? C.ink : C.surface,
      color: darkLabel ? C.inkText : C.text,
      line: darkLabel ? C.ink : C.border,
      fontSize: 9.5,
      h: 0.28,
    });
  }
}

function addTitleBlock(slide, kicker, title, subtitle, options = {}) {
  const {
    dark = false,
    titleW = 11.8,
    titleSize = 28,
    titleY = 0.52,
  } = options;
  addText(slide, kicker.toUpperCase(), 0.56, titleY, 3.5, 0.22, {
    fontSize: 9.5,
    bold: true,
    color: dark ? C.primaryBright : C.primary,
    charSpacing: 1.4,
  });
  addText(slide, title, 0.56, titleY + 0.24, titleW, 0.5, {
    fontSize: titleSize,
    bold: true,
    color: dark ? C.inkText : C.text,
    breakLine: false,
    valign: 'top',
  });
  if (subtitle) {
    addText(slide, subtitle, 0.56, titleY + 0.74, 11.9, 0.35, {
      fontSize: 13,
      color: dark ? C.inkMuted : C.muted,
      valign: 'top',
    });
  }
}

function addNumberBadge(slide, number, x, y, options = {}) {
  const { fill = C.primary, color = C.surface, size = 0.34 } = options;
  addCircle(slide, x, y, size, fill);
  addText(slide, String(number), x, y, size, size, {
    fontSize: 11,
    bold: true,
    color,
    align: 'center',
  });
}

function addCalloutCard(slide, number, title, body, x, y, w, options = {}) {
  const {
    h = 1.05,
    fill = C.surface,
    badgeFill = C.primary,
    titleColor = C.text,
  } = options;
  addCard(slide, x, y, w, h, { fill, line: C.border });
  addNumberBadge(slide, number, x + 0.17, y + 0.18, { fill: badgeFill, size: 0.34 });
  addText(slide, title, x + 0.64, y + 0.13, w - 0.78, 0.27, {
    fontSize: 13.2,
    bold: true,
    color: titleColor,
  });
  addText(slide, body, x + 0.64, y + 0.42, w - 0.78, h - 0.53, {
    fontSize: 10.6,
    color: C.muted,
    valign: 'top',
  });
}

function addCheckRow(slide, label, x, y, w, options = {}) {
  const {
    color = C.success,
    fill = C.successSoft,
    textColor = C.text,
    detail = '',
    h = 0.52,
  } = options;
  addCard(slide, x, y, w, h, { fill: C.surface, line: C.border });
  addCircle(slide, x + 0.14, y + 0.13, 0.25, fill, fill);
  addText(slide, '✓', x + 0.14, y + 0.12, 0.25, 0.25, {
    fontSize: 10,
    bold: true,
    color,
    align: 'center',
  });
  addText(slide, label, x + 0.52, y + 0.06, detail ? w * 0.39 : w - 0.68, h - 0.12, {
    fontSize: 11.8,
    bold: true,
    color: textColor,
  });
  if (detail) {
    addText(slide, detail, x + w * 0.62, y + 0.06, w * 0.33, h - 0.12, {
      fontSize: 10,
      color: C.muted,
      align: 'right',
    });
  }
}

function addStepCard(slide, number, title, body, x, y, w, h, options = {}) {
  const { fill = C.surface, accent = C.primary, dark = false } = options;
  addCard(slide, x, y, w, h, {
    fill,
    line: dark ? '4B4740' : C.border,
  });
  addPill(slide, String(number).padStart(2, '0'), x + 0.16, y + 0.14, 0.52, {
    fill: dark ? C.primaryBright : C.surfaceBlue,
    color: dark ? C.ink : accent,
    line: dark ? C.primaryBright : C.surfaceBlue,
    fontSize: 9.5,
    h: 0.26,
  });
  addText(slide, title, x + 0.16, y + 0.48, w - 0.32, 0.3, {
    fontSize: 13.2,
    bold: true,
    color: dark ? C.inkText : C.text,
  });
  addText(slide, body, x + 0.16, y + 0.83, w - 0.32, h - 0.98, {
    fontSize: 10.4,
    color: dark ? C.inkMuted : C.muted,
    valign: 'top',
  });
}

function createCoreSlide(master, title) {
  const slide = pptx.addSlide(master);
  coreSlides += 1;
  slideTitles.push(title);
  return slide;
}

function createAppendixSlide(title) {
  const slide = pptx.addSlide('APPENDIX');
  appendixSlides += 1;
  slideTitles.push(title);
  return slide;
}

function addSpeakerNotes(slide, notes) {
  const required = ['timing', 'say', 'point', 'avoid', 'transition'];
  for (const key of required) {
    if (!notes[key]) throw new Error(`Speaker notes are missing "${key}" for slide ${slideTitles.length}.`);
  }
  slide.addNotes(
    [
      `TIMING\n${notes.timing}`,
      `SAY\n${notes.say}`,
      `POINT / DEMO\n${notes.point}`,
      `DO NOT CLAIM\n${notes.avoid}`,
      `TRANSITION\n${notes.transition}`,
    ].join('\n\n'),
  );
  notesCount += 1;
}

function addBackupNotes(slide, use, detail, transition = 'Return to the relevant discussion question.') {
  addSpeakerNotes(slide, {
    timing: 'Backup only — no planned presentation time.',
    say: use,
    point: detail,
    avoid: 'Do not turn backup material into a new commitment, date, or productivity claim.',
    transition,
  });
}

// 1 — Title
{
  const slide = createCoreSlide('COVER', 'From sandbox to shared product system.');
  slide.background = { color: C.bg };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 4.72,
    h: H,
    line: { color: C.ink, transparency: 100 },
    fill: { color: C.ink },
  });
  addPill(slide, 'MONDAY SHOWCASE  •  30 + 15', 0.62, 0.64, 2.42, {
    fill: C.inkSoft,
    color: C.primaryBright,
    line: '4A463F',
    fontSize: 9.5,
    h: 0.32,
  });
  addText(slide, 'From sandbox\nto shared\nproduct system.', 0.62, 1.31, 3.5, 2.3, {
    fontSize: 31,
    bold: true,
    color: C.inkText,
    breakLine: true,
    valign: 'top',
    paraSpaceAfterPt: 4,
  });
  addText(
    slide,
    'Approved visual direction.\nCode-first reference.\nA safe path to converge into LiquidSky.',
    0.62,
    4.05,
    3.42,
    1.1,
    {
      fontSize: 15,
      color: C.inkMuted,
      breakLine: true,
      valign: 'top',
      breakLineOnOverflow: false,
    },
  );
  addText(slide, 'PRODUCT  ×  DESIGN  ×  ENGINEERING', 0.62, 6.33, 3.42, 0.24, {
    fontSize: 8.8,
    bold: true,
    color: C.inkMuted,
    charSpacing: 1.2,
  });

  addScreenshot(
    slide,
    A.dashboardLight,
    5.08,
    0.62,
    7.65,
    3.25,
    'Dashboard overview showing KPI cards and chart hierarchy in the approved light theme.',
    { focusY: 0.08, label: 'DASHBOARD', labelWidth: 1.2 },
  );
  addScreenshot(
    slide,
    A.sales,
    5.08,
    4.14,
    3.64,
    2.48,
    'Sales Orders page showing the repeatable data-page recipe.',
    { focusY: 0.16, label: 'PAGE RECIPE', labelWidth: 1.25 },
  );
  addScreenshot(
    slide,
    A.journey,
    9.02,
    4.14,
    3.71,
    2.48,
    'Journey Builder showing a purpose-built workflow workspace.',
    { focusY: 0.5, label: 'SPECIALIZED', labelWidth: 1.25, darkLabel: true },
  );
  addSpeakerNotes(slide, {
    timing: '0:00–0:01 — 1 minute.',
    say:
      'Today is a visual and implementation-direction review. The sandbox shows the approved visual direction as a working product, and the goal is to align on how shared capabilities converge into LiquidSky without creating a competing library.',
    point:
      'Frame the three images as the range: data-heavy dashboard, repeatable list-page recipe, and specialized builder. Set the expectation that the walkthrough is visual first.',
    avoid:
      'Do not call the sandbox a production-ready package, promise a migration date, or imply that every visible surface should become shared.',
    transition: 'Start with the design principle that lets these different experiences still feel like one product.',
  });
}

// 2 — Consistency and specialization
{
  const slide = createCoreSlide('CORE', 'Consistent where it should be; purpose-built where it matters.');
  addTitleBlock(
    slide,
    'ACT 1  /  APPROVED PRODUCT DIRECTION',
    'Consistent where it should be; purpose-built where it matters.',
    'One visual language does not mean one page layout.',
  );
  addScreenshot(
    slide,
    A.contacts,
    0.62,
    1.66,
    5.95,
    4.78,
    'Contacts list demonstrating the shared list-page language.',
    { focusY: 0.15, label: 'REPEATABLE RECIPE', labelWidth: 1.55 },
  );
  addScreenshot(
    slide,
    A.journey,
    6.77,
    1.66,
    5.95,
    4.78,
    'Journey Builder demonstrating a deliberately specialized workspace.',
    { focusY: 0.5, label: 'PURPOSE-BUILT', labelWidth: 1.45, darkLabel: true },
  );
  addPill(slide, 'SAME FOUNDATIONS', 1.55, 6.55, 1.65, {
    fill: C.surfaceBlue,
    color: C.primaryDark,
    line: C.surfaceBlue,
  });
  addText(slide, 'hierarchy  •  spacing  •  status  •  fields  •  focus', 3.35, 6.55, 6.6, 0.3, {
    fontSize: 11.5,
    color: C.muted,
    align: 'center',
  });
  addPill(slide, 'RIGHT WORKSPACE', 10.1, 6.55, 1.68, {
    fill: C.violetSoft,
    color: C.violet,
    line: C.violetSoft,
  });
  addSpeakerNotes(slide, {
    timing: '0:01–0:02 — 1 minute.',
    say:
      'Consistency is applied at the correct level. Lists, reports, settings, and detail pages use repeatable recipes. Builders and editors keep purpose-built workspaces while sharing tokens, fields, status, menus, confirmation, focus, and accessibility rules.',
    point:
      'Point left to the shared list-page rhythm and right to the builder canvas. Emphasize the shared foundations along the bottom.',
    avoid:
      'Do not suggest that specialized workspaces are exceptions to quality or that the entire page should be one reusable component.',
    transition: 'Explain why the team validated this direction in running code rather than stopping at static screens.',
  });
}

// 3 — Code-first reference
{
  const slide = createCoreSlide('CORE', 'A working reference reveals what static screens hide.');
  addTitleBlock(
    slide,
    'CODE-FIRST REFERENCE',
    'A working reference reveals what static screens hide.',
    'Real density, responsive behavior, states, focus, and interaction contracts become reviewable.',
  );

  addCard(slide, 0.62, 1.72, 2.64, 4.78, { fill: C.surface, line: C.border });
  addPill(slide, 'STATIC SCREEN', 0.87, 1.98, 1.15, {
    fill: C.surfaceAlt,
    color: C.muted,
    line: C.surfaceAlt,
  });
  addRect(slide, 0.9, 2.62, 2.06, 1.38, {
    fill: 'F8FAFC',
    line: C.borderStrong,
  });
  addRect(slide, 1.08, 2.83, 0.38, 0.91, {
    fill: 'E5E7EB',
    line: 'E5E7EB',
  });
  for (let row = 0; row < 4; row += 1) {
    addLine(slide, 1.62, 2.88 + row * 0.2, 1.05, 0, { color: 'CBD5E1', width: 2 });
  }
  addText(slide, 'Looks right at one size.', 0.9, 4.38, 2.05, 0.38, {
    fontSize: 16,
    bold: true,
    color: C.text,
    align: 'center',
  });
  addText(slide, 'Behavior remains implied.', 0.9, 4.82, 2.05, 0.3, {
    fontSize: 11.2,
    color: C.muted,
    align: 'center',
  });

  addText(slide, '→', 3.36, 3.65, 0.52, 0.55, {
    fontSize: 28,
    bold: true,
    color: C.primary,
    align: 'center',
  });

  addScreenshot(
    slide,
    A.marketing,
    3.96,
    1.72,
    5.23,
    4.78,
    'Marketing landing page in the running design sandbox.',
    { focusY: 0.28, label: 'WORKING SANDBOX', labelWidth: 1.55 },
  );

  addText(slide, '→', 9.3, 3.65, 0.52, 0.55, {
    fontSize: 28,
    bold: true,
    color: C.primary,
    align: 'center',
  });

  addCard(slide, 9.92, 1.72, 2.8, 4.78, { fill: C.ink, line: C.ink });
  addPill(slide, 'REVIEWABLE EVIDENCE', 10.18, 1.98, 1.72, {
    fill: C.inkSoft,
    color: C.primaryBright,
    line: '4A463F',
  });
  const evidence = [
    ['01', 'Responsive reflow'],
    ['02', 'Content density'],
    ['03', 'Loading + error'],
    ['04', 'Keyboard + focus'],
    ['05', 'Reusable contracts'],
  ];
  evidence.forEach(([number, label], index) => {
    const y = 2.65 + index * 0.62;
    addText(slide, number, 10.18, y, 0.42, 0.27, {
      fontFace: MONO,
      fontSize: 9.5,
      bold: true,
      color: C.primaryBright,
    });
    addText(slide, label, 10.62, y - 0.01, 1.75, 0.3, {
      fontSize: 12,
      bold: true,
      color: C.inkText,
    });
    if (index < evidence.length - 1) {
      addLine(slide, 10.18, y + 0.4, 2.04, 0, { color: '403C35', width: 0.8 });
    }
  });
  addSpeakerNotes(slide, {
    timing: '0:02–0:03 — 1 minute.',
    say:
      'The sandbox is a code-first reference and acceptance environment. It exposes responsive behavior, realistic content density, loading and error states, overlay behavior, keyboard flow, and reusable APIs that static screens leave open to interpretation.',
    point:
      'Walk left to right: static intent, working sandbox, observable evidence. Mention the same general frontend stack—Vue 3, TypeScript, Vuetify, Pinia, and Vue Router.',
    avoid:
      'Do not equate high-fidelity mock behavior with production integration, permissions, analytics, or backend readiness.',
    transition: 'Now show the visual language that stays coherent across that real product density.',
  });
}

// 4 — Calm visual language
{
  const slide = createCoreSlide('CORE', 'The visual language stays calm under load.');
  addTitleBlock(
    slide,
    'VISUAL LANGUAGE',
    'The visual language stays calm under load.',
    'Hierarchy carries the page; decoration stays quiet.',
  );
  addScreenshot(
    slide,
    A.marketing,
    0.62,
    1.58,
    7.74,
    5.15,
    'Marketing landing page demonstrating hierarchy, surfaces, typography, and action placement.',
    { focusY: 0.28 },
  );
  addNumberBadge(slide, 1, 2.12, 2.43, { fill: C.primary });
  addNumberBadge(slide, 2, 5.8, 3.45, { fill: C.primary });
  addNumberBadge(slide, 3, 7.42, 5.0, { fill: C.primary });

  const principles = [
    ['01', 'Hierarchy', 'Large title, quiet support copy, obvious next action.', C.surfaceBlue, C.primaryDark],
    ['02', 'Surfaces', 'Off-white canvas, white cards, hairline separation.', C.surface, C.text],
    ['03', 'Typography', 'Inter, tight display type, readable supporting text.', C.surfaceAlt, C.text],
    ['04', 'Status', 'Restrained semantic color carries meaning—not decoration.', C.successSoft, C.success],
    ['05', 'Actions', 'Primary action is clear; secondary actions recede.', C.warningSoft, C.warning],
  ];
  principles.forEach(([number, label, body, fill, color], index) => {
    const y = 1.58 + index * 1.03;
    addCard(slide, 8.65, y, 4.07, 0.84, { fill, line: fill });
    addText(slide, number, 8.87, y + 0.14, 0.38, 0.26, {
      fontFace: MONO,
      fontSize: 9.5,
      bold: true,
      color,
    });
    addText(slide, label, 9.3, y + 0.1, 1.1, 0.27, {
      fontSize: 13,
      bold: true,
      color: C.text,
    });
    addText(slide, body, 9.3, y + 0.39, 3.05, 0.32, {
      fontSize: 10.3,
      color: C.muted,
      valign: 'top',
    });
  });
  addSpeakerNotes(slide, {
    timing: '0:03–0:05 — 2 minutes.',
    say:
      'The approved visual direction uses a calm neutral canvas, clear white surfaces, readable numbers, restrained semantic color, and decisive action placement. The hierarchy remains legible even when a page carries setup, navigation, recent activity, and AI entry points together.',
    point:
      'Use the three numbered markers on the screenshot: title and primary action, repeatable section cards, and the product-specific AI panel. Then scan the five visual principles.',
    avoid:
      'Do not describe color or spacing as purely aesthetic; connect each choice to scanning, comprehension, and action clarity.',
    transition: 'Apply those principles to the most data-heavy surface in the sandbox: the dashboard.',
  });
}

// 5 — Dashboard
{
  const slide = createCoreSlide('CORE', 'Dashboard hierarchy makes dense data readable.');
  addTitleBlock(
    slide,
    'DASHBOARD PROOF',
    'Dashboard hierarchy makes dense data readable.',
    'Metric first. Comparison second. Detail on demand.',
  );
  addScreenshot(
    slide,
    A.dashboardLight,
    0.62,
    1.48,
    9.05,
    5.26,
    'Dashboard overview cropped to the KPI, setup, and primary chart hierarchy.',
    { focusY: 0.03, label: 'APPROVED LIGHT THEME', labelWidth: 1.75 },
  );
  addNumberBadge(slide, 1, 1.95, 2.22, { fill: C.success });
  addNumberBadge(slide, 2, 6.76, 3.55, { fill: C.primary });
  addNumberBadge(slide, 3, 7.77, 5.52, { fill: C.violet });

  addCalloutCard(slide, 1, 'Metric first', 'Large values and compact comparison cues establish the scan order.', 9.92, 1.48, 2.8, {
    h: 1.33,
    badgeFill: C.success,
  });
  addCalloutCard(slide, 2, 'One widget rhythm', 'Cards share title, range, action, chart area, and source metadata.', 9.92, 3.0, 2.8, {
    h: 1.33,
    badgeFill: C.primary,
  });
  addCalloutCard(slide, 3, 'Progressive detail', 'Setup, tables, and secondary charts coexist without competing.', 9.92, 4.52, 2.8, {
    h: 1.33,
    badgeFill: C.violet,
  });
  addPill(slide, 'PRODUCT-SPECIFIC RUNTIME', 10.22, 6.17, 2.18, {
    fill: C.ink,
    color: C.inkText,
    line: C.ink,
    fontSize: 9.3,
  });
  addSpeakerNotes(slide, {
    timing: '0:05–0:07 — 2 minutes.',
    say:
      'The dashboard demonstrates the visual language at its most data-heavy: restrained surfaces, clear numbers, consistent widget framing, and room for charts to breathe. Its runtime and widget registry stay product-specific; the reusable opportunity is lower-level cards, controls, states, and tokens.',
    point:
      'Point to the KPI row, setup and primary chart region, then the lower detail region. If demonstrating live, use /accounts/2000290/dashboard and do not edit the grid.',
    avoid:
      'Do not claim the charting runtime, widget registry, or dashboard data sources belong in the shared library.',
    transition: 'Prove that the same hierarchy survives both narrower viewports and dark mode.',
  });
}

// 6 — Responsive and dark mode
{
  const slide = createCoreSlide('CORE', 'The direction holds across viewport and theme.');
  addTitleBlock(
    slide,
    'RESPONSIVE + THEME EVIDENCE',
    'The direction holds across viewport and theme.',
    'Same information priorities; different composition.',
  );
  addScreenshot(
    slide,
    A.dashboardLight,
    0.62,
    1.62,
    4.82,
    4.88,
    'Desktop dashboard in the approved light theme.',
    { focusY: 0.03, label: '1440  /  LIGHT', labelWidth: 1.27 },
  );
  addScreenshot(
    slide,
    A.dashboardLight820,
    5.7,
    1.62,
    1.92,
    4.88,
    'Responsive 820-pixel dashboard showing stacked cards and preserved hierarchy.',
    { mode: 'contain', label: '820', labelWidth: 0.72 },
  );
  addScreenshot(
    slide,
    A.dashboardDark,
    7.89,
    1.62,
    4.83,
    4.88,
    'Desktop dashboard in the approved dark theme.',
    { focusY: 0.03, label: '1440  /  DARK', labelWidth: 1.27, darkLabel: true },
  );
  addPill(slide, 'REFLOW', 1.35, 6.59, 1.08, {
    fill: C.surfaceBlue,
    color: C.primaryDark,
    line: C.surfaceBlue,
  });
  addText(slide, '→', 2.49, 6.58, 0.35, 0.28, {
    fontSize: 15,
    bold: true,
    color: C.primary,
    align: 'center',
  });
  addPill(slide, 'PRIORITY', 2.9, 6.59, 1.08, {
    fill: C.surfaceBlue,
    color: C.primaryDark,
    line: C.surfaceBlue,
  });
  addText(slide, 'Same hierarchy  •  responsive reflow  •  semantic theme parity', 4.55, 6.58, 4.35, 0.3, {
    fontSize: 11.5,
    color: C.muted,
    align: 'center',
  });
  addPill(slide, 'THEME', 9.28, 6.59, 1.02, {
    fill: C.ink,
    color: C.primaryBright,
    line: C.ink,
  });
  addText(slide, '→', 10.39, 6.58, 0.35, 0.28, {
    fontSize: 15,
    bold: true,
    color: C.primary,
    align: 'center',
  });
  addPill(slide, 'CONTRAST', 10.8, 6.59, 1.16, {
    fill: C.ink,
    color: C.primaryBright,
    line: C.ink,
  });
  addSpeakerNotes(slide, {
    timing: '0:07–0:08 — 1 minute.',
    say:
      'The approved direction is not a single desktop screenshot. At 820 pixels the content reflows and priorities remain intact. In dark mode the same semantic hierarchy, surfaces, status, and chart relationships remain readable.',
    point:
      'Scan left to right: desktop light, narrow responsive stack, desktop dark. Call out that reflow is designed, not scaled down.',
    avoid:
      'Do not claim every product-specific surface has completed accessibility certification; describe these as acceptance evidence and required review dimensions.',
    transition: 'Move from dashboard evidence to the strongest repeatable page recipe: Sales Orders.',
  });
}

// 7 — Sales Orders before/after
{
  const slide = createCoreSlide('CORE', 'Sales Orders is the flagship page recipe.');
  addTitleBlock(
    slide,
    'ONE HIGH-VALUE COMPARISON',
    'Sales Orders is the flagship page recipe.',
    'The evolution is quieter, more structured, and easier to extend.',
  );
  addScreenshot(
    slide,
    A.salesBefore,
    0.62,
    1.62,
    5.98,
    4.62,
    'Earlier Sales Orders layout before the approved grouped-row evolution.',
    { focusY: 0.16, label: 'BEFORE', labelWidth: 0.85 },
  );
  addScreenshot(
    slide,
    A.sales,
    6.76,
    1.62,
    5.96,
    4.62,
    'Approved Sales Orders layout with grouped rows and improved hierarchy.',
    { focusY: 0.16, label: 'APPROVED DIRECTION', labelWidth: 1.68 },
  );
  const changes = [
    ['01', 'Group by meaningful status'],
    ['02', 'Reduce competing chrome'],
    ['03', 'Reveal detail progressively'],
  ];
  changes.forEach(([number, label], index) => {
    const x = 0.62 + index * 4.08;
    addCard(slide, x, 6.43, 3.9, 0.42, {
      fill: index === 1 ? C.surfaceBlue : C.surface,
      line: index === 1 ? C.surfaceBlue : C.border,
    });
    addText(slide, number, x + 0.14, 6.5, 0.35, 0.24, {
      fontFace: MONO,
      fontSize: 9,
      bold: true,
      color: C.primary,
    });
    addText(slide, label, x + 0.54, 6.49, 3.1, 0.24, {
      fontSize: 10.8,
      bold: true,
      color: C.text,
    });
  });
  addSpeakerNotes(slide, {
    timing: '0:08–0:10 — 2 minutes.',
    say:
      'Sales Orders is the strongest repeatable page recipe: page header, status tabs, data toolbar, responsive table, row actions, states, and bulk action behavior. The comparison shows the approved visual direction without turning this meeting into a redesign retrospective.',
    point:
      'Use the comparison to highlight meaningful row grouping, quieter toolbar chrome, and progressive disclosure. Keep the focus on the after state.',
    avoid:
      'Do not present the entire page as one component or imply that a screenshot comparison proves the table architecture is already compatible with LiquidSky.',
    transition: 'Use the approved page to preview the live interaction sequence and the exact behaviors the pilot must protect.',
  });
}

// 8 — Sales Orders interaction sequence
{
  const slide = createCoreSlide('CORE', 'The page recipe includes interaction—not just layout.');
  addTitleBlock(
    slide,
    'LIVE DEMO CUES',
    'The page recipe includes interaction—not just layout.',
    'A safe five-step sequence demonstrates filtering, control, selection, and disclosure.',
  );
  addScreenshot(
    slide,
    A.sales,
    0.62,
    1.52,
    8.43,
    5.18,
    'Sales Orders page used for the live interaction walkthrough.',
    { focusY: 0.15 },
  );
  addPill(slide, '/commerce/2000290/orders', 0.88, 6.33, 2.35, {
    fill: C.ink,
    color: C.inkText,
    line: C.ink,
    fontSize: 9.2,
  });
  const steps = [
    ['01', 'Switch status tab', 'All Orders → Processing'],
    ['02', 'Open filter', 'Inspect, then close'],
    ['03', 'Open columns', 'Show visibility control'],
    ['04', 'Select one row', 'Reveal floating bulk bar'],
    ['05', 'Expand one order', 'Show progressive detail'],
  ];
  steps.forEach(([number, title, detail], index) => {
    const y = 1.52 + index * 1.01;
    addCard(slide, 9.35, y, 3.37, 0.82, {
      fill: index === 3 ? C.surfaceBlue : C.surface,
      line: index === 3 ? C.primary : C.border,
    });
    addText(slide, number, 9.57, y + 0.16, 0.42, 0.24, {
      fontFace: MONO,
      fontSize: 9.5,
      bold: true,
      color: C.primary,
    });
    addText(slide, title, 10.04, y + 0.1, 2.35, 0.27, {
      fontSize: 12.3,
      bold: true,
      color: C.text,
    });
    addText(slide, detail, 10.04, y + 0.39, 2.35, 0.24, {
      fontSize: 10.2,
      color: C.muted,
    });
  });
  addPill(slide, 'OPEN + CLOSE  •  NO DESTRUCTIVE ACTIONS', 9.46, 6.6, 3.16, {
    fill: C.warningSoft,
    color: C.warning,
    line: C.warningSoft,
    fontSize: 8.7,
  });
  addSpeakerNotes(slide, {
    timing: '0:10–0:12 — 2 minutes.',
    say:
      'The recipe includes interaction contracts. I will switch tabs, open and close the filter, inspect column visibility, select one row to reveal bulk actions, and expand one order for progressive detail.',
    point:
      'If live, follow the five steps in order on /commerce/2000290/orders. Prefer opening and closing controls; reload the route if seeded state changes.',
    avoid:
      'Do not trigger cancel, delete, bulk fulfillment, or any destructive action. Do not improvise deep navigation.',
    transition: 'Zoom out from one flagship page and show that the same recipe already spans product areas.',
  });
}

// 9 — One recipe
{
  const slide = createCoreSlide('CORE', 'One recipe spans Orders, Contacts, Campaigns, and Products.');
  addTitleBlock(
    slide,
    'CROSS-PRODUCT CONSISTENCY',
    'One recipe spans Orders, Contacts, Campaigns, and Products.',
    'The composition repeats; the domain behavior stays local.',
  );
  const examples = [
    ['ORDERS', A.sales, 'Commerce'],
    ['CONTACTS', A.contacts, 'Audience'],
    ['CAMPAIGNS', A.campaigns, 'Marketing'],
    ['PRODUCTS', A.products, 'Catalog'],
  ];
  examples.forEach(([label, filePath, domain], index) => {
    const x = 0.62 + index * 3.07;
    addCard(slide, x, 1.58, 2.86, 3.93, { fill: C.surface, line: C.border });
    addText(slide, label, x + 0.18, 1.78, 1.65, 0.24, {
      fontSize: 11,
      bold: true,
      color: C.text,
      charSpacing: 0.7,
    });
    addPill(slide, domain, x + 1.74, 1.73, 0.9, {
      fill: C.surfaceAlt,
      color: C.muted,
      line: C.surfaceAlt,
      fontSize: 8.7,
      h: 0.26,
    });
    addScreenshot(
      slide,
      filePath,
      x + 0.18,
      2.22,
      2.5,
      3.02,
      `${label} page showing the shared data-page recipe.`,
      { focusY: 0.18 },
    );
  });
  addCard(slide, 0.62, 5.76, 12.07, 0.9, { fill: C.ink, line: C.ink });
  const recipe = ['Page header', 'Tabs', 'Toolbar', 'Responsive table', 'States', 'Bulk actions'];
  recipe.forEach((label, index) => {
    const x = 0.87 + index * 1.94;
    addPill(slide, label, x, 6.05, 1.57, {
      fill: index === 3 ? C.primaryBright : C.inkSoft,
      color: index === 3 ? C.ink : C.inkText,
      line: index === 3 ? C.primaryBright : '4A463F',
      fontSize: 9.2,
      h: 0.3,
    });
    if (index < recipe.length - 1) {
      addText(slide, '→', x + 1.59, 6.04, 0.25, 0.3, {
        fontSize: 11,
        bold: true,
        color: C.inkMuted,
        align: 'center',
      });
    }
  });
  addSpeakerNotes(slide, {
    timing: '0:12–0:13 — 1 minute.',
    say:
      'The value is not one polished page. The same page recipe now appears across commerce, contacts, marketing, and products. The shared contract is the composition and behavior; each domain keeps its data model, permissions, actions, and state.',
    point:
      'Scan the four thumbnails, then read the recipe strip from left to right. Emphasize recipe rather than monolithic component.',
    avoid:
      'Do not claim identical tables or domain rules. Similar visual composition does not erase product-specific behavior.',
    transition: 'Show how those same foundations support a detail page with a different hierarchy.',
  });
}

// 10 — Detail hierarchy
{
  const slide = createCoreSlide('CORE', 'Detail pages share contracts without forcing one layout.');
  addTitleBlock(
    slide,
    'DETAIL-PAGE HIERARCHY',
    'Detail pages share contracts without forcing one layout.',
    'Identity, status, summary, sections, actions, and responsive priorities form the contract.',
  );
  addScreenshot(
    slide,
    A.orderDetail,
    0.62,
    1.52,
    8.18,
    5.2,
    'Order Detail page showing identity, status, summary, sections, and action hierarchy.',
    { focusY: 0.12, label: 'ORDER DETAIL', labelWidth: 1.2 },
  );
  addScreenshot(
    slide,
    A.contactLists,
    9.08,
    1.52,
    3.64,
    2.23,
    'Contact Lists page showing list identity and status evidence.',
    { focusY: 0.16, label: 'LIST EVIDENCE', labelWidth: 1.18 },
  );
  addScreenshot(
    slide,
    A.contacts,
    9.08,
    4.02,
    3.64,
    1.68,
    'Contacts page showing identity and status treatment.',
    { focusY: 0.2, label: 'CONTACT EVIDENCE', labelWidth: 1.42 },
  );
  addCard(slide, 9.08, 5.96, 3.64, 0.76, { fill: C.surfaceBlue, line: C.surfaceBlue });
  addText(slide, 'IDENTITY  →  SUMMARY  →  SECTIONS', 9.3, 6.09, 3.2, 0.22, {
    fontSize: 9.6,
    bold: true,
    color: C.primaryDark,
    align: 'center',
    charSpacing: 0.4,
  });
  addText(slide, 'Shared contracts; local data and actions.', 9.3, 6.36, 3.2, 0.18, {
    fontSize: 9.6,
    color: C.muted,
    align: 'center',
  });
  addSpeakerNotes(slide, {
    timing: '0:13–0:14:30 — 1.5 minutes.',
    say:
      'Detail pages use the same foundations without forcing every record into the same layout. Shared contracts include page framing, KPI or summary treatment, status, section headings, form drawers, confirmation, and responsive table priorities. Data and actions remain product-owned.',
    point:
      'Use Order Detail as the primary proof, then point to contact and list evidence. If live, Contact Detail is /accounts/2000290/contacts/1 and Edit Contact demonstrates the drawer pattern.',
    avoid:
      'Do not claim the screenshot is Contact Detail; it is supporting contact and list evidence. Keep the verbal live-demo route distinct.',
    transition: 'Make the system completeness visible by showing the non-happy-path and overlay contracts.',
  });
}

// 11 — Complete workflows
{
  const slide = createCoreSlide('CORE', 'A complete workflow includes overlays and non-happy paths.');
  addTitleBlock(
    slide,
    'WORKFLOW COMPLETENESS',
    'A complete workflow includes overlays and non-happy paths.',
    'Drawer, confirmation, empty, and error states are part of the acceptance reference.',
  );
  addScreenshot(
    slide,
    A.settings,
    0.62,
    1.54,
    5.04,
    5.16,
    'Settings form page demonstrating field rhythm and action placement.',
    { focusY: 0.2, label: 'FORM FOUNDATION', labelWidth: 1.38 },
  );

  const states = [
    ['DRAWER', 'Create and edit without losing page context.', C.surfaceBlue, C.primary],
    ['CONFIRM', 'Destructive choices are explicit and recoverable.', C.warningSoft, C.warning],
    ['EMPTY', 'Explain what is missing and provide the next action.', C.surfaceAlt, C.muted],
    ['ERROR', 'Name the failure and preserve a recovery path.', C.errorSoft, C.error],
  ];
  states.forEach(([label, body, fill, accent], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 5.98 + col * 3.39;
    const y = 1.54 + row * 2.59;
    addCard(slide, x, y, 3.17, 2.31, { fill: C.surface, line: C.border });
    addPill(slide, label, x + 0.2, y + 0.2, 0.95, {
      fill,
      color: accent,
      line: fill,
      fontSize: 9,
      h: 0.27,
    });
    if (label === 'DRAWER') {
      addRect(slide, x + 0.2, y + 0.63, 2.72, 0.73, {
        fill: 'F8FAFC',
        line: C.border,
      });
      addRect(slide, x + 1.72, y + 0.63, 1.2, 0.73, {
        fill: C.surface,
        line: C.primary,
      });
      addLine(slide, x + 1.9, y + 0.85, 0.78, 0, { color: C.borderStrong, width: 2 });
      addLine(slide, x + 1.9, y + 1.05, 0.62, 0, { color: C.borderStrong, width: 2 });
    } else if (label === 'CONFIRM') {
      addRect(slide, x + 0.55, y + 0.66, 2.05, 0.72, {
        fill: C.surface,
        line: C.borderStrong,
      });
      addPill(slide, 'Cancel', x + 1.25, y + 1.05, 0.54, {
        fill: C.surfaceAlt,
        color: C.muted,
        line: C.surfaceAlt,
        fontSize: 7.5,
        h: 0.2,
      });
      addPill(slide, 'Confirm', x + 1.85, y + 1.05, 0.58, {
        fill: C.error,
        color: C.surface,
        line: C.error,
        fontSize: 7.5,
        h: 0.2,
      });
    } else {
      addCircle(slide, x + 1.37, y + 0.67, 0.42, fill, fill);
      addText(slide, label === 'EMPTY' ? '—' : '!', x + 1.37, y + 0.66, 0.42, 0.42, {
        fontSize: 15,
        bold: true,
        color: accent,
        align: 'center',
      });
      addLine(slide, x + 0.93, y + 1.22, 1.28, 0, { color: C.borderStrong, width: 2 });
    }
    addText(slide, body, x + 0.2, y + 1.57, 2.72, 0.5, {
      fontSize: 10.4,
      color: C.muted,
      valign: 'top',
    });
  });
  addSpeakerNotes(slide, {
    timing: '0:14:30–0:16 — 1.5 minutes.',
    say:
      'A system is complete only when it specifies overlays and non-happy paths. Form drawers keep context, confirmations make destructive choices explicit, empty states explain the next action, and error states preserve recovery.',
    point:
      'Use the settings screenshot for field and action rhythm, then scan the four editable state diagrams. Mention that these contracts have Storybook coverage and are required in product routes.',
    avoid:
      'Do not imply every possible backend error is modeled. These are visual and interaction contracts, not production error taxonomy.',
    transition: 'Contrast these shared contracts with a workspace that must remain purpose-built.',
  });
}

// 12 — Journey Builder
{
  const slide = createCoreSlide('CORE', 'Journey Builder is deliberately specialized.');
  addTitleBlock(
    slide,
    'PURPOSE-BUILT WORKSPACE',
    'Journey Builder is deliberately specialized.',
    'The canvas and node model stay local; the interaction language stays shared.',
  );
  addScreenshot(
    slide,
    A.journey,
    0.62,
    1.5,
    9.22,
    5.22,
    'Journey Builder showing palette, canvas, nodes, toolbar, and branch behavior.',
    { focusY: 0.5, label: 'JOURNEY BUILDER', labelWidth: 1.35 },
  );
  addNumberBadge(slide, 1, 1.47, 2.55, { fill: C.primary });
  addNumberBadge(slide, 2, 5.34, 2.4, { fill: C.success });
  addNumberBadge(slide, 3, 7.13, 5.22, { fill: C.violet });
  addCalloutCard(slide, 1, 'Custom workspace', 'Full-page toolbar, palette, and canvas serve a materially different task.', 10.12, 1.5, 2.6, {
    h: 1.39,
    badgeFill: C.primary,
  });
  addCalloutCard(slide, 2, 'Shared language', 'Status, fields, menus, color, confirmation, focus, and spacing remain coherent.', 10.12, 3.1, 2.6, {
    h: 1.39,
    badgeFill: C.success,
  });
  addCalloutCard(slide, 3, 'Product-owned model', 'Journey nodes, branching, configuration, and canvas behavior stay local.', 10.12, 4.7, 2.6, {
    h: 1.39,
    badgeFill: C.violet,
  });
  addPill(slide, '/accounts/2000290/journeys/1/builder', 10.13, 6.4, 2.57, {
    fill: C.ink,
    color: C.inkText,
    line: C.ink,
    fontSize: 8.5,
  });
  addSpeakerNotes(slide, {
    timing: '0:16–0:18 — 2 minutes.',
    say:
      'A system should create consistency without making every experience look like a table page. Journey Builder reuses foundations and interaction rules, while the canvas, node model, branching, and configuration behavior remain product-specific.',
    point:
      'If live, show the toolbar, search or expand one palette category, select an existing node, and point out shared status, fields, color, and confirmation patterns.',
    avoid:
      'Do not propose moving the journey canvas or node runtime into LiquidSky. Do not improvise a destructive journey edit.',
    transition: 'Turn that example into an explicit boundary between shared foundations and product-specific surfaces.',
  });
}

// 13 — Shared versus local
{
  const slide = createCoreSlide('CORE', 'Share the foundations. Keep product runtimes local.');
  addTitleBlock(
    slide,
    'SYSTEM BOUNDARY',
    'Share the foundations. Keep product runtimes local.',
    'Consistency increases when ownership follows the level of reuse.',
  );
  const foundations = [
    ['FOUNDATIONS', 'tokens  •  type  •  spacing  •  motion', C.surfaceBlue, C.primaryDark],
    ['PRIMITIVES', 'LiquidSky / Vuetify', C.surface, C.text],
    ['COMPOUNDS', 'headers  •  drawers  •  states  •  table controls', C.surface, C.text],
  ];
  foundations.forEach(([label, body, fill, color], index) => {
    const x = 0.62 + index * 4.08;
    addCard(slide, x, 1.52, 3.9, 0.98, { fill, line: index === 0 ? C.surfaceBlue : C.border });
    addText(slide, label, x + 0.2, 1.68, 1.35, 0.23, {
      fontSize: 10,
      bold: true,
      color,
      charSpacing: 0.7,
    });
    addText(slide, body, x + 0.2, 1.97, 3.47, 0.24, {
      fontSize: 10.6,
      color: C.muted,
    });
  });
  addLine(slide, 2.57, 2.53, 0, 0.44, { color: C.primary, width: 1.5 });
  addLine(slide, 6.65, 2.53, 0, 0.44, { color: C.primary, width: 1.5 });
  addLine(slide, 10.73, 2.53, 0, 0.44, { color: C.primary, width: 1.5 });
  addLine(slide, 2.57, 2.96, 8.16, 0, { color: C.primary, width: 1.5 });
  addLine(slide, 6.65, 2.96, 0, 0.42, { color: C.primary, width: 1.5 });
  addPill(slide, 'SHARED RULES + CONTRACTS', 5.24, 3.11, 2.82, {
    fill: C.ink,
    color: C.inkText,
    line: C.ink,
  });

  const surfaces = [
    ['DASHBOARDS', A.dashboardLight, 'widget runtime + data sources'],
    ['BUILDERS', A.journey, 'canvas + domain model'],
    ['AI', A.ai, 'conversation + orchestration'],
  ];
  surfaces.forEach(([label, filePath, detail], index) => {
    const x = 0.62 + index * 4.08;
    addCard(slide, x, 3.73, 3.9, 2.78, { fill: C.surface, line: C.border });
    addScreenshot(
      slide,
      filePath,
      x + 0.16,
      3.9,
      3.58,
      1.64,
      `${label} product-specific surface.`,
      { focusY: label === 'DASHBOARDS' ? 0.03 : 0.5 },
    );
    addText(slide, label, x + 0.18, 5.79, 1.28, 0.24, {
      fontSize: 11.5,
      bold: true,
      color: C.text,
    });
    addText(slide, detail, x + 1.43, 5.79, 2.25, 0.24, {
      fontSize: 9.8,
      color: C.muted,
      align: 'right',
    });
    addPill(slide, 'PRODUCT-LOCAL', x + 2.35, 6.13, 1.33, {
      fill: index === 2 ? C.aiSoft : C.surfaceAlt,
      color: index === 2 ? C.ai : C.muted,
      line: index === 2 ? C.aiSoft : C.surfaceAlt,
      fontSize: 8.6,
      h: 0.25,
    });
  });
  addSpeakerNotes(slide, {
    timing: '0:18–0:20 — 2 minutes.',
    say:
      'The system has layers. Foundations and shared primitives sit centrally. Generic compounds can converge into LiquidSky when they are truly reusable. Dashboards, builders, AI, merchandising, and domain workflows stay in the product layer.',
    point:
      'Read top to bottom. Explain that Vuetify is the implementation foundation, LiquidSky should own supported Maropost contracts, and product teams own recipes and runtimes.',
    avoid:
      'Do not say Vuetify itself is the design system, and do not present the older Mb layer as a target package.',
    transition: 'Define the observable acceptance dimensions that protect this boundary during implementation.',
  });
}

// 14 — Acceptance dimensions
{
  const slide = createCoreSlide('CORE', 'Acceptance is observable—not implied.');
  addTitleBlock(
    slide,
    'ACCEPTANCE DIMENSIONS',
    'Acceptance is observable—not implied.',
    'Every shared change must preserve the behavior people can see and use.',
  );
  addScreenshot(
    slide,
    A.sales,
    0.62,
    1.54,
    4.73,
    4.98,
    'Sales Orders desktop light-theme acceptance reference.',
    { focusY: 0.15, label: 'DESKTOP', labelWidth: 0.9 },
  );
  addScreenshot(
    slide,
    A.sales820,
    5.61,
    1.54,
    1.78,
    4.98,
    'Sales Orders responsive 820-pixel acceptance reference.',
    { mode: 'contain', label: '820', labelWidth: 0.68 },
  );
  addScreenshot(
    slide,
    A.salesDark,
    7.65,
    1.54,
    2.26,
    4.98,
    'Sales Orders dark-theme acceptance reference.',
    { focusY: 0.15, label: 'DARK', labelWidth: 0.75, darkLabel: true },
  );
  const checks = [
    ['Responsive', 'mobile • tablet • desktop'],
    ['Themes', 'light • dark • contrast'],
    ['States', 'loading • empty • error • partial'],
    ['Keyboard', 'order • escape • activation'],
    ['Focus', 'visible • restored • trapped'],
  ];
  checks.forEach(([label, detail], index) => {
    addCheckRow(slide, label, 10.2, 1.54 + index * 0.94, 2.52, {
      detail,
      h: 0.72,
      color: index < 2 ? C.primary : C.success,
      fill: index < 2 ? C.surfaceBlue : C.successSoft,
    });
  });
  addPill(slide, 'VISUAL SNAPSHOT  +  MANUAL REVIEW  +  CONSUMER SMOKE TEST', 9.98, 6.41, 2.96, {
    fill: C.ink,
    color: C.inkText,
    line: C.ink,
    fontSize: 7.9,
    h: 0.29,
  });
  addSpeakerNotes(slide, {
    timing: '0:20–0:21 — 1 minute.',
    say:
      'Acceptance includes responsive behavior, light and dark themes, loading and non-happy-path states, keyboard operation, and visible focus. Shared changes need visual snapshots, manual review, automated checks, and a smoke test in a real page.',
    point:
      'Use the three screenshots as visual evidence, then read the five acceptance dimensions. Mention that the current axe panel is not yet a complete release gate.',
    avoid:
      'Do not claim accessibility is complete across every specialized product surface.',
    transition: 'Show where those contracts are made visible before they are proven in a product route.',
  });
}

// 15 — Storybook contract
{
  const slide = createCoreSlide('CORE', 'Storybook is the contract; product routes are the proof.');
  addTitleBlock(
    slide,
    'VISIBLE CONTRACT',
    'Storybook is the contract; product routes are the proof.',
    'API, states, usage, and accessibility responsibilities stay reviewable beside real consumer evidence.',
  );
  addCard(slide, 0.62, 1.52, 5.72, 4.92, { fill: C.surface, line: C.border, shadow: true });
  addPill(slide, 'STORYBOOK CONTRACT', 0.88, 1.79, 1.58, {
    fill: C.violetSoft,
    color: C.violet,
    line: C.violetSoft,
  });
  addText(slide, 'MpFormDrawer', 0.88, 2.27, 2.75, 0.38, {
    fontSize: 22,
    bold: true,
    color: C.text,
  });
  addText(slide, 'Right-side create / edit surface', 0.88, 2.68, 2.75, 0.28, {
    fontSize: 11.3,
    color: C.muted,
  });
  addRect(slide, 3.77, 1.9, 2.25, 2.3, {
    fill: 'F8FAFC',
    line: C.border,
  });
  addRect(slide, 4.62, 1.9, 1.4, 2.3, {
    fill: C.surface,
    line: C.primary,
  });
  addText(slide, 'EDIT CONTACT', 4.79, 2.15, 1.05, 0.2, {
    fontSize: 8.5,
    bold: true,
    color: C.text,
  });
  addLine(slide, 4.79, 2.6, 0.95, 0, { color: C.borderStrong, width: 2 });
  addLine(slide, 4.79, 2.93, 0.95, 0, { color: C.borderStrong, width: 2 });
  addPill(slide, 'Save', 5.15, 3.63, 0.6, {
    fill: C.primary,
    color: C.surface,
    line: C.primary,
    fontSize: 8,
    h: 0.23,
  });
  const contractItems = [
    ['API', 'model • props • emits'],
    ['STATES', 'default • long • error'],
    ['A11Y', 'name • focus • escape'],
    ['THEMES', 'light • dark'],
  ];
  contractItems.forEach(([label, detail], index) => {
    const x = 0.88 + (index % 2) * 2.47;
    const y = 4.51 + Math.floor(index / 2) * 0.75;
    addCard(slide, x, y, 2.26, 0.58, {
      fill: index === 2 ? C.successSoft : C.surfaceAlt,
      line: index === 2 ? C.successSoft : C.surfaceAlt,
    });
    addText(slide, label, x + 0.14, y + 0.08, 0.65, 0.18, {
      fontSize: 8.5,
      bold: true,
      color: index === 2 ? C.success : C.muted,
    });
    addText(slide, detail, x + 0.14, y + 0.29, 1.98, 0.18, {
      fontSize: 8.7,
      color: C.text,
    });
  });

  addScreenshot(
    slide,
    A.orderDetail,
    6.67,
    1.52,
    6.05,
    4.92,
    'Order Detail product route demonstrating shared contracts in a realistic consumer.',
    { focusY: 0.12, label: 'PRODUCT ROUTE  /  PROOF', labelWidth: 1.8 },
  );
  addCard(slide, 0.62, 6.59, 12.1, 0.27, { fill: C.ink, line: C.ink });
  addText(
    slide,
    'Story API  →  supported states  →  accessibility responsibilities  →  product consumer',
    0.9,
    6.59,
    11.55,
    0.27,
    {
      fontSize: 9.3,
      bold: true,
      color: C.inkText,
      align: 'center',
    },
  );
  addSpeakerNotes(slide, {
    timing: '0:21–0:23 — 2 minutes.',
    say:
      'Storybook is the visible design contract. It shows the component API, supported states, usage guidance, accessibility responsibilities, and themes. Product routes then prove those contracts with realistic density and workflows.',
    point:
      'If live, open Storybook foundations, MpPageHeader, MpDataTableToolbar, and MpFormDrawer. If unavailable, use /accounts/2000290/design-system and the product routes.',
    avoid:
      'Do not claim Storybook alone proves production integration. It is the contract; consumer routes and tests provide additional evidence.',
    transition: 'With the visual direction established, move to the safe implementation strategy and LiquidSky boundary.',
  });
}

// 16 — LiquidSky
{
  const slide = createCoreSlide('DARK', 'LiquidSky remains the destination; 0.1.61 is not a direct fit.');
  addTitleBlock(
    slide,
    'ACT 2  /  SAFE IMPLEMENTATION',
    'LiquidSky remains the destination; 0.1.61 is not a direct fit.',
    'Converge capability by capability. Do not extract the sandbox as a competing package.',
    { dark: true, titleSize: 27 },
  );
  addPill(slide, '@maropost-ui/liquidsky-ui  0.1.61', 0.62, 1.67, 3.04, {
    fill: C.inkSoft,
    color: C.primaryBright,
    line: '4A463F',
    fontSize: 9.6,
    h: 0.34,
  });
  addText(slide, 'Destination', 0.62, 2.42, 2.05, 0.28, {
    fontSize: 11,
    bold: true,
    color: C.inkMuted,
    charSpacing: 0.7,
  });
  addText(slide, 'ONE SHARED\nLIBRARY', 0.62, 2.78, 3.72, 1.12, {
    fontSize: 29,
    bold: true,
    color: C.inkText,
    valign: 'top',
  });
  addText(slide, 'Method', 0.62, 4.34, 2.05, 0.28, {
    fontSize: 11,
    bold: true,
    color: C.inkMuted,
    charSpacing: 0.7,
  });
  addText(slide, 'Compatibility review\n+ gated pilots', 0.62, 4.7, 3.72, 0.88, {
    fontSize: 21,
    bold: true,
    color: C.primaryBright,
    valign: 'top',
  });
  addPill(slide, 'NO DIRECT PACKAGE SWAP', 0.62, 6.14, 2.2, {
    fill: C.errorSoft,
    color: C.error,
    line: C.errorSoft,
    fontSize: 9,
  });

  addCard(slide, 4.77, 1.67, 7.95, 4.97, { fill: C.inkSoft, line: '4A463F' });
  addText(slide, 'CLASSIFY EACH PORTABLE CAPABILITY', 5.06, 1.97, 4.1, 0.26, {
    fontSize: 10,
    bold: true,
    color: C.inkMuted,
    charSpacing: 0.8,
  });
  const outcomes = [
    ['01', 'Reuse', 'Existing LiquidSky capability already meets the contract.', C.success],
    ['02', 'Facade', 'Keep the Mp* API while delegating internally.', C.primaryBright],
    ['03', 'Contribute', 'Propose a missing generic compound or variant.', 'A78BFA'],
    ['04', 'Keep local', 'Domain behavior, recipes, builders, dashboards, and AI.', 'E1A04A'],
  ];
  outcomes.forEach(([number, title, body, accent], index) => {
    const y = 2.5 + index * 0.94;
    addCard(slide, 5.06, y, 7.35, 0.72, { fill: C.ink, line: '4A463F' });
    addText(slide, number, 5.27, y + 0.17, 0.38, 0.22, {
      fontFace: MONO,
      fontSize: 9.5,
      bold: true,
      color: accent,
    });
    addText(slide, title, 5.74, y + 0.11, 1.2, 0.26, {
      fontSize: 12.5,
      bold: true,
      color: C.inkText,
    });
    addText(slide, body, 7.02, y + 0.11, 5.05, 0.34, {
      fontSize: 10.5,
      color: C.inkMuted,
    });
  });
  addText(
    slide,
    'Review source • APIs • tokens • theme • peers • tests • release process',
    5.06,
    6.27,
    7.35,
    0.2,
    {
      fontSize: 9.5,
      color: C.inkMuted,
      align: 'center',
    },
  );
  addSpeakerNotes(slide, {
    timing: '0:23–0:25 — 2 minutes.',
    say:
      'LiquidSky remains the shared destination. The accepted package snapshot, 0.1.61, is not a direct fit for the complete set of proven sandbox contracts. The lowest-risk approach is convergence: review compatibility, classify each capability, and move ownership one capability at a time.',
    point:
      'State the destination on the left, then walk through reuse, facade, contribute, and product-local outcomes. Request source and contribution requirements before estimating.',
    avoid:
      'Do not claim LiquidSky is incapable or fully reviewed. Say direct fit is not established and source-level compatibility review is required. Do not propose publishing the sandbox or the older Mb layer.',
    transition: 'Explain how AI helps the team execute that evidence-heavy workflow without taking decisions away from people.',
  });
}

// 17 — AI-assisted workflow
{
  const slide = createCoreSlide('CORE', 'AI accelerates evidence—not human decisions.');
  addTitleBlock(
    slide,
    'AI-ASSISTED DELIVERY',
    'AI accelerates evidence—not human decisions.',
    'Use AI for repeatable analysis and implementation; keep product, platform, and release gates human-owned.',
  );
  addScreenshot(
    slide,
    A.ai,
    0.62,
    1.52,
    4.18,
    5.15,
    'Da Vinci AI experience representing the product-specific AI surface.',
    { focusY: 0.5, label: 'PRODUCT-SPECIFIC AI', labelWidth: 1.55 },
  );
  addCard(slide, 5.08, 1.52, 7.64, 5.15, { fill: C.surface, line: C.border });
  const tasks = [
    ['01', 'Inventory', 'components • coupling'],
    ['02', 'Contracts', 'props • events • states'],
    ['03', 'Adapters', 'facades • mappings'],
    ['04', 'Tests', 'a11y • interaction'],
    ['05', 'Evidence', 'snapshots • matrices'],
    ['06', 'Migration', 'small reviewed steps'],
  ];
  tasks.forEach(([number, label, detail], index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = 5.4 + col * 2.35;
    const y = 1.9 + row * 1.72;
    addStepCard(slide, number, label, detail, x, y, 2.1, 1.34, {
      fill: index === 2 ? C.aiSoft : C.surfaceAlt,
      accent: C.ai,
    });
    if (col < 2) {
      addText(slide, '→', x + 2.11, y + 0.51, 0.24, 0.26, {
        fontSize: 12,
        bold: true,
        color: C.faint,
        align: 'center',
      });
    }
  });
  addLine(slide, 5.5, 5.14, 6.77, 0, { color: C.primary, width: 1.5, dash: 'dash' });
  const gates = [
    ['HUMAN GATE', 'scope + acceptance'],
    ['HUMAN GATE', 'API + ownership'],
    ['HUMAN GATE', 'release + adoption'],
  ];
  gates.forEach(([label, detail], index) => {
    const x = 5.4 + index * 2.35;
    addPill(slide, label, x, 5.36, 1.05, {
      fill: C.warningSoft,
      color: C.warning,
      line: C.warningSoft,
      fontSize: 8.2,
      h: 0.25,
    });
    addText(slide, detail, x, 5.72, 2.1, 0.26, {
      fontSize: 9.4,
      color: C.muted,
      align: 'center',
    });
  });
  addPill(slide, 'AI DOES THE REPEATABLE WORK  •  PEOPLE OWN THE DECISIONS', 5.82, 6.2, 6.15, {
    fill: C.ink,
    color: C.inkText,
    line: C.ink,
    fontSize: 9.2,
  });
  addSpeakerNotes(slide, {
    timing: '0:25–0:27 — 2 minutes.',
    say:
      'AI can accelerate inventories, contract extraction, adapters, tests, evidence capture, and small migration steps. Humans still own scope, product intent, public APIs, shared ownership, accessibility acceptance, release, and adoption.',
    point:
      'Walk through the six repeatable tasks, then point to the three human gates. Explain that evidence makes reviews faster without delegating accountability.',
    avoid:
      'Do not promise a productivity percentage, migration date, autonomous release, or replacement of design-system and product reviewers.',
    transition: 'Close the presentation with the three decisions that turn this approach into a gated pilot.',
  });
}

// 18 — Decisions
{
  const slide = createCoreSlide('CORE', 'Three decisions unlock the gated pilot.');
  addTitleBlock(
    slide,
    'IMMEDIATE ASK',
    'Three decisions unlock the gated pilot.',
    'Alignment first. Evidence-based estimates after source review and pilots.',
  );
  const decisions = [
    [
      '01',
      'Acceptance reference',
      'Confirm the sandbox and Storybook as the visual and interaction reference.',
      C.surfaceBlue,
      C.primary,
    ],
    [
      '02',
      'Named ownership',
      'Nominate one LiquidSky maintainer and one product frontend owner.',
      C.successSoft,
      C.success,
    ],
    [
      '03',
      'Pilot sequence',
      'Low-coupling facades first; Sales Orders table recipe second.',
      C.violetSoft,
      C.violet,
    ],
  ];
  decisions.forEach(([number, title, body, fill, accent], index) => {
    const x = 0.62 + index * 4.08;
    addCard(slide, x, 1.72, 3.9, 3.52, { fill, line: fill });
    addText(slide, number, x + 0.25, 2.0, 0.68, 0.3, {
      fontFace: MONO,
      fontSize: 13,
      bold: true,
      color: accent,
    });
    addText(slide, title, x + 0.25, 2.58, 3.36, 0.72, {
      fontSize: 23,
      bold: true,
      color: C.text,
      valign: 'top',
    });
    addText(slide, body, x + 0.25, 3.58, 3.32, 1.06, {
      fontSize: 13.2,
      color: C.muted,
      valign: 'top',
    });
    addPill(slide, index === 0 ? 'DESIGN + PRODUCT' : index === 1 ? 'DS + FRONTEND' : 'GATED DELIVERY', x + 0.25, 4.69, 1.6, {
      fill: C.surface,
      color: accent,
      line: C.surface,
      fontSize: 8.6,
      h: 0.27,
    });
  });
  addCard(slide, 0.62, 5.57, 12.06, 1.02, { fill: C.ink, line: C.ink });
  addPill(slide, 'PILOT 1', 0.92, 5.89, 0.82, {
    fill: C.primaryBright,
    color: C.ink,
    line: C.primaryBright,
    fontSize: 8.8,
  });
  addText(slide, 'Page header  •  confirmation  •  form drawer  •  empty + error', 1.91, 5.89, 4.55, 0.3, {
    fontSize: 10.7,
    color: C.inkText,
  });
  addText(slide, '→', 6.5, 5.88, 0.35, 0.3, {
    fontSize: 14,
    bold: true,
    color: C.primaryBright,
    align: 'center',
  });
  addPill(slide, 'PILOT 2', 6.98, 5.89, 0.82, {
    fill: C.primaryBright,
    color: C.ink,
    line: C.primaryBright,
    fontSize: 8.8,
  });
  addText(slide, 'Sales Orders table recipe', 7.98, 5.89, 2.65, 0.3, {
    fontSize: 10.7,
    color: C.inkText,
  });
  addPill(slide, 'NO PARALLEL PACKAGE', 10.68, 5.89, 1.68, {
    fill: C.errorSoft,
    color: C.error,
    line: C.errorSoft,
    fontSize: 8.2,
  });
  addSpeakerNotes(slide, {
    timing: '0:27–0:30 — 3 minutes.',
    say:
      'The decision today is not approve every component. We need three alignments: confirm the sandbox and Storybook as the acceptance reference, name one LiquidSky maintainer and one product frontend owner, and approve the low-coupling pilot followed by the Sales Orders table pilot. No parallel package will be published.',
    point:
      'Pause on each decision card. Ask for the owners and source access. Use the bottom sequence to make the gated order explicit.',
    avoid:
      'Do not give a total migration estimate before the compatibility review and pilots. Do not imply a big-bang rewrite or shell migration.',
    transition: 'Move to questions, taking product questions first and implementation and ownership questions second.',
  });
}

// 19 — Q&A
{
  const slide = createCoreSlide('DARK', 'Questions, decisions, and ownership.');
  addTitleBlock(
    slide,
    'ACT 3  /  DISCUSSION',
    'Questions, decisions, and ownership.',
    'Product first. Then implementation, ownership, and next steps.',
    { dark: true, titleSize: 30 },
  );
  addPill(slide, '15:00  DISCUSSION', 10.7, 0.7, 1.62, {
    fill: C.primaryBright,
    color: C.ink,
    line: C.primaryBright,
    fontSize: 9.5,
    h: 0.34,
  });
  const prompts = [
    ['01', 'Product', 'What exactly are we approving?'],
    ['02', 'Implementation', 'What must the compatibility review prove?'],
    ['03', 'Ownership', 'Who owns shared contracts and product recipes?'],
    ['04', 'Next steps', 'Which pilot, owners, and evidence unlock adoption?'],
  ];
  prompts.forEach(([number, label, question], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 0.62 + col * 6.11;
    const y = 1.65 + row * 2.28;
    addCard(slide, x, y, 5.78, 1.89, { fill: C.inkSoft, line: '4A463F' });
    addText(slide, number, x + 0.25, y + 0.22, 0.52, 0.27, {
      fontFace: MONO,
      fontSize: 10.5,
      bold: true,
      color: C.primaryBright,
    });
    addPill(slide, label.toUpperCase(), x + 0.78, y + 0.17, 1.35, {
      fill: C.ink,
      color: C.inkMuted,
      line: '4A463F',
      fontSize: 8.7,
      h: 0.28,
    });
    addText(slide, question, x + 0.25, y + 0.78, 5.25, 0.72, {
      fontSize: 19,
      bold: true,
      color: C.inkText,
      valign: 'top',
    });
  });
  addText(slide, 'Backup slides follow for compatibility, pilots, ownership, accessibility, and demo fallback.', 0.62, 6.39, 12.06, 0.28, {
    fontSize: 10.8,
    color: C.inkMuted,
    align: 'center',
  });
  addSpeakerNotes(slide, {
    timing: '0:30–0:45 — 15 minutes.',
    say:
      'I will answer product questions first, then implementation and ownership questions. The goal is to leave with the acceptance reference, named owners, source access, and pilot sequence clear.',
    point:
      'Use the four prompts to keep discussion structured. Pull appendix slides only when a question needs more detail.',
    avoid:
      'Do not create a migration date, productivity percentage, or unsupported API commitment during Q&A. Record unresolved questions for the compatibility review.',
    transition: 'Close by restating decisions, owners, objections, and the next scheduled compatibility-review step.',
  });
}

// Appendix 1 — Approved scope
{
  const slide = createAppendixSlide('What is—and is not—being approved.');
  addTitleBlock(
    slide,
    'APPENDIX  01 / 08',
    'What is—and is not—being approved.',
    'Separate product direction from production implementation commitments.',
  );
  addCard(slide, 0.62, 1.63, 5.86, 4.94, { fill: C.successSoft, line: C.successSoft });
  addPill(slide, 'APPROVE', 0.91, 1.94, 1.02, {
    fill: C.surface,
    color: C.success,
    line: C.surface,
  });
  const yesItems = [
    'Approved visual direction',
    'Interaction principles',
    'Common page recipes',
    'Sandbox + Storybook as acceptance reference',
    'Converge shared capabilities into LiquidSky',
    'Compatibility review + gated pilot',
  ];
  yesItems.forEach((item, index) => {
    addCircle(slide, 0.94, 2.62 + index * 0.57, 0.23, C.surface, C.surface);
    addText(slide, '✓', 0.94, 2.61 + index * 0.57, 0.23, 0.23, {
      fontSize: 9.5,
      bold: true,
      color: C.success,
      align: 'center',
    });
    addText(slide, item, 1.34, 2.58 + index * 0.57, 4.68, 0.3, {
      fontSize: 12.3,
      bold: index < 2,
      color: C.text,
    });
  });

  addCard(slide, 6.78, 1.63, 5.94, 4.94, { fill: C.errorSoft, line: C.errorSoft });
  addPill(slide, 'NOT TODAY', 7.07, 1.94, 1.18, {
    fill: C.surface,
    color: C.error,
    line: C.surface,
  });
  const noItems = [
    'Publish the sandbox as a package',
    'Approve every current component API',
    'Commit to a big-bang rewrite',
    'Set a total migration date',
    'Move product-specific runtimes into LiquidSky',
    'Maintain a parallel Mb* design system',
  ];
  noItems.forEach((item, index) => {
    addCircle(slide, 7.1, 2.62 + index * 0.57, 0.23, C.surface, C.surface);
    addText(slide, '×', 7.1, 2.6 + index * 0.57, 0.23, 0.23, {
      fontSize: 11,
      bold: true,
      color: C.error,
      align: 'center',
    });
    addText(slide, item, 7.5, 2.58 + index * 0.57, 4.68, 0.3, {
      fontSize: 12.3,
      bold: index < 2,
      color: C.text,
    });
  });
  addBackupNotes(
    slide,
    'Use this slide when someone asks what the meeting decision covers.',
    'Read the first two bullets in each column, then summarize the remaining scope. Reinforce approved visual direction and code-first reference.',
  );
}

// Appendix 2 — LiquidSky compatibility
{
  const slide = createAppendixSlide('LiquidSky compatibility: direct integration is a no-go.');
  addTitleBlock(
    slide,
    'APPENDIX  02 / 08',
    'LiquidSky compatibility: direct integration is a no-go.',
    'The destination is confirmed; the adaptation path still requires source-level evidence.',
  );
  addCard(slide, 0.62, 1.6, 3.0, 4.98, { fill: C.ink, line: C.ink });
  addPill(slide, 'PACKAGE SNAPSHOT', 0.9, 1.9, 1.45, {
    fill: C.inkSoft,
    color: C.primaryBright,
    line: '4A463F',
  });
  addText(slide, '0.1.61', 0.9, 2.65, 2.35, 0.62, {
    fontFace: MONO,
    fontSize: 32,
    bold: true,
    color: C.inkText,
  });
  addText(slide, 'Not a direct fit for the full set of validated sandbox contracts.', 0.9, 3.53, 2.35, 1.0, {
    fontSize: 15,
    bold: true,
    color: C.inkMuted,
    valign: 'top',
  });
  addPill(slide, 'REVIEW BEFORE ESTIMATE', 0.9, 5.64, 1.92, {
    fill: C.warningSoft,
    color: C.warning,
    line: C.warningSoft,
    fontSize: 8.7,
  });

  const dimensions = [
    ['Public APIs', 'Map overlap, variants, gaps, and breaking differences.'],
    ['Tokens + theme', 'Choose one centrally owned semantic contract.'],
    ['Peer dependencies', 'Resolve Vue, Vuetify, icons, router, and tables.'],
    ['Quality gates', 'Tests, Storybook, accessibility, release, deprecation.'],
    ['Contribution model', 'Owners, review path, versioning, adoption support.'],
  ];
  dimensions.forEach(([label, detail], index) => {
    const y = 1.6 + index * 1.0;
    addCard(slide, 3.93, y, 8.79, 0.78, {
      fill: index === 1 ? C.surfaceBlue : C.surface,
      line: index === 1 ? C.surfaceBlue : C.border,
    });
    addText(slide, String(index + 1).padStart(2, '0'), 4.18, y + 0.19, 0.4, 0.21, {
      fontFace: MONO,
      fontSize: 9,
      bold: true,
      color: C.primary,
    });
    addText(slide, label, 4.67, y + 0.12, 1.65, 0.27, {
      fontSize: 12.5,
      bold: true,
      color: C.text,
    });
    addText(slide, detail, 6.42, y + 0.12, 5.96, 0.37, {
      fontSize: 10.8,
      color: C.muted,
    });
  });
  addPill(slide, 'DESTINATION: LIQUIDSKY', 4.1, 6.35, 2.08, {
    fill: C.successSoft,
    color: C.success,
    line: C.successSoft,
  });
  addText(slide, 'Method: compatibility matrix  →  pilots  →  incremental contribution', 6.45, 6.35, 5.75, 0.3, {
    fontSize: 10.6,
    color: C.muted,
    align: 'right',
  });
  addBackupNotes(
    slide,
    'Use this slide when asked why the team cannot simply install LiquidSky 0.1.61 and replace current contracts.',
    'Clarify that direct fit is not established. The no-go applies to an unreviewed direct swap, not to LiquidSky as the destination.',
  );
}

// Appendix 3 — Four outcomes
{
  const slide = createAppendixSlide('Every capability lands in one of four outcomes.');
  addTitleBlock(
    slide,
    'APPENDIX  03 / 08',
    'Every capability lands in one of four outcomes.',
    'The compatibility matrix prevents duplicate primitives and silent local forks.',
  );
  const outcomes = [
    ['01', 'REUSE', 'Use an existing LiquidSky capability.', 'Buttons • fields • menus', C.successSoft, C.success],
    ['02', 'FACADE', 'Preserve the Mp* consumer API temporarily.', 'Header • drawer • confirm', C.surfaceBlue, C.primary],
    ['03', 'UPSTREAM', 'Propose a missing generic compound or variant.', 'Toolbar • shared states', C.violetSoft, C.violet],
    ['04', 'PRODUCT-LOCAL', 'Keep domain behavior and specialized runtimes local.', 'Builders • dashboards • AI', C.warningSoft, C.warning],
  ];
  outcomes.forEach(([number, label, body, examples, fill, accent], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 0.62 + col * 6.1;
    const y = 1.63 + row * 2.52;
    addCard(slide, x, y, 5.78, 2.18, { fill, line: fill });
    addText(slide, number, x + 0.27, y + 0.24, 0.52, 0.25, {
      fontFace: MONO,
      fontSize: 10.5,
      bold: true,
      color: accent,
    });
    addText(slide, label, x + 0.84, y + 0.2, 2.4, 0.31, {
      fontSize: 14,
      bold: true,
      color: C.text,
      charSpacing: 0.6,
    });
    addText(slide, body, x + 0.27, y + 0.8, 5.15, 0.55, {
      fontSize: 14.5,
      bold: true,
      color: C.text,
      valign: 'top',
    });
    addPill(slide, examples, x + 0.27, y + 1.61, 2.42, {
      fill: C.surface,
      color: accent,
      line: C.surface,
      fontSize: 8.8,
      h: 0.27,
    });
  });
  addCard(slide, 0.62, 6.78 - 0.48, 12.06, 0.48, { fill: C.ink, line: C.ink });
  addText(slide, 'Outcome is decided by evidence and ownership—not by matching names.', 0.85, 6.38, 11.6, 0.26, {
    fontSize: 11.2,
    bold: true,
    color: C.inkText,
    align: 'center',
  });
  addBackupNotes(
    slide,
    'Use this slide when the discussion turns to which Mp* components become shared.',
    'Explain that names do not determine portability. Neutral props, slots, models, events, low domain coupling, and central ownership do.',
  );
}

// Appendix 4 — AI workflow
{
  const slide = createAppendixSlide('AI-assisted workflow with explicit human gates.');
  addTitleBlock(
    slide,
    'APPENDIX  04 / 08',
    'AI-assisted workflow with explicit human gates.',
    'Automation produces evidence and implementation candidates; people approve intent, contracts, and release.',
  );
  addPill(slide, 'AI-ASSISTED LANE', 0.62, 1.56, 1.45, {
    fill: C.aiSoft,
    color: C.ai,
    line: C.aiSoft,
  });
  addPill(slide, 'HUMAN GATES', 0.62, 4.38, 1.28, {
    fill: C.warningSoft,
    color: C.warning,
    line: C.warningSoft,
  });
  const tasks = ['Inventory', 'Compare', 'Draft adapter', 'Generate tests', 'Capture evidence', 'Prepare PR'];
  tasks.forEach((label, index) => {
    const x = 0.62 + index * 2.02;
    addStepCard(slide, index + 1, label, index === 0 ? 'surface + coupling' : index === 1 ? 'API + tokens' : index === 2 ? 'small facade' : index === 3 ? 'states + a11y' : index === 4 ? 'visual + consumer' : 'reviewable change', x, 1.98, 1.74, 1.45, {
      fill: index === 2 ? C.aiSoft : C.surface,
      accent: C.ai,
    });
    if (index < tasks.length - 1) {
      addText(slide, '→', x + 1.76, 2.52, 0.24, 0.3, {
        fontSize: 11,
        bold: true,
        color: C.faint,
        align: 'center',
      });
    }
  });
  addLine(slide, 0.98, 4.0, 10.87, 0, { color: C.ai, width: 1.5, dash: 'dash' });
  const gates = [
    ['GATE A', 'Approve scope + acceptance reference', 1.26],
    ['GATE B', 'Approve API + ownership outcome', 4.7],
    ['GATE C', 'Approve evidence + release', 8.36],
  ];
  gates.forEach(([label, detail, x], index) => {
    addCard(slide, x, 4.78, 3.18, 1.34, {
      fill: index === 1 ? C.warningSoft : C.surface,
      line: index === 1 ? C.warningSoft : C.border,
    });
    addPill(slide, label, x + 0.18, 4.99, 0.76, {
      fill: C.warningSoft,
      color: C.warning,
      line: C.warningSoft,
      fontSize: 8.5,
      h: 0.25,
    });
    addText(slide, detail, x + 0.18, 5.39, 2.82, 0.43, {
      fontSize: 11.5,
      bold: true,
      color: C.text,
      valign: 'top',
    });
  });
  addPill(slide, 'NO AUTONOMOUS PRODUCT OR RELEASE DECISIONS', 4.62, 6.48, 4.1, {
    fill: C.ink,
    color: C.inkText,
    line: C.ink,
    fontSize: 9,
  });
  addBackupNotes(
    slide,
    'Use this slide when asked what AI-assisted delivery means in practical terms.',
    'Walk the top lane left to right, then the three human approval gates. AI can propose and verify; accountable owners decide.',
  );
}

// Appendix 5 — Pilot sequence
{
  const slide = createAppendixSlide('Detailed pilot sequence and stop conditions.');
  addTitleBlock(
    slide,
    'APPENDIX  05 / 08',
    'Detailed pilot sequence and stop conditions.',
    'Each phase exits on evidence. The shell moves last.',
  );
  const phases = [
    ['01', 'Compatibility review', 'Matrix + pilot scope approved', 'STOP if source, owners, or token direction remain unknown'],
    ['02', 'Low-coupling facades', 'Stories + consumers pass', 'STOP on visual, a11y, API, or peer-dependency regression'],
    ['03', 'Sales Orders pilot', 'Standard table recipe chosen', 'STOP if key states or keyboard behavior cannot be preserved'],
    ['04', 'Incremental adoption', 'Released capability used once', 'STOP if ownership or deprecation path is missing'],
    ['05', 'Shell + navigation', 'Only after lower layers prove out', 'STOP until routing, permissions, search, and account context align'],
  ];
  phases.forEach(([number, title, exit, stop], index) => {
    const y = 1.58 + index * 1.02;
    addCard(slide, 0.62, y, 12.06, 0.82, {
      fill: index === 4 ? C.ink : C.surface,
      line: index === 4 ? C.ink : C.border,
    });
    addText(slide, number, 0.87, y + 0.22, 0.42, 0.22, {
      fontFace: MONO,
      fontSize: 9.5,
      bold: true,
      color: index === 4 ? C.primaryBright : C.primary,
    });
    addText(slide, title, 1.38, y + 0.13, 2.22, 0.27, {
      fontSize: 12.5,
      bold: true,
      color: index === 4 ? C.inkText : C.text,
    });
    addPill(slide, 'EXIT', 3.82, y + 0.15, 0.55, {
      fill: index === 4 ? C.inkSoft : C.successSoft,
      color: index === 4 ? C.primaryBright : C.success,
      line: index === 4 ? '4A463F' : C.successSoft,
      fontSize: 7.9,
      h: 0.23,
    });
    addText(slide, exit, 4.5, y + 0.12, 2.95, 0.34, {
      fontSize: 10.8,
      bold: true,
      color: index === 4 ? C.inkText : C.text,
    });
    addPill(slide, 'STOP', 7.71, y + 0.15, 0.58, {
      fill: index === 4 ? C.inkSoft : C.errorSoft,
      color: index === 4 ? C.inkMuted : C.error,
      line: index === 4 ? '4A463F' : C.errorSoft,
      fontSize: 7.9,
      h: 0.23,
    });
    addText(slide, stop, 8.41, y + 0.1, 3.94, 0.43, {
      fontSize: 9.8,
      color: index === 4 ? C.inkMuted : C.muted,
    });
  });
  addPill(slide, 'ESTIMATE AFTER EVIDENCE', 0.62, 6.76 - 0.34, 1.9, {
    fill: C.warningSoft,
    color: C.warning,
    line: C.warningSoft,
    fontSize: 8.8,
  });
  addText(slide, 'No total migration date before source review, facade pilot, and table pilot.', 2.77, 6.42, 9.9, 0.28, {
    fontSize: 10.8,
    color: C.muted,
    align: 'right',
  });
  addBackupNotes(
    slide,
    'Use this slide when asked for sequencing, risk management, or timing.',
    'Emphasize the exit and stop conditions. The pilots convert uncertainty into evidence before any wider estimate.',
  );
}

// Appendix 6 — Ownership
{
  const slide = createAppendixSlide('One system needs an explicit ownership model.');
  addTitleBlock(
    slide,
    'APPENDIX  06 / 08',
    'One system needs an explicit ownership model.',
    'Shared contracts and product integration have different accountable owners.',
  );
  const owners = [
    [
      'PRODUCT DESIGN',
      'Visual intent\nInteraction requirements\nContent hierarchy\nAcceptance review',
      C.surfaceBlue,
      C.primary,
    ],
    [
      'CENTRAL DESIGN SYSTEM',
      'LiquidSky public APIs\nShared tokens + theme\nA11y baseline\nRelease + deprecation',
      C.successSoft,
      C.success,
    ],
    [
      'PRODUCT FRONTEND',
      'Facades + recipes\nDomain behavior\nReal-data states\nConsumer tests',
      C.violetSoft,
      C.violet,
    ],
    [
      'PRODUCT + ENG LEADERSHIP',
      'Priorities\nStaffing\nSequence\nAdoption expectations',
      C.warningSoft,
      C.warning,
    ],
  ];
  owners.forEach(([label, body, fill, accent], index) => {
    const x = 0.62 + index * 3.07;
    addCard(slide, x, 1.68, 2.86, 4.47, { fill, line: fill });
    addText(slide, String(index + 1).padStart(2, '0'), x + 0.22, 1.98, 0.45, 0.24, {
      fontFace: MONO,
      fontSize: 9.5,
      bold: true,
      color: accent,
    });
    addText(slide, label, x + 0.22, 2.47, 2.42, 0.78, {
      fontSize: 14.5,
      bold: true,
      color: C.text,
      valign: 'top',
    });
    const lines = body.split('\n');
    lines.forEach((lineText, lineIndex) => {
      addCircle(slide, x + 0.24, 3.49 + lineIndex * 0.54, 0.18, C.surface, C.surface);
      addText(slide, '•', x + 0.24, 3.46 + lineIndex * 0.54, 0.18, 0.18, {
        fontSize: 11,
        bold: true,
        color: accent,
        align: 'center',
      });
      addText(slide, lineText, x + 0.56, 3.43 + lineIndex * 0.54, 2.02, 0.3, {
        fontSize: 11.4,
        color: C.text,
      });
    });
  });
  addCard(slide, 0.62, 6.42, 12.06, 0.34, { fill: C.ink, line: C.ink });
  addText(slide, 'IMMEDIATE PAIR: one LiquidSky maintainer  +  one product frontend owner', 0.9, 6.42, 11.5, 0.34, {
    fontSize: 10.2,
    bold: true,
    color: C.inkText,
    align: 'center',
  });
  addBackupNotes(
    slide,
    'Use this slide when ownership, review responsibility, or ongoing maintenance is unclear.',
    'Name the four roles, then return to the immediate pairing required for the compatibility review.',
  );
}

// Appendix 7 — Acceptance checklist
{
  const slide = createAppendixSlide('Accessibility and visual acceptance checklist.');
  addTitleBlock(
    slide,
    'APPENDIX  07 / 08',
    'Accessibility and visual acceptance checklist.',
    'Minimum gates for a shared capability and one representative consumer.',
  );
  const checks = [
    ['Type + package build', 'No public type or peer-dependency regressions'],
    ['Behavior tests', 'Models, events, keyboard, escape, and focus restoration'],
    ['Storybook build', 'Required states, guidance, themes, and long content'],
    ['Automated accessibility', 'Axe baseline plus semantic assertions'],
    ['Manual keyboard review', 'Order, activation, focus visibility, dialog trap'],
    ['Responsive review', 'Mobile, tablet, and desktop priorities'],
    ['Visual snapshot review', 'Approved light and dark references'],
    ['Consumer smoke test', 'Representative product route with realistic density'],
  ];
  checks.forEach(([label, detail], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 0.62 + col * 6.1;
    const y = 1.6 + row * 1.18;
    addCard(slide, x, y, 5.78, 0.96, {
      fill: row === 3 ? C.surfaceBlue : C.surface,
      line: row === 3 ? C.surfaceBlue : C.border,
    });
    addCircle(slide, x + 0.22, y + 0.23, 0.34, C.successSoft, C.successSoft);
    addText(slide, '✓', x + 0.22, y + 0.22, 0.34, 0.34, {
      fontSize: 12,
      bold: true,
      color: C.success,
      align: 'center',
    });
    addText(slide, label, x + 0.72, y + 0.14, 2.4, 0.28, {
      fontSize: 12.4,
      bold: true,
      color: C.text,
    });
    addText(slide, detail, x + 0.72, y + 0.48, 4.7, 0.27, {
      fontSize: 9.9,
      color: C.muted,
    });
  });
  addPill(slide, 'SHARED RELEASE GATE', 0.62, 6.48, 1.66, {
    fill: C.ink,
    color: C.inkText,
    line: C.ink,
  });
  addText(slide, 'Pass the component contract and a real consuming page.', 2.55, 6.48, 10.1, 0.3, {
    fontSize: 11,
    color: C.muted,
    align: 'right',
  });
  addBackupNotes(
    slide,
    'Use this slide when asked what “ready to share” means.',
    'Treat every line as a minimum gate. Automated axe results support—but do not replace—manual keyboard and product-consumer review.',
  );
}

// Appendix 8 — Demo fallback
{
  const slide = createAppendixSlide('Live-demo order and static fallback.');
  addTitleBlock(
    slide,
    'APPENDIX  08 / 08',
    'Live-demo order and static fallback.',
    'Pre-open the routes. Use the curated screenshots in this deck if the live environment fails.',
  );
  const routes = [
    ['/accounts/2000290/dashboard', 'Dashboard'],
    ['/commerce/2000290/orders', 'Sales Orders'],
    ['/accounts/2000290/contacts/1', 'Contact Detail'],
    ['/accounts/2000290/journeys/1/builder', 'Journey Builder'],
    ['localhost:6006 / foundations', 'Storybook colors'],
    ['localhost:6006 / MpPageHeader', 'Storybook layout'],
    ['localhost:6006 / MpDataTableToolbar', 'Storybook data'],
    ['localhost:6006 / MpFormDrawer', 'Storybook overlays'],
    ['/accounts/2000290/design-system', 'Storybook fallback'],
  ];
  addCard(slide, 0.62, 1.56, 6.48, 5.1, { fill: C.surface, line: C.border });
  routes.forEach(([route, label], index) => {
    const y = 1.82 + index * 0.5;
    addText(slide, String(index + 1).padStart(2, '0'), 0.88, y + 0.02, 0.38, 0.2, {
      fontFace: MONO,
      fontSize: 8.8,
      bold: true,
      color: C.primary,
    });
    addText(slide, label, 1.34, y, 1.62, 0.23, {
      fontSize: 10.2,
      bold: true,
      color: C.text,
    });
    addText(slide, route, 2.98, y, 3.72, 0.23, {
      fontFace: MONO,
      fontSize: 8.5,
      color: C.muted,
    });
    if (index < routes.length - 1) {
      addLine(slide, 0.88, y + 0.35, 5.94, 0, { color: C.border, width: 0.6 });
    }
  });
  addScreenshot(
    slide,
    A.dashboardLight,
    7.41,
    1.56,
    5.31,
    1.48,
    'Dashboard static fallback screenshot.',
    { focusY: 0.03, label: '1  DASHBOARD', labelWidth: 1.18 },
  );
  addScreenshot(
    slide,
    A.sales,
    7.41,
    3.29,
    5.31,
    1.48,
    'Sales Orders static fallback screenshot.',
    { focusY: 0.15, label: '2  ORDERS', labelWidth: 1.0 },
  );
  addScreenshot(
    slide,
    A.journey,
    7.41,
    5.02,
    5.31,
    1.48,
    'Journey Builder static fallback screenshot.',
    { focusY: 0.5, label: '4  BUILDER', labelWidth: 1.05, darkLabel: true },
  );
  addBackupNotes(
    slide,
    'Use this slide only if the live environment, Storybook, or a route is unavailable.',
    'Pre-open tabs in this order. If something fails, describe the intended interaction once, switch to the matching screenshot, and continue.',
    'Return to the decision or Q&A slide after the fallback proof.',
  );
}

const EXPECTED_CORE = 19;
const EXPECTED_APPENDIX = 8;
const EXPECTED_TOTAL = EXPECTED_CORE + EXPECTED_APPENDIX;

if (coreSlides !== EXPECTED_CORE) {
  throw new Error(`Expected ${EXPECTED_CORE} core slides, generated ${coreSlides}.`);
}
if (appendixSlides !== EXPECTED_APPENDIX) {
  throw new Error(`Expected ${EXPECTED_APPENDIX} appendix slides, generated ${appendixSlides}.`);
}
if (slideTitles.length !== EXPECTED_TOTAL) {
  throw new Error(`Expected ${EXPECTED_TOTAL} total slides, generated ${slideTitles.length}.`);
}
if (notesCount !== EXPECTED_TOTAL) {
  throw new Error(`Expected notes on all ${EXPECTED_TOTAL} slides, generated ${notesCount}.`);
}

async function main() {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  await pptx.writeFile({ fileName: OUTPUT, compression: true });
  const stats = fs.statSync(OUTPUT);
  process.stdout.write(
    `${JSON.stringify(
      {
        output: OUTPUT,
        coreSlides,
        appendixSlides,
        totalSlides: slideTitles.length,
        notesCount,
        bytes: stats.size,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
