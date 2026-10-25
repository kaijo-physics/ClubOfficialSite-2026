import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/article-body";
import { formatArticleDate, getArticle } from "@/lib/articles";

type Props = { params: Promise<{ slug: string }> };

export default async function ArticlePage({ params }: Props) {
  const article = await getArticle((await params).slug);
  if (article === null) {
    notFound();
  }

  return (
    <main>
      <article>
        <h1>{article.title}</h1>
        {article.date && <time dateTime={article.date}>{formatArticleDate(article.date)}</time>}
        <ArticleBody slug={article.slug} content={article.content} />
      </article>
    </main>
  );
}
