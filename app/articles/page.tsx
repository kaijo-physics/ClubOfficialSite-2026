/* eslint-disable @next/next/no-img-element -- 記事の任意サイズの画像を元の形式で表示する。 */
import Link from "next/link";
import { formatArticleDate, getAllArticles } from "@/lib/articles";

export default async function ArticlesPage() {
  const articles = await getAllArticles();
  return (
    <main>
      <h1>記事一覧</h1>
      {articles.length === 0 && <p>公開されている記事はありません。</p>}
      <ul>
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/articles/${encodeURIComponent(article.slug)}`}
          >
            <div className="border m-4 p-4">
              <h3 className="text-xl font-bold">{article.title}</h3>
              {article.thumbnailUrl && (
                <img src={article.thumbnailUrl} alt="" loading="lazy" />
              )}
              {article.date && (
                <p className="text-sm text-gray-500">
                  {formatArticleDate(article.date)}
                </p>
              )}
              {article.summary && <p>{article.summary}</p>}
            </div>
          </Link>
        ))}
      </ul>
    </main>
  );
}