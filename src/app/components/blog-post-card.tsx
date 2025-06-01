"use client";

import React from "react";
import Image from "next/image";
import { Heart, Share2, User } from "lucide-react";
import { Lora, Poppins } from "next/font/google";

const lora = Lora({ subsets: ["latin"], weight: "400", preload: true });
const poppins = Poppins({ subsets: ["latin"], weight: "600", preload: true });

export interface BlogPostCardProps {
  post: {
    _id: string;
    slug: string;
    title: string;
    banner?: string;
    description?: string;
    content?: string;
    tags?: string[];
    author: string;
    total_likes?: number;
    total_reads?: number;
    isDraft?: boolean;
    updatedAt: string;
    createdAt: string;
  };
  isLiked?: boolean;
  onClick?: () => void;
  onLike?: () => void;
  onShare?: () => void;
  ariaLabel?: string;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({
  post,
  isLiked = false,
  onClick,
  onLike,
  onShare,
  ariaLabel,
}) => {
  const handleKeyDown = (event: React.KeyboardEvent, action?: () => void) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action?.();
    }
  };

  const formattedDate = new Date(post.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <article
      className="flex flex-row gap-4 bg-white rounded-xl shadow-sm cursor-pointer transition-shadow duration-200 overflow-hidden"
      onClick={onClick}
      onKeyDown={(e) => handleKeyDown(e, onClick)}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : "article"}
      aria-label={ariaLabel || `Blog post: ${post.title}`}
    >
      <div className="flex flex-col justify-between py-3 px-4 pr-3 flex-grow">
        <div>
          <div className="flex items-center gap-1 text-xs text-black mb-1">
            <User className="h-4 w-4" />
            <span className="font-medium">{post.author}</span>
            <span className="mx-1 text-gray-500">·</span>
            <time dateTime={post.updatedAt} className="text-gray-500">
              {formattedDate}
            </time>
          </div>

          <div className="flex flex-col justify-center">
            <h2
              className={`text-base font-semibold text-black mb-1 line-clamp-2 ${poppins.className}`}
            >
              {post.title}
            </h2>

            {post.description && (
              <p
                className={`text-sm text-gray-800 mb-2 line-clamp-2 ${lora.className}`}
              >
                {post.description}
              </p>
            )}

            {Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-black text-white text-xs font-medium px-2 py-0.5 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike?.();
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                handleKeyDown(e, onLike);
              }}
              className={`flex items-center gap-1 text-xs ${
                isLiked ? "text-red-500" : "text-black hover:opacity-80"
              } transition-colors`}
              aria-label={isLiked ? "Unlike this post" : "Like this post"}
            >
              <Heart className={`w-3 h-3 ${isLiked ? "fill-current" : ""}`} />
              <span>{post.total_likes ?? 0}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare?.();
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                handleKeyDown(e, onShare);
              }}
              className="text-black hover:opacity-80 transition-colors"
              aria-label="Share this post"
            >
              <Share2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {post.banner && (
        <div className="w-40 h-40 flex-shrink-0">
          <div className="relative w-full h-full">
            <Image
              src={post.banner}
              alt={`Cover image for ${post.title}`}
              fill
              className="object-cover rounded-l-none rounded-r-xl"
              sizes="(max-width: 768px) 33vw, 20vw"
              priority
            />
          </div>
        </div>
      )}
    </article>
  );
};

export default BlogPostCard;
