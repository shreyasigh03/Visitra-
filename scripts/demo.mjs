// Starts VISITRA with a temporary public link that works on phones: npm run demo
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { backend, exitWithProblems, faceService, findProblems, root, start, stopAll } from "./services.mjs";

const PORT = 5001;
const MIN_PASSWORD = 10;
const LINK_TIMEOUT_MS = 45_000;
const webDir = path.join(root, "demo-dist");
const tunnelCmd = process.env.TUNNEL_CMD || "cloudflared";

const problems = await findProblems([{ name: "backend", port: PORT }, faceService]);
if (problems.length) exitWithProblems(problems);

const dotenv = createRequire(path.join(backend, "package.json"))("dotenv");
const settings = dotenv.parse(readFileSync(path.join(backend, ".env")));
if ((settings.ADMIN_PASSWORD || "").length < MIN_PASSWORD) {
  problems.push(`The link is public, so ADMIN_PASSWORD in backend/.env needs at least ${MIN_PASSWORD} characters.`);
}
if (spawnSync(tunnelCmd, ["--version"]).error) problems.push("The free tool cloudflared is not installed.");
if (problems.length) exitWithProblems(problems);

console.log("\nPreparing the website...");
const build = spawnSync(process.execPath, ["node_modules/vite/bin/vite.js", "build", "--outDir", webDir, "--emptyOutDir"], {
  cwd: root,
  env: { ...process.env, VITE_SAME_ORIGIN: "true" },
  encoding: "utf8",
});
if (build.status !== 0) {
  console.error(build.stdout, build.stderr);
  exitWithProblems(["The website could not be built. See the message above."]);
}

console.log("Getting the public link...");
let link = "";
const recent = [];
const timer = setTimeout(() => {
  console.error(recent.join("\n"));
  console.error("\nNo public link yet. Check the internet, or use your phone's hotspot, then start again.\n");
  stopAll();
  process.exitCode = 1;
}, LINK_TIMEOUT_MS);

start(
  // http2 instead of UDP, which college networks often block.
  { name: "tunnel", cwd: root, cmd: tunnelCmd, args: ["tunnel", "--protocol", "http2", "--url", `http://127.0.0.1:${PORT}`] },
  (line) => {
    recent.push(line);
    if (recent.length > 20) recent.shift();
    const found = /https:\/\/(?!api\.)[a-z0-9-]+\.trycloudflare\.com/.exec(line)?.[0];
    if (!found || link) return;
    link = found;
    clearTimeout(timer);
    run();
  },
);

function run() {
  // Keeps a Mac awake while the demo runs.
  if (process.platform === "darwin") start({ name: "awake", cwd: root, cmd: "caffeinate", args: ["-dims"] });
  start(faceService);
  start({
    name: "backend",
    cwd: backend,
    cmd: process.execPath,
    args: ["server.js"],
    env: { PORT: String(PORT), WEB_URL: link, WEB_DIR: webDir },
  });
  console.log(`
==================================================================
  VISITRA is open on any phone or laptop at:

  ${link}

  Wait about 30 seconds for the face service.
  Keep this window open. The link changes each time you start again.
  Press Ctrl+C to close the link and stop everything.
==================================================================
`);
}
