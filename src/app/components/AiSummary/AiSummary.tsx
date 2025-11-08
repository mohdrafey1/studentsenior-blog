'use client';
import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

interface SummaryObject {
    summary: string;
}

interface AiSummaryProps {
    summaries: SummaryObject[];
}

const AiSummary: React.FC<AiSummaryProps> = ({ summaries = [] }) => {
    const [displayText, setDisplayText] = useState('');
    const [loading, setLoading] = useState(false);
    const [started, setStarted] = useState(false);
    const [typing, setTyping] = useState(false);
    const [aiTyping, setAiTyping] = useState(false);

    // ✍️ Typing animation (logic unchanged)
    const typeText = (text: string) => {
        setDisplayText('');
        setTyping(true);
        setAiTyping(true);

        let index = 0;
        const typingSpeed = 25;
        const typingInterval = setInterval(() => {
            setDisplayText((prev) => prev + text.charAt(index));
            index++;
            if (index === text.length) {
                clearInterval(typingInterval);
                setTyping(false);
                setTimeout(() => setAiTyping(false), 600);
            }
        }, typingSpeed);
    };

    // ⚙️ Simulate AI generation (logic unchanged)
    const handleGenerate = () => {
        if (summaries.length === 0) return;

        setStarted(true);
        setLoading(true);
        setDisplayText('');
        setTyping(false);
        setAiTyping(false);

        const delay = Math.floor(Math.random() * 1700) + 1500;

        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * summaries.length);
            const newSummary = summaries[randomIndex].summary;
            setLoading(false);
            typeText(newSummary);
        }, delay);
    };

    return (
        <div className='max-w-7xl lg:mx-9 mx-auto p-5 bg-white border border-gray-200 rounded-2xl shadow-lg shadow-gray-900/5 my-8 transition-all duration-300'>
            {/* Header */}
            <div className='flex items-center justify-between mb-0'>
                <h3 className='text-lg flex items-center justify-center content-center font-semibold gap-2 text-slate-800'>
                    <span className='inline-block animate-bounce'>
                        <Sparkles className='w-5 h-5 text-purple-500 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text' />
                    </span>
                    AI Blog Summary
                </h3>

                <button
                    onClick={handleGenerate}
                    disabled={loading || typing}
                    className='text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white flex items-center gap-2 px-4 py-2 rounded-md shadow-lg shadow-indigo-500/20 transform hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    {loading && (
                        <RefreshCw
                            className={`w-4 h-4 ${
                                loading ? 'animate-spin' : ''
                            }`}
                        />
                    )}
                    {!loading ? (
                        <Sparkles className='w-5 h-5 text-white bg-clip-text' />
                    ) : (
                        ''
                    )}
                    {started ? 'Regenerate' : 'Generate'}
                </button>
            </div>

            {/* Display Area */}
            <div className='relative flex items-center justify-center'>
                {!started ? (
                    <div className='flex flex-col items-center justify-center text-center text-slate-400 w-full animate-fadeIn'>
                        {/* <Sparkles className='w-10 h-10 text-gray-300 mb-1' />
                        <p className='font-medium text-sm'>
                            Click "Generate" to see the magic
                        </p> */}
                    </div>
                ) : loading ? (
                    <div className='flex items-center justify-center h-20 text-lg font-medium gap-2'>
                        <p className='animate-shimmer bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 bg-[length:200%_100%] bg-clip-text text-transparent'>
                            AI is generating summary...
                        </p>
                    </div>
                ) : displayText ? (
                    <div className='animate-fadeIn w-full'>
                        {/* This class handles newlines (\n) in your summary string */}
                        <p
                            className={`text-slate-700 leading-relaxed whitespace-pre-line`}
                        >
                            {displayText}
                            {aiTyping && (
                                <span className='ml-1 animate-blink bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent'>
                                    █
                                </span>
                            )}
                        </p>
                        {aiTyping && (
                            <div className='flex items-center gap-2 mt-3 text-sm text-indigo-600'>
                                <span className='relative flex h-2 w-2'>
                                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75'></span>
                                    <span className='relative inline-flex rounded-full h-2 w-2 bg-indigo-500'></span>
                                </span>
                                Generating ...
                            </div>
                        )}
                    </div>
                ) : (
                    <p className='text-slate-400'>No summary generated yet.</p>
                )}
            </div>

            {/* ✨ Custom Aesthetics & Animations (Unchanged from previous) */}
            <style jsx>{`
                /* Blinking cursor */
                @keyframes blink {
                    0%,
                    100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0;
                    }
                }
                .animate-blink {
                    animation: blink 0.8s infinite steps(1, start);
                }

                /* Text fade-in */
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }

                /* AI Loading Shimmer */
                @keyframes shimmer {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }
                .animate-shimmer {
                    animation: shimmer 2s linear infinite;
                }

                /* Header Icon Sparkle */
                @keyframes sparkle-spin {
                    0% {
                        transform: scale(1) rotate(0deg);
                        opacity: 0.8;
                    }
                    50% {
                        transform: scale(1.3) rotate(45deg);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1) rotate(0deg);
                        opacity: 0.8;
                    }
                }
                .animate-sparkle-spin {
                    animation: sparkle-spin 2.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default AiSummary;
