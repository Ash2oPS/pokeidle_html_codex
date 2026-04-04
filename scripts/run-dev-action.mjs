import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

function parseArgs(argv) {
  const separatorIndex = argv.indexOf("--");

  if (separatorIndex === -1) {
    throw new Error("Missing `--` separator before the command to run.");
  }

  const urls = [];

  for (let index = 0; index < separatorIndex; index += 1) {
    const value = argv[index];

    if (value !== "--url" || index + 1 >= separatorIndex) {
      throw new Error(`Unsupported argument: ${value ?? "<missing>"}`);
    }

    urls.push(argv[index + 1]);
    index += 1;
  }

  const command = argv[separatorIndex + 1];
  const commandArgs = argv.slice(separatorIndex + 2);

  if (!command) {
    throw new Error("Missing command after `--`.");
  }

  return {
    urls,
    command,
    commandArgs,
  };
}

async function isUrlReady(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(1_000),
    });

    return response.status >= 200 && response.status < 500;
  } catch {
    return false;
  }
}

function openUrlInBrowser(url) {
  let openerCommand;
  let openerArgs;

  if (process.platform === "win32") {
    openerCommand = "cmd.exe";
    openerArgs = ["/c", "start", "", url];
  } else if (process.platform === "darwin") {
    openerCommand = "open";
    openerArgs = [url];
  } else {
    openerCommand = "xdg-open";
    openerArgs = [url];
  }

  const opener = spawn(openerCommand, openerArgs, {
    detached: true,
    stdio: "ignore",
  });

  opener.unref();
}

async function waitForUrlAndOpen(url, child) {
  while (!child.killed && child.exitCode === null) {
    if (await isUrlReady(url)) {
      openUrlInBrowser(url);
      return;
    }

    await delay(500);
  }
}

function forwardSignal(child, signal) {
  if (child.killed || child.exitCode !== null) {
    return;
  }

  try {
    child.kill(signal);
  } catch {
    child.kill();
  }
}

async function main() {
  const { urls, command, commandArgs } = parseArgs(process.argv.slice(2));
  const child = spawn(command, commandArgs, {
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  const openTasks = urls.map((url) => waitForUrlAndOpen(url, child));

  process.on("SIGINT", () => {
    forwardSignal(child, "SIGINT");
  });

  process.on("SIGTERM", () => {
    forwardSignal(child, "SIGTERM");
  });

  child.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });

  child.on("exit", (code) => {
    Promise.allSettled(openTasks).finally(() => {
      process.exit(code ?? 0);
    });
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
