import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BENTO_HTML_PATH = path.join(__dirname, "../src/bento-grid.html");
const OUTPUT_SVG_PATH = path.join(__dirname, "../html-wrapper.svg");

const GITHUB_USER = "Marcu08";
const SNAKE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_USER}/output/github-contribution-grid-snake-dark.svg`;
const SPOTIFY_URL = "https://spotify-github-profile.kittinanx.com/api/view?uid=g94czyi452vvziaas0pheb84q&cover_image=true&theme=default&show_offline=false&background_color=0d1117&interchange=true&bar_color=53b14f&bar_color_cover=true";

async function build() {
    let html = fs.readFileSync(BENTO_HTML_PATH, "utf-8");

    const [snakeSvg, spotifySvg] = await Promise.all([
        fetch(SNAKE_URL).then((r) => r.text()),
        fetch(SPOTIFY_URL).then((r) => r.text()),
    ]);

    html = html.replace("{{SNAKE_SVG}}", snakeSvg);
    html = html.replace("{{SPOTIFY_SVG}}", spotifySvg);

    const svg = `<svg width="840" height="800" xmlns="http://www.w3.org/2000/svg">
  <foreignObject width="100%" height="100%">
    ${html}
  </foreignObject>
</svg>`;

    fs.writeFileSync(OUTPUT_SVG_PATH, svg);
    console.log("html-wrapper.svg generato");
}

build();
