'use client';
import React, { useState } from 'react';
import { Sparkles, RefreshCw, ChevronRight } from 'lucide-react';

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

        let currentIndex = 0;
        const typingSpeed = 20;

        const interval = setInterval(() => {
            currentIndex++;
            setDisplayText(text.slice(0, currentIndex));

            if (currentIndex >= text.length) {
                clearInterval(interval);
                setTyping(false);
                setTimeout(() => setAiTyping(false), 600);
            }
        }, typingSpeed);
    };

    // Generate summary
    const handleGenerate = () => {
        if (!summaries.length || loading || typing) return;

        setStarted(true);
        setLoading(true);
        setDisplayText('');
        setTyping(false);
        setAiTyping(false);

        const delay = Math.floor(Math.random() * 1700) + 1500;

        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * summaries.length);
            const selectedSummaryArray = summaries[randomIndex];
            const newSummary = selectedSummaryArray.join('\n');

            setLoading(false);
            typeText(newSummary);
        }, delay);
    };

    return (
        <div className='relative mx-3 sm:mx-6 md:mx-10 my-8 overflow-hidden rounded-3xl bg-white dark:bg-gray-900 border border-indigo-100/60 dark:border-gray-800 shadow-xl shadow-indigo-500/5 dark:shadow-none transition-all duration-300'>
            {/* Subtle Gradient Background */}
            <div className='absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 dark:from-indigo-950/20 dark:via-gray-900 dark:to-purple-900/10 pointer-events-none' />
            
            <div className='relative z-10 p-5 sm:p-7 md:p-8'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4 border-b border-indigo-100/60 dark:border-gray-800 pb-5'>
                    <div className='flex items-center gap-3 cursor-pointer group' >
                        <div className='p-2.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl group-hover:scale-105 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition-all shadow-sm'>
                            <Sparkles className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
                        </div>
                        <div>
                            <h3 className='text-[18px] sm:text-[20px] font-bold text-gray-900 dark:text-gray-100 tracking-tight'>
                                AI Summary
                            </h3>
                            <p className='text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5'>
                                Get a quick overview of the key points
                            </p>
                        </div>
                    </div>

                    {!started && (
                        <button
                            onClick={handleGenerate}
                            disabled={loading || typing}
                            className='group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-500 hover:to-purple-500 shadow-md hover:shadow-indigo-500/25 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden w-full sm:w-auto'
                        >
                            <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black" />
                            {loading ? (
                                <RefreshCw className='w-4 h-4 animate-spin relative z-10' />
                            ) : (
                                <Sparkles className='w-4 h-4 relative z-10 group-hover:scale-110 transition-transform' />
                            )}
                            <span className="relative z-10 tracking-wide">Generate Magic</span>
                        </button>
                    )}

                    {loading && (
                        <div className='-mt-1 flex items-center justify-center'>
                            <svg
                                width='44'
                                height='44'
                                viewBox='0 0 80 80'
                                xmlns='http://www.w3.org/2000/svg'
                                className='drop-shadow-sm'
                            >
                                <defs>
                                    <linearGradient
                                        id='spark'
                                        x1='0%'
                                        y1='0%'
                                        x2='100%'
                                        y2='100%'
                                    >
                                        <stop offset='0%' stopColor='#6366f1' />
                                        <stop offset='50%' stopColor='#a855f7' />
                                        <stop offset='100%' stopColor='#ec4899' />
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
                <div className="min-h-[100px] flex items-center justify-center">
                    {displayText ? (
                        <ul className='space-y-4 w-full'>
                            {displayText.split('\n').map((line, i) => {
                                if (!line.trim()) return null;
                                return (
                                    <li
                                        key={i}
                                        className='flex items-start gap-3.5 group'
                                    >
                                        <div className='mt-1 flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shadow-sm'>
                                            <ChevronRight className='w-3.5 h-3.5' />
                                        </div>
                                        <span className='text-[15px] sm:text-[16px] leading-relaxed text-gray-700 dark:text-gray-300 break-words'>
                                            {line}
                                            {aiTyping &&
                                                i ===
                                                    displayText.split('\n').filter(l => l.trim()).length -
                                                        1 && (
                                                    <span className='ml-1.5 inline-block w-1.5 h-4 bg-indigo-500 animate-pulse align-middle rounded-sm'></span>
                                                )}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        !loading && (
                            <div className='flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-indigo-100 dark:border-gray-800 rounded-2xl w-full bg-white/50 dark:bg-gray-900/50'>
                                <Sparkles className='w-8 h-8 text-indigo-300 dark:text-indigo-900/80 mb-3' />
                                <p className='text-gray-500 dark:text-gray-400 text-[15px] font-medium'>
                                    Tap <span className='text-indigo-600 dark:text-indigo-400 font-semibold'>Generate Magic</span> to let AI read for you.
                                </p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiSummary;
