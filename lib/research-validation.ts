import { validCompanySymbol } from "./company-directory";

export type ResearchInput = {
  symbol: string;
  question: string;
  extract: string;
  documentName: string;
};
export function researchInput(value: unknown): ResearchInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (
    typeof v.symbol !== "string" ||
    typeof v.question !== "string" ||
    (v.extract !== undefined && typeof v.extract !== "string") ||
    (v.documentName !== undefined && typeof v.documentName !== "string")
  )
    return null;
  const symbol = v.symbol.trim().toUpperCase(),
    question = v.question.trim();
  const extract = (v.extract as string | undefined)?.trim() || "";
  const documentName = (v.documentName as string | undefined)?.trim() || "";
  return validCompanySymbol(symbol) &&
    question.length > 0 &&
    question.length <= 1500 &&
    extract.length <= 50000 &&
    documentName.length <= 100
    ? { symbol, question, extract, documentName }
    : null;
}
export type ResearchSource = {
  id: string;
  title: string;
  url: string;
  locator: string;
  facts: string;
};
export function checkedAnswer(value: unknown, sources: ResearchSource[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const parsed = value as Record<string, unknown>;
  if (
    typeof parsed.answer !== "string" ||
    !parsed.answer.trim() ||
    parsed.answer.length > 20000
  )
    return null;
  const inlineIds = [
    ...parsed.answer.matchAll(/\[([A-Za-z0-9][A-Za-z0-9._:-]*)\]/g),
  ].map((m) => m[1]);
  if (inlineIds.some((id) => !sources.some((s) => s.id === id))) return null;
  const citations = (
    Array.isArray(parsed.citations) ? parsed.citations : []
  ).flatMap((c) => {
    if (!c || typeof c !== "object" || typeof c.id !== "string") return [];
    const source = sources.find((s) => s.id === c.id);
    if (!source) return [];
    return [
      {
        id: source.id,
        title: source.title,
        url: source.url,
        locator: source.facts
          ? source.locator
          : typeof c.locator === "string" && c.locator.length <= 300
            ? c.locator
            : source.locator,
      },
    ];
  });
  const unique = [...new Map(citations.map((c) => [c.id, c])).values()];
  if (inlineIds.some((id) => !unique.some((c) => c.id === id))) return null;
  if (
    !unique.length &&
    (!/cannot establish|not disclosed|insufficient evidence|missing evidence/i.test(
      parsed.answer,
    ) ||
      /\d/.test(parsed.answer))
  )
    return null;
  return {
    answer: parsed.answer.trim(),
    citations: unique,
    limitations:
      typeof parsed.limitations === "string"
        ? parsed.limitations.slice(0, 2000)
        : "",
  };
}

export async function boundedBytes(
  body: ReadableStream<Uint8Array> | null,
  limit: number,
) {
  if (!body) return new Uint8Array();
  const reader = body.getReader(),
    chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new Error("Content exceeds the supported size");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    result.set(chunk, at);
    at += chunk.length;
  }
  return result;
}
