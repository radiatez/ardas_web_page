import { readFile } from "node:fs/promises";
import { join } from "node:path";

const demoAssetNames = new Set([
  "warehouse-hero.png",
  "distribution-operations.png",
  "parts-detail.png",
  "facility-loading.png",
  "careers-workplace.png",
  "portfolio-rhythm.png",
]);

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ asset: string }> },
) {
  const { asset } = await context.params;
  if (!demoAssetNames.has(asset)) {
    return new Response(null, { status: 404 });
  }

  try {
    const bytes = await readFile(join(process.cwd(), "demo-media", asset));
    return new Response(bytes, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        "Content-Type": "image/png",
        "X-Content-Type-Options": "nosniff",
        "X-Ardas-Media-Status": "temporary-requires-replacement",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
