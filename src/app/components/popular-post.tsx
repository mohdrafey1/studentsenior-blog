"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Lora, Poppins } from "next/font/google";
import { BlogListProps } from "@/constant/interface";

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

const PopularPosts: React.FC<BlogListProps> = ({ posts }) => {
  return (
    <div className="w-full space-y-5">
      {posts.map((post) => {
        return (
          <Link
            key={post._id}
            href={`/blog/post/${post.slug}`}
            className="block"
          >
            <article className="flex items-start gap-3 w-full border border-neutral-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-2">
              {post.banner && (
                <div className="relative aspect-[4/3] w-24 sm:w-28 md:w-32 flex-shrink-0 rounded-lg overflow-hidden">
                  <Image
                    src={post.banner}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="flex flex-col justify-between flex-1 min-w-0">
                <h3
                  className={`text-sm sm:text-base font-semibold text-neutral-900 leading-tight line-clamp-2 ${poppins.className}`}
                >
                  {post.title}
                </h3>

                {(post.description || post.description) && (
                  <p
                    className={`text-xs sm:text-sm text-neutral-600 line-clamp-2 mt-1 ${lora.className}`}
                  >
                    {post.description?.slice(0, 140)}
                  </p>
                )}
              </div>
            </article>
          </Link>
        );
      })}
    </div>
  );
};

export default PopularPosts;
