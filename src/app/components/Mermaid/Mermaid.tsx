'use client';

import React, { useEffect, useId, useState } from 'react';

interface MermaidProps {
    chart: string;
}

export default function Mermaid({ chart }: MermaidProps) {
    const rawId = useId();
    // Sanitize id for mermaid selector
    const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function renderDiagram() {
            try {
                const mermaid = (await import('mermaid')).default;
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'default',
                    securityLevel: 'loose',
                    fontFamily: 'inherit',
                });

                const cleanChart = chart.trim();
                if (!cleanChart) return;

                const { svg } = await mermaid.render(id, cleanChart);
                if (isMounted) {
                    setSvg(svg);
                    setError(null);
                }
            } catch (err: unknown) {
                console.error('Failed to render Mermaid diagram:', err);
                if (isMounted) {
                    setError('Failed to render diagram');
                }
            }
        }

        renderDiagram();

        return () => {
            isMounted = false;
        };
    }, [chart, id]);

    if (error) {
        return (
            <div className='my-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm'>
                <p className='font-medium'>Diagram rendering error</p>
                <pre className='mt-2 text-xs overflow-x-auto text-neutral-800 bg-white/70 p-2 rounded'>
                    {chart}
                </pre>
            </div>
        );
    }

    if (!svg) {
        return (
            <div className='my-4 flex items-center justify-center p-8 bg-neutral-50 rounded-xl border border-neutral-200 animate-pulse text-sm text-neutral-400'>
                Rendering diagram...
            </div>
        );
    }

    return (
        <div
            className='my-6 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-4 shadow-sm flex justify-center [&>svg]:max-w-full [&>svg]:h-auto'
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}
