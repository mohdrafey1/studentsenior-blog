/** Cancellation is not a share. Clipboard fallbacks count only after success. */
export async function shareAndTrack(
    action: () => Promise<unknown>,
    track: () => void,
): Promise<void> {
    await action();
    track();
}
