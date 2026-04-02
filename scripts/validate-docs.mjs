import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const registryPath = path.join(repoRoot, "docs", "ai", "rule-registry.json");
const writeRegistry = process.argv.includes("--write-registry");
const errors = [];

const markdownFiles = [
  path.join(repoRoot, "AGENTS.md"),
  path.join(repoRoot, "README.md"),
  ...walkMarkdown(path.join(repoRoot, "docs")),
].filter((value, index, array) => array.indexOf(value) === index);

const documents = [];
const rules = [];
const headingsCache = new Map();
const linkTargets = new Map();

for (const filePath of markdownFiles) {
  const relativePath = normalize(filePath);
  const content = fs.readFileSync(filePath, "utf8");
  const meta = parseDocMeta(content, relativePath);
  const headings = collectHeadings(content);
  const docRules = collectRules(content, relativePath, meta);
  const docLinks = collectLinks(content);

  headingsCache.set(relativePath, headings);
  linkTargets.set(relativePath, docLinks);
  documents.push({
    path: relativePath,
    status: meta.status,
    scope: meta.scope,
    readFirst: meta.readFirst,
    ruleCount: docRules.length,
  });
  rules.push(...docRules);
}

validateAiHubLinks();
validateLinks();
validateRuleIds(rules);
validateDocuments(documents);

const expectedRegistry = {
  version: 1,
  generatedBy: "scripts/validate-docs.mjs",
  documents: documents.sort((left, right) => left.path.localeCompare(right.path)),
  rules: rules.sort((left, right) => left.id.localeCompare(right.id)),
};

if (writeRegistry) {
  fs.writeFileSync(registryPath, JSON.stringify(expectedRegistry, null, 2) + "\n", "utf8");
}

if (!fs.existsSync(registryPath)) {
  errors.push(`Missing registry file: ${normalize(registryPath)}`);
} else {
  const actualRegistry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  if (JSON.stringify(actualRegistry) !== JSON.stringify(expectedRegistry)) {
    errors.push("docs/ai/rule-registry.json is out of date with the current markdown docs. Run `node scripts/validate-docs.mjs --write-registry`.");
  }
}

if (errors.length > 0) {
  console.error("Documentation validation failed:\n");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Documentation validation passed for ${documents.length} markdown docs and ${rules.length} active rules.`);

function walkMarkdown(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdown(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalize(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function parseDocMeta(content, relativePath) {
  const match = content.match(/^<!-- doc-meta: (.+) -->\r?\n/);
  if (!match) {
    errors.push(`${relativePath}: missing doc-meta header.`);
    return { status: "reference", scope: ["missing-meta"], readFirst: [] };
  }

  let meta;
  try {
    meta = JSON.parse(match[1]);
  } catch (error) {
    errors.push(`${relativePath}: invalid doc-meta JSON (${error.message}).`);
    return { status: "reference", scope: ["invalid-meta"], readFirst: [] };
  }

  if (!isAllowedStatus(meta.status)) {
    errors.push(`${relativePath}: invalid doc status '${meta.status}'.`);
  }
  if (!Array.isArray(meta.scope) || meta.scope.length === 0) {
    errors.push(`${relativePath}: doc-meta.scope must be a non-empty array.`);
  }
  if (!Array.isArray(meta.readFirst)) {
    errors.push(`${relativePath}: doc-meta.readFirst must be an array.`);
  }
  if (meta.status === "archive" && Array.isArray(meta.readFirst) && meta.readFirst.length > 0) {
    errors.push(`${relativePath}: archive docs must not be read-first guidance.`);
  }

  return meta;
}

function isAllowedStatus(status) {
  return status === "normative" || status === "reference" || status === "archive";
}

function collectRules(content, relativePath, meta) {
  const lines = content.split(/\r?\n/);
  const docRules = [];

  lines.forEach((line, index) => {
    if (!/^\s*-\s+/.test(line)) {
      return;
    }

    const tags = [...line.matchAll(/\[RULE:([A-Z0-9-]+)\]/g)].map((match) => match[1]);

    if (meta.status === "normative") {
      if (tags.length !== 1) {
        errors.push(`${relativePath}:${index + 1}: normative bullet must contain exactly one [RULE:...] marker.`);
        return;
      }

      docRules.push({
        id: tags[0],
        status: "normative",
        canonicalPath: relativePath,
        canonicalLine: index + 1,
        scope: meta.scope,
        summary: line.replace(/\s*\[RULE:[A-Z0-9-]+\]\s*$/, "").replace(/^\s*-\s+/, "").trim(),
      });
      return;
    }

    if (tags.length > 0) {
      errors.push(`${relativePath}:${index + 1}: only normative docs may declare [RULE:...] markers.`);
    }
  });

  if (meta.status === "normative" && docRules.length === 0) {
    errors.push(`${relativePath}: normative docs must declare at least one rule.`);
  }

  return docRules;
}

function collectHeadings(content) {
  const lines = content.split(/\r?\n/);
  const slugs = new Set();
  const counts = new Map();

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) {
      continue;
    }

    const rawHeading = match[2].trim().replace(/\s+#*$/, "");
    const base = slugify(rawHeading);
    const nextCount = (counts.get(base) ?? 0) + 1;
    counts.set(base, nextCount);
    const slug = nextCount === 1 ? base : `${base}-${nextCount}`;
    slugs.add(slug);
  }

  return slugs;
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[`*_~\[\](){}<>]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function collectLinks(content) {
  return [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1].trim());
}

function validateAiHubLinks() {
  const requiredTargets = [
    { source: "AGENTS.md", target: "docs/ai/README.md" },
    { source: "docs/README.md", target: "docs/ai/README.md" },
  ];

  for (const requirement of requiredTargets) {
    const sourcePath = path.join(repoRoot, requirement.source);
    const sourceLinks = linkTargets.get(requirement.source) ?? [];
    const hasTarget = sourceLinks.some((target) => resolveLinkTarget(sourcePath, requirement.source, target)?.path === requirement.target);
    if (!hasTarget) {
      errors.push(`${requirement.source}: must link to ${requirement.target}.`);
    }
  }
}

function validateLinks() {
  for (const [relativePath, links] of linkTargets.entries()) {
    const sourcePath = path.join(repoRoot, relativePath);
    for (const target of links) {
      const resolved = resolveLinkTarget(sourcePath, relativePath, target);
      if (!resolved || resolved.external) {
        continue;
      }

      if (!fs.existsSync(resolved.absolutePath)) {
        errors.push(`${relativePath}: broken link target '${target}'.`);
        continue;
      }

      if (resolved.fragment) {
        const targetRelative = normalize(resolved.absolutePath);
        const headings = headingsCache.get(targetRelative) ?? collectHeadings(fs.readFileSync(resolved.absolutePath, "utf8"));
        if (!headings.has(resolved.fragment)) {
          errors.push(`${relativePath}: missing anchor '${resolved.fragment}' in '${targetRelative}'.`);
        }
      }
    }
  }
}

function resolveLinkTarget(sourcePath, sourceRelative, rawTarget) {
  if (rawTarget.startsWith("http://") || rawTarget.startsWith("https://") || rawTarget.startsWith("mailto:")) {
    return { external: true };
  }

  const [targetPath, fragment] = rawTarget.split("#");
  const absolutePath = targetPath
    ? path.resolve(path.dirname(sourcePath), targetPath)
    : sourcePath;

  return {
    external: false,
    absolutePath,
    path: normalize(absolutePath),
    fragment: fragment ?? null,
    source: sourceRelative,
  };
}

function validateRuleIds(ruleEntries) {
  const seen = new Map();

  for (const rule of ruleEntries) {
    if (seen.has(rule.id)) {
      const other = seen.get(rule.id);
      errors.push(`Duplicate rule id '${rule.id}' in ${other.canonicalPath}:${other.canonicalLine} and ${rule.canonicalPath}:${rule.canonicalLine}.`);
      continue;
    }
    if (rule.canonicalPath.includes("archive")) {
      errors.push(`Rule '${rule.id}' cannot use an archive document as its canonical home.`);
    }
    seen.set(rule.id, rule);
  }
}

function validateDocuments(documentEntries) {
  for (const documentEntry of documentEntries) {
    if (documentEntry.status === "normative" && documentEntry.ruleCount === 0) {
      errors.push(`${documentEntry.path}: normative docs must not be orphaned.`);
    }
  }
}