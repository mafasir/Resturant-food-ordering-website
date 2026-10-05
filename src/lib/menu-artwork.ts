/**
 * Deterministic SVG artwork generator for menu items.
 *
 * Real food photography would be ideal, but stock sources are inconsistent in
 * quality and require network access at runtime. Instead each dish gets a
 * unique, on-brand gradient poster derived from its slug, so the menu grid looks
 * colourful and cohesive while remaining fully offline.
 */

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small deterministic PRNG so the same slug always yields the same artwork. */
function rng(seed: number) {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

export type Palette = {
  /** Base wash behind everything. */
  base: [string, string];
  /** Colours used for the soft glowing blobs. */
  glows: string[];
  /** Colour of the plate ring and highlight strokes. */
  accent: string;
};

export const CATEGORY_PALETTES: Record<string, Palette> = {
  Starters: {
    base: ["#2a1508", "#120a06"],
    glows: ["#f59e0b", "#ef4444", "#b45309"],
    accent: "#fbbf24",
  },
  "Burgers & Sandwiches": {
    base: ["#2b100c", "#120707"],
    glows: ["#dc2626", "#f97316", "#7f1d1d"],
    accent: "#fb923c",
  },
  Mains: {
    base: ["#241a06", "#0f0c05"],
    glows: ["#d97706", "#84cc16", "#a16207"],
    accent: "#fbbf24",
  },
  "Pizza & Pasta": {
    base: ["#2a0f0c", "#120606"],
    glows: ["#dc2626", "#16a34a", "#b91c1c"],
    accent: "#f87171",
  },
  "Bowls & Salads": {
    base: ["#08201a", "#05100c"],
    glows: ["#16a34a", "#0d9488", "#4d7c0f"],
    accent: "#4ade80",
  },
  Sides: {
    base: ["#2a1f06", "#100c04"],
    glows: ["#ca8a04", "#facc15", "#a16207"],
    accent: "#fde047",
  },
  Desserts: {
    base: ["#2a0a1f", "#12040d"],
    glows: ["#db2777", "#7c3aed", "#be185d"],
    accent: "#f9a8d4",
  },
  Beverages: {
    base: ["#08202b", "#040f14"],
    glows: ["#06b6d4", "#2563eb", "#0e7490"],
    accent: "#67e8f9",
  },
};

const FALLBACK_PALETTE: Palette = {
  base: ["#1c1917", "#0c0a09"],
  glows: ["#f59e0b", "#ef4444", "#a16207"],
  accent: "#fbbf24",
};

/**
 * Renders a 800x600 poster. Composition is a mesh-gradient wash, a few soft
 * radial glows, a tilted plate ring for depth, and a film-grain overlay.
 */
export function renderMenuArtwork(slug: string, category: string): string {
  const palette = CATEGORY_PALETTES[category] ?? FALLBACK_PALETTE;
  const seed = hash(slug);
  const rand = rng(seed);

  const angle = Math.floor(rand() * 90) + 100;
  const rad = (angle * Math.PI) / 180;
  const x1 = (50 - Math.cos(rad) * 50).toFixed(1);
  const y1 = (50 - Math.sin(rad) * 50).toFixed(1);
  const x2 = (50 + Math.cos(rad) * 50).toFixed(1);
  const y2 = (50 + Math.sin(rad) * 50).toFixed(1);

  const glows = palette.glows
    .map((colour, index) => {
      const cx = Math.round(rand() * 800);
      const cy = Math.round(rand() * 600);
      const r = Math.round(220 + rand() * 220);
      const opacity = (0.55 + rand() * 0.35 - index * 0.08).toFixed(2);
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#g${index})" opacity="${opacity}" />`;
    })
    .join("\n    ");

  const ringRotation = Math.round(rand() * 40 - 20);
  const ringRadius = Math.round(180 + rand() * 40);
  const innerRadius = Math.round(ringRadius * 0.82);

  const speckles = Array.from({ length: 14 }, () => {
    const cx = Math.round(rand() * 800);
    const cy = Math.round(rand() * 600);
    const r = Math.round(2 + rand() * 7);
    const colour = palette.glows[Math.floor(rand() * palette.glows.length)];
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${colour}" opacity="0.5" />`;
  }).join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" role="img" aria-label="${escapeXml(category)}">
  <defs>
    <linearGradient id="bg" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
      <stop offset="0%" stop-color="${palette.base[0]}" />
      <stop offset="100%" stop-color="${palette.base[1]}" />
    </linearGradient>
    ${palette.glows
      .map(
        (colour, index) =>
          `<radialGradient id="g${index}"><stop offset="0%" stop-color="${colour}" stop-opacity="0.85" /><stop offset="100%" stop-color="${colour}" stop-opacity="0" /></radialGradient>`,
      )
      .join("\n    ")}
    <linearGradient id="rim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.9" />
      <stop offset="55%" stop-color="${palette.accent}" stop-opacity="0.15" />
      <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0.6" />
    </linearGradient>
    <radialGradient id="sheen" cx="35%" cy="28%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="${seed % 1000}" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
  </defs>
  <rect width="800" height="600" fill="url(#bg)" />
  <g filter="url(#grain)" opacity="0.05" />
  <g>
    ${glows}
  </g>
  <g opacity="0.55">
    ${speckles}
  </g>
  <g transform="rotate(${ringRotation} 400 300)">
    <circle cx="400" cy="300" r="${ringRadius}" fill="none" stroke="url(#rim)" stroke-width="3" />
    <circle cx="400" cy="300" r="${innerRadius}" fill="none" stroke="${palette.accent}" stroke-opacity="0.12" stroke-width="1.5" />
    <circle cx="400" cy="300" r="${innerRadius}" fill="url(#sheen)" />
  </g>
  <rect width="800" height="600" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="2" />
</svg>
`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
