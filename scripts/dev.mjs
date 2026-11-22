// Starts the website, backend and face service together: npm run dev:all
import { backend, exitWithProblems, faceService, findProblems, portInUse, root, start } from "./services.mjs";

const services = [
  { name: "web", port: 5173, cwd: root, cmd: process.execPath, args: ["node_modules/vite/bin/vite.js", "--port", "5173", "--strictPort"] },
  { name: "backend", port: 5001, cwd: backend, cmd: process.execPath, args: ["node_modules/nodemon/bin/nodemon.js", "server.js"] },
  faceService,
];

const problems = await findProblems([]);
if (problems.length) exitWithProblems(problems);

// A part that another terminal already runs is used as it is.
const missing = [];
for (const service of services) {
  if (await portInUse(service.port)) console.log(`[${service.name}] already running on port ${service.port}`);
  else missing.push(service);
}
if (missing.length === 0) {
  console.log("\nVISITRA is already running. Open http://localhost:5173\n");
  process.exit(0);
}
for (const service of missing) start(service);
console.log("\nStarting VISITRA. Open http://localhost:5173 (face service takes about 30 seconds).\nPress Ctrl+C to stop everything.\n");
