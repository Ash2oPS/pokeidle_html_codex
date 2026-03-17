import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, "package.json");
const DOWNLOADS_DIR = path.join(ROOT_DIR, "downloads");

const PUBLIC_ARTIFACTS = [
  {
    id: "windows-installer",
    label: "Windows installer",
    source: ({ version }) => path.join(ROOT_DIR, "output", "electron-dist", `PokeIdle-Setup-${version}.exe`),
    destination: path.join(DOWNLOADS_DIR, "PokeIdle-Windows-Installer.exe"),
  },
  {
    id: "android-apk",
    label: "Android APK",
    source: () => path.join(ROOT_DIR, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
    destination: path.join(DOWNLOADS_DIR, "PokeIdle-Android.apk"),
  },
];

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

async function readPackageVersion() {
  const packageJsonRaw = await readFile(PACKAGE_JSON_PATH, "utf8");
  const packageJson = JSON.parse(packageJsonRaw);
  return String(packageJson.version || "").trim();
}

async function copyArtifact(definition, context) {
  const sourcePath = definition.source(context);
  const destinationPath = definition.destination;
  const sourceStats = await stat(sourcePath);
  await copyFile(sourcePath, destinationPath);
  return {
    id: definition.id,
    label: definition.label,
    source: toPosixPath(path.relative(ROOT_DIR, sourcePath)),
    destination: toPosixPath(path.relative(ROOT_DIR, destinationPath)),
    sizeBytes: sourceStats.size,
  };
}

async function main() {
  const version = await readPackageVersion();
  if (!version) {
    throw new Error("Impossible de determiner la version depuis package.json.");
  }

  await mkdir(DOWNLOADS_DIR, { recursive: true });

  const publishedArtifacts = [];
  for (const artifact of PUBLIC_ARTIFACTS) {
    publishedArtifacts.push(await copyArtifact(artifact, { version }));
  }

  const manifest = {
    version,
    generatedAt: new Date().toISOString(),
    files: publishedArtifacts,
  };

  await writeFile(
    path.join(DOWNLOADS_DIR, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  for (const artifact of publishedArtifacts) {
    console.log(`${artifact.label}: ${artifact.destination} (${artifact.sizeBytes} bytes)`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
