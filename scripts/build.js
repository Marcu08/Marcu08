import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SVG_TEMPLATE_PATH = path.join(__dirname, "../src/bento-grid.svg");
const OUTPUT_SVG_PATH = path.join(__dirname, "../html-wrapper.svg");

const GITHUB_USER = "Marcu08";
const SNAKE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_USER}/output/github-contribution-grid-snake-dark.svg`;
const SPOTIFY_URL = "https://spotify-github-profile.kittinanx.com/api/view?uid=g94czyi452vvziaas0pheb84q&cover_image=true&theme=natemoo-re&show_offline=true&background_color=121212&interchange=true";

async function fetchAsDataUri(url) {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ctype = res.headers.get("content-type") || "";
    const ext = ctype.includes("svg") ? "svg+xml" : (ctype.includes("png") ? "png" : "svg+xml");
    const buf = await res.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    return `data:image/${ext};base64,${b64}`;
}

function escapeXml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

    // Spotify: scarica badge, estrae dati via regex, ricostruisce in SVG puro (no foreignObject)
    let spotContent = '';
    try {
        const spotRes = await fetch(SPOTIFY_URL);
        if (spotRes.ok) {
            const spotSvg = await spotRes.text();

            // Estrai cover URL dall'<img> dentro il foreignObject
            const coverMatch = spotSvg.match(/<img[^>]+class="cover"[^>]+src="([^"]+)"/i);
            const coverUrl = coverMatch ? coverMatch[1] : null;

            // Estrai artista e song
            const artMatch = spotSvg.match(/<div[^>]+class="artist"[^>]*>([\s\S]*?)<\/div>/i);
            const songMatch = spotSvg.match(/<div[^>]+class="song"[^>]*>([\s\S]*?)<\/div>/i);
            const isPlaying = spotSvg.includes('class="container playing"') && !spotSvg.includes('class="container not-play"');

            let artist = artMatch ? artMatch[1].trim() : 'Spotify';
            let song = songMatch ? songMatch[1].trim() : 'Not playing';
            // Pulizia da eventuali tag HTML annidati
            artist = artist.replace(/<[^>]+>/g, '').trim();
            song = song.replace(/<[^>]+>/g, '').trim();

            // Se non in riproduzione, messaggio offline
            if (!isPlaying) {
                song = 'Currently not playing';
                artist = 'Awaiting your next track';
            }

            // Cover come data URI (evita blocchi GitHub)
            let coverDataUri = null;
            if (coverUrl && coverUrl.startsWith('http')) {
                coverDataUri = await fetchAsDataUri(coverUrl);
            }

            // Crea card SVG pura
            const cardW = 320, cardH = 84;
            const coverSize = 62;
            const cardX = 0, cardY = 0;
            const coverX = cardX + 13, coverY = cardY + (cardH - coverSize) / 2;
            const textX = coverX + coverSize + 14;
            const textY = cardY + 28;

            let lines = '';
            if (coverDataUri) {
                // Cover come pattern/image inline
                lines += `<image href="${coverDataUri}" x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#spotClip)"/>`;
            } else {
                // Placeholder rosso se cover non disponibile
                lines += `<rect x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" rx="8" fill="#282828"/>`;
                lines += `<text x="${coverX + coverSize / 2}" y="${coverY + coverSize / 2 + 5}" fill="#fff" font-family="sans-serif" font-size="18" text-anchor="middle" font-weight="bold">♪</text>`;
            }

            // Indicatore playing / offline
            const dotColor = isPlaying ? '#1DB954' : '#666';
            const statusLabel = isPlaying ? 'NOW PLAYING' : 'OFFLINE';
            lines += `<circle cx="${textX + 6}" cy="${textY - 4}" r="4" fill="${dotColor}"/>`;
            lines += `<text x="${textX + 15}" y="${textY}" fill="#9e9e9e" font-family="sans-serif" font-size="9" font-weight="600" letter-spacing="1.5">${statusLabel}</text>`;

            // Artista (bold, bianco)
            lines += `<text x="${textX}" y="${textY + 24}" fill="#fff" font-family="sans-serif" font-size="14" font-weight="600">${escapeXml(artist)}</text>`;

            // Song (grigio, eventualmente troncata)
            const maxChars = Math.floor((cardW - textX - 10) / 7); // ~7px per char
            const displaySong = song.length > maxChars ? song.substring(0, maxChars - 2) + '…' : song;
            lines += `<text x="${textX}" y="${textY + 44}" fill="#b3b3b3" font-family="sans-serif" font-size="12">${escapeXml(displaySong)}</text>`;

            // Logo Spotify in alto a destra
            lines += `<svg x="${cardW - 28}" y="10" width="18" height="18" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.72.48-1.08.24-2.88-1.68-6.48-2.04-10.68-1.08-.36.12-.72-.12-.84-.48-.12-.36.12-.72.48-.84 4.56-1.08 8.52-.6 11.76 1.2.36.12.48.6.36.96zm1.44-3.24c-.3.42-.84.6-1.26.3-3.24-2.04-8.28-2.64-12.24-1.44-.48.12-.96-.12-1.08-.6 0-.48.24-.84.72-.96 4.56-1.32 10.08-.72 13.8 1.68.48.24.6.78.3 1.2zm.12-3.36c-3.84-2.28-10.2-2.52-13.92-1.44-.6.12-1.2-.24-1.32-.84s.24-1.2.84-1.32c4.32-1.2 11.28-.96 15.72 1.68.48.24.72.84.48 1.32-.24.48-.84.72-1.32.6z"/></svg>`;

            const cardSvg = `<rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="8" fill="#121212"/>
<defs><clipPath id="spotClip"><rect x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" rx="8"/></clipPath></defs>
${lines}`;

            // Scala e centra nel box
            const boxX = 440, boxY = 220, boxW = 370, boxH = 330;
            const scale = Math.min(boxW / cardW, boxH / cardH);
            const scW = cardW * scale, scH = cardH * scale;
            const tx = boxX + (boxW - scW) / 2;
            const ty = boxY + (boxH - scH) / 2;
            spotContent = `<g transform="translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) scale(${scale.toFixed(4)})">${cardSvg}</g>`;
        }
    } catch {}

    if (spotContent) {
        const spotReg = /<image\s+href="https:\/\/spotify-github-profile[^"]*"[^>]*\/>/;
        svg = svg.replace(spotReg, spotContent);
    }

    fs.writeFileSync(OUTPUT_SVG_PATH, svg);
    console.log("html-wrapper.svg generato");
}

build();
