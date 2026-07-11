import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SVG_TEMPLATE_PATH = path.join(__dirname, "../src/bento-grid.svg");
const OUTPUT_SVG_PATH = path.join(__dirname, "../html-wrapper.svg");

const GITHUB_USER = "Marcu08";
const SNAKE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_USER}/output/github-contribution-grid-snake-dark.svg`;
const SPOTIFY_URL = "https://spotify-github-profile.kittinanx.com/api/view?uid=g94czyi452vvziaas0pheb84q&cover_image=true&theme=default&show_offline=false&background_color=121212&interchange=false&profanity=false&hide_remaster=false";

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

    // Spotify: costruisce SVG puro (remote URL bloccato da GitHub, foreignObject non supportato)
    try {
        const spotReg = /<image\s+href="https:\/\/spotify-github-profile[^"]*"[^>]*\/>/;
        const spotRes = await fetch(SPOTIFY_URL);
        if (spotRes.ok) {
            const spotSvg = await spotRes.text();
            const coverMatch = spotSvg.match(/<img[^>]+src="([^"]+)"/);
            const artistMatch = spotSvg.match(/<div class="artist">([^<]*)<\/div>/);
            const songMatch = spotSvg.match(/<div class="song">([^<]*)<\/div>/);
            const isPlaying = /playing/i.test(spotSvg) && !/not.play/i.test(spotSvg);
            const cx = 615, cy = 385;
            let sc = "";
            if (coverMatch) {
                const cd = await fetchAsDataUri(coverMatch[1]);
                if (cd) sc += `<image href="${cd}" x="${cx - 100}" y="${cy - 130}" width="200" height="200" rx="4" />`;
            }
            const sc2 = isPlaying ? "#53b14f" : "#b3b3b3";
            const label = isPlaying ? "In riproduzione" : "Ultima traccia";
            sc += `<rect x="${cx - 60}" y="${cy + 85}" width="120" height="24" rx="12" fill="${sc2}" fill-opacity="0.15" />`;
            sc += `<text x="${cx}" y="${cy + 101}" fill="${sc2}" font-family="Arial,sans-serif" font-size="12" font-weight="bold" text-anchor="middle">${label}</text>`;
            if (songMatch) {
                const s = songMatch[1].trim().slice(0, 28);
                sc += `<text x="${cx}" y="${cy + 125}" fill="#fff" font-family="Arial,sans-serif" font-size="15" font-weight="bold" text-anchor="middle">${s}</text>`;
            }
            if (artistMatch) {
                const a = artistMatch[1].trim().slice(0, 35);
                sc += `<text x="${cx}" y="${cy + 145}" fill="#b3b3b3" font-family="Arial,sans-serif" font-size="13" text-anchor="middle">${a}</text>`;
            }
            svg = svg.replace(spotReg, sc);
        } else {
            svg = svg.replace(spotReg, `<text x="615" y="420" fill="#b3b3b3" font-family="Arial,sans-serif" font-size="14" text-anchor="middle">Spotify — nessun dato</text>`);
        }
    } catch {
        svg = svg.replace(/<image\s+href="https:\/\/spotify-github-profile[^"]*"[^>]*\/>/, `<text x="615" y="420" fill="#b3b3b3" font-family="Arial,sans-serif" font-size="14" text-anchor="middle">Spotify — nessun dato</text>`);
    }

    fs.writeFileSync(OUTPUT_SVG_PATH, svg);
    console.log("html-wrapper.svg generato");
}

build();
