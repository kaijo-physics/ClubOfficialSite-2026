// fsで記事ファイルを読むため、このファイルはサーバー側だけで使う。
import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { getArticleAssetUrl, isRelativeArticleImage } from "./article-assets";

// 記事フォルダの場所。slugごとに content/articles/<slug>/ を読む。
const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

// 記事一覧に必要な情報。本文(content)は含めず、一覧ページが使う分だけにする。
// thumbnailUrlはMarkdown内の相対パスではなく、ブラウザで開けるURL。
export type ArticleSummary = {
  slug: string;
  title: string;
  date?: string;
  summary?: string;
  thumbnailUrl?: string;
};

// 記事ページでは一覧の情報に加えてMarkdown本文も必要。
export type Article = ArticleSummary & { content: string };

// 記事フォルダから配信する画像形式と、ブラウザに返すContent-Type。
const IMAGE_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

/**
 * slugから公開記事を読み込む。
 * 記事がない、またはdraft: trueならnull。Markdownが複数ある・titleがない場合は原稿の不備としてエラー。
 */
export async function getArticle(slug: string): Promise<Article | null> {
  const directory = await getArticleDir(slug);
  if (directory === null) {
    return null;
  }
  // Markdownのファイル名は固定しない。記事フォルダ直下に.mdがちょうど1つ必要。
  // サブフォルダ内のMarkdownは数えず、本文ファイルと画像などを区別する。
  const directoryEntries = await fs.readdir(directory, { withFileTypes: true });

  // ファイルがあるとき、mdファイルのみを抽出する。
  const markdownFiles = directoryEntries.filter(
    (entry) => entry.isFile() && entry.name.endsWith(".md"),
  );

  if (markdownFiles.length !== 1) {
    throw new Error(`${slug}: .mdファイルを1つ置いてください`);
  }

  const markdownFilePath = path.join(directory, markdownFiles[0].name);
  const markdownSource = await fs.readFile(markdownFilePath, "utf8");
  // gray-matterがfrontmatterと本文に分ける。
  const { data: frontmatter, content } = matter(markdownSource);

  // 下書きは記事ページにも一覧にも出さない。画像配信も後でこの関数を使って同じ判定をする。
  if (frontmatter.draft === true) {
    return null;
  }
  if (!frontmatter.title) {
    throw new Error(`${slug}: titleが必要です`);
  }

  const title = frontmatter.title;

  let date = frontmatter.date;
  // gray-matterはYAMLの日付をDateオブジェクトに変換するため、文字列のYYYY-MM-DD形式に戻す必要がある。
  if (frontmatter.date instanceof Date) {
    // Dateオブジェクトになっている場合は、YYYY-MM-DD形式の文字列にする。スライスの仕組みは(0, 10)で、YYYY-MM-DDの10文字を切り出す。
    date = frontmatter.date.toISOString().slice(0, 10);
  }

  const summary = frontmatter.summary;

  let thumbnailUrl: string | undefined;
  if (isRelativeArticleImage(frontmatter.thumbnail)) {
    // 記事フォルダ内の相対パスなので、画像配信用のURLに変換する。
    thumbnailUrl = getArticleAssetUrl(slug, frontmatter.thumbnail);
  }

  // Markdownの値を、そのまま画面が使える記事オブジェクトにまとめて返す。
  return {
    slug,
    title,
    date,
    summary,
    thumbnailUrl,
    content,
  };
}

/**
 * 記事フォルダを走査して公開記事の概要一覧を返す。
 * 各記事の読み込みはgetArticleに任せるため、下書きは一覧から自然に除外される。
 */
export async function getAllArticles(): Promise<ArticleSummary[]> {
  let articleEntries;
  try {
    articleEntries = await fs.readdir(ARTICLES_DIR, { withFileTypes: true });
  } catch (error) {
    // 記事フォルダ自体がまだない新規プロジェクトでは、空の一覧として扱う。
    if (isMissing(error)) {
      return [];
    }
    throw error;
  }
  // 各サブフォルダ名をslugとして記事を読み込む。Promise.allで並行して待つ。
  const articleResults = await Promise.all(
    articleEntries
      .filter((articleDirectory) => articleDirectory.isDirectory())
      .map((articleDirectory) => getArticle(articleDirectory.name)),
  );
  return articleResults
    // getArticleは非公開記事をnullで返すので、公開記事だけに絞る。
    .filter((article): article is Article => article !== null)
    // 一覧では本文を使わないため、ArticleSummaryの項目だけ取り出す。
    .map((article) => ({
      slug: article.slug,
      title: article.title,
      date: article.date,
      summary: article.summary,
      thumbnailUrl: article.thumbnailUrl,
    }))
    .sort((a, b) => {
      // YYYY-MM-DD形式なら文字列の比較で新しい日付が先になる。同じ日付はslug順にする。
      const dateOrder = (b.date ?? "").localeCompare(a.date ?? "");
      if (dateOrder !== 0) {
        return dateOrder;
      }
      return a.slug.localeCompare(b.slug);
    });
}

/**
 * 記事フォルダ内の画像を読み、Route Handlerが返せる形にする。
 * slugは記事フォルダ名、partsはURLの残りのパス要素（例: ["images", "photo.png"]）。
 * 見つからない・非公開・未許可形式ならnull、成功時は画像データとContent-Typeを返す。
 */
export async function getArticleAsset(slug: string, parts: string[]) {
  if (parts.length === 0 || !parts.every(isSafePathSegment)) {
    return null;
  }
  // 拡張子からContent-Typeを決める。拡張子の大文字・小文字は区別しない。
  const contentType = IMAGE_TYPES[path.extname(parts[parts.length - 1])];
  if (contentType === undefined) {
    return null;
  }

  // 記事が存在しない、または下書きなら、その画像も配信しない。
  const article = await getArticle(slug);
  if (article === null) {
    return null;
  }

  const directory = await getArticleDir(slug);
  if (directory === null) {
    return null;
  }

  try {
    const imageFilePath = path.join(directory, ...parts);
    if (!(await fs.stat(imageFilePath)).isFile()) {
      return null;
    }
    // Route Handlerへ返すため、Node.jsのBufferをWeb Responseで扱えるUint8Arrayにする。
    return { imageData: new Uint8Array(await fs.readFile(imageFilePath)), contentType };
  } catch (error) {
    // ファイルがない場合は「画像なし」として扱い、それ以外のエラーは呼び出し元へ返す。
    if (isMissing(error)) {
      return null;
    }
    throw error;
  }
}

/** YYYY-MM-DD形式の日付を、画面表示用のYYYY/MM/DD形式にする。 */
export function formatArticleDate(date: string) {
  return date.replaceAll("-", "/");
}

// ここから下は、上の公開関数が内部で使う補助処理。

/**
 * URLから受け取った1つのパス要素が安全かを確認する。
 * 空文字、`.`、`..`、区切り文字を含む名前を拒否し、別フォルダへ移動できないようにする。
 */
function isSafePathSegment(name: string): boolean {
  return !!name && name !== "." && name !== ".." &&
    !name.includes("/") && !name.includes("\\") && !name.includes("\0");
}

/**
 * ファイルやフォルダが存在しないときだけtrueを返す。
 * それ以外のエラーまで「記事がない」と扱うと、権限や設定の問題を見落とすため分ける。
 */
function isMissing(error: unknown): boolean {
  return error instanceof Error && "code" in error &&
    (error.code === "ENOENT" || error.code === "ENOTDIR"); // ファイルやフォルダがない、またはディレクトリではない
}

/**
 * slugに対応する記事フォルダを探す。
 * slugは1つのフォルダ名だけに制限し、記事フォルダ外を指定できないようにする。
 * フォルダが見つからない場合はnull、それ以外の読み込みエラーは呼び出し元へ返す。
 */
async function getArticleDir(slug: string): Promise<string | null> {
  if (!isSafePathSegment(slug)) {
    return null;
  }
  const directory = path.join(ARTICLES_DIR, slug);
  try {
    if (!(await fs.stat(directory)).isDirectory()) {
      return null;
    }
    return directory;
  } catch (error) {
    // 存在しない記事はnull。それ以外のエラーは隠さず呼び出し元へ返す。
    if (isMissing(error)) {
      return null;
    }
    throw error;
  }
}
