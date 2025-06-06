"use client";

import React from "react";
import Image from "next/image";
import { Heart, Share2, User, Clock, Eye } from "lucide-react";
import { Poppins, Inter } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  preload: true,
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  preload: true,
});

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

  const formattedDate = new Date(post.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const getReadTime = (content?: string) => {
    if (!content) return "2 min read";
    const words = content.split(" ").length;
    const readTime = Math.ceil(words / 200);
    return `${readTime} min read`;
  };

  return (
    <article
      className="group bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col sm:flex-row h-full"
      onClick={onClick}
      onKeyDown={(e) => handleKeyDown(e, onClick)}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : "article"}
      aria-label={ariaLabel || `Blog post: ${post.title}`}
    >
      {post.banner && (
        <div className="w-full sm:w-1/3 md:w-2/5 lg:w-1/3 h-48 sm:h-auto relative flex-shrink-0">
          <Image
            src={post.banner}
            alt={`Cover image for ${post.title}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 40vw, (max-width: 1024px) 30vw, 25vw"
          />
        </div>
      )}

      <div className="p-4 sm:p-5 flex flex-col flex-grow w-full sm:w-2/3 md:w-3/5 lg:w-2/3 bg-gray-50">
        {post.tags && post.tags.length > 0 && (
          <span className="text-sm font-medium text-blue-500 uppercase tracking-wide mb-2">
            {post.tags[0]}
          </span>
        )}

        <h2
          className={`text-xl sm:text-2xl font-semibold text-gray-900 mb-2 leading-tight ${poppins.className}`}
        >
          {post.title}
        </h2>

        {post.description && (
          <p
            className={`text-gray-500 mb-3 sm:mb-4 text-base leading-relaxed line-clamp-2 ${inter.className}`}
          >
            {post.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-auto">
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-3 w-3 text-gray-600" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="text-sm font-medium text-gray-900">
              {post.author}
            </span>
            <span className="hidden sm:inline text-gray-400">•</span>
            <time dateTime={post.updatedAt} className="text-sm text-gray-500">
              {formattedDate}
            </time>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{getReadTime(post.content)}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{post.total_reads ?? 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike?.();
              }}
              className={`flex items-center gap-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 rounded-lg px-2 py-1 ${
                isLiked ? "text-red-600" : "text-gray-500 hover:text-red-600"
              }`}
              aria-label={isLiked ? "Unlike this post" : "Like this post"}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              <span>{post.total_likes ?? 0}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare?.();
              }}
              className="text-sm text-gray-500 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg px-2 py-1"
              aria-label="Share this post"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default BlogPostCard;
