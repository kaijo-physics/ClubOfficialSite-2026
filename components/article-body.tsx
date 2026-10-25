import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import {
  getArticleAssetUrl,
  isRelativeArticleImage,
} from "@/lib/article-assets";

export function ArticleBody({ slug, content }: { slug: string; content: string }) {
  return (
    <ReactMarkdown
      urlTransform={(url, key, node) => {
        // 外部URL・サイト内の絶対URL・アンカーは通常のMarkdownとして扱う。
        if (
          node.tagName === "img" &&
          key === "src" &&
          isRelativeArticleImage(url)
        ) {
          return getArticleAssetUrl(slug, url);
        }
        // 外部リンクなどにもreact-markdown標準のURL検証を残す。
        return defaultUrlTransform(url);
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
