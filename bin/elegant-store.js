#!/usr/bin/env node

import fs from "fs";
import http from "http";
import path from "path";
import readline from "readline";
import { execSync } from "child_process";
import { createStore } from "../dist/index.js";

// Colors and Styling Tokens
const PURPLE = "\x1b[38;5;99m";
const CYAN = "\x1b[38;5;51m";
const GREEN = "\x1b[38;5;82m";
const RED = "\x1b[38;5;196m";
const GREY = "\x1b[38;5;244m";
const DARK_GREY = "\x1b[38;5;238m";
const WHITE = "\x1b[1m\x1b[37m";
const MAGENTA = "\x1b[38;5;207m";
const GOLD = "\x1b[38;5;214m";
const RESET = "\x1b[0m";

// Strips ANSI escape codes to measure true visible length
function visLen(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, "").length;
}

// Centers text inside a bordered row of total width w (including the two border chars)
function centerLine(txt, w) {
  const inner = w - 2;
  const visible = visLen(txt);
  const pad = Math.max(0, inner - visible);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  return (
    PURPLE + "\u2502" + RESET +
    " ".repeat(left) + txt + " ".repeat(right) +
    PURPLE + "\u2502" + RESET
  );
}

// Prints the new block-style logo
function printBanner() {
  console.clear();

  const W = 62; // total width including border chars

  const top    = PURPLE + "\u256d" + "\u2500".repeat(W - 2) + "\u256e" + RESET;
  const divider = PURPLE + "\u251c" + "\u2500".repeat(W - 2) + "\u2524" + RESET;
  const bottom = PURPLE + "\u2570" + "\u2500".repeat(W - 2) + "\u256f" + RESET;

  // Block-pixel logo: ELEGANT  STORE
  // Using Unicode half-block chars: \u2580 \u2584 \u2588
  const U = "\u2588"; // full block
  const T = "\u2580"; // upper half
  const B = "\u2584"; // lower half

  const row1 =
    CYAN  + U+T+T+" "+U+" "+U+T+T+" "+U+T+T+" "+U+T+B+" "+U+B+" "+U+" "+T+U+T+"  " + RESET +
    PURPLE + B+T+T+" "+T+U+T+" "+U+T+T+" "+U+T+T + RESET;

  const row2 =
    CYAN  + U+B+B+" "+U+B+B+" "+U+B+B+" "+U+B+B+" "+U+T+U+" "+U+" "+U+"  "+U+"   " + RESET +
    PURPLE + T+T+B+" " +U+" "+U+B+B+" "+U+B+B + RESET;

  const tagline = GOLD + "\u2726  Premium React State Management  \u2726" + RESET;
  const sub     = GREY + "v3  \u00b7  Zero Boilerplate  \u00b7  Full TypeScript" + RESET;

  console.log(top);
  console.log(centerLine("", W));
  console.log(centerLine(
    CYAN  + " \u2588\u2580\u2580 \u2588   \u2588\u2580\u2580 \u2588\u2580\u2580 \u2584\u2580\u2584 \u2588\u2584 \u2588 \u2580\u2588\u2580  " + RESET +
    PURPLE + " \u2584\u2580\u2580 \u2580\u2588\u2580 \u2588\u2580\u2580 \u2588\u2580\u2580" + RESET,
    W
  ));
  console.log(centerLine(
    CYAN  + " \u2588\u2584\u2584 \u2588\u2584\u2584 \u2588\u2584\u2584 \u2588\u2584\u2584 \u2588\u2580\u2588 \u2588 \u2580\u2588  \u2588   " + RESET +
    PURPLE + " \u2580\u2580\u2584  \u2588  \u2588\u2584\u2584 \u2588\u2584\u2584" + RESET,
    W
  ));
  console.log(centerLine("", W));
  console.log(divider);
  console.log(centerLine(tagline, W));
  console.log(centerLine(sub, W));
  console.log(centerLine("", W));
  console.log(bottom);
  console.log("");
}

// Detect the workspace package manager
function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent || "";
  if (userAgent.includes("pnpm")) return "pnpm";
  if (userAgent.includes("yarn")) return "yarn";
  if (userAgent.includes("bun")) return "bun";
  if (userAgent.includes("npm")) return "npm";

  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(dir, "pnpm-lock.yaml"))) return "pnpm";
    if (fs.existsSync(path.join(dir, "yarn.lock"))) return "yarn";
    if (fs.existsSync(path.join(dir, "package-lock.json"))) return "npm";
    if (fs.existsSync(path.join(dir, "bun.lockb")) || fs.existsSync(path.join(dir, "bun.lock"))) return "bun";
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return "npm";
}

// Interactive Keyboard Navigation Menu
async function selectMenu(title, options) {
  let selectedIndex = 0;
  const stdout = process.stdout;

  const render = () => {
    stdout.write("\x1b[?25l"); // Hide cursor
    readline.cursorTo(stdout, 0);
    stdout.write(`   ${WHITE}${title}${RESET}\n\n`);

    options.forEach((opt, idx) => {
      if (idx === selectedIndex) {
        stdout.write(`    ${CYAN}\u279c ${WHITE}${opt}${RESET}\n`);
      } else {
        stdout.write(`      ${GREY}${opt}${RESET}\n`);
      }
    });
    stdout.write(`\n   ${DARK_GREY}Use \u2191/\u2193 arrows to navigate, Enter to select.${RESET}\n`);
  };

  const clearLines = (count) => {
    for (let i = 0; i < count; i++) {
      readline.moveCursor(stdout, 0, -1);
      readline.clearLine(stdout, 0);
    }
  };

  render();

  return new Promise((resolve) => {
    const handleKeypress = (_str, key) => {
      if (key && key.ctrl && key.name === "c") {
        stdout.write("\x1b[?25h");
        process.exit(0);
      }

      if (key && key.name === "up") {
        selectedIndex = (selectedIndex - 1 + options.length) % options.length;
        clearLines(options.length + 4);
        render();
      } else if (key && key.name === "down") {
        selectedIndex = (selectedIndex + 1) % options.length;
        clearLines(options.length + 4);
        render();
      } else if (key && key.name === "return") {
        cleanup();
        stdout.write("\x1b[?25h\n");
        resolve(selectedIndex);
      }
    };

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.on("keypress", handleKeypress);

    const cleanup = () => {
      process.stdin.off("keypress", handleKeypress);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
    };
  });
}

// Function to run Option 1: Setup & Generate Example
async function setupAndInstall() {
  printBanner();
  const pm = detectPackageManager();
  console.log(`   ${WHITE}\u{1F4E6} Detected Workspace Package Manager:${RESET} ${GREEN}${pm}${RESET}\n`);

  let installCmd = "";
  switch (pm) {
    case "npm":  installCmd = "npm install elegant-store"; break;
    case "pnpm": installCmd = "pnpm add elegant-store";   break;
    case "yarn": installCmd = "yarn add elegant-store";   break;
    case "bun":  installCmd = "bun add elegant-store";    break;
  }

  try {
    console.log(`   ${CYAN}\u26a1 Installing elegant-store in the current project...${RESET}`);
    console.log(`   ${GREY}> ${installCmd}${RESET}\n`);
    execSync(installCmd, { stdio: "inherit" });

    // Detect TypeScript project
    const isTS =
      fs.existsSync(path.join(process.cwd(), "tsconfig.json")) ||
      (fs.existsSync(path.join(process.cwd(), "package.json")) &&
        fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8").includes("typescript"));

    const ext = isTS ? "ts" : "js";
    const hasSrc = fs.existsSync(path.join(process.cwd(), "src"));
    const relativeStorePath = hasSrc ? `src/store.${ext}` : `store.${ext}`;
    const storePath = path.join(process.cwd(), relativeStorePath);

    const storeContent = isTS
      ? `import { createStore } from "elegant-store";\n\n// Initialize your Elegant Store with automatic type inference\nexport const counterStore = createStore(\n  { count: 0 },\n  {\n    increment: (state) => ({ count: state.count + 1 }),\n    decrement: (state) => ({ count: state.count - 1 }),\n    reset: () => ({ count: 0 }),\n    set: (_state, val: number) => ({ count: val }),\n  }\n);\n`
      : `import { createStore } from "elegant-store";\n\n// Initialize your Elegant Store\nexport const counterStore = createStore(\n  { count: 0 },\n  {\n    increment: (state) => ({ count: state.count + 1 }),\n    decrement: (state) => ({ count: state.count - 1 }),\n    reset: () => ({ count: 0 }),\n    set: (_state, val) => ({ count: val }),\n  }\n);\n`;

    fs.writeFileSync(storePath, storeContent);

    const importPath = "./" + relativeStorePath.replace("src/", "").replace(/\.(ts|js)$/, "");

    console.log(`\n   ${GREEN}\u2714 Package installed successfully!${RESET}`);
    console.log(`   ${GREEN}\u2714 Created demo store at:${RESET} ${CYAN}./${relativeStorePath}${RESET}\n`);

    console.log(`   ${WHITE}\u{1F680} How to use your store in React:${RESET}`);
    console.log(`     ${GOLD}1. Import your store:${RESET}`);
    console.log(`        ${GREY}import { counterStore } from "${importPath}";${RESET}\n`);
    console.log(`     ${GOLD}2. Call the useStore hook on it inside your component:${RESET}`);
    console.log(`        ${GREY}const { state, increment, decrement } = counterStore.useStore();${RESET}\n`);
    console.log(`     ${GOLD}3. Render state and trigger actions:${RESET}`);
    console.log(`        ${GREY}<button onClick={increment}>Count: {state.count}</button>${RESET}\n`);
    console.log(`   ${GREEN}\u2728 You're all set! Start building elegant state machines! \u2728${RESET}\n`);

    // Pause to let user read
    console.log(`   ${GREY}Press any key to return to the main menu...${RESET}`);
    await waitForKey();
  } catch (error) {
    console.log(`\n   ${RED}\u2716 Failed to run installer: ${error.message}${RESET}\n`);
    console.log(`   ${GREY}Press any key to return to the main menu...${RESET}`);
    await waitForKey();
  }
}

function waitForKey() {
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once("data", () => {
      process.stdin.setRawMode(false);
      resolve();
    });
  });
}

// Function to run Option 2: Live Local Demo
function runLocalDemo() {
  console.clear();
  const store = createStore(
    { count: 0 },
    {
      increment: (state) => ({ count: state.count + 1 }),
      decrement: (state) => ({ count: state.count - 1 }),
      reset: () => ({ count: 0 }),
      set: (_state, val) => ({ count: val }),
    }
  );

  const historyLogs = [];
  const PORT = 3000;

  function logAction(message) {
    const time = new Date().toTimeString().split(" ")[0];
    historyLogs.push(`[${time}] ${message}`);
    if (historyLogs.length > 5) historyLogs.shift();
  }

  function drawDashboard() {
    const state = store.getState();
    const width = 60;
    const stdout = process.stdout;

    stdout.write("\x1b[2J\x1b[H");

    let out = "";

    // Header
    out += `${PURPLE}\u250c${"\u2500".repeat(width - 2)}\u2510${RESET}\n`;
    out += `${PURPLE}\u2502${WHITE}       \u2728  ELEGANT STORE \u2014 INTERACTIVE LIVE DASHBOARD  \u2728       ${PURPLE}\u2502${RESET}\n`;
    out += `${PURPLE}\u2514${"\u2500".repeat(width - 2)}\u2518${RESET}\n\n`;

    // Counter
    out += `   ${WHITE}STORE STATE:${RESET}\n`;
    out += `   ${GREY}Count:${RESET}  ${GREEN}${state.count >= 0 ? "\u25b2" : "\u25bc"} ${state.count}${RESET}\n`;

    // Progress bar
    const barWidth = 30;
    const maxVal = 20;
    const pct = Math.min(Math.max((state.count + maxVal) / (maxVal * 2), 0), 1);
    const filled = Math.round(barWidth * pct);
    const empty = barWidth - filled;
    out += `   ${GREY}Range [-20,20]:${RESET} [${GREEN}${"\u2588".repeat(filled)}${DARK_GREY}${"\u2591".repeat(empty)}${RESET}] (${Math.round(pct * 100)}%)\n\n`;

    // Server info
    out += `   ${WHITE}REMOTE SERVER:${RESET}\n`;
    out += `   ${GREY}Status:${RESET}  ${GREEN}\u25cf Online${RESET} \u2014 ${CYAN}http://localhost:${PORT}${RESET}\n`;
    out += `   ${GREY}Endpoints:${RESET}\n`;
    out += `     ${MAGENTA}\u25b8 GET /increment${RESET}   ${DARK_GREY}\u2192 increment count${RESET}\n`;
    out += `     ${MAGENTA}\u25b8 GET /decrement${RESET}   ${DARK_GREY}\u2192 decrement count${RESET}\n`;
    out += `     ${MAGENTA}\u25b8 GET /set?val=N${RESET}   ${DARK_GREY}\u2192 set count to N${RESET}\n`;
    out += `     ${MAGENTA}\u25b8 GET /reset${RESET}       ${DARK_GREY}\u2192 reset count${RESET}\n\n`;

    // Logs
    out += `   ${WHITE}ACTION LOG:${RESET}\n`;
    if (historyLogs.length === 0) {
      out += `     ${DARK_GREY}(no actions yet)${RESET}\n`;
    } else {
      historyLogs.forEach((log) => { out += `     ${log}\n`; });
    }
    out += "\n";

    // Footer
    out += `${PURPLE}\u250c${"\u2500".repeat(width - 2)}\u2510${RESET}\n`;
    out += `${PURPLE}\u2502${WHITE}  [Space/+] Inc   [-] Dec   [R] Reset   [Q] Quit & Stop   ${PURPLE}\u2502${RESET}\n`;
    out += `${PURPLE}\u2514${"\u2500".repeat(width - 2)}\u2518${RESET}\n`;

    stdout.write(out);
  }

  store.subscribe(drawDashboard);

  const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    const parsed = new URL(req.url || "", `http://localhost:${PORT}`);
    const p = parsed.pathname;
    const ip = req.socket.remoteAddress || "127.0.0.1";

    if (p === "/increment") {
      store.actions.increment();
      logAction(`Remote [increment] from ${ip}`);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, count: store.getState().count }));
    } else if (p === "/decrement") {
      store.actions.decrement();
      logAction(`Remote [decrement] from ${ip}`);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, count: store.getState().count }));
    } else if (p === "/reset") {
      store.actions.reset();
      logAction(`Remote [reset] from ${ip}`);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, count: store.getState().count }));
    } else if (p === "/set") {
      const val = parseInt(parsed.searchParams.get("val") || "", 10);
      if (!isNaN(val)) {
        store.actions.set(val);
        logAction(`Remote [set=${val}] from ${ip}`);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, count: store.getState().count }));
      } else {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: "Invalid val" }));
      }
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Not Found" }));
    }
  });

  server.listen(PORT, () => {
    logAction("Server initialized");
    drawDashboard();
  });

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  const handleKey = (_str, key) => {
    if (key && ((key.ctrl && key.name === "c") || key.name === "q")) {
      process.stdout.write("\x1b[2J\x1b[H\x1b[?25h");
      server.close();
      process.stdin.off("keypress", handleKey);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      mainLoop();
      return;
    }
    if (key.name === "space" || key.sequence === "+") {
      store.actions.increment();
      logAction("Keypress: increment");
    } else if (key.sequence === "-") {
      store.actions.decrement();
      logAction("Keypress: decrement");
    } else if (key.name === "r") {
      store.actions.reset();
      logAction("Keypress: reset");
    }
  };

  process.stdin.on("keypress", handleKey);
}

// Main CLI Event Loop
async function mainLoop() {
  while (true) {
    printBanner();
    const selection = await selectMenu("Select an action to proceed:", [
      "Initialize & Install Elegant Store in current project",
      "Run Local Counter store live demonstration (TUI & Server)",
      "Exit Initializer",
    ]);

    if (selection === 0) {
      await setupAndInstall();
    } else if (selection === 1) {
      runLocalDemo();
      break;
    } else {
      console.clear();
      console.log(`\n   ${GREEN}Thank you for using Elegant Store! Happy coding! \u{1F680}${RESET}\n`);
      process.exit(0);
    }
  }
}

// Launch the CLI tool
mainLoop();
