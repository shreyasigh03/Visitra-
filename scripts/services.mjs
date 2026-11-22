// Shared by dev.mjs and demo.mjs: paths, checks before starting, and running services.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const backend = path.join(root, "backend");
export const ai = path.join(root, "ai-service");
// Always this Python: it is the only one with the face libraries installed.
export const python = path.join(ai, ".venv", ...(process.platform === "win32" ? ["Scripts", "python.exe"] : ["bin", "python"]));

export const faceService = {
  name: "face",
  port: 8000,
  cwd: ai,
  cmd: python,
  args: ["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
};

const canConnect = (port, host) =>
  new Promise((resolve) => {
    const socket = net.connect({ port, host });
    socket.once("error", () => resolve(false));
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
  });

export const portInUse = async (port) => (await canConnect(port, "127.0.0.1")) || (await canConnect(port, "::1"));

export async function findProblems(services) {
  const problems = [];
  if (!existsSync(path.join(root, "node_modules"))) problems.push("Website packages are missing. Run: npm install");
  if (!existsSync(path.join(backend, "node_modules"))) problems.push("Backend packages are missing. Run: npm install --prefix backend");
  if (!existsSync(path.join(backend, ".env"))) problems.push("backend/.env is missing. Copy backend/.env.example and fill it in.");
  if (!existsSync(python)) problems.push("ai-service/.venv is missing. See 'Face service' in README.md.");
  for (const { name, port } of services) {
    if (await portInUse(port)) problems.push(`Port ${port} (${name}) is already in use. Close the other terminal running it.`);
  }
  return problems;
}

export function exitWithProblems(problems) {
  console.error(`\nCould not start VISITRA:\n- ${problems.join("\n- ")}\n`);
  process.exit(1);
}

const children = [];
let stopping = false;

// Prints each line with the service name. onLine sees every line too.
export function start({ name, cwd, cmd, args, env }, onLine) {
  const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
  const print = (chunk) => {
    for (const line of chunk.toString().split("\n")) {
      if (!line.trim()) continue;
      if (onLine) onLine(line);
      else console.log(`[${name}] ${line}`);
    }
  };
  child.stdout.on("data", print);
  child.stderr.on("data", print);
  child.on("error", (err) => console.error(`[${name}] could not start: ${err.message}`));
  child.on("exit", (code) => {
    if (!stopping) console.error(`[${name}] stopped (code ${code}). Press Ctrl+C, fix the error above, then start again.`);
  });
  children.push(child);
  return child;
}

export function stopAll() {
  stopping = true;
  // SIGINT, like Ctrl+C: nodemon then also stops the backend it started.
  for (const child of children) child.kill("SIGINT");
}
process.on("SIGINT", stopAll);
process.on("SIGTERM", stopAll);
