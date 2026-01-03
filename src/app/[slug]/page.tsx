import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import PopularPosts from '@/app/components/popular-post';
import Header from '@/app/components/header';
import Footer from '@/app/components/Footer';
import React from 'react';
import SocialShareButtons from '@/app/components/share-buttons';
import { api } from '@/config/apiConfig';
import {
    BlogPostComponentProps,
    tParams,
    Blog,
    CodeProps,
} from '@/constant/interface';
import { formatReadTime, formatDate } from '@/utils/formatting';
import ClientAd from '@/app/components/Ads/AdsClient';
import { optimizeCloudinaryUrl } from '@/utils/cloudinary';
import CopyButton from '@/app/components/copy-button';
import type { Element, ElementContent } from 'hast';
import AiSummary from '../components/AiSummary/AiSummary';

function BlogPostComponent({
    post,
    popularPosts,
    latestPosts,
}: BlogPostComponentProps): React.ReactElement {
    const readTime = formatReadTime(post.content);

    let firstAdRendered = false;
    const renderMarkdown = (content: string = '') => {
        if (!content.trim()) {
            return (
                <div className='max-w-none'>
                    <p className='text-neutral-500 italic font-light'>
                        No content available.
                    </p>
                </div>
            );
        }

        return (
            <div className='max-w-none text-neutral-800'>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({ ...props }) => (
                            <h1
                                className='text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-8 md:mt-12 mb-6 md:mb-8 leading-tight'
                                {...props}
                            />
                        ),
                        h2: ({ ...props }) => (
                            <h2
                                className="text-2xl md:text-3xl font-bold text-neutral-900 mt-8 md:mt-10 mb-4 md:mb-6 leading-tight relative after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-16 after:h-1 after:bg-gradient-to-r after:from-blue-500 after:to-purple-500"
                                {...props}
                            />
                        ),
                        h3: ({ ...props }) => (
                            <h3
                                className="text-xl md:text-2xl font-semibold text-neutral-800 mt-6 md:mt-8 mb-3 md:mb-4 leading-tight flex items-center before:content-['#'] before:text-blue-500 before:mr-2 before:text-lg md:before:text-xl"
                                {...props}
                            />
                        ),
                        p: ({ node, ...props }) => {
                            const hasBlockChild = (
                                node?.children as ElementContent[]
                            )?.some(
                                (child): child is Element =>
                                    'tagName' in child &&
                                    [
                                        'div',
                                        'img',
                                        'pre',
                                        'iframe',
                                        'table',
                                        'blockquote',
                                    ].includes(child.tagName)
                            );

                            const Component = hasBlockChild ? 'div' : 'p';

                            return (
                                <Component
                                    className='text-base md:text-lg text-neutral-700 leading-relaxed mb-4 md:mb-6 font-normal'
                                    {...props}
                                />
                            );
                        },

                        a: ({ ...props }) => (
                            <a
                                className='text-blue-600 hover:text-blue-800 font-medium underline underline-offset-4 decoration-blue-300 hover:decoration-blue-500 transition-all duration-200'
                                target='_blank'
                                rel='noopener noreferrer'
                                {...props}
                            />
                        ),
                        ul: ({ ...props }) => (
                            <ul
                                className='list-disc pl-5 md:pl-6 mb-4 md:mb-6 space-y-2 md:space-y-3 marker:text-blue-400'
                                {...props}
                            />
                        ),
                        ol: ({ ...props }) => (
                            <ol
                                className='list-decimal pl-5 md:pl-6 mb-4 md:mb-6 space-y-2 md:space-y-3 marker:font-medium marker:text-blue-500'
                                {...props}
                            />
                        ),
                        li: ({ ...props }) => (
                            <li
                                className='text-base md:text-lg text-neutral-700 leading-relaxed pl-1 md:pl-2 marker:font-medium'
                                {...props}
                            />
                        ),
                        blockquote: ({ ...props }) => (
                            <blockquote
                                className='border-l-4 border-blue-400 pl-4 md:pl-6 italic text-neutral-600 my-4 md:my-6 py-1 md:py-2 bg-blue-50 rounded-r-lg'
                                {...props}
                            />
                        ),
                        code({ className, children, ...props }: CodeProps) {
                            const match = /language-(\w+)/.exec(
                                className || ''
                            );
                            const isInline = !className;

                            if (isInline) {
                                return (
                                    <code
                                        className='inline bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-mono text-sm border border-red-300'
                                        {...props}
                                    >
                                        {String(children).trim()}
                                    </code>
                                );
                            }

                            return (
                                <div className='rounded-lg overflow-hidden my-4 md:my-6 group'>
                                    <div className='flex items-center justify-between bg-neutral-800 px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm text-neutral-200'>
                                        <span>{match?.[1] || 'code'}</span>
                                        <CopyButton
                                            textToCopy={String(
                                                children
                                            ).replace(/\n$/, '')}
                                        />
                                    </div>
                                    <SyntaxHighlighter
                                        // @ts-expect-error - atomDark type is not properly exported
                                        style={atomDark}
                                        language={match?.[1] || 'text'}
                                        PreTag='div'
                                        className='!bg-neutral-900 !rounded-b-lg !p-3 md:!p-4 text-xs md:text-sm !m-0'
                                        showLineNumbers
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                </div>
                            );
                        },
                        hr: ({ ...props }) => (
                            <hr
                                className='my-6 md:my-8 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent border-0'
                                {...props}
                            />
                        ),
                        img: ({ src, alt }) => {
                            if (!src || typeof src !== 'string') return null;

                            return (
                                <div className='my-6 md:my-8 rounded-xl overflow-hidden shadow-lg border border-neutral-200 group'>
                                    <Image
                                        src={optimizeCloudinaryUrl(
                                            src || '',
                                            'f_auto,q_auto,c_fill,w_400,dpr_auto'
                                        )}
                                        alt={alt || ''}
                                        width={800}
                                        height={400}
                                        className='w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]'
                                        unoptimized
                                    />
                                    {alt && (
                                        <div className='bg-neutral-50 px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm text-neutral-600 text-center border-t border-neutral-200'>
                                            {alt}
                                        </div>
                                    )}
                                </div>
                            );
                        },
                        table: ({ ...props }) => {
                            const showAd = !firstAdRendered;
                            if (showAd) firstAdRendered = true;
                            return (
                                <>
                                    <div className='overflow-x-auto my-4 md:my-6 rounded-lg border border-neutral-200 shadow-sm'>
                                        <table
                                            className='min-w-full divide-y divide-neutral-200'
                                            {...props}
                                        />
                                    </div>
                                    {showAd && <ClientAd adSlot='9984010614' />}
                                </>
                            );
                        },
                        th: ({ ...props }) => (
                            <th
                                className='px-3 md:px-4 py-2 md:py-3 bg-neutral-50 text-left text-xs md:text-sm font-semibold text-neutral-700 uppercase tracking-wider border-b border-neutral-200'
                                {...props}
                            />
                        ),
                        td: ({ ...props }) => (
                            <td
                                className='px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-neutral-700 border-b border-neutral-200'
                                {...props}
                            />
                        ),
                        tr: ({ ...props }) => (
                            <tr
                                className='hover:bg-neutral-50 transition-colors'
                                {...props}
                            />
                        ),
                        strong: ({ ...props }) => (
                            <strong
                                className='font-semibold text-neutral-900'
                                {...props}
                            />
                        ),
                        em: ({ ...props }) => (
                            <em className='italic text-blue-600' {...props} />
                        ),
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        );
    };

    return (
        <>
            <Header />
            <div className='min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100'>
                <div className='max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-12 p-4 sm:p-6 lg:p-8'>
                    <article className='flex-1 rounded-2xl overflow-hidden'>
                        <div className='px-4 sm:px-6 md:px-10 pt-2 pb-4'>
                            <Link
                                href='/'
                                className='inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-all duration-300 hover:gap-3 group'
                            >
                                <ArrowLeft className='w-4 h-4 transition-transform group-hover:-translate-x-1' />
                                <span className='font-medium'>
                                    Back to Home
                                </span>
                            </Link>
                        </div>
                        <header className='px-4 sm:px-6 md:px-8 lg:px-10 pb-0 text-neutral-800'>
                            {/* Title */}
                            <h1 className='text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight tracking-tight font-serif mb-3 text-neutral-900'>
                                {post.title}
                            </h1>

                            {/* Meta + Share */}
                            <div className='flex flex-col sm:flex-row sm:items-start md:items-center md:justify-between gap-3 md:gap-6 mb-4'>
                                {/* Meta Info */}
                                <div className='flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-neutral-500'>
                                    {post.author && (
                                        <div className='flex items-center gap-1'>
                                            <User className='w-3 h-3 sm:w-4 sm:h-4 text-neutral-400' />
                                            <span className='font-medium text-neutral-700'>
                                                {post.author}
                                            </span>
                                        </div>
                                    )}

                                    <div className='flex items-center gap-1'>
                                        <Calendar className='w-3 h-3 sm:w-4 sm:h-4 text-neutral-400' />
                                        <span className='font-medium'>
                                            {formatDate(post.createdAt)}
                                        </span>
                                    </div>

                                    <div className='flex items-center gap-1'>
                                        <Clock className='w-3 h-3 sm:w-4 sm:h-4 text-neutral-400' />
                                        <span className='font-medium'>
                                            {readTime}
                                        </span>
                                    </div>
                                </div>

                                {/* Share Buttons */}
                                <div className='flex justify-start sm:justify-end'>
                                    <SocialShareButtons />
                                </div>
                            </div>

                            {/* Banner Image */}
                            {post.banner && (
                                <div className='relative w-full h-48 sm:h-52 md:h-64 lg:h-72 xl:h-80 mb-6 sm:mb-8 rounded-xl overflow-hidden shadow-lg'>
                                    <Image
                                        src={post.banner}
                                        alt={`Banner for ${post.title}`}
                                        fill
                                        className='object-cover hover:scale-105 transition-transform duration-700'
                                        sizes='(max-width: 768px) 100vw, 800px'
                                        unoptimized
                                    />
                                    <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent' />
                                </div>
                            )}
                        </header>
                        {post?.summary && (
                            <AiSummary summaries={post?.summary} />
                        )}
                        <ClientAd adSlot='9984010614' />
                        <div className='px-4 sm:px-6 md:px-10 pb-8 sm:pb-12'>
                            {renderMarkdown(post.content)}
                        </div>
                        <ClientAd adSlot='9984010614' />
                        <footer className='px-4 sm:px-6 md:px-10 py-6 sm:py-8 border-t border-neutral-200'>
                            {/* Tags */}
                            {Array.isArray(post.tags) &&
                                post.tags.length > 0 && (
                                    <div className='flex flex-wrap gap-2 mb-4 sm:mb-6'>
                                        {post.tags.map(
                                            (tag: string, index: number) => (
                                                <span
                                                    key={`${tag}-${index}`}
                                                    className='px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium cursor-pointer bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200 transition-all duration-200'
                                                >
                                                    #{tag}
                                                </span>
                                            )
                                        )}
                                    </div>
                                )}
                        </footer>
                    </article>

                    <aside className='lg:w-80'>
                        <div className='sticky top-4 sm:top-8 space-y-8 sm:space-y-10'>
                            <h2
                                className={`text-lg sm:text-xl mb-3 sm:mb-4 font-semibold text-neutral-800 font-poppins`}
                            >
                                Popular Posts
                            </h2>
                            <PopularPosts posts={popularPosts} />
                            <h2
                                className={`text-lg sm:text-xl mb-3 sm:mb-4 font-semibold text-neutral-800 font-poppins`}
                            >
                                Latest Posts
                            </h2>
                            <PopularPosts posts={latestPosts.slice(0, 5)} />
                        </div>
                    </aside>
                </div>
            </div>
            <Footer />
        </>
    );
}

export async function generateMetadata({ params }: { params: tParams }) {
    const { slug } = await params;
    const blogId = slug;

    try {
        const postRes = await fetch(`${api.blog.allBlogs}/${blogId}`, {
            next: { revalidate: 3600 },
            headers: { 'Content-Type': 'application/json' },
        });

        if (!postRes.ok) {
            return {
                title: 'Blog Post Not Found',
                description: 'The requested blog post could not be found.',
            };
        }

        const postJson = await postRes.json();
        const post: Blog = postJson.data;

        if (!post) {
            return {
                title: 'Blog Post Not Found',
                description: 'The requested blog post could not be found.',
            };
        }

        return {
            title: `${post.title} | Student Senior Blogs`,
            description:
                post.description || 'A blog post about interesting topics.',
            keywords: post.tags?.join(', ') || 'blog, article, post',
            openGraph: {
                title: post.title,
                description:
                    post.description || 'A blog post about interesting topics.',
                type: 'article',
                publishedTime: post.createdAt,
                authors: post.author ? [post.author] : undefined,
                tags: post.tags,
                images: post.banner
                    ? [
                          {
                              url: post.banner,
                              width: 1200,
                              height: 630,
                              alt: post.title,
                          },
                      ]
                    : undefined,
            },
            twitter: {
                card: 'summary_large_image',
                title: post.title,
                description:
                    post.description || 'A blog post about interesting topics.',
                images: post.banner ? [post.banner] : undefined,
            },
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'Error Loading Blog',
            description: 'An error occurred while loading the blog metadata.',
        };
    }
}

export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const blogId = slug;

    const headers = { 'Content-Type': 'application/json' };

    try {
        // Fetch all data in parallel
        const [postRes, popularRes, latestRes] = await Promise.all([
            fetch(`${api.blog.allBlogs}/${blogId}`, {
                next: { revalidate: 3600 },
                headers,
            }),
            fetch(api.blog.popularBlogs, {
                next: { revalidate: 3600 },
                headers,
            }),
            fetch(api.blog.latestBlogs, {
                next: { revalidate: 3600 },
                headers,
            }),
        ]);

        if (!postRes.ok) {
            console.error(`Failed to fetch post: ${postRes.status}`);
            return notFound();
        }

        const postJson = await postRes.json();
        if (!postJson?.data) {
            console.error('Post data not found in response');
            return notFound();
        }

        // Safely parse other JSONs
        const [popularJson, latestJson] = await Promise.all([
            popularRes.ok ? popularRes.json() : { data: [] },
            latestRes.ok ? latestRes.json() : { data: [] },
        ]);

        return (
            <BlogPostComponent
                post={postJson.data}
                popularPosts={popularJson.data || []}
                latestPosts={latestJson.data || []}
            />
        );
    } catch (error) {
        console.error('Error fetching blog post:', error);
        return notFound();
    }
}
