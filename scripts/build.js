import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BENTO_HTML_PATH = path.join(__dirname, "../src/bento-grid.html");
const OUTPUT_SVG_PATH = path.join(__dirname, "../html-wrapper.svg");

const GITHUB_USER = "Marcu08";
const SNAKE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_USER}/output/github-contribution-grid-snake-dark.svg`;

async function build() {
    let html = fs.readFileSync(BENTO_HTML_PATH, "utf-8");

    let snakeContent;
    try {
        const res = await fetch(SNAKE_URL);
        if (res.ok) snakeContent = await res.text();
    } catch {}
    if (!snakeContent) {
        snakeContent = `<div style="color:#666;padding:40px;text-align:center;font-size:14px;">Contributions snake — a breve disponibile</div>`;
    }

    html = html.replace("{{SNAKE_SVG}}", snakeContent);

    const svg = `<svg width="840" height="950" xmlns="http://www.w3.org/2000/svg">
  <foreignObject width="100%" height="100%">
    ${html}
  </foreignObject>
</svg>`;

    fs.writeFileSync(OUTPUT_SVG_PATH, svg);
    console.log("html-wrapper.svg generato");
}

build();
