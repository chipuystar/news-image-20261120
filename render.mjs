// render.mjs — screenshot news.html (1024x1024) into entry.png via Chromium CDP.
// Usage: node render.mjs [html-file] [png-out]
// Defaults: news.html in this directory -> entry.png in this directory.
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const htmlFile = resolve(process.argv[2] ?? join(here, "news.html"));
const outFile = resolve(process.argv[3] ?? join(here, "entry.png"));
const CHROME = "/opt/meta-chromium/chrome";
const PORT = 9331;
const WIDTH = 1024;
const HEIGHT = 1024;

const POLICY_FILE = "/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt";
const POLICY_SHA256 = "8097045f0459c96c4cdc76e3a1af4e0f43f640b4b59c43d6db35e3641c0264c6";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForTargets() {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page) return page;
    } catch { /* not up yet */ }
    await sleep(200);
  }
  throw new Error("Chromium DevTools did not come up");
}

async function main() {
  const profile = mkdtempSync(join(tmpdir(), "news-render-"));
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--allow-file-access-from-files",
    `--hatch-webgl-allowed-domains-file=${POLICY_FILE}`,
    `--hatch-webgl-allowed-domains-sha256=${POLICY_SHA256}`,
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    "about:blank",
  ], { stdio: "ignore" });

  try {
    const page = await waitForTargets();
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

    let nextId = 1;
    const pending = new Map();
    let loadFired = null;
    const loadPromise = new Promise((res) => { loadFired = res; });
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve: ok, reject: bad } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) bad(new Error(JSON.stringify(msg.error)));
        else ok(msg.result);
      } else if (msg.method === "Page.loadEventFired") {
        loadFired();
      }
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false,
    });
    await send("Page.navigate", { url: `file://${htmlFile}` });
    await loadPromise;
    await sleep(400); // let fonts and layout settle
    const shot = await send("Page.captureScreenshot", {
      format: "png",
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT, scale: 1 },
      captureBeyondViewport: true,
      fromSurface: true,
    });
    writeFileSync(outFile, Buffer.from(shot.data, "base64"));
    console.log(`wrote ${outFile} (${Buffer.from(shot.data, "base64").length} bytes)`);
    ws.close();
  } finally {
    chrome.kill("SIGKILL");
    rmSync(profile, { recursive: true, force: true });
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
