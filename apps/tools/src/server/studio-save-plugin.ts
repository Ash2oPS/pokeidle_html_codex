import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { BattleDefinition, DialogueDocument, ZoneDefinition } from "@pokeidle/contracts";
import {
  battleDefinitionSchema,
  dialogueDocumentSchema,
  zoneDefinitionSchema,
} from "../../../../packages/content-schema/src/index";
import type { Connect, Plugin } from "vite";
import { z } from "zod";

type StudioEditableDomain = "zones" | "dialogues" | "battles";

interface StudioSaveRequestBody {
  domain?: unknown;
  documentId?: unknown;
  document?: unknown;
}

interface StudioSaveSuccessResponse {
  ok: true;
  document: BattleDefinition | DialogueDocument | ZoneDefinition;
  filePath: string;
}

interface StudioSaveErrorResponse {
  ok: false;
  error: string;
}

const idSchema = z.string().min(1);
const battleSummarySchema = z.object({
  id: idSchema,
  kind: z.enum(["trainer", "gym"]),
});
const worldMapSummarySchema = z.object({
  nodes: z.array(
    z.object({
      zoneId: idSchema,
    }),
  ),
});
const idOnlySchema = z.object({
  id: idSchema,
});

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), "../../../../");
const contentRoot = path.join(repoRoot, "content");
const authoredRoot = path.join(contentRoot, "authored");
const generatedRoot = path.join(contentRoot, "generated");

const editableDomainConfig = {
  zones: {
    folder: path.join(authoredRoot, "zones"),
    schema: zoneDefinitionSchema,
  },
  dialogues: {
    folder: path.join(authoredRoot, "dialogues"),
    schema: dialogueDocumentSchema,
  },
  battles: {
    folder: path.join(authoredRoot, "battles"),
    schema: battleDefinitionSchema,
  },
} as const;

export function studioSavePlugin(): Plugin {
  return {
    name: "studio-save-plugin",
    configureServer(server) {
      installStudioSaveMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      installStudioSaveMiddleware(server.middlewares);
    },
  };
}

function installStudioSaveMiddleware(middlewares: Connect.Server): void {
  middlewares.use("/api/studio/documents", async (request, response, next) => {
    if (request.method !== "POST") {
      next();
      return;
    }

    try {
      const body = await readJsonBody(request);
      const result = await saveStudioDocumentFromRequest(body);
      sendJson(response, 200, result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Studio save failed for an unknown reason.";
      const statusCode = error instanceof StudioSaveRequestError ? 400 : 500;

      sendJson(response, statusCode, {
        ok: false,
        error: message,
      } satisfies StudioSaveErrorResponse);
    }
  });
}

class StudioSaveRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudioSaveRequestError";
  }
}

interface SafeParseSuccess<T> {
  success: true;
  data: T;
}

interface SafeParseFailure {
  success: false;
  error: {
    issues: Array<{
      path: PropertyKey[];
      message: string;
    }>;
  };
}

interface SafeParseSchema<T> {
  safeParse(value: unknown): SafeParseSuccess<T> | SafeParseFailure;
}

async function saveStudioDocumentFromRequest(
  body: StudioSaveRequestBody,
): Promise<StudioSaveSuccessResponse> {
  const domain = parseEditableDomain(body.domain);
  const documentId = parseDocumentId(body.documentId);

  if (domain === "zones") {
    const parsedDocument = parseStudioDocument(zoneDefinitionSchema, body.document, domain);

    if (parsedDocument.id !== documentId) {
      throw new StudioSaveRequestError(
        `Document id mismatch: request targeted "${documentId}" but payload contained "${parsedDocument.id}".`,
      );
    }

    await validateZoneDocument(parsedDocument);

    return persistStudioDocument(domain, documentId, parsedDocument);
  }

  if (domain === "dialogues") {
    const parsedDocument = parseStudioDocument(dialogueDocumentSchema, body.document, domain);

    if (parsedDocument.id !== documentId) {
      throw new StudioSaveRequestError(
        `Document id mismatch: request targeted "${documentId}" but payload contained "${parsedDocument.id}".`,
      );
    }

    validateDialogueDocument(parsedDocument);

    return persistStudioDocument(domain, documentId, parsedDocument);
  }

  const parsedDocument = parseStudioDocument(battleDefinitionSchema, body.document, domain);

  if (parsedDocument.id !== documentId) {
    throw new StudioSaveRequestError(
      `Document id mismatch: request targeted "${documentId}" but payload contained "${parsedDocument.id}".`,
    );
  }

  await validateBattleDocument(parsedDocument);

  return persistStudioDocument(domain, documentId, parsedDocument);
}

async function persistStudioDocument(
  domain: StudioEditableDomain,
  documentId: string,
  document: BattleDefinition | DialogueDocument | ZoneDefinition,
): Promise<StudioSaveSuccessResponse> {
  const targetPath = resolveDocumentPath(editableDomainConfig[domain].folder, documentId);
  await fs.writeFile(targetPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");

  return {
    ok: true,
    document,
    filePath: path.relative(repoRoot, targetPath).split(path.sep).join("/"),
  };
}

function parseEditableDomain(value: unknown): StudioEditableDomain {
  if (value === "zones" || value === "dialogues" || value === "battles") {
    return value;
  }

  throw new StudioSaveRequestError("Invalid editable domain.");
}

function parseStudioDocument<TDocument>(
  schema: SafeParseSchema<TDocument>,
  value: unknown,
  domain: StudioEditableDomain,
): TDocument {
  const parsedDocument = schema.safeParse(value);

  if (!parsedDocument.success) {
    const issue = parsedDocument.error.issues[0];
    const issuePath = issue?.path.length ? issue.path.join(".") : "(root)";
    throw new StudioSaveRequestError(
      `Invalid ${domain} document at ${issuePath}: ${issue?.message ?? "Validation failed."}`,
    );
  }

  return parsedDocument.data;
}

function parseDocumentId(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new StudioSaveRequestError("Missing document id.");
  }

  if (value.includes("/") || value.includes("\\")) {
    throw new StudioSaveRequestError("Document ids must not contain path separators.");
  }

  return value;
}

function resolveDocumentPath(folderPath: string, documentId: string): string {
  const resolvedPath = path.resolve(folderPath, `${documentId}.json`);
  const relativePath = path.relative(folderPath, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new StudioSaveRequestError("Resolved document path escaped the editable folder.");
  }

  return resolvedPath;
}

async function validateZoneDocument(
  document: ZoneDefinition,
): Promise<void> {
  await validateZoneWorldMapMembership(document.id);

  if (document.canonicalLocationId) {
    const canonLocationIds = await readIdSetFromArrayFile(
      path.join(generatedRoot, "sinnoh", "locations.v1.json"),
      idOnlySchema,
    );

    if (!canonLocationIds.has(document.canonicalLocationId)) {
      throw new StudioSaveRequestError(
        `Invalid zone "${document.id}": canonicalLocationId "${document.canonicalLocationId}" does not exist.`,
      );
    }
  }

  if (document.kind === "combat") {
    const speciesIds = await readIdSetFromArrayFile(
      path.join(generatedRoot, "pokemon", "species.v1.json"),
      idOnlySchema,
    );

    document.battle.enemyPoolIds.forEach((speciesId) => {
      if (!speciesIds.has(speciesId)) {
        throw new StudioSaveRequestError(
          `Invalid zone "${document.id}": enemyPoolIds "${speciesId}" does not exist.`,
        );
      }
    });

    return;
  }

  const dialogueIds = await readIdSetFromDirectory(
    path.join(authoredRoot, "dialogues"),
    idOnlySchema,
  );
  const questIds = await readIdSetFromDirectory(path.join(authoredRoot, "quests"), idOnlySchema);
  const battlesById = await readBattleKindMap(path.join(authoredRoot, "battles"));

  document.activities.forEach((activity) => {
    if (activity.kind === "dialogue_npc") {
      if (!dialogueIds.has(activity.dialogueId)) {
        throw new StudioSaveRequestError(
          `Invalid zone "${document.id}": dialogueId "${activity.dialogueId}" does not exist.`,
        );
      }

      if (activity.startsQuestId && !questIds.has(activity.startsQuestId)) {
        throw new StudioSaveRequestError(
          `Invalid zone "${document.id}": startsQuestId "${activity.startsQuestId}" does not exist.`,
        );
      }
    }

    if (activity.kind === "gym_battle") {
      const battleKind = battlesById.get(activity.battleId);

      if (!battleKind) {
        throw new StudioSaveRequestError(
          `Invalid zone "${document.id}": battleId "${activity.battleId}" does not exist.`,
        );
      }

      if (battleKind !== "gym") {
        throw new StudioSaveRequestError(
          `Invalid zone "${document.id}": battleId "${activity.battleId}" must point to a gym battle.`,
        );
      }
    }
  });
}

async function validateBattleDocument(
  document: BattleDefinition,
): Promise<void> {
  const speciesIds = await readIdSetFromArrayFile(
    path.join(generatedRoot, "pokemon", "species.v1.json"),
    idOnlySchema,
  );

  if (!document.enemyTeam?.length) {
    throw new StudioSaveRequestError(
      `Invalid battle "${document.id}": enemyTeam must contain at least one enemy.`,
    );
  }

  document.enemyTeam.forEach((enemy) => {
    if (!speciesIds.has(enemy.speciesId)) {
      throw new StudioSaveRequestError(
        `Invalid battle "${document.id}": enemyTeam speciesId "${enemy.speciesId}" does not exist.`,
      );
    }
  });

  if (document.kind !== "gym") {
    return;
  }

  const canonGymIds = await readIdSetFromArrayFile(
    path.join(generatedRoot, "sinnoh", "gyms.v1.json"),
    idOnlySchema,
  );

  if (!document.canonicalGymId || !canonGymIds.has(document.canonicalGymId)) {
    throw new StudioSaveRequestError(
      `Invalid battle "${document.id}": canonicalGymId "${document.canonicalGymId ?? "(missing)"}" does not exist.`,
    );
  }
}

function validateDialogueDocument(
  document: DialogueDocument,
): void {
  const participantIds = new Set(document.participants.map((participant) => participant.id));

  document.lines.forEach((line) => {
    if (!participantIds.has(line.speakerId)) {
      throw new StudioSaveRequestError(
        `Invalid dialogue "${document.id}": speakerId "${line.speakerId}" does not exist in participants.`,
      );
    }
  });
}

async function validateZoneWorldMapMembership(zoneId: string): Promise<void> {
  const worldMap = worldMapSummarySchema.safeParse(
    await readJsonFile(path.join(authoredRoot, "world-map", "world-map.v1.json")),
  );

  if (!worldMap.success) {
    throw new StudioSaveRequestError("World map data is invalid and blocked studio save.");
  }

  const zoneIds = new Set(worldMap.data.nodes.map((node) => node.zoneId));

  if (!zoneIds.has(zoneId)) {
    throw new StudioSaveRequestError(
      `World map does not contain zone "${zoneId}", so the document cannot be saved safely.`,
    );
  }
}

async function readBattleKindMap(directoryPath: string): Promise<Map<string, "trainer" | "gym">> {
  const entries = await readParsedDirectory(directoryPath, battleSummarySchema);
  return new Map(entries.map((entry) => [entry.id, entry.kind]));
}

async function readIdSetFromDirectory<TSchema extends { id: string }>(
  directoryPath: string,
  schema: SafeParseSchema<TSchema>,
): Promise<Set<string>> {
  const entries = await readParsedDirectory(directoryPath, schema);
  return new Set(entries.map((entry) => entry.id));
}

async function readIdSetFromArrayFile<TSchema extends { id: string }>(
  filePath: string,
  schema: SafeParseSchema<TSchema>,
) {
  const entries = await readParsedArrayFile(filePath, schema);
  return new Set(entries.map((entry) => entry.id));
}

async function readParsedDirectory<TSchema>(
  directoryPath: string,
  schema: SafeParseSchema<TSchema>,
): Promise<TSchema[]> {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const jsonFileNames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  return Promise.all(
    jsonFileNames.map((fileName) => readParsedFile(path.join(directoryPath, fileName), schema)),
  );
}

async function readParsedArrayFile<TSchema>(
  filePath: string,
  schema: SafeParseSchema<TSchema>,
): Promise<TSchema[]> {
  const parsed = await readJsonFile(filePath);

  if (!Array.isArray(parsed)) {
    throw new StudioSaveRequestError(
      `Expected a JSON array in ${path.relative(repoRoot, filePath)}.`,
    );
  }

  return parsed.map((entry, index) =>
    parseWithSchema(schema, entry, `${path.relative(repoRoot, filePath)}[${index}]`),
  );
}

async function readParsedFile<TSchema>(
  filePath: string,
  schema: SafeParseSchema<TSchema>,
): Promise<TSchema> {
  return parseWithSchema(schema, await readJsonFile(filePath), path.relative(repoRoot, filePath));
}

function parseWithSchema<TSchema>(
  schema: SafeParseSchema<TSchema>,
  value: unknown,
  label: string,
): TSchema {
  const parsed = schema.safeParse(value);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const issuePath = issue?.path.length ? issue.path.join(".") : "(root)";
    throw new StudioSaveRequestError(
      `Invalid supporting content at ${label} ${issuePath}: ${issue?.message ?? "Validation failed."}`,
    );
  }

  return parsed.data;
}

async function readJsonFile(filePath: string): Promise<unknown> {
  const rawText = await fs.readFile(filePath, "utf8");

  try {
    return JSON.parse(rawText);
  } catch (error) {
    throw new StudioSaveRequestError(
      `Failed to parse JSON from ${path.relative(repoRoot, filePath)}: ${
        error instanceof Error ? error.message : "Unknown parse error."
      }`,
    );
  }
}

async function readJsonBody(request: IncomingMessage): Promise<StudioSaveRequestBody> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  if (rawBody.length === 0) {
    throw new StudioSaveRequestError("Missing request body.");
  }

  try {
    return JSON.parse(rawBody) as StudioSaveRequestBody;
  } catch (error) {
    throw new StudioSaveRequestError(
      `Invalid JSON body: ${error instanceof Error ? error.message : "Unknown parse error."}`,
    );
  }
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: StudioSaveSuccessResponse | StudioSaveErrorResponse,
): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}
