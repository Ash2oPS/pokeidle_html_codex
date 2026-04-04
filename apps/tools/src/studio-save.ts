import type { DialogueDocument, ZoneDefinition } from "@pokeidle/contracts";

export type StudioEditableDomain = "zones" | "dialogues";

interface StudioDocumentMap {
  zones: ZoneDefinition;
  dialogues: DialogueDocument;
}

interface StudioSaveSuccessResponse<TDomain extends StudioEditableDomain> {
  ok: true;
  document: StudioDocumentMap[TDomain];
  filePath: string;
}

interface StudioSaveErrorResponse {
  ok: false;
  error: string;
}

type StudioSaveResponse<TDomain extends StudioEditableDomain> =
  | StudioSaveSuccessResponse<TDomain>
  | StudioSaveErrorResponse;

export async function saveStudioDocument<TDomain extends StudioEditableDomain>(
  domain: TDomain,
  documentId: string,
  document: StudioDocumentMap[TDomain],
): Promise<StudioSaveSuccessResponse<TDomain>> {
  const response = await fetch("/api/studio/documents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      domain,
      documentId,
      document,
    }),
  });

  const payload = (await response.json().catch(() => null)) as StudioSaveResponse<TDomain> | null;

  if (!response.ok || !payload || !payload.ok) {
    const errorMessage =
      payload && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `Failed to save ${domain} document.`;
    throw new Error(errorMessage);
  }

  return payload;
}
