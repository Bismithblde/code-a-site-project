import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { notFound } from "next/navigation";
import { ScrollReveal } from "@/components/animation/ScrollReveal";
import { WaveDivider } from "@/components/animation/WaveDivider";
import { ParallaxLayer } from "@/components/animation/ParallaxLayer";
import { FloatingBubbles } from "@/components/animation/FloatingBubbles";
import { MDXContent } from "./MDXContent";
import { JsonLd } from "@/components/JsonLd";
import Link from "next/link";
import type { Metadata } from "next";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: `${post.title} — MineralWater Blog`,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary",
      title: `${post.title} — MineralWater Blog`,
      description: post.excerpt,
    },
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // Get all posts for prev/next navigation
  const allPosts = getAllPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === post.slug);
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mineralwater.com";

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          datePublished: post.date,
          author: {
            "@type": "Person",
            name: post.author,
          },
          publisher: {
            "@type": "Organization",
            name: "MineralWater",
            url: siteUrl,
          },
          mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
          keywords: post.tags.join(", "),
        }}
      />

      {/* Hero */}
      <section className="relative min-h-[35vh] flex items-center justify-center overflow-hidden -mt-16">
        <ParallaxLayer speed={0.3} className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-ocean-deep via-ocean-mid to-ocean-surface" />
        </ParallaxLayer>
        <FloatingBubbles count={8} />
        <div className="relative z-10 text-center px-4 pt-16 max-w-3xl mx-auto">
          <ScrollReveal>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              {post.title}
            </h1>
            <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
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
          </ScrollReveal>
        </div>
      </section>

      <WaveDivider variant="gentle" />

      {/* Article content */}
      <article className="max-w-3xl mx-auto px-4 py-12">
        <ScrollReveal>
          <div className="glass-card p-6 sm:p-10">
            <MDXContent source={post.content} />
          </div>
        </ScrollReveal>
      </article>

      <WaveDivider variant="choppy" />

      {/* Prev/Next navigation */}
      <section className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-between gap-4">
          {prevPost ? (
            <Link
              href={`/blog/${prevPost.slug}`}
              className="glass-card p-4 flex-1 group hover:shadow-lg transition-all"
            >
              <p className="text-xs text-muted-foreground mb-1">
                ← Previous
              </p>
              <p className="text-sm font-medium group-hover:text-ocean-surface transition-colors line-clamp-1">
                {prevPost.title}
              </p>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {nextPost ? (
            <Link
              href={`/blog/${nextPost.slug}`}
              className="glass-card p-4 flex-1 text-right group hover:shadow-lg transition-all"
            >
              <p className="text-xs text-muted-foreground mb-1">
                Next →
              </p>
              <p className="text-sm font-medium group-hover:text-ocean-surface transition-colors line-clamp-1">
                {nextPost.title}
              </p>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </section>

      {/* Back to blog */}
      <section className="max-w-3xl mx-auto px-4 pb-12 text-center">
        <Link
          href="/blog"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to all posts
        </Link>
      </section>
    </>
  );
}
