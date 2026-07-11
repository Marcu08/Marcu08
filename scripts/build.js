import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SVG_TEMPLATE_PATH = path.join(__dirname, "../src/bento-grid.svg");
const OUTPUT_SVG_PATH = path.join(__dirname, "../html-wrapper.svg");

const GITHUB_USER = "Marcu08";
const SNAKE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_USER}/output/github-contribution-grid-snake-dark.svg`;

async function build() {
    let svg = fs.readFileSync(SVG_TEMPLATE_PATH, "utf-8");

    let snakeContent;
    try {
        const res = await fetch(SNAKE_URL);
        if (res.ok) snakeContent = await res.text();
    } catch {}
    if (!snakeContent) {
        snakeContent = `<text x="420" y="780" fill="#666" font-family="Arial,sans-serif" font-size="14" text-anchor="middle">Contributions snake — a breve disponibile</text>`;
    } else {
        snakeContent = snakeContent.replace(/<svg[^>]*>/i, '').replace(/<\/svg>/i, '');
        snakeContent = `<g transform="translate(40, 600)">${snakeContent}</g>`;
    }

    svg = svg.replace("{{SNAKE_SVG}}", snakeContent);

    fs.writeFileSync(OUTPUT_SVG_PATH, svg);
    console.log("html-wrapper.svg generato");
}

build();
