import { type NextRequest } from "next/server";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  const url = new URL(request.url);
  url.pathname = `/api/v2/shares/${encodeURIComponent(token)}`;
  url.searchParams.set("download", "1");
  return Response.redirect(url, 307);
}
