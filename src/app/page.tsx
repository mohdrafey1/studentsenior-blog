"use client";

import React, { useEffect, useState, Suspense } from "react";
import BlogPostCard from "@/app/components/blog-post-card";
import Header from "@/app/components/header";
import "@/app/globals.css";
import { Poppins } from "next/font/google";
import { TrendingUp } from "lucide-react";
import PopularPosts from "./components/popular-post";
import AdSenseAd from "./components/Ads/AdSenseAd";
import Footer from "./components/footer";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/config/apiConfig";
import { BlogPost } from "@/constant/interface";

const poppins = Poppins({ subsets: ["latin"], weight: "600", preload: true });

// Main content component that handles data fetching and display
function MainContent() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [popularPost, setPopularPost] = useState<BlogPost[]>([]);
  const router = useRouter();

  const category = [
    "nodejs",
    "backend",
    "express",
    "technology",
    "NextJs",
    "React",
    "Earning",
    "Career",
    "web devlopment",
  ];

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${api.blog.allBlogs}`);
        const data = await res.json();
        setPosts(data.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
    const fetchPopular = async () => {
      try {
        const res = await fetch(`${api.blog.popularBlogs}`);
        const data = await res.json();
        setPopularPost(data.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
    fetchPopular();
    fetchPosts();
  }, []);

  const handleShare = (post: BlogPost) => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };
  const handlePostClick = (slug: string) => {
    router.push(`/blog/post/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex justify-center">
      <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-10">
        {/* Main Content */}
        <main className="w-full">
          <section className="mb-12">
            <h2
              className={`text-2xl font-semibold mb-4 pl-2 ${poppins.className}`}
            >
              Home
            </h2>
            <div className="space-y-6">
              {posts.map((post) => (
                <BlogPostCard
                  key={post._id}
                  // @ts-expect-error fix type later
                  post={post}
                  onShare={() => handleShare(post)}
                  onClick={() => handlePostClick(post.slug)}
                />
              ))}
            </div>
            <AdSenseAd adSlot="4650270379" />
          </section>
        </main>

        {/* Sidebar */}
        <aside className="w-full space-y-8">
          {/* Categories */}
          <section>
            <h3 className={`${poppins.className} text-xl font-semibold mb-4`}>
              Stories from all interests
            </h3>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              {category.map((item, index) => (
                <Link
                  key={index}
                  href={`/blog/search?q=${encodeURIComponent(item)}`}
                  className={`${poppins.className} bg-stone-100 text-gray-800 shadow-md px-4 py-2 rounded-full cursor-pointer capitalize hover:bg-stone-200 transition`}
                >
                  {item}
                </Link>
              ))}
            </div>
          </section>

          {/* Popular Posts */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-gray-700" />
              <h3 className={`${poppins.className} text-xl font-semibold`}>
                Popular
              </h3>
            </div>
            <PopularPosts posts={popularPost} />
            <AdSenseAd adSlot="4650270379" />
          </section>
        </aside>
      </div>
    </div>
  );
}

// Main page component with Suspense boundaries
export default function Home() {
  return (
    <>
      <Suspense
        fallback={
          <div className="w-full h-16 bg-gray-50 border-b border-gray-200 animate-pulse" />
        }
      >
        <Header />
      </Suspense>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        }
      >
        <MainContent />
      </Suspense>
      <Footer />
    </>
  );
}
