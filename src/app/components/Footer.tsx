import { Facebook, Twitter, Linkedin } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer className='bg-gray-900 text-gray-300 py-8'>
            <div className='container mx-auto px-4 flex flex-col md:flex-row justify-between items-center'>
                {/* Logo / Brand Name */}
                <div className='mb-4 md:mb-0'>
                    <h1 className='text-2xl font-bold text-orange-500'>
                        Student Senior
                    </h1>
                    <p className='text-sm mt-1'>
                        Empowering Students, One Blog at a Time
                    </p>
                </div>

                {/* Navigation Links */}
                <nav className='flex space-x-6 mb-4 md:mb-0 text-sm'>
                    <Link href='/' className='hover:text-orange-500 transition'>
                        Home
                    </Link>
                    <Link
                        href='/blogs'
                        className='hover:text-orange-500 transition'
                    >
                        Blogs
                    </Link>
                    <Link
                        href='/about'
                        className='hover:text-orange-500 transition'
                    >
                        About
                    </Link>
                    <Link
                        href='/contact'
                        className='hover:text-orange-500 transition'
                    >
                        Contact
                    </Link>
                </nav>

                {/* Social Icons */}
                <div className='flex space-x-4 text-gray-300'>
                    <Link
                        href='https://facebook.com'
                        target='_blank'
                        rel='noopener noreferrer'
                        aria-label='Facebook'
                        className='hover:text-orange-500 transition'
                    >
                        <Facebook size={24} />
                    </Link>
                    <Link
                        href='https://twitter.com'
                        target='_blank'
                        rel='noopener noreferrer'
                        aria-label='Twitter'
                        className='hover:text-orange-500 transition'
                    >
                        <Twitter size={24} />
                    </Link>
                    <Link
                        href='https://linkedin.com'
                        target='_blank'
                        rel='noopener noreferrer'
                        aria-label='LinkedIn'
                        className='hover:text-orange-500 transition'
                    >
                        <Linkedin size={24} />
                    </Link>
                </div>
            </div>

            {/* Copyright */}
            <div className='mt-8 text-center text-xs text-gray-500'>
                &copy; {new Date().getFullYear()} Student Senior. All rights
                reserved.
            </div>
        </footer>
    );
};

export default Footer;
