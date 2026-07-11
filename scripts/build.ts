import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BENTO_HTML_PATH = path.join(__dirname, "../src/bento-grid.html");
const OUTPUT_SVG_PATH = path.join(__dirname, "../html-wrapper.svg");

const SNAKE_URL = "https://raw.githubusercontent.com/Platane/snk/output/github-contribution-grid-snake-dark.svg";
const SPOTIFY_URL = "https://spotify-github-profile.kittinanx.com/api/view?uid=g94czyi452vvziaas0pheb84q&cover_image=true&theme=default&show_offline=false&background_color=0d1117&interchange=true&bar_color=53b14f&bar_color_cover=true";

async function build() {
    let html = fs.readFileSync(BENTO_HTML_PATH, "utf-8");

    // Fetch Snake SVG
    const snakeRes = await fetch(SNAKE_URL);
    const snakeSvg = await snakeRes.text();

    // Fetch Spotify SVG
    const spotifyRes = await fetch(SPOTIFY_URL);
    let spotifySvg = await spotifyRes.text();
    spotifySvg = spotifySvg.replace(/<a[^>]*>|<\/a>/g, "").replace(/<image[^>]*>/g, ""); // Rimuovi link e immagini interne per evitare problemi di rendering

    html = html.replace("{{SNAKE_SVG}}", snakeSvg);
    html = html.replace("{{SPOTIFY_SVG}}", spotifySvg);

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: "new",
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const svgContent = await page.evaluate(() => {
        const serializer = new XMLSerializer();
        const svgElement = document.querySelector('.grid'); // Seleziona l'elemento principale della griglia
        if (!svgElement) return '';

        // Imposta le dimensioni dell'SVG in base al contenuto della griglia
        const bbox = svgElement.getBoundingClientRect();
        const width = bbox.width;
        const height = bbox.height;

        // Crea un elemento SVG wrapper
        const svgWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgWrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svgWrapper.setAttribute('width', width.toString());
        svgWrapper.setAttribute('height', height.toString());
        svgWrapper.setAttribute('viewBox', `0 0 ${width} ${height}`);

        // Clona il contenuto della griglia e aggiungilo all'SVG wrapper
        const clonedGrid = svgElement.cloneNode(true);
        svgWrapper.appendChild(clonedGrid);

        return serializer.serializeToString(svgWrapper);
    });

    fs.writeFileSync(OUTPUT_SVG_PATH, svgContent);

    await browser.close();
}

build();
