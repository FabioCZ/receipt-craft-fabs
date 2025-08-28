'use client';

import React, { useRef, useState } from 'react';
import { ReceiptPrinter } from './ReceiptPrinter';
import { HTMLCanvasEpsonPrinter } from '../html-canvas-printer';
import { BarcodeType, TextAlignment } from '../interfaces/epson-printer';
import type { EpsonPrinter } from '../interfaces/epson-printer';

import { useEffect } from 'react';

export const PrinterDemo: React.FC = () => {
  const printerRef = useRef<EpsonPrinter | null>(null);
  const [, setRerender] = useState(0);

  // --- State for each method ---
  // addText
  const [text, setText] = useState('Hello, world!');
  const [bold, setBold] = useState(false);
  const [underline, setUnderline] = useState(false);
  const fontChoices = ['monospace', 'serif', 'sans-serif', 'cursive', 'fantasy'];
  const [fontFamily, setFontFamily] = useState('monospace');

  // addTextAlign
  const [textAlign, setTextAlign] = useState<TextAlignment>('left');

  // addTextSize
  const [textWidth, setTextWidth] = useState(1);
  const [textHeight, setTextHeight] = useState(1);

  // addFeedLine
  const [feedLines, setFeedLines] = useState(1);

  // addLineSpace
  const [lineSpace, setLineSpace] = useState(30);

  // addBarcode
  const [barcodeData, setBarcodeData] = useState('123456789');
  const [barcodeType, setBarcodeType] = useState<BarcodeType>(BarcodeType.CODE128);
  const [barcodeWidth, setBarcodeWidth] = useState(2);
  const [barcodeHeight, setBarcodeHeight] = useState(100);
  const [barcodeHRI, setBarcodeHRI] = useState<'none' | 'above' | 'below' | 'both'>('below');

  // addQRCode
  const [qrData, setQrData] = useState('https://example.com');
  const [qrSize, setQrSize] = useState(200);
  const [qrEC, setQrEC] = useState<'L' | 'M' | 'Q' | 'H'>('M');

  // --- Printer Ready ---
  const handlePrinterReady = (printer: EpsonPrinter) => {
    printerRef.current = printer;
  };

  // --- Method Calls ---
  const callAddText = () => {
    printerRef.current?.addText(text, {
      bold,
      underline,
      fontFamily,
    });
    setRerender(v => v + 1);
  };
  const callAddTextAlign = () => {
    printerRef.current?.addTextAlign(textAlign);
    setRerender(v => v + 1);
  };
  const callAddTextSize = () => {
    printerRef.current?.addTextSize(textWidth, textHeight);
    setRerender(v => v + 1);
  };
  const callAddTextStyle = () => {
    printerRef.current?.addTextStyle({ bold, underline, fontFamily });
    setRerender(v => v + 1);
  };
  const callAddFeedLine = () => {
    printerRef.current?.addFeedLine(feedLines);
    setRerender(v => v + 1);
  };
  const callAddLineSpace = () => {
    printerRef.current?.addLineSpace(lineSpace);
    setRerender(v => v + 1);
  };
  const callAddBarcode = () => {
    printerRef.current?.addBarcode(barcodeData, barcodeType, {
      width: barcodeWidth,
      height: barcodeHeight,
      hri: barcodeHRI,
    });
    setRerender(v => v + 1);
  };
  const callAddQRCode = () => {
    printerRef.current?.addQRCode(qrData, {
      size: qrSize,
      errorCorrection: qrEC,
    });
    setRerender(v => v + 1);
  };
  const callCutPaper = () => {
    printerRef.current?.cutPaper();
    setRerender(v => v + 1);
  };

  // --- Clear Button Handler ---
  const handleClear = () => {
    if (printerRef.current && typeof (printerRef.current as any).clear === 'function') {
      (printerRef.current as any).clear();
      setRerender(v => v + 1);
    }
  };

  // --- UI ---
  

  return (
    <div className={"flex gap-8 min-h-screen bg-slate-900 text-gray-100 transition-colors duration-300 px-6"}>
      {/* Top Info + Toggle */}
      <div className="fixed top-0 left-0 w-full flex items-center px-8 py-3 z-20 bg-slate-800 shadow-lg">
        <h1 className="text-lg font-semibold text-gray-100">Low Level Receipt Printer Demo</h1>
      </div>
      <div className="w-[400px] space-y-6 pt-24">
        <button className="bg-red-700 hover:bg-red-800 text-white font-bold px-4 py-3 rounded-lg w-full mb-4 shadow transition" onClick={handleClear}>
          Clear Receipt
        </button>
        {/* addText */}
        <div className="border rounded p-4 space-y-2 bg-slate-800 border-slate-700">
          <div className="font-bold">addText</div>
          <div className="text-xs text-gray-300 mb-1">Prints text at the current position. <b>Text</b>: string. <b>Style</b>: bold, underline, font.</div>
          <input
            className="w-full bg-slate-700 border border-slate-600 text-gray-100 placeholder-gray-400 p-2 rounded focus:ring-2 focus:ring-sky-500 focus:outline-none"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Text"
          />
          <div className="flex gap-2">
            <label><input type="checkbox" checked={bold} onChange={e => setBold(e.target.checked)} /> Bold</label>
            <label><input type="checkbox" checked={underline} onChange={e => setUnderline(e.target.checked)} /> Underline</label>
          </div>
          <select
            className="w-full bg-slate-700 border border-slate-600 text-gray-100 placeholder-gray-400 p-2 rounded focus:ring-2 focus:ring-sky-500 focus:outline-none"
            value={fontFamily}
            onChange={e => setFontFamily(e.target.value)}
          >
            {fontChoices.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded-lg w-full transition mt-2" onClick={callAddText}>addText</button>
        </div>
        {/* addTextAlign */}
        <div className="border rounded p-4 space-y-2 bg-slate-800 border-slate-700">
          <div className="font-bold">addTextAlign</div>
          <div className="text-xs text-gray-300 mb-1">Sets alignment for future text. <b>Options</b>: left, center, right.</div>
          <select className="w-full bg-slate-700 border border-slate-600 text-gray-100 placeholder-gray-400 p-2 rounded focus:ring-2 focus:ring-sky-500 focus:outline-none" value={textAlign} onChange={e => setTextAlign(e.target.value as TextAlignment)}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded-lg w-full transition mt-2" onClick={callAddTextAlign}>addTextAlign</button>
        </div>
        {/* addTextSize */}
        <div className="border rounded p-4 space-y-2 bg-slate-800 border-slate-700">
          <div className="font-bold">addTextSize</div>
          <div className="text-xs text-gray-300 mb-1">Sets width and height multiplier for future text. <b>Width/Height</b>: 1-4 (integer).</div>
          <div className="flex gap-2">
            <input type="number" min={1} max={8} value={textWidth} onChange={e => setTextWidth(Number(e.target.value))} className="w-full bg-slate-700 border border-slate-600 text-gray-100 placeholder-gray-400 p-2 rounded focus:ring-2 focus:ring-sky-500 focus:outline-none w-1/2" placeholder="Width" />
            <input type="number" min={1} max={8} value={textHeight} onChange={e => setTextHeight(Number(e.target.value))} className="w-full bg-slate-700 border border-slate-600 text-gray-100 placeholder-gray-400 p-2 rounded focus:ring-2 focus:ring-sky-500 focus:outline-none w-1/2" placeholder="Height" />
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded-lg w-full transition mt-2" onClick={callAddTextSize}>addTextSize</button>
        </div>
        {/* addTextStyle */}
        <div className="border rounded p-4 space-y-2 bg-slate-800 border-slate-700">
          <div className="font-bold">addTextStyle</div>
          <div className="text-xs text-gray-300 mb-1">Sets style for future text. <b>Options</b>: bold, underline, font family.</div>
          <div className="text-xs text-gray-300 mb-1">Expected value: Text style is set to the specified value.</div>
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={bold} onChange={e => setBold(e.target.checked)} /> Bold</label>
            <label><input type="checkbox" checked={underline} onChange={e => setUnderline(e.target.checked)} /> Underline</label>
          </div>
          <select
            className="w-full bg-slate-700 border border-slate-600 text-gray-100 placeholder-gray-400 p-2 rounded focus:ring-2 focus:ring-sky-500 focus:outline-none"
            value={fontFamily}
            onChange={e => setFontFamily(e.target.value)}
          >
            {fontChoices.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded-lg w-full transition mt-2" onClick={callAddTextStyle}>addTextStyle</button>
        </div>
        {/* addFeedLine */}
        <div className="border rounded p-4 space-y-2 bg-slate-800 border-slate-700">
          <div className="font-bold">addFeedLine</div>
          <div className="text-xs text-gray-300 mb-1">Feeds N blank lines. <b>Lines</b>: 1-10 (integer).</div>
          <input type="number" min={1} max={10} value={feedLines} onChange={e => setFeedLines(Number(e.target.value))} className="w-full bg-slate-700 border border-slate-600 text-gray-100 placeholder-gray-400 p-2 rounded focus:ring-2 focus:ring-sky-500 focus:outline-none" placeholder="Lines" />
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded-lg w-full transition mt-2" onClick={callAddFeedLine}>addFeedLine</button>
        </div>
        {/* addLineSpace */}
        <div className="border rounded p-4 space-y-2 bg-slate-800 border-slate-700">
          <div className="font-bold">addLineSpace</div>
          <div className="text-xs text-gray-300 mb-1">Sets vertical space between lines. <b>Pixels</b>: 0-100.</div>
          <input type="number" min={0} max={100} value={lineSpace} onChange={e => setLineSpace(Number(e.target.value))} className="w-full bg-slate-700 border border-slate-600 text-gray-100 placeholder-gray-400 p-2 rounded focus:ring-2 focus:ring-sky-500 focus:outline-none" placeholder="Pixels" />
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded-lg w-full transition mt-2" onClick={callAddLineSpace}>addLineSpace</button>
        </div>
        {/* addBarcode */}
        <div className="border rounded p-4 space-y-2 bg-slate-800 border-slate-700">
          <div className="font-bold">addBarcode</div>
          <div className="text-xs text-gray-300 mb-1">Prints a barcode. <b>Data</b>: string. <b>Type</b>: CODE39, CODE128. <b>Width</b>: 1-10. <b>Height</b>: 10-300 px. <b>HRI</b>: Human readable text (none/above/below/both).</div>
          <input className="w-full bg-slate-700 border border-slate-600 text-gray-100 placeholder-gray-400 p-2 rounded focus:ring-2 focus:ring-sky-500 focus:outline-none" value={barcodeData} onChange={e => setBarcodeData(e.target.value)} placeholder="Barcode Data" />
          <select className="w-full bg-slate-700 border border-slate-600 text-gray-100 placeholder-gray-400 p-2 rounded focus:ring-2 focus:ring-sky-500 focus:outline-none" value={barcodeType} onChange={e => setBarcodeType(e.target.value as BarcodeType)}>
            <option value="CODE39">CODE39</option>
            <option value="CODE128">CODE128</option>
            <option value="QR">QR</option>
          </select>
          <div className="flex gap-2">
            <input type="number" min={1} max={10} value={barcodeWidth} onChange={e => setBarcodeWidth(Number(e.target.value))} className="w-full bg-slate-700 border border-slate-600 text-gray-100 placeholder-gray-400 p-2 rounded focus:ring-2 focus:ring-sky-500 focus:outline-none w-1/3" placeholder="Width" />
            <input type="number" min={10} max={300} value={barcodeHeight} onChange={e => setBarcodeHeight(Number(e.target.value))} className="w-full bg-slate-700 border border-slate-600 text-gray-100 placeholder-gray-400 p-2 rounded focus:ring-2 focus:ring-sky-500 focus:outline-none w-1/3" placeholder="Height" />
            <select className="w-full bg-slate-700 border border-slate-600 text-gray-100 placeholder-gray-400 p-2 rounded focus:ring-2 focus:ring-sky-500 focus:outline-none w-1/3" value={barcodeHRI} onChange={e => setBarcodeHRI(e.target.value as any)}>
              <option value="none">None</option>
              <option value="above">Above</option>
              <option value="below">Below</option>
              <option value="both">Both</option>
            </select>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded-lg w-full transition mt-2" onClick={callAddBarcode}>addBarcode</button>
        </div>
        {/* addQRCode */}
        <div className="border rounded p-4 space-y-2 bg-slate-800 border-slate-700">
          <div className="font-bold">addQRCode</div>
          <div className="text-xs text-gray-300 mb-1">Prints a QR code. <b>Data</b>: string (URL or text). <b>Size</b>: 50-500 px. <b>Error Correction</b>: L, M, Q, H.</div>
          <input className="w-full bg-slate-700 border border-slate-600 text-gray-100 placeholder-gray-400 p-2 rounded focus:ring-2 focus:ring-sky-500 focus:outline-none" value={qrData} onChange={e => setQrData(e.target.value)} placeholder="QR Data" />
          <div className="flex gap-2">
            <input type="number" min={50} max={500} value={qrSize} onChange={e => setQrSize(Number(e.target.value))} className="w-full bg-slate-700 border border-slate-600 text-gray-100 placeholder-gray-400 p-2 rounded focus:ring-2 focus:ring-sky-500 focus:outline-none w-1/2" placeholder="Size" />
            <select className="w-full bg-slate-700 border border-slate-600 text-gray-100 placeholder-gray-400 p-2 rounded focus:ring-2 focus:ring-sky-500 focus:outline-none w-1/2" value={qrEC} onChange={e => setQrEC(e.target.value as any)}>
              <option value="L">L</option>
              <option value="M">M</option>
              <option value="Q">Q</option>
              <option value="H">H</option>
            </select>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded-lg w-full transition mt-2" onClick={callAddQRCode}>addQRCode</button>
        </div>
        {/* cutPaper */}
        <div className="border rounded p-4 space-y-2 bg-slate-800 border-slate-700">
          <div className="font-bold">cutPaper</div>
          <div className="text-xs text-gray-300 mb-1">Simulates cutting the paper (resets printer state).</div>
          <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-2 rounded-lg w-full transition" onClick={callCutPaper}>cutPaper</button>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center pt-24">
        <div className="font-semibold text-gray-100 mb-2 text-lg">Basic Preview</div>
        <div className="rounded-2xl border-4 border-slate-600 bg-slate-800 shadow-xl p-4">
          <ReceiptPrinter onPrinterReady={handlePrinterReady} />
        </div>
      </div>
    </div>
  );
};
