import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SVG_TEMPLATE_PATH = path.join(__dirname, "../src/bento-grid.svg");
const OUTPUT_SVG_PATH = path.join(__dirname, "../html-wrapper.svg");

const GITHUB_USER = "Marcu08";
const SNAKE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_USER}/output/github-contribution-grid-snake-dark.svg`;
const SPOTIFY_URL = "https://spotify-github-profile.kittinanx.com/api/view?uid=g94czyi452vvziaas0pheb84q&cover_image=true&theme=default&show_offline=true&background_color=121212&interchange=true";

async function fetchAsDataUri(url) {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ctype = res.headers.get("content-type") || "";
    const ext = ctype.includes("svg") ? "svg+xml" : (ctype.includes("png") ? "png" : "svg+xml");
    const buf = await res.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    return `data:image/${ext};base64,${b64}`;
}

async function build() {
    let svg = fs.readFileSync(SVG_TEMPLATE_PATH, "utf-8");

    // Snake
    let snakeContent;
    try {
        const res = await fetch(SNAKE_URL);
        if (res.ok) snakeContent = await res.text();
    } catch {}
    if (!snakeContent) {
        snakeContent = `<text x="420" y="780" fill="#666" font-family="Arial,sans-serif" font-size="14" text-anchor="middle">Contributions snake — a breve disponibile</text>`;
    } else {
        const dim = snakeContent.match(/<svg[^>]*\swidth="([\d.]+)"[^>]*\sheight="([\d.]+)"/);
        const BOX_X = 20, BOX_Y = 580, BOX_W = 800, BOX_H = 400, PAD = 20, TOP_OFFSET = 40;
        const srcW = dim ? parseFloat(dim[1]) : 880;
        const srcH = dim ? parseFloat(dim[2]) : 192;
        const availW = BOX_W - PAD * 2;
        const availH = BOX_H - TOP_OFFSET - PAD;
        const scale = Math.min(availW / srcW, availH / srcH);
        const scaledW = srcW * scale;
        const scaledH = srcH * scale;
        const tx = BOX_X + (BOX_W - scaledW) / 2;
        const ty = BOX_Y + TOP_OFFSET + (BOX_H - TOP_OFFSET - scaledH) / 2;
        snakeContent = snakeContent.replace(/<svg[^>]*>/i, '').replace(/<\/svg>/i, '');
        snakeContent = `<g transform="translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) scale(${scale.toFixed(4)})">${snakeContent}</g>`;
    }
    svg = svg.replace("{{SNAKE_SVG}}", snakeContent);

    // Spotify: estrae cover image dal badge SVG estero (no foreignObject = no HTML inside SVG)
    try {
        const spotRes = await fetch(SPOTIFY_URL);
        if (spotRes.ok) {
            const spotSvg = await spotRes.text();
            const coverMatch = spotSvg.match(/<img[^>]+src="([^"]+)"/);
            if (coverMatch) {
                const coverDataUri = await fetchAsDataUri(coverMatch[1]);
                if (coverDataUri) {
                    const spotReg = /<image\s+href="https:\/\/spotify-github-profile[^"]+"/;
                    svg = svg.replace(spotReg, `<image href="${coverDataUri}"`);
                }
            }
        }
    } catch {}

    fs.writeFileSync(OUTPUT_SVG_PATH, svg);
    console.log("html-wrapper.svg generato");
}

build();
