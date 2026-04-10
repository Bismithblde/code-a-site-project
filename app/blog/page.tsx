import { getAllPosts } from "@/lib/blog";
import { ScrollReveal } from "@/components/animation/ScrollReveal";
import { StaggerGrid } from "@/components/animation/StaggerGrid";
import { WaveDivider } from "@/components/animation/WaveDivider";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — MineralWater",
  description:
    "Articles about mineral water, hydration science, mineral content guides, and brand comparisons.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <section className="max-w-4xl mx-auto px-4 py-8">
        <ScrollReveal>
          <h1 className="text-4xl font-bold mb-2">Blog</h1>
          <p className="text-muted-foreground mb-12 max-w-2xl">
            Deep dives into mineral water science, brand comparisons, hydration
            tips, and more.
          </p>
        </ScrollReveal>

        {posts.length > 0 ? (
          <StaggerGrid className="grid grid-cols-1 gap-6">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <article className="glass-card p-6 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-ocean-surface/10 px-2.5 py-0.5 text-xs font-medium text-ocean-surface"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-2xl font-bold mb-2 group-hover:text-ocean-surface transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{post.author}</span>
                      <span>&middot;</span>
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      Read more →
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </StaggerGrid>
        ) : (
          <div className="glass-card p-12 text-center text-muted-foreground">
            No blog posts yet. Check back soon!
          </div>
        )}
      </section>

      <WaveDivider variant="gentle" />
    </>
  );
}
