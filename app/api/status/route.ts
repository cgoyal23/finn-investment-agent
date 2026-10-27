import { env } from "cloudflare:workers";
export async function GET() {
  return Response.json({
    aiConfigured: Boolean(
      (env as any).GEMINI_API_KEY || process.env.GEMINI_API_KEY,
    ),
    model:
      (env as any).GEMINI_MODEL ||
      process.env.GEMINI_MODEL ||
      "gemini-3.5-flash-lite",
    market: "Yahoo Finance EOD snapshots + on-demand refresh",
    research: "Primary-source evidence only",
    announcements:
      "Historical filing library; continuous exchange ingestion is not yet enabled",
  });
}
