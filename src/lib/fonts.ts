export interface FontOption {
  name: string;
  group: "Sans" | "Display" | "Mono" | "Bangla";
  weights: string; // Google Fonts axis spec, "" for single-weight fonts
}

const W = "wght@400;500;600;700";

export const FONT_OPTIONS: FontOption[] = [
  // Sans
  { name: "Geist", group: "Sans", weights: W },
  { name: "Inter", group: "Sans", weights: W },
  { name: "Space Grotesk", group: "Sans", weights: W },
  { name: "Manrope", group: "Sans", weights: W },
  { name: "Outfit", group: "Sans", weights: W },
  { name: "Sora", group: "Sans", weights: W },
  { name: "DM Sans", group: "Sans", weights: W },
  { name: "Plus Jakarta Sans", group: "Sans", weights: W },
  { name: "IBM Plex Sans", group: "Sans", weights: W },
  { name: "Work Sans", group: "Sans", weights: W },
  { name: "Figtree", group: "Sans", weights: W },
  { name: "Urbanist", group: "Sans", weights: W },
  { name: "Lexend", group: "Sans", weights: W },
  { name: "Rubik", group: "Sans", weights: W },
  { name: "Barlow", group: "Sans", weights: W },
  { name: "Archivo", group: "Sans", weights: W },
  { name: "Titillium Web", group: "Sans", weights: "wght@400;600;700" },
  // Display / sci-fi
  { name: "Rajdhani", group: "Display", weights: "wght@400;500;600;700" },
  { name: "Orbitron", group: "Display", weights: W },
  { name: "Exo 2", group: "Display", weights: W },
  { name: "Chakra Petch", group: "Display", weights: W },
  { name: "Oxanium", group: "Display", weights: W },
  { name: "Saira", group: "Display", weights: W },
  { name: "Syne", group: "Display", weights: W },
  { name: "Audiowide", group: "Display", weights: "" },
  { name: "Michroma", group: "Display", weights: "" },
  { name: "Electrolize", group: "Display", weights: "" },
  { name: "Share Tech", group: "Display", weights: "" },
  // Mono
  { name: "Geist Mono", group: "Mono", weights: W },
  { name: "JetBrains Mono", group: "Mono", weights: W },
  { name: "Fira Code", group: "Mono", weights: W },
  { name: "IBM Plex Mono", group: "Mono", weights: W },
  { name: "Space Mono", group: "Mono", weights: "wght@400;700" },
  { name: "Source Code Pro", group: "Mono", weights: W },
  { name: "Roboto Mono", group: "Mono", weights: W },
  { name: "Ubuntu Mono", group: "Mono", weights: "wght@400;700" },
  { name: "Inconsolata", group: "Mono", weights: W },
  { name: "Red Hat Mono", group: "Mono", weights: W },
  { name: "Martian Mono", group: "Mono", weights: W },
  { name: "Share Tech Mono", group: "Mono", weights: "" },
  { name: "VT323", group: "Mono", weights: "" },
  { name: "Azeret Mono", group: "Mono", weights: W },
  { name: "DM Mono", group: "Mono", weights: "wght@400;500" },
  { name: "Overpass Mono", group: "Mono", weights: W },
  { name: "Anonymous Pro", group: "Mono", weights: "wght@400;700" },
  { name: "Major Mono Display", group: "Mono", weights: "" },
  // Bangla
  { name: "Hind Siliguri", group: "Bangla", weights: W },
  { name: "Noto Sans Bengali", group: "Bangla", weights: W },
  { name: "Noto Serif Bengali", group: "Bangla", weights: W },
  { name: "Baloo Da 2", group: "Bangla", weights: W },
  { name: "Anek Bangla", group: "Bangla", weights: W },
  { name: "Tiro Bangla", group: "Bangla", weights: "" },
  { name: "Galada", group: "Bangla", weights: "" },
  { name: "Atma", group: "Bangla", weights: "wght@400;500;600;700" },
  { name: "Mina", group: "Bangla", weights: "wght@400;700" },
];

export function googleFontsHref(names: string[]) {
  const uniq = Array.from(new Set(names.filter(Boolean)));
  const parts = uniq.map((n) => {
    const f = FONT_OPTIONS.find((o) => o.name === n);
    const fam = n.replace(/ /g, "+");
    return f?.weights ? `family=${fam}:${f.weights}` : `family=${fam}`;
  });
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}
