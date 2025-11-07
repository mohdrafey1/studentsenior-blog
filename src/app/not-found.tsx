import Link from 'next/link';

export default function NotFound() {
    return (
        <main className='flex min-h-screen flex-col items-center justify-center bg-gray-50 text-gray-800 px-6 text-center'>
            <div className='max-w-md'>
                <h1 className='text-8xl font-extrabold text-blue-600 mb-4'>
                    404
                </h1>
                <h2 className='text-2xl font-semibold mb-3'>Page Not Found</h2>
                <p className='text-gray-500 mb-6'>
                    Oops! The page you’re looking for doesn’t exist or has been
                    moved.
                </p>

                <Link
                    href='/'
                    className='inline-block rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition'
                >
                    Go Back Home
                </Link>

                <div className='mt-8 text-sm text-gray-400'>
                    Student Senior Blogs © {new Date().getFullYear()}
                </div>
            </div>
        </main>
    );
}
