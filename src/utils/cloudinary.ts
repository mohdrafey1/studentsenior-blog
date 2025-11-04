export function optimizeCloudinaryUrl(
    url: string,
    options = 'f_auto,q_auto,c_fill,w_800,dpr_auto'
): string {
    if (!url || !url.includes('/upload/')) return url;
    return url.replace('/upload/', `/upload/${options}/`);
}
