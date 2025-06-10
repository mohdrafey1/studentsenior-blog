// blog-post-page.tsx
import {
  ArrowLeft,
  Heart,
  Eye,
  Calendar,
  User,
  Clock,
  TrendingUp,
  Rss,
} from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PopularPosts from "@/app/components/popular-post";
import Header from "@/app/components/header";
import Footer from "@/app/components/Footer";

interface Blog {
  _id: string;
  slug: string;
  title: string;
  banner?: string;
  description?: string;
  content?: string;
  tags?: string[];
  author?: string;
  total_likes?: number;
  total_reads?: number;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BlogPostComponentProps {
  post: Blog;
  popularPosts: Blog[];
  latestPosts: Blog[];
}

interface BlogPostPageProps {
  params: { slug: string };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatReadTime(content: string = ""): string {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  return `${readTime} min read`;
}

function renderMarkdown(content: string = ""): JSX.Element {
  if (!content.trim()) {
    return (
      <div className="prose max-w-none">
        <p className="text-neutral-500 italic font-light">
          No content available.
        </p>
      </div>
    );
  }

  return (
    <div className="prose prose-lg prose-neutral max-w-none">
      <div className="text-neutral-800 leading-[1.8] space-y-6 font-light">
        {content.split("\n\n").map((paragraph, index) => {
          if (!paragraph.trim()) return null;
          if (paragraph.startsWith("# ")) {
            return (
              <h2
                key={index}
                className="text-3xl font-bold text-neutral-900 mt-12 mb-6 leading-tight tracking-tight"
              >
                {paragraph.replace("# ", "")}
              </h2>
            );
          }
          if (paragraph.startsWith("## ")) {
            return (
              <h3
                key={index}
                className="text-2xl font-semibold text-neutral-800 mt-10 mb-5 leading-tight tracking-tight"
              >
                {paragraph.replace("## ", "")}
              </h3>
            );
          }
          return (
            <p
              key={index}
              className="text-neutral-700 leading-[1.8] mb-6 text-lg font-light"
            >
              {paragraph}
            </p>
          );
        })}
      </div>
    </div>
  );
}

function BlogPostComponent({
  post,
  popularPosts,
  latestPosts,
}: BlogPostComponentProps): JSX.Element {
  const readTime = formatReadTime(post.content);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 p-4 sm:p-6 lg:p-8">
          <article className="flex-1 bg-white rounded-2xl shadow-lg border border-neutral-200/80 overflow-hidden">
            <div className="px-10 pt-8 pb-4">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-all duration-300 hover:gap-3 group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="font-medium">Back to Blog</span>
              </Link>
            </div>

            <header className="px-10 pb-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 leading-[1.1] mb-8 tracking-tight font-serif">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-600 mb-8">
                {post.author && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-neutral-500" />
                    <span className="font-medium text-neutral-700">
                      {post.author}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neutral-500" />
                  <span className="font-medium">
                    {formatDate(post.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-500" />
                  <span className="font-medium">{readTime}</span>
                </div>
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-8">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-neutral-100 text-neutral-700 px-4 py-2 rounded-full text-sm font-medium border border-neutral-200 hover:bg-neutral-200 hover:border-neutral-300 transition-all duration-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {post.description && (
                <div className="mb-10 p-6 bg-neutral-50 rounded-xl border-l-4 border-neutral-300">
                  <p className="text-xl text-neutral-700 leading-relaxed font-light italic">
                    {post.description}
                  </p>
                </div>
              )}

              {post.banner && (
                <div className="relative w-full h-72 md:h-96 lg:h-[28rem] mb-10 rounded-xl overflow-hidden shadow-md">
                  <Image
                    src={post.banner}
                    alt={`Banner for ${post.title}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 800px"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )}
            </header>

            <div className="px-10 pb-12">{renderMarkdown(post.content)}</div>

            <footer className="px-10 py-8 bg-neutral-50/80 border-t border-neutral-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-neutral-800">
                      {post.total_likes ?? 0}
                    </span>
                    <span className="text-sm font-medium">Likes</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-neutral-800">
                      {post.total_reads ?? 0}
                    </span>
                    <span className="text-sm font-medium">Views</span>
                  </div>
                </div>
                <div className="text-sm text-neutral-500 font-medium">
                  Last updated {formatDate(post.updatedAt)}
                </div>
              </div>
            </footer>
          </article>

          <aside className="lg:w-80">
            <div className="sticky top-8 space-y-10">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-neutral-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-neutral-700" />
                  </div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Popular Posts
                  </h2>
                </div>
                <PopularPosts posts={popularPosts} variant="minimal" />
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-neutral-100 rounded-lg">
                    <Rss className="w-5 h-5 text-neutral-700" />
                  </div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Latest Posts
                  </h2>
                </div>
                <PopularPosts posts={latestPosts} variant="minimal" />
              </div>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default async function BlogPostPage({
  params,
}: BlogPostPageProps): Promise<JSX.Element> {
  const { slug } = params;
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const [latestRes, postRes, popularRes] = await Promise.all([
      fetch(`${apiBase}/v1/blogsPage?page=1&limit=5`, {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      }),
      fetch(`${apiBase}/v1/blogs/${slug}`, {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      }),
      fetch(`${apiBase}/v1/blogsPopular`, {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    if (!postRes.ok) return notFound();
    const postJson = await postRes.json();
    const popularJson = await popularRes.json();
    const latestJson = await latestRes.json();

    if (!postJson.data) return notFound();
    const post: Blog = postJson.data;
    const popularPosts: Blog[] = popularJson.data || [];
    const latestPosts: Blog[] = latestJson.data || [];

    if (post.isDraft && process.env.NODE_ENV === "production")
      return notFound();

    return (
      <BlogPostComponent
        post={post}
        popularPosts={popularPosts}
        latestPosts={latestPosts}
      />
    );
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return notFound();
  }
}
