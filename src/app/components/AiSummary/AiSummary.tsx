'use client';
import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

interface AiSummaryProps {
    summaries: string[][];
}

const AiSummary: React.FC<AiSummaryProps> = ({ summaries = [] }) => {
    const [displayText, setDisplayText] = useState('');
    const [loading, setLoading] = useState(false);
    const [started, setStarted] = useState(false);
    const [typing, setTyping] = useState(false);
    const [aiTyping, setAiTyping] = useState(false);

    // Typing animation
    const typeText = (text: string) => {
        setDisplayText('');
        setTyping(true);
        setAiTyping(true);

        let index = 0;
        const typingSpeed = 25;

        const interval = setInterval(() => {
            setDisplayText((prev) => prev + text.charAt(index - 1));
            index++;

            if (index === text.length) {
                clearInterval(interval);
                setTyping(false);
                setTimeout(() => setAiTyping(false), 600);
            }
        }, typingSpeed);
    };

    // Generate summary
    const handleGenerate = () => {
        if (!summaries.length) return;

        setStarted(true);
        setLoading(true);
        setDisplayText('');
        setTyping(false);
        setAiTyping(false);

        const delay = Math.floor(Math.random() * 1700) + 1500;

        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * summaries.length);

            // FIXED — summaries[randomIndex] is already an array of strings
            const selectedSummaryArray = summaries[randomIndex];

            // Convert string[] → single string (with line breaks)
            const newSummary = selectedSummaryArray.join('\n');

            setLoading(false);
            typeText(newSummary);
        }, delay);
    };

    return (
        <div className='relative mx-3 sm:mx-6 md:mx-10 my-4 rounded-2xl bg-blue-100'>
            <div className='rounded-t-2xl p-4 sm:p-5 md:p-6'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-3'>
                    <div className='flex items-center gap-1'>
                        <Sparkles className='w-5 h-5 text-blue-600 pl-4 pr-4' />
                        <h3 className='text-[17px] sm:text-[18px] font-semibold text-gray-800 tracking-tight'>
                            AI Summary
                        </h3>
                    </div>

                    {!started && (
                        <button
                            onClick={handleGenerate}
                            disabled={loading || typing}
                            className='text-sm font-medium bg-blue-600 hover:bg-blue-700 transition-all text-white flex items-center gap-2 px-4 py-1.5 rounded-md shadow disabled:opacity-50 w-full sm:w-auto justify-center'
                        >
                            {loading ? (
                                <RefreshCw className='w-4 h-4 animate-spin' />
                            ) : (
                                <Sparkles className='w-4 h-4' />
                            )}
                            Generate
                        </button>
                    )}

                    {loading && (
                        <div className='-mt-3'>
                            <svg
                                width='40'
                                height='40'
                                viewBox='0 0 80 80'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <defs>
                                    <linearGradient
                                        id='spark'
                                        x1='0%'
                                        y1='0%'
                                        x2='100%'
                                        y2='100%'
                                    >
                                        <stop
                                            offset='0%'
                                            stop-color='#8B5CF6'
                                        />
                                        <stop
                                            offset='50%'
                                            stop-color='#A855F7'
                                        />
                                        <stop
                                            offset='100%'
                                            stop-color='#FB7185'
                                        />
                                    </linearGradient>
                                </defs>

                                <g transform='translate(32 25)'>
                                    <path
                                        fill='url(#spark)'
                                        d='M14 0c1.5 7 6 12 13 14-7 2-12 6-14 13-2-7-7-12-13-14 7-2 12-7 14-13z'
                                    >
                                        <animateTransform
                                            attributeName='transform'
                                            type='scale'
                                            values='1;1.18;1'
                                            dur='1.8s'
                                            repeatCount='indefinite'
                                        />
                                    </path>
                                </g>

                                <g transform='translate(10 10) scale(0.7)'>
                                    <path
                                        fill='url(#spark)'
                                        d='M12 0c1 6 5 10 10 11-6 1-10 5-11 10-1-6-5-10-10-11 6-1 10-5 11-10z'
                                    >
                                        <animateTransform
                                            attributeName='transform'
                                            type='translate'
                                            values='0 -2;0 2;0 -2'
                                            dur='2s'
                                            repeatCount='indefinite'
                                        />
                                    </path>
                                </g>

                                <g transform='translate(55 12) scale(0.55)'>
                                    <path
                                        fill='url(#spark)'
                                        d='M10 0c1 5 4 9 9 10-5 1-9 4-10 9-1-5-4-9-9-10 5-1 9-4 10-9z'
                                    >
                                        <animateTransform
                                            attributeName='transform'
                                            type='translate'
                                            values='0 -1.5;0 1.5;0 -1.5'
                                            dur='1.6s'
                                            repeatCount='indefinite'
                                        />
                                    </path>
                                </g>
                            </svg>
                        </div>
                    )}
                </div>

                {/* Summary List */}
                {displayText ? (
                    <ul className='space-y-3 text-[14px] sm:text-[15px] text-gray-700'>
                        {displayText.split('\n').map((line, i) => (
                            <li
                                key={i}
                                className='flex items-start gap-2 sm:gap-3 border-l-0 border-purple-300 pl-2 sm:pl-3 py-0.5'
                            >
                                <span className='block h-2 w-2 mt-1 rounded-full bg-purple-500'></span>
                                <span className='leading-relaxed break-words'>
                                    {line}
                                    {aiTyping &&
                                        i ===
                                            displayText.split('\n').length -
                                                1 && (
                                            <span className='ml-1 animate-pulse text-purple-600'>
                                                █
                                            </span>
                                        )}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className='text-gray-400 text-sm sm:text-[15px]'>
                        Tap Generate and let AI do the magic
                    </p>
                )}
            </div>
        </div>
    );
};

export default AiSummary;
