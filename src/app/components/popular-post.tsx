"use client";

import React from "react";
import Image from "next/image";
import { Lora, Poppins } from "next/font/google";
import { LucideEye, LucideHeart } from "lucide-react";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "600"],
  preload: true,
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
  preload: true,
});

export interface BlogPost {
  _id: string;
  title: string;
  content?: string;
  banner?: string;
  category?: string;
  author?: string;
  date?: string;
  likes?: number;
  total_reads: string;
  createdAt?: string;
}

interface BlogListProps {
  posts: BlogPost[];
  variant?: "default" | "minimal" | "featured";
}

const PopularPosts: React.FC<BlogListProps> = ({
  posts,
  variant = "default",
}) => {
  if (variant === "minimal") {
    return (
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post._id}
            className="group flex items-start gap-3 hover:bg-gray-50/80 p-2 rounded-lg transition-all duration-200"
          >
            {/* Thumbnail Image */}
            {post.banner && (
              <div className="relative w-16 h-12 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                <Image
                  src={post.banner}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105 duration-300"
                  sizes="64px"
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3
                className={`text-sm font-medium text-neutral-800 group-hover:text-indigo-600 transition-colors leading-tight mb-1 line-clamp-2 ${poppins.className}`}
              >
                {post.title}
              </h3>
              <div className="flex items-center gap-2">
                <p className={`text-xs text-neutral-500 ${lora.className}`}>
                  {post.author && (
                    <>
                      {post.author}
                      {post.createdAt && " · "}
                    </>
                  )}
                  {post.createdAt &&
                    new Date(post.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const formattedDate = post.createdAt
            ? new Date(post.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "";

          return (
            <article
              key={post._id}
              className="group overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              {post.banner && (
                <div className="relative h-48 w-full">
                  <Image
                    src={post.banner}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105 duration-300"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                  <span className="font-medium text-primary-600">
                    {post.category}
                  </span>
                  <span>·</span>
                  <span>{formattedDate}</span>
                </div>
                <h3
                  className={`text-lg font-semibold mb-2 group-hover:text-primary-600 transition-colors ${poppins.className}`}
                >
                  {post.title}
                </h3>
                {post.content && (
                  <p
                    className={`text-neutral-600 text-sm mb-4 line-clamp-2 ${lora.className}`}
                  >
                    {post.content}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-neutral-500">
                  <span>By {post.author || "Unknown"}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <LucideEye className="w-4 h-4" />
                      {post.total_reads ?? 0}
                    </span>
                    {post.likes !== undefined && (
                      <span className="flex items-center gap-1">
                        <LucideHeart className="w-4 h-4" />
                        {post.likes}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  // Default variant
  return (
    <div className="space-y-6">
      {posts.map((post) => {
        const formattedDate = post.createdAt
          ? new Date(post.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })
          : "";

        return (
          <article
            key={post._id}
            className="flex flex-col sm:flex-row gap-4 border-b border-neutral-100 hover:bg-neutral-50/50 p-2 rounded-lg transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                {post.category && (
                  <span className="bg-neutral-100 text-neutral-700 px-2 py-1 rounded-full">
                    {post.category}
                  </span>
                )}
                <span>{post.author || "Unknown"}</span>
                <span>·</span>
                <span>{formattedDate}</span>
              </div>

              <h3
                className={`text-lg font-semibold mb-2 leading-tight ${poppins.className}`}
              >
                {post.title}
              </h3>

              {post.content && (
                <p
                  className={`text-neutral-600 text-sm mb-3 line-clamp-2 ${lora.className}`}
                >
                  {post.content}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-neutral-500">
                <span className="flex items-center gap-1">
                  <LucideEye className="w-4 h-4" />
                  {post.total_reads ?? 0} reads
                </span>
                {post.likes !== undefined && (
                  <span className="flex items-center gap-1">
                    <LucideHeart className="w-4 h-4" />
                    {post.likes} likes
                  </span>
                )}
              </div>
            </div>

            {post.banner && (
              <div className="sm:w-32 sm:h-24 w-full h-40 relative rounded-md overflow-hidden flex-shrink-0">
                <Image
                  src={post.banner}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 128px"
                />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};

export default PopularPosts;
