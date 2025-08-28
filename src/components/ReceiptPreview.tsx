'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { HTMLCanvasEpsonPrinter } from '../html-canvas-printer-exact';
import { executeJavaScriptInterpreter } from '../lib/js-interpreter-executor';
import type { EpsonPrinter, Alignment, TextSize, BarcodeType } from '../interfaces/epson-printer-exact';
import type { Order } from '../interfaces/order';

// Dynamically import the JS editor to avoid SSR issues
const SimpleJSEditor = dynamic(
  () => import('./SimpleJSEditor').then(mod => mod.SimpleJSEditor),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-black border border-gray-600 rounded-lg flex items-center justify-center">
        <div className="text-green-400">Loading JavaScript Editor...</div>
      </div>
    )
  }
);

interface ReceiptPreviewProps {
  jsonDsl: string;
}

type SubTab = 'json' | 'order' | 'api' | 'interpreter' | 'receipt';

const DEFAULT_JS_INTERPRETER = `function interpret(jsonString, printer, order) {
  // Parse the JSON design
  const json = JSON.parse(jsonString);
  
  // Helper function to replace template variables with actual order data
  function replaceTemplateVars(text, order) {
    if (!order) return text;
    
    // Simple template variable replacement
    return text
      .replace('{{STORE_NAME}}', order.storeName || 'Store')
      .replace('{{STORE_NUMBER}}', order.storeNumber || '000')
      .replace('{{ORDER_ID}}', order.orderId || 'N/A');
  }
  
  // Process each element in the JSON
  if (json.elements && Array.isArray(json.elements)) {
    json.elements.forEach(element => {
      switch(element.type) {
        case 'text':
          // Replace template variables and print text with optional style
          const content = replaceTemplateVars(element.content || '', order);
          if (element.style) {
            printer.addText(content, element.style);
          } else {
            printer.addText(content);
          }
          break;
          
        case 'items_list':
          // Print a simple list of item names from the order
          if (order && order.items && order.items.length > 0) {
            order.items.forEach(item => {
              // Just print the item name, nothing fancy
              printer.addText(\`• \${item.name}\`);
            });
          } else {
            printer.addText('(No items)');
          }
          break;
          
        case 'align':
          // Set text alignment (LEFT, CENTER, RIGHT)
          printer.addTextAlign(element.alignment || 'LEFT');
          break;
          
        case 'feedLine':
          // Add blank lines for spacing
          printer.addFeedLine(element.lines || 1);
          break;
          
        case 'cutPaper':
          // Cut the paper
          printer.cutPaper();
          break;
          
        default:
          console.warn(\`Unknown element type: \${element.type}\`);
      }
    });
  }
}`;

const DEFAULT_ORDER: Order = {
  // Basic fields (Round 1+)
  orderId: "A-0042",
  storeNumber: "001",
  storeName: "BYTE BURGERS",
  timestamp: Date.now(),
  
  // Items array with all optional fields
  items: [
    {
      name: "Classic Cheeseburger",
      quantity: 2,
      unitPrice: 8.99,
      totalPrice: 17.98,
      sku: "BURG-001",
      category: "BURGERS",
      modifiers: ["Medium Rare", "Extra Cheese"]
    },
    {
      name: "Crispy Fries",
      quantity: 1,
      unitPrice: 3.99,
      totalPrice: 3.99,
      sku: "SIDE-002",
      category: "SIDES"
    },
    {
      name: "Cola",
      quantity: 2,
      unitPrice: 2.99,
      totalPrice: 5.98,
      sku: "DRINK-003",
      category: "BEVERAGES"
    }
  ],
  
  // Totals (pre-calculated)
  subtotal: 27.95,
  taxRate: 0.08,
  taxAmount: 2.24,
  totalAmount: 30.19,
  
  // Optional fields for advanced rounds
  paymentMethod: "VISA ****1234",
  
  // Round 2+ Promotions
  itemPromotions: [
    {
      itemSku: "BURG-001",
      promotionName: "Burger Tuesday - 10% Off",
      discountAmount: 1.80
    }
  ],
  orderPromotions: [
    {
      promotionName: "Lunch Special",
      discountAmount: 2.00,
      promotionType: "FIXED"
    }
  ],
  
  // Round 3+ Customer Info
  customerInfo: {
    customerId: "CUST-8826",
    name: "John Doe",
    memberStatus: "GOLD",
    loyaltyPoints: 1247,
    memberSince: "2019-03-15"
  },
  
  // Round 5+ Split Payment & Table Info
  splitPayments: [
    {
      payerName: "Alice Chen",
      amount: 15.10,
      method: "VISA ****7823",
      tip: 3.00,
      items: ["Classic Cheeseburger", "Cola"]
    },
    {
      payerName: "Bob Smith",
      amount: 15.09,
      method: "MASTERCARD ****4567",
      tip: 3.00,
      items: ["Classic Cheeseburger", "Crispy Fries", "Cola"]
    }
  ],
  tableInfo: {
    tableNumber: "12",
    serverName: "Jennifer K.",
    guestCount: 2,
    serviceRating: 5
  }
};

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ jsonDsl }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('json');
  const [jsCode, setJsCode] = useState(DEFAULT_JS_INTERPRETER);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  
  // Default example JSON for the Preview tab
  const DEFAULT_PREVIEW_JSON = JSON.stringify({
    elements: [
      // Header - centered with store info using template variables
      { type: "align", alignment: "CENTER" },
      { type: "text", content: "Welcome to {{STORE_NAME}}", style: { bold: true, size: "LARGE" } },
      { type: "text", content: "Store #{{STORE_NUMBER}}", style: { size: "NORMAL" } },
      { type: "feedLine", lines: 1 },
      
      // Order details - left aligned
      { type: "align", alignment: "LEFT" },
      { type: "text", content: "Order ID: {{ORDER_ID}}", style: { bold: false } },
      { type: "feedLine", lines: 1 },
      
      // Separator line
      { type: "text", content: "================================" },
      { type: "feedLine", lines: 1 },
      
      // Items header
      { type: "text", content: "PURCHASED ITEMS:", style: { bold: true, underline: true } },
      { type: "feedLine", lines: 1 },
      
      // Special marker for interpreter to insert item list
      { type: "items_list" },
      
      // Footer separator
      { type: "feedLine", lines: 1 },
      { type: "text", content: "================================" },
      { type: "feedLine", lines: 1 },
      
      // Thank you message - centered
      { type: "align", alignment: "CENTER" },
      { type: "text", content: "Thank you for your order!", style: { size: "NORMAL" } },
      { type: "feedLine", lines: 3 },
      
      // Cut the paper
      { type: "cutPaper" }
    ]
  }, null, 2);
  
  // JSON editing state - start with custom JSON showing the example
  const [useCustomJson, setUseCustomJson] = useState(true);
  const [customJson, setCustomJson] = useState(DEFAULT_PREVIEW_JSON);
  const [productionJson, setProductionJson] = useState(jsonDsl);
  const [jsonError, setJsonError] = useState<string | null>(null);
  
  // Order editing state - enable by default so template variables work
  const [orderJson, setOrderJson] = useState(JSON.stringify(DEFAULT_ORDER, null, 2));
  const [orderError, setOrderError] = useState<string | null>(null);
  const [useOrder, setUseOrder] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printerRef = useRef<EpsonPrinter | null>(null);

  // Define renderReceipt before the useEffects that use it
  const renderReceipt = useCallback(async () => {
    if (!printerRef.current || !canvasRef.current) return;
    
    setIsRendering(true);
    setError(null);

    try {
      // Clear the canvas
      if ('clear' in printerRef.current) {
        (printerRef.current as any).clear();
      }

      // Get the JSON to use
      const jsonToUse = useCustomJson ? customJson : productionJson;
      
      // Parse order if enabled
      let orderToUse = null;
      if (useOrder) {
        try {
          orderToUse = JSON.parse(orderJson);
        } catch (e) {
          throw new Error('Invalid Order JSON: ' + (e instanceof Error ? e.message : 'Unknown error'));
        }
      }

      // Execute the JavaScript interpreter
      await executeJavaScriptInterpreter(
        jsCode,
        jsonToUse,
        printerRef.current,
        orderToUse
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to render receipt';
      setError(errorMessage);
      console.error('Receipt rendering error:', err);
    } finally {
      setIsRendering(false);
    }
  }, [useCustomJson, customJson, productionJson, jsCode, useOrder, orderJson]);

  // Update production JSON when it changes from parent (Design tab)
  useEffect(() => {
    setProductionJson(jsonDsl);
  }, [jsonDsl]);

  // Initialize printer and render when switching to receipt tab
  useEffect(() => {
    if (activeSubTab === 'receipt' && canvasRef.current) {
      // Always create a new printer instance when switching to receipt tab
      printerRef.current = new HTMLCanvasEpsonPrinter(canvasRef.current);
      // Render immediately after creating printer
      setTimeout(() => renderReceipt(), 100);
    }
  }, [activeSubTab, renderReceipt]);

  // Render receipt when JSON/code changes while on receipt tab
  useEffect(() => {
    if (activeSubTab === 'receipt' && canvasRef.current && printerRef.current) {
      renderReceipt();
    }
  }, [activeSubTab, renderReceipt]);

  const handleRefresh = () => {
    renderReceipt();
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex-1 bg-gray-800 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header with sub-tabs */}
        <div className="border-b border-gray-700 flex-shrink-0">
          <div className="px-6 pt-4">
            <h2 className="text-xl font-bold text-gray-100">Receipt Preview</h2>
          </div>
          <div className="flex space-x-4 px-6 mt-3 overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('json')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeSubTab === 'json'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              📝 JSON
            </button>
            <button
              onClick={() => setActiveSubTab('order')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeSubTab === 'order'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              🛒 Order
            </button>
            <button
              onClick={() => setActiveSubTab('api')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeSubTab === 'api'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              📖 Printer API
            </button>
            <button
              onClick={() => setActiveSubTab('interpreter')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeSubTab === 'interpreter'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              🔧 JS Interpreter
            </button>
            <button
              onClick={() => setActiveSubTab('receipt')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeSubTab === 'receipt'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              📄 Receipt
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 min-h-0 overflow-hidden">
          {/* JSON Tab */}
          {activeSubTab === 'json' && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="mb-2 flex items-center justify-between flex-shrink-0">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useCustomJson}
                    onChange={(e) => setUseCustomJson(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-300">Use Custom JSON</span>
                </label>
                {!useCustomJson && (
                  <span className="text-xs text-gray-400">Using production JSON from Design tab</span>
                )}
              </div>

              <div className="flex-1 min-h-0" style={{ overflow: 'hidden' }}>
                <SimpleJSEditor
                  value={useCustomJson ? customJson : productionJson}
                  onChange={(value) => {
                    if (useCustomJson) {
                      setCustomJson(value);
                      // Validate JSON
                      try {
                        JSON.parse(value);
                        setJsonError(null);
                      } catch (e) {
                        setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
                      }
                    }
                  }}
                  height="100%"
                  readOnly={!useCustomJson}
                />
              </div>

              {jsonError && (
                <div className="mt-2 p-2 bg-red-900 border border-red-700 rounded text-xs text-red-200 flex-shrink-0">
                  JSON Error: {jsonError}
                </div>
              )}

              <div className="mt-2 p-2 bg-gray-700 rounded-lg flex-shrink-0">
                <details className="cursor-pointer">
                  <summary className="text-xs text-gray-300 font-semibold">JSON Format Guide</summary>
                  <pre className="text-xs text-gray-400 mt-2">
{`{
  "storeName": "Store Name",
  "elements": [
    { "type": "align", "alignment": "CENTER" },
    { "type": "text", "content": "Text", "style": { "bold": true, "size": "LARGE" } },
    { "type": "feedLine", "lines": 2 },
    { "type": "qrCode", "data": "https://...", "options": { "size": 3 } },
    { "type": "cutPaper" }
  ]
}`}
                  </pre>
                </details>
              </div>
            </div>
          )}

          {/* Order Tab */}
          {activeSubTab === 'order' && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="mb-2 flex items-center justify-between flex-shrink-0">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useOrder}
                    onChange={(e) => setUseOrder(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-300">Include Order in Interpreter</span>
                </label>
                {useOrder && (
                  <button
                    onClick={() => setOrderJson(JSON.stringify(DEFAULT_ORDER, null, 2))}
                    className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                  >
                    Reset to Default
                  </button>
                )}
              </div>

              <div className="flex-1 min-h-0" style={{ overflow: 'hidden' }}>
                <SimpleJSEditor
                  value={orderJson}
                  onChange={(value) => {
                    setOrderJson(value);
                    // Validate JSON
                    try {
                      JSON.parse(value);
                      setOrderError(null);
                    } catch (e) {
                      setOrderError(e instanceof Error ? e.message : 'Invalid JSON');
                    }
                  }}
                  height="100%"
                  readOnly={!useOrder}
                />
              </div>

              {orderError && (
                <div className="mt-2 p-2 bg-red-900 border border-red-700 rounded text-xs text-red-200 flex-shrink-0">
                  Order JSON Error: {orderError}
                </div>
              )}

              <div className="mt-2 p-2 bg-gray-700 rounded-lg flex-shrink-0">
                <details className="cursor-pointer">
                  <summary className="text-xs text-gray-300 font-semibold">Full Order Schema (click to expand)</summary>
                  <pre className="text-xs text-gray-400 mt-2 overflow-x-auto">
{`// Basic fields (Round 1+)
{
  "orderId": "A-0042",
  "storeNumber": "001",
  "storeName": "BYTE BURGERS",
  "timestamp": 1710123456789,
  
  "items": [{
    "name": "Cheeseburger",
    "quantity": 2,
    "unitPrice": 8.99,
    "totalPrice": 17.98,
    "sku?": "BURG-001",
    "category?": "BURGERS",
    "modifiers?": ["Medium Rare", "Extra Cheese"]
  }],
  
  "subtotal": 27.95,
  "taxRate": 0.08,
  "taxAmount": 2.24,
  "totalAmount": 30.19,
  
  // Round 2+ Promotions
  "itemPromotions?": [{
    "itemSku": "COFF-002",
    "promotionName": "Buy One Get One 50% Off",
    "discountAmount": 3.00
  }],
  "orderPromotions?": [{
    "promotionName": "Morning Rush Special",
    "discountAmount": 2.00,
    "promotionType": "PERCENTAGE" | "FIXED"
  }],
  
  // Round 3+ Customer
  "customerInfo?": {
    "customerId": "CUST-8826",
    "name": "John Doe",
    "memberStatus?": "GOLD",
    "loyaltyPoints?": 1247,
    "memberSince?": "2019-03-15"
  },
  "paymentMethod?": "VISA ****1234",
  
  // Round 5+ Split Payment
  "splitPayments?": [{
    "payerName": "Alice Chen",
    "amount": 156.43,
    "method": "VISA ****7823",
    "tip?": 25.00,
    "items?": ["Wagyu Steak", "Truffle Fries"]
  }],
  "tableInfo?": {
    "tableNumber": "12",
    "serverName": "Jennifer K.",
    "guestCount": 3,
    "serviceRating?": 5
  }
}`}
                  </pre>
                </details>
              </div>
            </div>
          )}

          {activeSubTab === 'receipt' && (
            <div className="h-full flex flex-col overflow-hidden">
              {/* Error display */}
              {error && (
                <div className="mb-2 p-2 bg-red-900 border border-red-700 rounded-lg flex-shrink-0">
                  <h3 className="font-semibold text-red-200 text-sm">Error</h3>
                  <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono">{error}</pre>
                </div>
              )}

              {/* Refresh button and status */}
              <div className="mb-2 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleRefresh}
                    disabled={isRendering}
                    className={`px-3 py-1 rounded-lg font-medium text-sm transition-all ${
                      isRendering
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isRendering ? '🔄 Rendering...' : '🔄 Refresh Preview'}
                  </button>
                  {isRendering && (
                    <span className="text-xs text-gray-400">Processing interpreter...</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 space-x-3">
                  <span>JSON: {useCustomJson ? '✏️ Custom' : '📝 Production'}</span>
                  <span>Order: {useOrder ? '✅ Included' : '❌ None'}</span>
                </div>
              </div>

              {/* Canvas container */}
              <div className="flex-1 min-h-0 overflow-auto bg-gray-900 rounded-lg p-4">
                <div className="flex justify-center">
                  <div
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                      padding: '20px',
                      width: 'fit-content'
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      width={480}
                      height={2000}
                      style={{
                        display: 'block',
                        background: 'white',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Current JSON display */}
              <div className="mt-2 flex-shrink-0">
                <details className="cursor-pointer bg-gray-900 rounded-lg p-2">
                  <summary className="text-xs font-medium text-gray-300">
                    Current JSON DSL (click to expand)
                  </summary>
                  <pre className="mt-2 text-xs bg-black text-green-400 p-2 rounded overflow-x-auto max-h-32 font-mono">
                    {useCustomJson ? customJson : productionJson || '// No JSON generated yet - design a receipt first!'}
                  </pre>
                </details>
              </div>
            </div>
          )}

          {activeSubTab === 'interpreter' && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="mb-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-300">
                    JavaScript Interpreter Code
                    <span className="ml-2 text-xs text-gray-500">
                      (function interpret(jsonString, printer, order) {})
                    </span>
                  </label>
                  <button
                    onClick={() => setJsCode(DEFAULT_JS_INTERPRETER)}
                    className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0" style={{ overflow: 'hidden' }}>
                <SimpleJSEditor
                  value={jsCode}
                  onChange={setJsCode}
                  height="100%"
                />
              </div>

              <div className="mt-2 flex-shrink-0">
                <details className="cursor-pointer bg-gray-700 border border-gray-600 rounded-lg p-2">
                  <summary className="text-xs text-gray-300 font-semibold">Tips (click to expand)</summary>
                  <ul className="text-xs text-gray-400 list-disc list-inside space-y-1 mt-2">
                    <li>The interpreter receives: jsonString (your JSON DSL), printer (EpsonPrinter), order (null in preview)</li>
                    <li>Use printer.addText(), printer.addTextAlign(), printer.addQRCode(), etc.</li>
                    <li>Parse the JSON and translate elements to printer commands</li>
                    <li>Changes auto-refresh the receipt preview when you switch tabs</li>
                    <li>This is the same signature as the Kotlin interpreter you'll submit</li>
                  </ul>
                </details>
              </div>
            </div>
          )}

          {activeSubTab === 'api' && (
            <div className="h-full overflow-auto">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-400 mb-3">🖨️ EpsonPrinter API Reference</h3>
                  <p className="text-sm text-gray-300 mb-4">
                    Complete reference for all methods and constants available in your interpreter function.
                  </p>
                </div>

                {/* Core Methods */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h4 className="text-md font-bold text-green-400 mb-3">Core Printing Methods</h4>
                  <div className="space-y-3">
                    <div className="bg-black rounded p-3">
                      <code className="text-blue-300">printer.addText(text: string, style?: TextStyle)</code>
                      <p className="text-xs text-gray-400 mt-1">Prints text with optional styling</p>
                      <pre className="text-xs text-green-400 mt-2">
{`// Examples
printer.addText("Hello World");
printer.addText("Bold Text", { bold: true });
printer.addText("Large Text", { bold: true, underline: true, size: 'LARGE' });`}
                      </pre>
                    </div>

                    <div className="bg-black rounded p-3">
                      <code className="text-blue-300">printer.addTextAlign(alignment: Alignment)</code>
                      <p className="text-xs text-gray-400 mt-1">Sets text alignment for subsequent text</p>
                      <pre className="text-xs text-green-400 mt-2">
{`// Alignment enum: LEFT, CENTER, RIGHT
printer.addTextAlign('CENTER');
printer.addText("Centered Text");
printer.addTextAlign('LEFT'); // Reset to left`}
                      </pre>
                    </div>

                    <div className="bg-black rounded p-3">
                      <code className="text-blue-300">printer.addTextStyle(style: TextStyle)</code>
                      <p className="text-xs text-gray-400 mt-1">Sets text style for subsequent text</p>
                      <pre className="text-xs text-green-400 mt-2">
{`printer.addTextStyle({ bold: true, underline: false, size: 'LARGE' });
printer.addText("Styled Text");
printer.addTextStyle({ size: 'NORMAL' }); // Reset`}
                      </pre>
                    </div>

                    <div className="bg-black rounded p-3">
                      <code className="text-blue-300">printer.addFeedLine(lines: number)</code>
                      <p className="text-xs text-gray-400 mt-1">Feeds blank lines (adds vertical spacing)</p>
                      <pre className="text-xs text-green-400 mt-2">
{`printer.addFeedLine(2); // Add 2 blank lines`}
                      </pre>
                    </div>

                    <div className="bg-black rounded p-3">
                      <code className="text-blue-300">printer.cutPaper()</code>
                      <p className="text-xs text-gray-400 mt-1">Cuts the paper (marks end of receipt)</p>
                      <pre className="text-xs text-green-400 mt-2">
{`printer.addFeedLine(3);
printer.cutPaper(); // Always call at the end`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Advanced Methods */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h4 className="text-md font-bold text-green-400 mb-3">Advanced Methods</h4>
                  <div className="space-y-3">
                    <div className="bg-black rounded p-3">
                      <code className="text-blue-300">printer.addQRCode(data: string, options?: QRCodeOptions)</code>
                      <p className="text-xs text-gray-400 mt-1">Prints a QR code</p>
                      <pre className="text-xs text-green-400 mt-2">
{`printer.addQRCode("https://example.com");
printer.addQRCode("WIFI:T:WPA;S:MyNetwork;P:MyPassword;;", {
  size: 3, // Size multiplier (1-16)
  errorCorrection: 'H' // L, M, Q, or H
});`}
                      </pre>
                    </div>

                    <div className="bg-black rounded p-3">
                      <code className="text-blue-300">printer.addBarcode(data: string, type: BarcodeType, options?: BarcodeOptions)</code>
                      <p className="text-xs text-gray-400 mt-1">Prints various types of barcodes</p>
                      <pre className="text-xs text-green-400 mt-2">
{`// BarcodeType: CODE128, CODE39, EAN13, UPC_A, etc.
printer.addBarcode("123456789", "CODE128");
printer.addBarcode("ABC123", "CODE39", {
  width: 'MEDIUM', // THIN, MEDIUM, THICK
  height: 50,
  hri: true // Human Readable Interpretation
});`}
                      </pre>
                    </div>

                    <div className="bg-black rounded p-3">
                      <code className="text-blue-300">printer.addTextStyle(style: TextStyle)</code>
                      <p className="text-xs text-gray-400 mt-1">Sets default text style for subsequent text</p>
                      <pre className="text-xs text-green-400 mt-2">
{`printer.addTextStyle({ bold: true, underline: true });
printer.addText("This will be bold and underlined");
printer.addTextStyle({}); // Reset styles`}
                      </pre>
                    </div>

                    <div className="bg-black rounded p-3">
                      <code className="text-blue-300">printer.addLineSpace(space: number)</code>
                      <p className="text-xs text-gray-400 mt-1">Sets line spacing in pixels (default: 30)</p>
                      <pre className="text-xs text-green-400 mt-2">
{`printer.addLineSpace(50); // Increase line spacing
printer.addText("Spaced text");`}
                      </pre>
                    </div>

                    <div className="bg-black rounded p-3">
                      <code className="text-blue-300">printer.clear()</code>
                      <p className="text-xs text-gray-400 mt-1">Clears the canvas (preview only)</p>
                      <pre className="text-xs text-green-400 mt-2">
{`printer.clear(); // Start fresh`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Type Definitions */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h4 className="text-md font-bold text-green-400 mb-3">Type Definitions & Options</h4>
                  <div className="space-y-3">
                    <div className="bg-black rounded p-3">
                      <code className="text-yellow-300">TextStyle</code>
                      <pre className="text-xs text-gray-300 mt-2">
{`interface TextStyle {
  bold?: boolean;
  underline?: boolean;
  size?: TextSize; // SMALL, NORMAL, LARGE, XLARGE
}

enum TextSize {
  SMALL = 'SMALL',
  NORMAL = 'NORMAL',
  LARGE = 'LARGE',
  XLARGE = 'XLARGE'
}`}
                      </pre>
                    </div>

                    <div className="bg-black rounded p-3">
                      <code className="text-yellow-300">BarcodeType</code>
                      <pre className="text-xs text-gray-300 mt-2">
{`enum BarcodeType {
  UPC_A, UPC_E, EAN13, EAN8,
  CODE39, ITF, CODABAR, CODE93, CODE128,
  GS1_128, GS1_DATABAR_OMNIDIRECTIONAL,
  GS1_DATABAR_TRUNCATED, GS1_DATABAR_LIMITED,
  GS1_DATABAR_EXPANDED
}`}
                      </pre>
                    </div>

                    <div className="bg-black rounded p-3">
                      <code className="text-yellow-300">QRCodeOptions</code>
                      <pre className="text-xs text-gray-300 mt-2">
{`interface QRCodeOptions {
  size?: number;  // Size multiplier (default: 3)
  errorCorrection?: QRErrorCorrection; // L, M, Q, H (default: M)
}

enum QRErrorCorrection {
  L = 'L', M = 'M', Q = 'Q', H = 'H'
}`}
                      </pre>
                    </div>

                    <div className="bg-black rounded p-3">
                      <code className="text-yellow-300">BarcodeOptions & Alignment</code>
                      <pre className="text-xs text-gray-300 mt-2">
{`interface BarcodeOptions {
  width?: BarcodeWidth;  // THIN, MEDIUM, THICK (default: MEDIUM)
  height?: number;  // Height in pixels (default: 50)
  hri?: boolean;  // Human Readable Interpretation (default: true)
}

enum Alignment {
  LEFT = 'LEFT',
  CENTER = 'CENTER',
  RIGHT = 'RIGHT'
}`}
                      </pre>
                    </div>

                  </div>
                </div>

                {/* Complete Example */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h4 className="text-md font-bold text-green-400 mb-3">Complete Example</h4>
                  <div className="bg-black rounded p-3">
                    <pre className="text-xs text-green-400 overflow-x-auto">
{`function interpret(jsonString, printer, order) {
  const json = JSON.parse(jsonString);
  
  // Header
  printer.addTextAlign('CENTER');
  printer.addText(json.storeName || "STORE NAME", { 
    bold: true, 
    size: 'XLARGE' 
  });
  printer.addFeedLine(1);
  
  // Date/Time
  printer.addText(new Date().toLocaleString());
  printer.addFeedLine(2);
  
  // Items (if order provided)
  if (order) {
    printer.addTextAlign('LEFT');
    printer.addText("ORDER #" + order.orderId);
    printer.addFeedLine(1);
    
    order.items.forEach(item => {
      const line = item.name.padEnd(20) + " $" + item.totalPrice.toFixed(2);
      printer.addText(line);
    });
    
    printer.addFeedLine(1);
    printer.addTextAlign('RIGHT');
    printer.addText("TOTAL: $" + order.totalAmount.toFixed(2), { 
      bold: true,
      size: 'LARGE'
    });
  }
  
  // QR Code
  printer.addFeedLine(2);
  printer.addTextAlign('CENTER');
  printer.addQRCode("https://payment.example.com/order/" + (order?.orderId || "test"), {
    size: 3,
    errorCorrection: 'H'
  });
  
  // Footer
  printer.addFeedLine(1);
  printer.addText("Thank you for your business!");
  printer.addFeedLine(3);
  printer.cutPaper();
}`}
                    </pre>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4">
                  <h4 className="text-md font-bold text-blue-400 mb-2">💡 Pro Tips</h4>
                  <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                    <li>Always call <code className="text-green-400">printer.cutPaper()</code> at the end</li>
                    <li>Reset text size with <code className="text-green-400">printer.addTextSize(1, 1)</code> after making text larger</li>
                    <li>Use <code className="text-green-400">printer.addFeedLine()</code> for spacing instead of adding empty text</li>
                    <li>Text alignment affects all subsequent text until changed</li>
                    <li>For Kotlin: Replace <code className="text-green-400">printer.</code> with <code className="text-green-400">printer.</code> (same API)</li>
                    <li>In Kotlin, use string templates: <code className="text-green-400">{'"Total: $${amount}"'}</code></li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreview;