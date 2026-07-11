import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BENTO_HTML_PATH = path.join(__dirname, "../src/bento-grid.html");
const OUTPUT_SVG_PATH = path.join(__dirname, "../html-wrapper.svg");

const GITHUB_USER = "Marcu08";
const SNAKE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_USER}/output/github-contribution-grid-snake-dark.svg`;
const SPOTIFY_UID = "g94czyi452vvziaas0pheb84q";
const SPOTIFY_API_URL = `https://spotify-github-profile.kittinanx.com/api/view?uid=${SPOTIFY_UID}&cover_image=true&theme=default&show_offline=false&background_color=121212&interchange=false&profanity=false&hide_remaster=false`;

function spotifyPlaceholder() {
    return `<a href="https://open.spotify.com/user/${SPOTIFY_UID}">
        <div style="background:#1DB954;border-radius:10px;padding:30px 20px;text-align:center;">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="white">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <p style="color:white;font-weight:bold;font-size:18px;margin:10px 0 0;">Ascolta su Spotify</p>
        </div>
    </a>`;
}

async function build() {
    let html = fs.readFileSync(BENTO_HTML_PATH, "utf-8");

    const [snakeContent, spotifyCard] = await Promise.all([
        (async () => {
            try {
                const res = await fetch(SNAKE_URL);
                if (res.ok) return await res.text();
            } catch {}
            return `<div style="color:#666;padding:40px;text-align:center;font-size:14px;">Contributions snake — a breve disponibile</div>`;
        })(),
        (async () => {
            try {
                const res = await fetch(SPOTIFY_API_URL);
                const text = await res.text();
                if (!text.includes("Error: Invalid")) return text;
            } catch {}
            return spotifyPlaceholder();
        })(),
    ]);

    html = html.replace("{{SNAKE_SVG}}", snakeContent);
    html = html.replace("{{SPOTIFY_CARD}}", spotifyCard);

    const svg = `<svg width="840" height="950" xmlns="http://www.w3.org/2000/svg">
  <foreignObject width="100%" height="100%">
    ${html}
  </foreignObject>
</svg>`;

    fs.writeFileSync(OUTPUT_SVG_PATH, svg);
    console.log("html-wrapper.svg generato");
}

build();
