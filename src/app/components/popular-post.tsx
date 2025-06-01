"use client";

import React from "react";
import Image from "next/image";
import { Lora, Poppins } from "next/font/google";
import { LucideEye } from "lucide-react";

const lora = Lora({ subsets: ["latin"], weight: "400", preload: true });
const poppins = Poppins({ subsets: ["latin"], weight: "600", preload: true });

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
}

const PopularPosts: React.FC<BlogListProps> = ({ posts }) => {
  return (
    <div className="space-y-6">
      {posts.map((post) => {
        const formattedDate = post.createdAt
          ? new Date(post.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })
          : "Date";

        return (
          <div
            key={post._id}
            className="flex justify-between items-start border-b border-gray-300 pb-5"
          >
            <div className="flex-1 pr-4">
              <div className="text-xs text-neutral-500 mb-1">
                {post.author ?? "Unknown"} &bull; {formattedDate}
              </div>

              <h2
                className={`text-black text-base leading-snug font-semibold line-clamp-2 mb-2 ${poppins.className}`}
              >
                {post.title}
              </h2>

              {post.content && (
                <p
                  className={`text-neutral-700 text-sm leading-relaxed line-clamp-2 mb-2 ${lora.className}`}
                >
                  {post.content}
                </p>
              )}

              <div className="flex items-center flex-wrap gap-3 text-xs text-neutral-600">
                {post.category && (
                  <span className="bg-neutral-200 px-2 py-0.5 rounded-full text-[11px] tracking-wide">
                    {post.category}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <LucideEye className="w-4 h-4" /> {post.total_reads ?? 0}
                </span>
              </div>
            </div>

            {post.banner && (
              <div className="w-24 h-16 relative flex-shrink-0">
                <Image
                  src={post.banner}
                  alt={post.title}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PopularPosts;
