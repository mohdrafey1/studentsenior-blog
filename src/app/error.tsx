"use client";

export default function ContentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-12 text-center" role="alert">
            <h1 className="text-2xl font-semibold">We couldn’t load this page</h1>
            <p className="text-gray-600">Check your connection and try again. Your content may still be available.</p>
            <button type="button" onClick={reset} className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Try again</button>
        </main>
    );
}
