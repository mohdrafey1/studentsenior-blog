export interface Blog {
    _id: string;
    title: string;
    content?: string;
    description?: string;
    banner?: string;
    category?: string;
    author?: string;
    date?: string;
    likes?: number;
    total_reads: number;
    createdAt?: string;
    updatedAt?: string;
    slug: string;
    isDraft?: boolean;
    tags?: string[];
    total_likes?: number;
    summary?: string[][];
}

export interface BlogPostComponentProps {
    post: Blog;
    popularPosts: Blog[];
    latestPosts: Blog[];
}

// The route is app/[slug], a single dynamic segment, so Next resolves this
// to a string. It was typed string[] and only worked because every use site
// interpolated it into a template literal.
export type tParams = Promise<{ slug: string }>;

export interface CodeProps extends React.HTMLAttributes<HTMLElement> {
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
}

export interface BlogPost {
    _id: string;
    title: string;
    description?: string;
    banner?: string;
    author?: string;
    createdAt?: string;
    slug: string;
    total_reads: number;
    readTime?: string;
}

export interface BlogListProps {
    posts: BlogPost[];
}

export interface SocialShareButtonsProps {
    message?: string; // Optional custom message
}

export interface Slug {
    slug: string;
}
