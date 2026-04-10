import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

const mdxComponents = {
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2
      className="text-2xl font-bold mt-8 mb-4 text-foreground"
      {...props}
    />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3
      className="text-xl font-bold mt-6 mb-3 text-foreground"
      {...props}
    />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p
      className="text-muted-foreground leading-relaxed mb-4"
      {...props}
    />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol className="list-decimal pl-6 mb-4 space-y-1 text-muted-foreground" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => (
    <li className="leading-relaxed" {...props} />
  ),
  a: (props: ComponentPropsWithoutRef<"a">) => {
    const href = props.href ?? "";
    if (href.startsWith("/")) {
      return (
        <Link
          href={href}
          className="text-ocean-surface font-medium hover:underline"
        >
          {props.children}
        </Link>
      );
    }
    return (
      <a
        className="text-ocean-surface font-medium hover:underline"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    );
  },
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="border-l-4 border-ocean-surface/50 pl-4 italic text-muted-foreground my-4"
      {...props}
    />
  ),
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="overflow-x-auto my-6">
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  thead: (props: ComponentPropsWithoutRef<"thead">) => (
    <thead className="border-b border-border" {...props} />
  ),
  th: (props: ComponentPropsWithoutRef<"th">) => (
    <th
      className="text-left py-2 px-3 font-semibold text-foreground"
      {...props}
    />
  ),
  td: (props: ComponentPropsWithoutRef<"td">) => (
    <td
      className="py-2 px-3 border-b border-border/50 text-muted-foreground"
      {...props}
    />
  ),
  hr: () => <hr className="my-8 border-border" />,
  code: (props: ComponentPropsWithoutRef<"code">) => (
    <code
      className="bg-secondary/50 rounded px-1.5 py-0.5 text-sm font-mono"
      {...props}
    />
  ),
};

interface MDXContentProps {
  source: string;
}

export async function MDXContent({ source }: MDXContentProps) {
  return (
    <div className="prose-ocean">
      <MDXRemote source={source} components={mdxComponents} />
    </div>
  );
}
