# 記事の追加と表示

1記事につき `content/articles/<slug>/` を作ります。直下に好きな名前の `.md` を1つだけ置き、画像も同じ記事フォルダに保存してください。

```text
content/articles/my-experiment/
├─ 実験.md
└─ images/
   ├─ thumbnail.webp
   └─ setup.webp
```

```md
---
title: "実験の紹介"
date: "2026-10-03"
draft: false
summary: "記事一覧に表示する概要"
thumbnail: "./images/thumbnail.webp"
---

本文をここに書きます。

![実験装置](./images/setup.webp)

[参考動画](https://www.youtube.com/)
```

- `title` は公開記事で必須です。本文側の先頭の `# タイトル` は不要です。
- `date` は任意。指定する場合は `YYYY-MM-DD`（例: `"2026-10-03"`）。厳密な形式・実在日付の検証は行いません。一覧は日付の新しい順、日付なしは末尾です。
- `draft` は省略すると `false`。`true` の記事は一覧・記事URL・画像URLからアクセスできません。
- `summary`、`thumbnail` は任意。サムネイルは記事フォルダ内の相対パスです。
- 本文画像も記事フォルダ基準の相対パスを使えます。外部URLや `/` 始まりのURLはそのまま扱います。
- PNG・JPEG・WebP・GIF・AVIFを配信します。Markdown、HTML、SVG、動画、PDFなどは現在の画像ルートから配信しません。
- フォルダがない場合は404、Markdownが0個/複数・title未指定の場合は原稿エラーです。その他のfrontmatterは記載した型・形式で書く前提にしています。
- Markdown内のHTMLや独自の動画埋め込み構文は追加していません。通常のリンクが使えます。

## 処理の役割

| 場所                                           | 役割                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------- |
| `lib/articles.ts`                              | サーバー専用。Markdown探索、gray-matterによる解析、公開判定、一覧、画像読み込み |
| `lib/article-assets.ts`                        | 相対画像パスから公開URLへの変換                                                 |
| `components/article-body.tsx`                  | react-markdownによる本文表示と本文画像URLの変換                                 |
| `app/articles/page.tsx`                        | タイトル・サムネイル・日付・概要の一覧                                          |
| `app/articles/[slug]/page.tsx`                 | 記事取得、404、ページタイトル、本文表示                                         |
| `app/article-assets/[slug]/[...parts]/route.ts` | 共通関数の結果をHTTPレスポンスにする                                            |

公開関数:

- `getAllArticles(): Promise<ArticleSummary[]>` — 公開記事の概要一覧。本文は返しません。
- `getArticle(slug): Promise<Article | null>` — 公開記事の概要と本文。不存在・下書きはnull。
- `getArticleAssetUrl(slug, relativePath): string` — サムネイルと本文画像で共用するURL変換。
- `getArticleAsset(slug, parts)` — 公開記事内の許可された画像を読み、データとContent-Typeを返す。

`thumbnailUrl` は表示用のURLです。`content` はfrontmatterを除いたMarkdown文字列です。ディレクトリパスや生のfrontmatterをページ側で操作する必要はありません。

## Vercel

記事の更新はGitへ反映して再デプロイします。`next.config.ts` の `outputFileTracingIncludes` で記事ファイルをサーバー処理に同梱します。Route Handlerを利用するため、`output: 'export'` は使用しません。

画像は元ファイルを返します。最小構成では画像最適化や永続キャッシュを加えていません。公開済み画像を後から下書きにしても、以前取得されたコピーまで取り消すことはできません。
