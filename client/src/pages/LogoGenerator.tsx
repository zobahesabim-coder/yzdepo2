import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Download,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { addHistoryItem } from "@/lib/history";

type LogoStyle = {
  id: string;
  label: string;
  desc: string;
};

const logoStyles: LogoStyle[] = [
  { id: "geometric", label: "Geometrik", desc: "Keskin şekiller ve sembol" },
  { id: "minimal", label: "Minimal", desc: "Sade, az detay" },
  { id: "badge", label: "Rozet", desc: "Daire içinde marka adı" },
  { id: "modern", label: "Modern", desc: "Gradyan ve kalın tipografi" },
  { id: "tech", label: "Teknoloji", desc: "Kod/dijital temalı ikon" },
  { id: "elegant", label: "Zarif", desc: "İnce çizgi, serif tipografi" },
];

const colorPalettes = [
  { name: "Mavi", primary: "#2563eb", secondary: "#1e40af", accent: "#60a5fa" },
  { name: "Yeşil", primary: "#059669", secondary: "#047857", accent: "#34d399" },
  { name: "Turuncu", primary: "#ea580c", secondary: "#c2410c", accent: "#fb923c" },
  { name: "Mor", primary: "#7c3aed", secondary: "#6d28d9", accent: "#a78bfa" },
  { name: "Pembe", primary: "#db2777", secondary: "#be185d", accent: "#f472b6" },
  { name: "Siyah-Beyaz", primary: "#18181b", secondary: "#3f3f46", accent: "#a1a1aa" },
  { name: "Teal", primary: "#0d9488", secondary: "#0f766e", accent: "#2dd4bf" },
  { name: "Kırmızı", primary: "#dc2626", secondary: "#b91c1c", accent: "#f87171" },
];

type LogoResult = {
  svg: string;
  brandName: string;
  style: string;
  paletteName: string;
  variantIndex: number;
};

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Deterministic pseudo-random based on a seed string (so each variant index
// produces a different but reproducible design).
function seededRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Generates an SVG for a given brand name, style, palette, and variant index.
 * Each style has 30 distinct variants driven by the variant index, so every
 * "Oluştur" press with a different index yields a visibly different logo.
 */
function generateSVG(
  brandName: string,
  styleId: string,
  palette: (typeof colorPalettes)[0],
  variant: number
): string {
  const initials = getInitials(brandName);
  const { primary, secondary, accent } = palette;
  const safeName = brandName.replace(/[<>&"']/g, "").trim() || "Brand";
  const v = variant % 30; // 0..29
  const r = (offset: number) => seededRandom(`${styleId}-${v}-${offset}`);

  switch (styleId) {
    case "geometric": {
      // 30 geometric variants: different polygon shapes, positions, accents
      const shapes = [
        // variant 0..29 each a unique geometric layout
        `<polygon points="40,100 80,40 120,100 80,160" fill="${primary}"/><polygon points="80,100 120,40 160,100 120,160" fill="${secondary}" opacity="0.8"/>`,
        `<rect x="35" y="55" width="70" height="90" rx="8" fill="${primary}"/><rect x="55" y="75" width="30" height="50" rx="4" fill="${secondary}"/>`,
        `<circle cx="80" cy="100" r="42" fill="${primary}"/><circle cx="80" cy="100" r="26" fill="${secondary}"/><circle cx="80" cy="100" r="12" fill="${accent}"/>`,
        `<polygon points="40,60 120,60 80,140" fill="${primary}"/><polygon points="120,60 120,140 80,140" fill="${secondary}"/>`,
        `<rect x="40" y="60" width="40" height="80" fill="${primary}"/><rect x="90" y="60" width="40" height="80" fill="${secondary}"/><rect x="65" y="80" width="40" height="40" fill="${accent}" opacity="0.7"/>`,
        `<polygon points="80,40 120,100 80,160 40,100" fill="${primary}"/><circle cx="80" cy="100" r="22" fill="${secondary}"/>`,
        `<path d="M40 100 L80 50 L120 100 L80 150 Z" fill="${primary}" stroke="${secondary}" stroke-width="3"/>`,
        `<rect x="50" y="50" width="60" height="60" fill="${primary}" transform="rotate(45 80 100)"/>`,
        `<circle cx="60" cy="80" r="30" fill="${primary}"/><circle cx="100" cy="120" r="30" fill="${secondary}" opacity="0.85"/>`,
        `<polygon points="50,100 80,50 110,100 80,150" fill="${primary}"/><line x1="80" y1="50" x2="80" y2="150" stroke="${secondary}" stroke-width="4"/>`,
        `<rect x="35" y="70" width="50" height="60" rx="10" fill="${primary}"/><rect x="85" y="70" width="50" height="60" rx="10" fill="${secondary}"/>`,
        `<polygon points="40,100 80,55 120,100 100,145 60,145" fill="${primary}"/>`,
        `<circle cx="80" cy="100" r="40" fill="none" stroke="${primary}" stroke-width="5"/><polygon points="80,70 95,100 80,130 65,100" fill="${secondary}"/>`,
        `<rect x="40" y="55" width="80" height="90" rx="4" fill="${primary}"/><polygon points="55,70 105,70 80,130" fill="${accent}"/>`,
        `<path d="M40 60 H120 V140 H40 Z M60 80 H100 V120 H60 Z" fill="${primary}" fill-rule="evenodd"/>`,
        `<circle cx="80" cy="100" r="45" fill="${primary}"/><rect x="60" y="80" width="40" height="40" fill="${secondary}"/>`,
        `<polygon points="80,40 100,90 150,90 110,120 125,160 80,135 35,160 50,120 10,90 60,90" fill="${primary}"/>`,
        `<rect x="40" y="60" width="80" height="80" rx="20" fill="${primary}"/><circle cx="80" cy="100" r="25" fill="none" stroke="${accent}" stroke-width="3"/>`,
        `<path d="M40 100 Q80 40 120 100 Q80 160 40 100 Z" fill="${primary}"/>`,
        `<polygon points="40,100 70,60 100,100 70,140" fill="${primary}"/><polygon points="70,100 100,60 130,100 100,140" fill="${secondary}"/>`,
        `<rect x="35" y="55" width="90" height="90" rx="6" fill="${primary}"/><path d="M55 75 H105 V125 H55 Z M70 90 H90 V110 H70 Z" fill="${secondary}" fill-rule="evenodd"/>`,
        `<circle cx="80" cy="100" r="35" fill="${primary}"/><circle cx="80" cy="100" r="20" fill="none" stroke="${secondary}" stroke-width="4"/><circle cx="80" cy="100" r="8" fill="${accent}"/>`,
        `<polygon points="60,60 100,60 120,100 100,140 60,140 40,100" fill="${primary}"/><polygon points="70,80 90,80 100,100 90,120 70,120 60,100" fill="${secondary}"/>`,
        `<rect x="40" y="60" width="80" height="80" fill="${primary}"/><rect x="55" y="75" width="50" height="50" fill="${secondary}"/><rect x="70" y="90" width="20" height="20" fill="${accent}"/>`,
        `<path d="M40 60 L120 60 L80 140 Z" fill="${primary}"/><path d="M40 140 L120 140 L80 60 Z" fill="${secondary}" opacity="0.6"/>`,
        `<circle cx="65" cy="100" r="35" fill="${primary}"/><circle cx="95" cy="100" r="35" fill="${secondary}" opacity="0.85"/>`,
        `<rect x="40" y="55" width="80" height="90" rx="45" fill="${primary}"/><rect x="60" y="75" width="40" height="50" rx="25" fill="${accent}"/>`,
        `<polygon points="50,60 110,60 110,140 50,140 30,100" fill="${primary}"/><polygon points="60,75 100,75 100,125 60,125 50,100" fill="${secondary}"/>`,
        `<circle cx="80" cy="100" r="40" fill="${primary}"/><path d="M50 100 L80 60 L110 100 L80 140 Z" fill="${secondary}"/>`,
        `<rect x="40" y="60" width="40" height="80" fill="${primary}"/><circle cx="110" cy="100" r="30" fill="${secondary}"/><rect x="60" y="85" width="40" height="30" fill="${accent}" opacity="0.7"/>`,
      ];
      const deco = v < 8 ? `<rect x="190" y="135" width="60" height="3" fill="${accent}"/>` : v < 16 ? `<circle cx="200" cy="138" r="4" fill="${accent}"/>` : `<polygon points="190,138 200,132 210,138 200,144" fill="${accent}"/>`;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <rect width="400" height="200" fill="white"/>
  ${shapes[v]}
  <text x="190" y="95" font-family="Poppins, sans-serif" font-size="32" font-weight="700" fill="${primary}">${safeName}</text>
  <text x="190" y="125" font-family="Inter, sans-serif" font-size="14" font-weight="400" fill="${accent}">${safeName}</text>
  ${deco}
</svg>`;
    }

    case "minimal": {
      const icons = [
        `<circle cx="60" cy="100" r="28" fill="none" stroke="${primary}" stroke-width="3"/><circle cx="60" cy="100" r="10" fill="${primary}"/>`,
        `<circle cx="60" cy="100" r="30" fill="${primary}"/>`,
        `<rect x="35" y="75" width="50" height="50" rx="8" fill="none" stroke="${primary}" stroke-width="3"/>`,
        `<line x1="35" y1="100" x2="85" y2="100" stroke="${primary}" stroke-width="4"/><line x1="60" y1="75" x2="60" y2="125" stroke="${primary}" stroke-width="4"/>`,
        `<polygon points="60,70 85,125 35,125" fill="none" stroke="${primary}" stroke-width="3"/>`,
        `<circle cx="60" cy="100" r="30" fill="none" stroke="${primary}" stroke-width="3"/><line x1="30" y1="100" x2="90" y2="100" stroke="${primary}" stroke-width="3"/>`,
        `<rect x="35" y="75" width="50" height="50" rx="25" fill="${primary}"/>`,
        `<path d="M35 100 Q60 70 85 100 Q60 130 35 100 Z" fill="none" stroke="${primary}" stroke-width="3"/>`,
        `<circle cx="60" cy="100" r="28" fill="${primary}"/><circle cx="60" cy="100" r="14" fill="white"/>`,
        `<polygon points="60,70 85,100 60,130 35,100" fill="none" stroke="${primary}" stroke-width="3"/>`,
        `<rect x="35" y="75" width="50" height="50" fill="${primary}"/>`,
        `<circle cx="60" cy="100" r="30" fill="none" stroke="${primary}" stroke-width="3"/><circle cx="60" cy="100" r="6" fill="${primary}"/>`,
        `<line x1="35" y1="75" x2="85" y2="125" stroke="${primary}" stroke-width="4"/><line x1="85" y1="75" x2="35" y2="125" stroke="${primary}" stroke-width="4"/>`,
        `<rect x="35" y="75" width="50" height="50" rx="8" fill="${primary}"/><rect x="50" y="90" width="20" height="20" fill="white"/>`,
        `<circle cx="60" cy="100" r="30" fill="none" stroke="${primary}" stroke-width="3"/><rect x="50" y="90" width="20" height="20" fill="${primary}"/>`,
        `<polygon points="60,70 85,125 35,125" fill="${primary}"/>`,
        `<circle cx="60" cy="100" r="28" fill="none" stroke="${primary}" stroke-width="3"/><polygon points="60,85 75,115 45,115" fill="${primary}"/>`,
        `<rect x="35" y="80" width="50" height="40" rx="4" fill="none" stroke="${primary}" stroke-width="3"/><line x1="45" y1="100" x2="75" y2="100" stroke="${primary}" stroke-width="3"/>`,
        `<circle cx="60" cy="100" r="30" fill="${primary}"/><circle cx="60" cy="100" r="20" fill="white"/><circle cx="60" cy="100" r="10" fill="${primary}"/>`,
        `<path d="M35 75 H85 V125 H35 Z" fill="none" stroke="${primary}" stroke-width="3"/><circle cx="60" cy="100" r="8" fill="${primary}"/>`,
        `<polygon points="45,75 75,75 60,125" fill="${primary}"/>`,
        `<circle cx="60" cy="100" r="30" fill="none" stroke="${primary}" stroke-width="3"/><line x1="60" y1="70" x2="60" y2="130" stroke="${primary}" stroke-width="3"/>`,
        `<rect x="35" y="75" width="50" height="50" rx="25" fill="none" stroke="${primary}" stroke-width="3"/><circle cx="60" cy="100" r="8" fill="${primary}"/>`,
        `<line x1="35" y1="100" x2="85" y2="100" stroke="${primary}" stroke-width="4"/><circle cx="60" cy="100" r="10" fill="${primary}"/>`,
        `<path d="M35 100 Q60 70 85 100" fill="none" stroke="${primary}" stroke-width="3"/><path d="M35 100 Q60 130 85 100" fill="none" stroke="${primary}" stroke-width="3"/>`,
        `<circle cx="60" cy="100" r="30" fill="${primary}" opacity="0.2"/><circle cx="60" cy="100" r="20" fill="${primary}"/>`,
        `<rect x="35" y="75" width="50" height="50" rx="4" fill="${primary}" opacity="0.3"/><rect x="45" y="85" width="30" height="30" rx="4" fill="${primary}"/>`,
        `<polygon points="60,70 85,100 60,130 35,100" fill="${primary}"/><polygon points="60,80 75,100 60,120 45,100" fill="white"/>`,
        `<circle cx="60" cy="100" r="28" fill="none" stroke="${primary}" stroke-width="3"/><line x1="32" y1="100" x2="88" y2="100" stroke="${primary}" stroke-width="2" opacity="0.5"/>`,
        `<rect x="35" y="75" width="50" height="50" fill="none" stroke="${primary}" stroke-width="3"/><rect x="50" y="90" width="20" height="20" fill="${primary}"/>`,
      ];
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <rect width="400" height="200" fill="white"/>
  ${icons[v]}
  <text x="110" y="108" font-family="Poppins, sans-serif" font-size="28" font-weight="600" fill="${primary}">${safeName}</text>
</svg>`;
    }

    case "badge": {
      const radii = [60, 55, 50, 65, 58];
      const ringW = [2, 3, 4, 2, 3];
      const subTexts = ["EST 2025", "STUDIO", "BRAND", "CO.", "ORIGINALS"];
      const ri = v % radii.length;
      const ringDeco = v % 3 === 0 ? "" : v % 3 === 1 ? `<circle cx="100" cy="100" r="${radii[ri] - 12}" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="4 4"/>` : `<line x1="40" y1="100" x2="160" y2="100" stroke="${accent}" stroke-width="1" opacity="0.3"/>`;
      const cx = 100;
      const cy = 100;
      const badgeShapes = [
        `<circle cx="${cx}" cy="${cy}" r="${radii[ri]}" fill="${primary}"/><circle cx="${cx}" cy="${cy}" r="${radii[ri] - 8}" fill="none" stroke="${accent}" stroke-width="${ringW[ri]}"/>`,
        `<rect x="${cx - radii[ri]}" y="${cy - radii[ri]}" width="${radii[ri] * 2}" height="${radii[ri] * 2}" rx="12" fill="${primary}"/><rect x="${cx - radii[ri] + 8}" y="${cy - radii[ri] + 8}" width="${(radii[ri] - 8) * 2}" height="${(radii[ri] - 8) * 2}" rx="8" fill="none" stroke="${accent}" stroke-width="${ringW[ri]}"/>`,
        `<polygon points="${cx},${cy - radii[ri]} ${cx + radii[ri]},${cy} ${cx},${cy + radii[ri]} ${cx - radii[ri]},${cy}" fill="${primary}"/><polygon points="${cx},${cy - radii[ri] + 10} ${cx + radii[ri] - 10},${cy} ${cx},${cy + radii[ri] - 10} ${cx - radii[ri] + 10},${cy}" fill="none" stroke="${accent}" stroke-width="${ringW[ri]}"/>`,
        `<circle cx="${cx}" cy="${cy}" r="${radii[ri]}" fill="${primary}"/><circle cx="${cx}" cy="${cy}" r="${radii[ri] - 15}" fill="${secondary}"/>`,
        `<rect x="${cx - radii[ri]}" y="${cy - radii[ri]}" width="${radii[ri] * 2}" height="${radii[ri] * 2}" rx="${radii[ri]}" fill="${primary}"/><rect x="${cx - radii[ri] + 10}" y="${cy - radii[ri] + 10}" width="${(radii[ri] - 10) * 2}" height="${(radii[ri] - 10) * 2}" rx="${radii[ri] - 10}" fill="none" stroke="${accent}" stroke-width="${ringW[ri]}"/>`,
      ];
      const shapeIdx = Math.floor(v / 6) % badgeShapes.length;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <rect width="400" height="200" fill="white"/>
  ${badgeShapes[shapeIdx]}
  ${ringDeco}
  <text x="${cx}" y="${cy - 5}" font-family="Poppins, sans-serif" font-size="22" font-weight="800" fill="white" text-anchor="middle">${initials}</text>
  <text x="${cx}" y="${cy + 18}" font-family="Inter, sans-serif" font-size="9" font-weight="500" fill="${accent}" text-anchor="middle" letter-spacing="2">${subTexts[v % subTexts.length]}</text>
  <text x="185" y="95" font-family="Poppins, sans-serif" font-size="24" font-weight="700" fill="${primary}">${safeName}</text>
  <rect x="185" y="108" width="120" height="2" fill="${secondary}"/>
  <text x="185" y="128" font-family="Inter, sans-serif" font-size="11" fill="${accent}">MARKA STÜDYOSU</text>
</svg>`;
    }

    case "modern": {
      const cornerR = [14, 8, 20, 4, 12];
      const ri = v % cornerR.length;
      const boxW = [60, 70, 50, 80, 55];
      const bi = Math.floor(v / 6) % boxW.length;
      const gradId = `grad_${v}`;
      const decorations = [
        `<rect x="110" y="115" width="180" height="4" rx="2" fill="url(#${gradId})"/>`,
        `<circle cx="200" cy="117" r="4" fill="${accent}"/>`,
        `<polygon points="110,117 130,111 150,117 130,123" fill="${accent}"/>`,
        `<rect x="110" y="113" width="80" height="6" rx="3" fill="${accent}"/>`,
        `<line x1="110" y1="117" x2="290" y2="117" stroke="${accent}" stroke-width="3"/>`,
      ];
      const di = v % decorations.length;
      const subTexts = ["DIGITAL STUDIO", "CREATIVE LAB", "STUDIO", "MEDIA", "DESIGN CO."];
      const boxShape = v % 2 === 0
        ? `<rect x="30" y="60" width="${boxW[bi]}" height="80" rx="${cornerR[ri]}" fill="url(#${gradId})"/>`
        : `<circle cx="60" cy="100" r="38" fill="url(#${gradId})"/>`;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${primary}"/>
      <stop offset="100%" style="stop-color:${secondary}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="200" fill="white"/>
  ${boxShape}
  <text x="${v % 2 === 0 ? 48 : 60}" y="${v % 2 === 0 ? 112 : 108}" font-family="Poppins, sans-serif" font-size="28" font-weight="800" fill="white" ${v % 2 !== 0 ? 'text-anchor="middle"' : ''}>${initials}</text>
  <text x="110" y="100" font-family="Poppins, sans-serif" font-size="30" font-weight="800" fill="${primary}">${safeName}</text>
  ${decorations[di]}
  <text x="110" y="138" font-family="Inter, sans-serif" font-size="12" font-weight="500" fill="${accent}" letter-spacing="1">${subTexts[v % subTexts.length]}</text>
</svg>`;
    }

    case "tech": {
      const codeChars = ["&lt;/&gt;", "{ }", "[ ]", "&lt;html&gt;", "()", "01", "#", "$_", "&lt;css&gt;", "/* */", "&lt;js&gt;", "&lt;py&gt;", "//", "===", "=&gt;", "!=", "null", "true", "0x", "API", "v1", "404", "200", "&lt;br&gt;", "&lt;a&gt;", "+", "-", "*", "/", "[]", "{}"];
      const commentTexts = ["tech solutions", "digital lab", "code studio", "dev studio", "software co.", "web agency", "app builder", "system", "platform", "cloud", "data", "AI", "API", "frontend", "backend", "fullstack", "mobile", "desktop", "cloud native", "open source", "framework", "library", "compiler", "runtime", "kernel", "shell", "terminal", "console", "debug", "deploy"];
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <rect width="400" height="200" fill="white"/>
  <rect x="35" y="55" width="70" height="90" rx="8" fill="${primary}"/>
  <text x="42" y="80" font-family="Fira Code, monospace" font-size="10" fill="${accent}">${codeChars[v]}</text>
  <text x="42" y="100" font-family="Fira Code, monospace" font-size="10" fill="white">${codeChars[(v + 5) % 30]}</text>
  <text x="42" y="120" font-family="Fira Code, monospace" font-size="10" fill="${accent}">${codeChars[(v + 10) % 30]}</text>
  <text x="125" y="95" font-family="Poppins, sans-serif" font-size="26" font-weight="700" fill="${primary}">${safeName}</text>
  <text x="125" y="120" font-family="Fira Code, monospace" font-size="11" fill="${secondary}">// ${commentTexts[v]}</text>
  <rect x="125" y="130" width="100" height="3" fill="${accent}"/>
</svg>`;
    }

    case "elegant": {
      const flourishes = [
        `<line x1="85" y1="112" x2="290" y2="112" stroke="${accent}" stroke-width="1"/>`,
        `<line x1="85" y1="112" x2="200" y2="112" stroke="${accent}" stroke-width="1"/><circle cx="205" cy="112" r="2" fill="${accent}"/>`,
        `<path d="M85 112 Q187 105 290 112" fill="none" stroke="${accent}" stroke-width="1"/>`,
        `<line x1="85" y1="108" x2="290" y2="108" stroke="${accent}" stroke-width="0.5"/><line x1="85" y1="116" x2="290" y2="116" stroke="${accent}" stroke-width="0.5"/>`,
        `<line x1="85" y1="112" x2="180" y2="112" stroke="${accent}" stroke-width="1"/><line x1="195" y1="112" x2="290" y2="112" stroke="${accent}" stroke-width="1"/><circle cx="187" cy="112" r="3" fill="none" stroke="${accent}" stroke-width="1"/>`,
        `<polygon points="180,112 185,107 190,112 185,117" fill="${accent}"/><line x1="85" y1="112" x2="175" y2="112" stroke="${accent}" stroke-width="1"/><line x1="195" y1="112" x2="290" y2="112" stroke="${accent}" stroke-width="1"/>`,
      ];
      const fi = v % flourishes.length;
      const subs = ["EST. 2025", "SINCE 2025", "ATELIER", "MAISON", "BOUTIQUE", "STUDIO", "GALLERY", "COLLECTION", "ORIGINALS", "FINE GOODS", "ESTABLISHED", "CREATED 2025", "DESIGN HOUSE", "WORKSHOP", "CRAFTED", "HERITAGE", "PREMIUM", "LUXURY", "EXCLUSIVE", "SIGNATURE", "ARTISAN", "DISTINCTIVE", "TIMELESS", "REFINED", "ELEGANT", "CLASSIC", "TRADITION", "EXCELLENCE", "QUALITY", "SINCE 2024"];
      const marks = [
        `<line x1="60" y1="80" x2="60" y2="120" stroke="${primary}" stroke-width="2"/><line x1="55" y1="100" x2="65" y2="100" stroke="${primary}" stroke-width="2"/>`,
        `<circle cx="60" cy="100" r="18" fill="none" stroke="${primary}" stroke-width="1.5"/>`,
        `<path d="M48 100 Q60 85 72 100" fill="none" stroke="${primary}" stroke-width="1.5"/><path d="M48 100 Q60 115 72 100" fill="none" stroke="${primary}" stroke-width="1.5"/>`,
        `<polygon points="60,82 68,118 52,118" fill="none" stroke="${primary}" stroke-width="1.5"/>`,
        `<line x1="50" y1="100" x2="70" y2="100" stroke="${primary}" stroke-width="1.5"/><line x1="60" y1="90" x2="60" y2="110" stroke="${primary}" stroke-width="1.5"/>`,
      ];
      const mi = v % marks.length;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <rect width="400" height="200" fill="white"/>
  ${marks[mi]}
  <text x="85" y="100" font-family="Playfair Display, serif" font-size="26" font-weight="700" font-style="italic" fill="${primary}">${safeName}</text>
  ${flourishes[fi]}
  <text x="85" y="130" font-family="Inter, sans-serif" font-size="9" font-weight="400" fill="${secondary}" letter-spacing="3">${subs[v]}</text>
</svg>`;
    }

    default: {
      return generateSVG(brandName, "minimal", palette, variant);
    }
  }
}

export default function LogoGenerator() {
  const [brandName, setBrandName] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("geometric");
  const [selectedPalette, setSelectedPalette] = useState(0);
  const [result, setResult] = useState<LogoResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [variantIndex, setVariantIndex] = useState(0);

  const handleGenerate = () => {
    if (!brandName.trim()) {
      toast.error("Lütfen marka adını girin.");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      // Pick a random variant index (0..29) different from the last one
      let next = Math.floor(Math.random() * 30);
      if (next === variantIndex) next = (next + 1) % 30;
      setVariantIndex(next);

      const palette = colorPalettes[selectedPalette];
      const svg = generateSVG(brandName, selectedStyle, palette, next);
      const logoResult: LogoResult = {
        svg,
        brandName: brandName.trim(),
        style: logoStyles.find((s) => s.id === selectedStyle)?.label || selectedStyle,
        paletteName: palette.name,
        variantIndex: next,
      };
      setResult(logoResult);
      const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
      addHistoryItem({
        toolType: "logo",
        outputUrl: dataUrl,
        metadata: JSON.stringify({ brandName: brandName.trim(), style: logoResult.style }),
      });
      setIsProcessing(false);
      toast.success("Logo oluşturuldu!");
    }, 400);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.brandName.replace(/\s+/g, "_")}_logo.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Logo indirildi!");
  };

  const handleDownloadPNG = () => {
    if (!result) return;
    const img = new Image();
    const svgBlob = new Blob([result.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `${result.brandName.replace(/\s+/g, "_")}_logo.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
        toast.success("PNG indirildi!");
      }, "image/png");
    };
    img.src = url;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Logo Oluşturucu</h1>
            <p className="text-muted-foreground text-sm">
              Marka adını gir, stil ve renk seç — her basışta farklı bir logo oluşsun
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Marka Bilgisi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Marka Adı
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="örn: SMG Studio"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    maxLength={30}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Logo Stili
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {logoStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          selectedStyle === style.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="font-semibold text-sm text-foreground">{style.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{style.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Renk Paleti
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorPalettes.map((pal, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedPalette(idx)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                          selectedPalette === idx
                            ? "border-primary"
                            : "border-transparent hover:border-border"
                        }`}
                        title={pal.name}
                      >
                        <div className="flex gap-0.5">
                          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: pal.primary }} />
                          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: pal.secondary }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{pal.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleGenerate}
                  disabled={isProcessing || !brandName.trim()}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      {result ? "Yeni Logo Oluştur" : "Logo Oluştur"}
                    </>
                  )}
                </Button>
                {result && (
                  <p className="text-xs text-muted-foreground text-center">
                    Her basışta farklı bir tasarım — {result.variantIndex + 1}/30 varyasyon
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Result Panel */}
          <div className="lg:col-span-3">
            {result ? (
              <div className="space-y-4">
                <Card className="shadow-sm overflow-hidden">
                  <div className="bg-white p-8 flex items-center justify-center min-h-[240px]">
                    <div
                      className="max-w-full"
                      dangerouslySetInnerHTML={{ __html: result.svg }}
                    />
                  </div>
                  <CardContent className="p-4 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{result.style}</Badge>
                      <Badge variant="outline">{result.paletteName}</Badge>
                      <Badge variant="outline">#{result.variantIndex + 1}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleDownload} className="gap-2">
                        <Download className="w-4 h-4" />
                        SVG
                      </Button>
                      <Button size="sm" onClick={handleDownloadPNG} className="gap-2">
                        <Download className="w-4 h-4" />
                        PNG
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm bg-purple-50/40">
                  <CardContent className="p-4">
                    <p className="text-xs text-purple-800/80">
                      <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                      Her "Yeni Logo Oluştur" basışında aynı stilde farklı bir tasarım gelir.
                      30 farklı varyasyon mevcut — beğendiğini SVG veya PNG olarak indir.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-dashed border-2 border-border h-full min-h-[300px] flex items-center justify-center bg-white shadow-sm">
                <CardContent className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Logo Hazır Değil</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Marka adını gir, stil ve renk seç, ardından "Logo Oluştur" butonuna tıkla.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-8 bg-slate-50/50">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2025 SMG Yapay Zeka. Öğrenciler için tasarlandı.</p>
          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text" style={{fontFamily: "'Poppins', sans-serif", fontWeight: "800", letterSpacing: "-0.3px"}}>Made by @Beratkarabudak</span>
        </div>
      </footer>
    </div>
  );
}
