/**
 * Share card artwork for Bible Atlas.
 *
 * The card is composed as a plain SVG string — no layout engine, no satori —
 * so it costs nothing until a crawler actually asks for an image. Text is
 * wrapped with an estimated glyph-width table (Spectral is the app's serif),
 * and the verse type size steps down before anything is ever ellipsed, so a
 * long verse stays readable instead of overflowing the frame.
 */

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

const INK = "#1b2a4a";
const INK_SOFT = "#5b6a86";
const ACCENT = "#9c6b3f";

/** Rough advance widths (in em) for Spectral, good enough for line breaking. */
const NARROW = new Set([..." iljtfrI.,;:!|'`()[]{}-"]);
const WIDE = new Set([..."mwMW@%"]);

function charWidth(ch: string) {
  if (NARROW.has(ch)) return 0.3;
  if (WIDE.has(ch)) return 0.86;
  if (ch >= "A" && ch <= "Z") return 0.65;
  return 0.52;
}

export function measure(text: string, fontSize: number) {
  let w = 0;
  for (const ch of text) w += charWidth(ch);
  return w * fontSize;
}

export function wrap(text: string, fontSize: number, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (measure(next, fontSize) <= maxWidth) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  const overflowed = lines.length >= maxLines && measure(words.join(" "), fontSize) > maxWidth * maxLines;
  if (overflowed) {
    let last = lines[maxLines - 1] ?? "";
    while (last && measure(`${last}…`, fontSize) > maxWidth) {
      last = last.slice(0, last.lastIndexOf(" ") > 0 ? last.lastIndexOf(" ") : last.length - 1);
    }
    lines[maxLines - 1] = `${last.replace(/[\s,;:.\-—]+$/, "")}…`;
  }
  return lines;
}

export function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Parchment ground, double rule and the Bible Atlas mark — shared by every card. */
function frame() {
  return `
  <defs>
    <linearGradient id="parchment" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f7eeda"/>
      <stop offset="55%" stop-color="#f0e2c6"/>
      <stop offset="100%" stop-color="#e4d2ae"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="65%">
      <stop offset="0%" stop-color="#fffaf0" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#fffaf0" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#parchment)"/>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#glow)"/>
  <rect x="24" y="24" width="${CARD_WIDTH - 48}" height="${CARD_HEIGHT - 48}" fill="none" stroke="${INK}" stroke-opacity="0.75" stroke-width="3"/>
  <rect x="36" y="36" width="${CARD_WIDTH - 72}" height="${CARD_HEIGHT - 72}" fill="none" stroke="${INK}" stroke-opacity="0.28" stroke-width="1.5"/>
  <g transform="translate(72, 74)">
    <circle cx="20" cy="20" r="19" fill="none" stroke="${INK}" stroke-width="3"/>
    <path d="M20 6 L20 34 M6 20 L34 20" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="20" cy="20" r="6" fill="${ACCENT}"/>
    <text x="56" y="29" font-family="Spectral" font-size="26" font-weight="600" fill="${INK}" letter-spacing="6">BIBLE ATLAS</text>
  </g>
  <path d="M72 132 L${CARD_WIDTH - 72} 132" stroke="${INK}" stroke-opacity="0.25" stroke-width="2"/>`;
}

function footer(label: string) {
  return `<text x="72" y="${CARD_HEIGHT - 66}" font-family="Spectral" font-size="24" fill="${INK_SOFT}">${escapeXml(label)}</text>`;
}

/**
 * A verse (or chapter) card: reference, the passage itself, and the brand.
 * `text` is optional — a chapter link renders an invitation line instead.
 */
export function verseCardSvg(opts: { reference: string; text?: string | null }) {
  const reference = opts.reference.trim() || "Bible Atlas";
  const body = (opts.text ?? "").replace(/\s+/g, " ").trim();

  const refSize = measure(reference, 66) > 1000 ? 52 : 66;
  const maxWidth = CARD_WIDTH - 144;

  let bodySize = 42;
  let lines: string[] = [];
  if (body) {
    for (const size of [42, 38, 34, 30]) {
      bodySize = size;
      lines = wrap(`“${body}”`, size, maxWidth, 5);
      if (measure(`“${body}”`, size) <= maxWidth * 5) break;
    }
  } else {
    bodySize = 34;
    lines = wrap(
      "Read this chapter with maps, timelines and context beside every verse.",
      34,
      maxWidth,
      2,
    );
  }

  const lineHeight = Math.round(bodySize * 1.42);
  const blockHeight = lines.length * lineHeight;
  const refBaseline = 232;
  const bodyTop = Math.min(refBaseline + 74, CARD_HEIGHT - 140 - blockHeight);

  const bodyLines = lines
    .map(
      (line, i) =>
        `<text x="72" y="${bodyTop + (i + 1) * lineHeight}" font-family="Spectral" font-size="${bodySize}" fill="${INK}" fill-opacity="0.92">${escapeXml(line)}</text>`,
    )
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  ${frame()}
  <text x="72" y="${refBaseline}" font-family="Spectral" font-size="${refSize}" font-weight="600" fill="${INK}">${escapeXml(reference)}</text>
  ${bodyLines}
  ${footer(opts.text ? "Explore this verse in context · mybibleatlas.com" : "mybibleatlas.com")}
</svg>`;
}

/** Brand-only card used whenever a verse card cannot be produced. */
export function defaultCardSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  ${frame()}
  <text x="72" y="270" font-family="Spectral" font-size="72" font-weight="600" fill="${INK}">Bible Atlas</text>
  <text x="72" y="340" font-family="Spectral" font-size="34" fill="${INK}" fill-opacity="0.85">Read the Bible with context &amp; maps</text>
  <text x="72" y="398" font-family="Spectral" font-size="28" fill="${INK_SOFT}">Maps, timelines, family trees and 3D artefacts beside every verse.</text>
  ${footer("mybibleatlas.com")}
</svg>`;
}
