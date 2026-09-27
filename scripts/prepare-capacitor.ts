import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, ".output", "public");
const assetsDir = path.join(publicDir, "assets");

if (!fs.existsSync(publicDir)) {
  console.error("Error: .output/public directory does not exist. Run 'npm run build' first.");
  process.exit(1);
}

const files = fs.readdirSync(assetsDir);
const cssFiles = files.filter((f) => f.endsWith(".css")).map((f) => `/assets/${f}`);
const jsClientFile = files.find((f) => f.startsWith("client-") && f.endsWith(".js"));
const jsIndexFile = files.find((f) => f.startsWith("index-") && f.endsWith(".js"));

const jsFiles = [jsClientFile, jsIndexFile].filter(Boolean).map((f) => `/assets/${f}`);

const cssTags = cssFiles.map((href) => `    <link rel="stylesheet" href="${href}" />`).join("\n");
const jsTags = jsFiles.map((src) => `    <script type="module" src="${src}"></script>`).join("\n");

const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#7a4a24" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Bible Atlas" />
    <title>Bible Atlas</title>
${cssTags}
  </head>
  <body class="bg-background text-foreground antialiased select-none">
    <div id="root"></div>
${jsTags}
  </body>
</html>
`;

const indexHtmlPath = path.join(publicDir, "index.html");
fs.writeFileSync(indexHtmlPath, indexHtmlContent, "utf8");
console.log(`✓ Generated ${indexHtmlPath} for Capacitor SPA entry point.`);

console.log("Syncing native Capacitor platforms...");
try {
  execSync("npx cap sync", { stdio: "inherit" });
  console.log("✓ Capacitor sync completed successfully.");
} catch (err) {
  console.error("Capacitor sync encountered an issue:", err);
}
