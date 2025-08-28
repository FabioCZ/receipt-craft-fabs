'use client';

import React, { useEffect, useRef } from 'react';
import { HTMLCanvasEpsonPrinter } from '../html-canvas-printer';
import { BarcodeType, TextAlignment } from '../interfaces/epson-printer';
import type { EpsonPrinter } from '../interfaces/epson-printer';

interface ReceiptPrinterProps {
  width?: number;
  className?: string;
  onPrinterReady?: (printer: EpsonPrinter) => void;
}

export const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({ 
  width = 576, // Standard 80-column receipt width (at 72dpi)
  className = '',
  onPrinterReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printerRef = useRef<EpsonPrinter | null>(null);

  useEffect(() => {
    if (canvasRef.current && !printerRef.current) {
      const canvas = canvasRef.current;
      printerRef.current = new HTMLCanvasEpsonPrinter(canvas);
      if (onPrinterReady) {
        onPrinterReady(printerRef.current);
      }
    }
  }, [onPrinterReady]);

  return (
    <div
      className={`receipt-printer ${className}`}
      style={{
        maxHeight: '600px',
        overflowY: 'auto',
        background: 'repeating-linear-gradient(0deg, #fafafa, #fff 40px, #fafafa 80px)',
        borderRadius: '16px',
        border: '2px solid #e0e0e0',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        padding: '20px',
        margin: '0 auto',
        width: `${width + 40}px`, // Add padding to width
        minWidth: `${width + 40}px`,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          padding: '10px',
          margin: '0 auto',
          width: `${width}px`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={1000} // Initial height, will grow as needed
          className="receipt-canvas"
          style={{
            width: `${width}px`,
            minHeight: '200px',
            display: 'block',
            margin: '0 auto',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        />
      </div>
    </div>
  );
};
