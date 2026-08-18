import type { ArticleBlock } from "@/lib/content/types";

export default function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="blog-content">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") return <p key={index}>{block.text}</p>;
        if (block.type === "heading") {
          return block.level === 2 ? <h2 key={index}>{block.text}</h2> : <h3 key={index}>{block.text}</h3>;
        }
        if (block.type === "bulletList") {
          return <ul key={index}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
        }
        if (block.type === "numberList") {
          return <ol key={index}>{block.items.map((item) => <li key={item}>{item}</li>)}</ol>;
        }
        if (block.type === "quote") return <blockquote key={index}><p>{block.text}</p></blockquote>;
        return (
          <aside key={index} className="my-7 rounded-2xl border border-primary/20 bg-primary/[0.06] p-5 md:p-6">
            {block.title && <p className="mb-2 text-sm font-semibold text-primary">{block.title}</p>}
            <p className="mb-0 text-sm text-foreground/90 md:text-base">{block.text}</p>
          </aside>
        );
      })}
    </div>
  );
}
