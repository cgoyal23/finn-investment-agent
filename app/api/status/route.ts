import { runtimeValue } from "@/lib/runtime-env";
export async function GET() {
  return Response.json({
    aiConfigured: Boolean(runtimeValue("GEMINI_API_KEY")),
    model: runtimeValue("GEMINI_MODEL") || "gemini-3.5-flash-lite",
    market: "Yahoo Finance EOD snapshots + on-demand refresh",
    research: "Primary-source evidence only",
    announcements:
      "Historical filing library; continuous exchange ingestion is not yet enabled",
  });
}
