import { getArticleAsset } from "@/lib/articles";

// Node.jsのファイル読み込み機能を使うため、Node.js環境で実行する。
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug: string; parts: string[] }> };

export async function GET(_request: Request, { params }: RouteContext) {
  // Next.jsのparamsはPromise。[...parts]は残りのURL区間を配列で受け取る。
  // 例: /article-assets/demo/images/photo.png → slug="demo", parts=["images", "photo.png"]
  const { slug, parts } = await params;
  const asset = await getArticleAsset(slug, parts);
  if (asset === null) {
    return new Response(null, { status: 404 });
  }

  return new Response(asset.imageData, {
    headers: {
      "Content-Type": asset.contentType,
      // 下書きへの変更も反映できるよう、キャッシュを保持しない。
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
