import { validCompanySymbol } from "@/lib/company-directory";
import { discoverDocuments } from "@/lib/discovery";
export async function GET(request: Request) {
  const s = (
    new URL(request.url).searchParams.get("symbol") || ""
  ).toUpperCase();
  if (!validCompanySymbol(s))
    return Response.json(
      { error: "Choose a company from search." },
      { status: 400 },
    );
  return Response.json(await discoverDocuments(s));
}
