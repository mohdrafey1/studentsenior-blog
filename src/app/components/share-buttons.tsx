'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faWhatsapp,
    faXTwitter,
    faLinkedin,
} from '@fortawesome/free-brands-svg-icons';
import { SocialShareButtonsProps } from '@/constant/interface';

const SocialShareButtons = ({ message }: SocialShareButtonsProps) => {
    const [currentUrl, setCurrentUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUrl(window.location.href);
        }
    }, []);
    const defaultMessage =
        '🚀 Check this out! Found something really helpful for you:';
    const finalMessage = encodeURIComponent(
        `${message || defaultMessage} ${currentUrl}`
    );

    const encodedUrlOnly = encodeURIComponent(currentUrl);

    const handleWhatsAppShare = () => {
        window.open(`https://wa.me/?text=${finalMessage}`, '_blank');
    };

    const handleTwitterShare = () => {
        window.open(
            `https://twitter.com/intent/tweet?text=${finalMessage}`,
            '_blank'
        );
    };

    const handleLinkedInShare = () => {
        window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrlOnly}`,
            '_blank'
        );
    };

    return (
        <div className='flex items-center gap-3'>
            <button
                onClick={handleWhatsAppShare}
                className='hover:scale-110 transition-transform'
            >
                <FontAwesomeIcon
                    icon={faWhatsapp}
                    className='h-5 md:h-6 text-2xl text-green-500'
                />
            </button>

            <button
                onClick={handleTwitterShare}
                className='hover:scale-110 transition-transform'
            >
                <FontAwesomeIcon
                    icon={faXTwitter}
                    className='h-5 md:h-6 text-2xl text-black'
                />
            </button>

            <button
                onClick={handleLinkedInShare}
                className='hover:scale-110 transition-transform'
            >
                <FontAwesomeIcon
                    icon={faLinkedin}
                    className='h-5 md:h-6 text-2xl text-blue-700'
                />
            </button>
        </div>
    );
};

export default SocialShareButtons;
