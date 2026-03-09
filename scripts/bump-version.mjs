import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const versionFilePath = path.resolve(process.cwd(), process.argv[2] || "version.js");
const versionPattern = /POKEIDLE_APP_VERSION\s*=\s*"([^"]+)"/;
const semverPattern =
  /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

function bumpSemver(version) {
  const match = semverPattern.exec(version);
  if (!match) {
    throw new Error(`Version semver invalide: ${version}`);
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  const prerelease = match[4] || "";
  const build = match[5] || "";

  if (!prerelease) {
    return `${major}.${minor}.${patch + 1}${build ? `+${build}` : ""}`;
  }

  const prereleaseParts = prerelease.split(".");
  const lastIndex = prereleaseParts.length - 1;
  const lastPart = prereleaseParts[lastIndex];

  if (/^\d+$/.test(lastPart)) {
    prereleaseParts[lastIndex] = String(Number(lastPart) + 1);
  } else {
    prereleaseParts.push("1");
  }

  return `${major}.${minor}.${patch}-${prereleaseParts.join(".")}${build ? `+${build}` : ""}`;
}

const source = await readFile(versionFilePath, "utf8");
const versionMatch = source.match(versionPattern);

if (!versionMatch) {
  throw new Error(`Impossible de trouver POKEIDLE_APP_VERSION dans ${versionFilePath}`);
}

const currentVersion = versionMatch[1];
const nextVersion = bumpSemver(currentVersion);
const nextSource = source.replace(versionPattern, `POKEIDLE_APP_VERSION = "${nextVersion}"`);

if (nextSource === source) {
  throw new Error("Le script n'a produit aucune modification.");
}

await writeFile(versionFilePath, nextSource, "utf8");
process.stdout.write(nextVersion);
