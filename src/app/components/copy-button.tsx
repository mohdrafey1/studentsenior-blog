// app/components/CopyButton.tsx
'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CopyButtonProps {
    textToCopy: string;
}

export default function CopyButton({ textToCopy }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className='opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-white'
            title={copied ? 'Copied!' : 'Copy to clipboard'}
            aria-label='Copy text'
        >
            {copied ? (
                <Check className='w-3 h-3 md:w-4 md:h-4 text-green-400' />
            ) : (
                <Copy className='w-3 h-3 md:w-4 md:h-4' />
            )}
        </button>
    );
}
