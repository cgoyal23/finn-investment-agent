import { discoverDocuments } from "@/lib/discovery";
export async function GET(request: Request) {
  const s = (
    new URL(request.url).searchParams.get("symbol") || ""
  ).toUpperCase();
  if (!/^[A-Z0-9&-]{1,24}$/.test(s))
    return Response.json(
      { error: "Enter a valid NSE symbol." },
      { status: 400 },
    );
  return Response.json(await discoverDocuments(s));
}
