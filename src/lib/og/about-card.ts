/**
 * Share card artwork for the Bible Atlas landing page.
 *
 * Same approach as the verse card: a plain SVG string, no layout engine, so
 * the endpoint stays cheap until a crawler actually asks for the image.
 */

import { CARD_HEIGHT, CARD_WIDTH, escapeXml, wrap } from "./verse-card";

const INK = "#1b2a4a";
const INK_SOFT = "#5b6a86";
const ACCENT = "#9c6b3f";

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

const HEADLINE = "Read the Bible with maps, people and places in view";
const SUBLINE =
  "Tap any highlighted name for an interactive map, profile, timeline and the passages it touches — without losing your place.";

const CHIPS = ["Interactive maps", "People & places", "Concordance", "Offline KJV"];

function chips() {
  let x = 72;
  return CHIPS.map((label) => {
    const width = Math.round(label.length * 13 + 44);
    const chip = `<g transform="translate(${x}, 494)">
    <rect width="${width}" height="52" rx="26" fill="none" stroke="${INK}" stroke-opacity="0.35" stroke-width="2"/>
    <text x="${width / 2}" y="34" text-anchor="middle" font-family="Spectral" font-size="24" fill="${INK}" fill-opacity="0.85">${escapeXml(label)}</text>
  </g>`;
    x += width + 16;
    return chip;
  }).join("\n  ");
}

export function aboutCardSvg() {
  const maxWidth = CARD_WIDTH - 144;
  const headlineLines = wrap(HEADLINE, 60, maxWidth, 2);
  const sublineLines = wrap(SUBLINE, 28, maxWidth, 3);

  const headline = headlineLines
    .map(
      (line, i) =>
        `<text x="72" y="${232 + i * 78}" font-family="Spectral" font-size="60" font-weight="600" fill="${INK}">${escapeXml(line)}</text>`,
    )
    .join("\n  ");

  const subline = sublineLines
    .map(
      (line, i) =>
        `<text x="72" y="${232 + headlineLines.length * 78 + 30 + i * 40}" font-family="Spectral" font-size="28" fill="${INK_SOFT}">${escapeXml(line)}</text>`,
    )
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  ${frame()}
  ${headline}
  ${subline}
  ${chips()}
  <text x="72" y="${CARD_HEIGHT - 66}" font-family="Spectral" font-size="24" fill="${INK_SOFT}">Free · No account needed · mybibleatlas.com</text>
</svg>`;
}
