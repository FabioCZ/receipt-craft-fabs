'use client';

import React from 'react';

interface ReceiptDesignerProps {
  onJsonUpdate: (json: string) => void;
}

/**
 * TODO: Build your receipt designer here!
 * 
 * Requirements:
 * - Create a visual interface for designing receipts
 * - Support various element types (text, barcode, QR code, etc.)
 * - Generate JSON DSL from the design
 * - Call onJsonUpdate() whenever the design changes
 * 
 * Ideas to consider:
 * - Drag and drop interface
 * - Element palette
 * - Properties panel
 * - Live JSON preview
 * - Template presets
 */
export const ReceiptDesigner: React.FC<ReceiptDesignerProps> = ({ onJsonUpdate }) => {
  // TODO: Implement your receipt designer
  
  // Initialize with sample JSON only once when component mounts
  React.useEffect(() => {
    const sampleJson = {
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
    };
    onJsonUpdate(JSON.stringify(sampleJson, null, 2));
  }, []); // Remove onJsonUpdate from dependencies to only run once

  return (
    <div className="h-full p-8 bg-gray-900">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 h-full overflow-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-100">Receipt Designer</h2>
        
        <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-red-400 mb-2">⚠️ CRITICAL: Update Parent Component</h3>
          <p className="text-gray-200 font-mono">
            You MUST call: <code className="bg-gray-700 px-2 py-1 rounded text-yellow-300">onJsonUpdate(jsonString)</code>
          </p>
          <p className="text-gray-300 text-sm mt-2">
            This updates the parent component with your JSON design. Without this, your design won't appear in the Preview tab!
          </p>
        </div>
        
        <div className="bg-gray-700 border-2 border-yellow-500 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2 text-yellow-400">🚧 TODO: Implement Your Designer</h3>
          <p className="text-gray-300 mb-4">
            Build your visual receipt designer that generates JSON DSL!
          </p>
          
          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h4 className="font-bold text-green-400 mb-2">Implementation Requirements:</h4>
              <ul className="list-decimal list-inside space-y-2 text-gray-300">
                <li>Create UI elements for designing receipts (buttons, forms, drag-drop, etc.)</li>
                <li>Support element types: text, barcode, QR code, alignment, feed lines</li>
                <li>Generate JSON that describes the receipt LAYOUT (not data)</li>
                <li className="text-yellow-300 font-bold">Call onJsonUpdate() whenever design changes!</li>
              </ul>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h4 className="font-bold text-blue-400 mb-2">Example Implementation Pattern:</h4>
              <pre className="text-gray-300 font-mono text-sm overflow-x-auto">{`// When user adds/modifies an element:
const updateDesign = () => {
  const myDesignJson = {
    sections: [
      { type: "header", alignment: "CENTER" },
      { type: "itemList", showPrices: true },
      { type: "totals", includeTax: true }
    ]
  };
  
  // THIS IS REQUIRED - Updates parent!
  onJsonUpdate(JSON.stringify(myDesignJson, null, 2));
};`}</pre>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h4 className="font-bold text-purple-400 mb-2">JSON Design Philosophy:</h4>
              <p className="text-gray-300 text-sm mb-2">Your JSON should be a TEMPLATE that describes layout, not actual data:</p>
              <div className="grid md:grid-cols-2 gap-3 mt-3">
                <div className="bg-red-900/30 p-2 rounded">
                  <p className="text-red-400 font-bold text-xs">❌ BAD: Hardcoded Data</p>
                  <pre className="text-gray-400 text-xs mt-1">{`{
  "items": [
    {"name": "Burger", "price": 8.99}
  ]
}`}</pre>
                </div>
                <div className="bg-green-900/30 p-2 rounded">
                  <p className="text-green-400 font-bold text-xs">✅ GOOD: Layout Template</p>
                  <pre className="text-gray-400 text-xs mt-1">{`{
  "itemSection": {
    "showSku": true,
    "priceAlign": "RIGHT"
  }
}`}</pre>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h4 className="font-bold text-yellow-400 mb-2">Available Resources:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>Printer interfaces: <code className="bg-gray-700 px-2 py-1 rounded text-green-400">src/interfaces/epson-printer-exact.ts</code></li>
                <li>Test in Preview tab → JSON to see your output</li>
                <li>Use JS Interpreter tab to test interpretation logic</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};