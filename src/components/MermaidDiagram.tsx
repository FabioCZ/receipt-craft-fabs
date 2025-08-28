'use client';

import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    mermaid: any;
  }
}

interface MermaidDiagramProps {
  diagram: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ diagram }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderedSvg, setRenderedSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (typeof window !== 'undefined') {
        try {
          // Dynamically import mermaid
          const mermaid = (await import('mermaid')).default;
          
          mermaid.initialize({ 
            startOnLoad: false,
            theme: 'dark',
            themeVariables: {
              primaryColor: '#1e3a5f',
              primaryTextColor: '#ffffff',
              primaryBorderColor: '#3b82f6',
              lineColor: '#64748b',
              secondaryColor: '#1e293b',
              tertiaryColor: '#059669',
              background: '#0f172a',
              mainBkg: '#1e3a5f',
              secondBkg: '#1e293b',
              tertiaryBkg: '#059669',
              textColor: '#e2e8f0',
              fontSize: '14px',
              fontFamily: 'monospace'
            },
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              curve: 'basis'
            }
          });

          // Use mermaid's render method to generate SVG
          const uniqueId = `mermaid-${Date.now()}`;
          const { svg } = await mermaid.render(uniqueId, diagram.trim());
          setRenderedSvg(svg);
          setError(null);
        } catch (error) {
          console.error('Mermaid diagram rendering error:', error);
          setError(error?.toString() || 'Failed to render diagram');
          setRenderedSvg(null);
        }
      }
    };

    renderDiagram();
  }, [diagram]);

  return (
    <div className="w-full overflow-x-auto bg-slate-950 p-4 rounded-lg">
      <div ref={containerRef} className="flex justify-center min-w-[600px]">
        {renderedSvg ? (
          <div dangerouslySetInnerHTML={{ __html: renderedSvg }} />
        ) : error ? (
          <div className="text-red-400">
            <p>Failed to render diagram</p>
            <pre className="text-xs mt-2 text-gray-500">{error}</pre>
          </div>
        ) : (
          <div className="text-gray-400">Loading diagram...</div>
        )}
      </div>
    </div>
  );
};