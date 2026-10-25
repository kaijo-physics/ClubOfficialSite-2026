/**
 * Markdown画像の指定が記事フォルダ内の相対パスかを判定する。
 * 相対パスだけ記事画像用URLに変換し、それ以外はReactMarkdown標準の処理に任せる。
 */
export function isRelativeArticleImage(imageUrl: string): boolean {
  // 空文字、サイトのルートから始まるパス、ページ内リンク、クエリだけのURLは相対画像ではない。
  if (!imageUrl || imageUrl.startsWith("/") || imageUrl.startsWith("#") || imageUrl.startsWith("?")) {
    return false;
  }
  try {
    // baseを渡さずにURLとして読めるものは、https://example.com/photo.pngのような絶対URL。
    new URL(imageUrl);
    return false; //成功時は絶対URLなので記事フォルダ内の相対画像ではない。
  } catch {
    // baseなしではURLにできない images/photo.png などは、記事フォルダからの相対パス。
    return true; // 例外時は相対パスなので記事フォルダ内の画像とみなす。
  }
}

/** 記事内の画像パスを画像Route Handler用のURLにする。 */
export function getArticleAssetUrl(slug: string, relativePath: string): string {
  // ./images/photo.png の先頭の ./ はURLには不要なので取り除く。
  let imagePath = relativePath;
  if (relativePath.startsWith("./")) {
    imagePath = relativePath.slice(2);
  }

  return `/article-assets/${encodeURIComponent(slug)}/${imagePath}`;
}
