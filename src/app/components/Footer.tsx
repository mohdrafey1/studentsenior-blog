import { Linkedin } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer className='bg-neutral-950 text-gray-400 border-t border-neutral-800'>
            <div className='max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8'>
                {/* --- Brand Section --- */}
                <div>
                    <h2 className='text-2xl font-semibold text-white mb-2'>
                        Student Senior
                    </h2>
                    <p className='text-sm leading-relaxed text-gray-500'>
                        Empowering students through knowledge, mentorship, and
                        opportunities. Learn, grow, and achieve your academic
                        goals with confidence.
                    </p>
                </div>

                {/* --- Quick Links --- */}
                <div className='md:text-center'>
                    <h3 className='text-sm font-semibold uppercase text-gray-300 tracking-wide mb-4'>
                        Quick Links
                    </h3>
                    <ul className='space-y-2'>
                        <li>
                            <Link
                                href='/'
                                className='hover:text-blue-500 transition-colors duration-300'
                            >
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link
                                href='https://www.studentsenior.com/about-us'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='hover:text-blue-500 transition-colors duration-300'
                            >
                                About Us
                            </Link>
                        </li>
                        <li>
                            <Link
                                href='https://www.studentsenior.com/contact-us'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='hover:text-blue-500 transition-colors duration-300'
                            >
                                Contact
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* --- Connect Section --- */}
                <div className='md:text-right'>
                    <h3 className='text-sm font-semibold uppercase text-gray-300 tracking-wide mb-4'>
                        Connect With Us
                    </h3>
                    <div className='flex md:justify-end space-x-4'>
                        <Link
                            href='https://www.studentsenior.com'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='hover:text-blue-500 transition-colors duration-300 text-sm'
                        >
                            Website
                        </Link>
                        <Link
                            href='https://www.linkedin.com/company/student-senior'
                            target='_blank'
                            rel='noopener noreferrer'
                            aria-label='LinkedIn'
                            className='p-2 rounded-full bg-neutral-900 hover:bg-blue-500 hover:text-white transition-all duration-300'
                        >
                            <Linkedin size={20} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* --- Bottom Bar --- */}
            <div className='border-t border-neutral-800 py-4 text-center text-xs text-gray-500'>
                © {new Date().getFullYear()}{' '}
                <span className='text-white font-medium'>Student Senior</span>.
                All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
