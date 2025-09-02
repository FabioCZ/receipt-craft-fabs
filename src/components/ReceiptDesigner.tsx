'use client';

import React, { useState, useRef, useCallback } from 'react';
import { TextSize, Alignment, BarcodeType, QRErrorCorrection, BarcodeWidth } from '../interfaces/epson-printer-exact';

interface ReceiptDesignerProps {
  onJsonUpdate: (json: string) => void;
}

// Element type definitions for the palette
const ELEMENT_TYPES = {
  text: { icon: '📝', label: 'Text', color: 'bg-blue-500' },
  align: { icon: '↔️', label: 'Align', color: 'bg-green-500' },
  feedLine: { icon: '↩️', label: 'Feed Line', color: 'bg-purple-500' },
  barcode: { icon: '📊', label: 'Barcode', color: 'bg-orange-500' },
  qrcode: { icon: '▣', label: 'QR Code', color: 'bg-pink-500' },
  divider: { icon: '─', label: 'Divider', color: 'bg-gray-500' },
  dynamic: { icon: '🔗', label: 'Dynamic Field', color: 'bg-yellow-500' },
  items_list: { icon: '📋', label: 'Items List', color: 'bg-indigo-500' },
  split_payments: { icon: '💳', label: 'Split Payments', color: 'bg-teal-500' },
  cutPaper: { icon: '✂️', label: 'Cut Paper', color: 'bg-red-500' }
};

// Dynamic field options
const DYNAMIC_FIELDS = [
  // Basic order fields
  'STORE_NAME', 'STORE_NUMBER', 'ORDER_ID', 'TIMESTAMP', 
  'SUBTOTAL', 'TAX_RATE', 'TAX', 'TOTAL', 'PAYMENT_METHOD',
  'ITEM_COUNT', 'TOTAL_QUANTITY',
  // Customer info fields  
  'CUSTOMER_ID', 'CUSTOMER_NAME', 'MEMBER_STATUS', 'LOYALTY_POINTS', 'MEMBER_SINCE',
  // Table info fields
  'TABLE_NUMBER', 'SERVER_NAME', 'GUEST_COUNT', 'SERVICE_RATING',
  // Staff fields
  'CASHIER_NAME'
];

interface ReceiptElement {
  id: string;
  type: string;
  content?: string;
  style?: {
    bold?: boolean;
    underline?: boolean;
    size?: TextSize;
  };
  alignment?: Alignment;
  lines?: number;
  data?: string;
  barcodeType?: BarcodeType;
  qrSize?: number;
  field?: string;
  // Items list specific properties
  itemTemplate?: string;
  showSku?: boolean;
  showCategory?: boolean;
  showModifiers?: boolean;
  showUnitPrice?: boolean;
}

export const ReceiptDesigner: React.FC<ReceiptDesignerProps> = ({ onJsonUpdate }) => {
  const [elements, setElements] = useState<ReceiptElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [draggedCanvasElement, setDraggedCanvasElement] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const dragCounter = useRef(0);

  // Auto-update JSON whenever elements change
  React.useEffect(() => {
    if (elements.length > 0) {
      const jsonElements = elements.map(({ id, ...element }) => element);
      const jsonOutput = { elements: jsonElements };
      
      onJsonUpdate(JSON.stringify(jsonOutput, null, 2));
    }
  }, [elements, onJsonUpdate]);

  // Persist elements to localStorage whenever they change
  React.useEffect(() => {
    if (elements.length > 0) {
      localStorage.setItem('receipt-designer-elements', JSON.stringify(elements));
    }
  }, [elements]);

  // Create new element with default properties
  const createElement = useCallback((type: string): ReceiptElement => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    switch (type) {
      case 'text':
        return { id, type, content: 'Sample Text', style: { size: TextSize.NORMAL } };
      case 'align':
        return { id, type, alignment: Alignment.CENTER };
      case 'feedLine':
        return { id, type, lines: 1 };
      case 'barcode':
        return { id, type, data: '123456789', barcodeType: BarcodeType.CODE128 };
      case 'qrcode':
        return { id, type, data: 'https://example.com', qrSize: 3 };
      case 'divider':
        return { id, type, content: '================================' };
      case 'dynamic':
        return { id, type, field: 'STORE_NAME' };
      case 'items_list':
        return {
          id,
          type,
          itemTemplate: "{{align:left}}{{quantity}}x {{name}}\n{{align:right}}${{totalPrice}}\n{{feedLine}}",
          showSku: false,
          showCategory: false,
          showModifiers: false,
          showUnitPrice: false
        };
      case 'split_payments':
        return { id, type };
      case 'cutPaper':
        return { id, type };
      default:
        return { id, type };
    }
  }, []);

  // Load saved design from localStorage or create default template
  const loadSavedDesign = React.useCallback(() => {
    try {
      const savedElements = localStorage.getItem('receipt-designer-elements');
      if (savedElements) {
        const parsed = JSON.parse(savedElements) as ReceiptElement[];
        if (parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load saved design from localStorage:', error);
    }
    
    // Fallback to basic template
    return [
      createElement('align'),
      { ...createElement('text'), content: 'Welcome to {{STORE_NAME}}', style: { bold: true, size: TextSize.LARGE } },
      { ...createElement('text'), content: 'Store #{{STORE_NUMBER}}' },
      createElement('feedLine'),
      { ...createElement('align'), alignment: Alignment.LEFT },
      { ...createElement('text'), content: 'Order ID: {{ORDER_ID}}' },
      createElement('feedLine'),
      createElement('divider'),
      createElement('feedLine'),
      createElement('items_list'),
      createElement('feedLine'),
      createElement('divider'),
      { ...createElement('align'), alignment: Alignment.CENTER },
      { ...createElement('text'), content: 'Thank you for your order!' },
      { ...createElement('feedLine'), lines: 3 },
      createElement('cutPaper')
    ];
  }, [createElement]);

  // Handle drag start from palette
  const handleDragStart = (e: React.DragEvent, elementType: string) => {
    e.dataTransfer.setData('elementType', elementType);
    setDraggedElement(elementType);
  };

  // Handle drag start from canvas element
  const handleCanvasElementDragStart = (e: React.DragEvent, elementId: string) => {
    e.dataTransfer.setData('canvasElementId', elementId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedCanvasElement(elementId);
  };

  // Handle drag end for canvas elements
  const handleCanvasElementDragEnd = () => {
    setDraggedCanvasElement(null);
    setDragOverIndex(null);
    setDraggedElement(null);
  };

  // Handle drag over canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Clear drag over index when dragging over general canvas
    if (dragOverIndex !== null) {
      setDragOverIndex(null);
    }
  };

  // Handle drag over drop zone between elements
  const handleDropZoneDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index);
  };

  // Handle drop on canvas (fallback for empty canvas)
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const elementType = e.dataTransfer.getData('elementType');
    
    // Only handle palette drops when canvas is empty or no specific drop zone caught it
    if (elementType && elements.length === 0) {
      const newElement = createElement(elementType);
      setElements([newElement]);
      setSelectedElement(newElement.id);
    }
    
    setDraggedElement(null);
    setDraggedCanvasElement(null);
    setDragOverIndex(null);
  }, [createElement, elements.length]);

  // Handle drop on specific drop zones
  const handleDropZoneDrop = useCallback((e: React.DragEvent, insertIndex: number) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to canvas
    
    const elementType = e.dataTransfer.getData('elementType');
    const canvasElementId = e.dataTransfer.getData('canvasElementId');
    
    if (elementType) {
      // Dropping from palette
      const newElement = createElement(elementType);
      setElements(prev => {
        const newElements = [...prev];
        newElements.splice(insertIndex, 0, newElement);
        return newElements;
      });
      setSelectedElement(newElement.id);
    } else if (canvasElementId) {
      // Reordering canvas elements
      setElements(prev => {
        const elementToMove = prev.find(el => el.id === canvasElementId);
        if (!elementToMove) return prev;
        
        const currentIndex = prev.findIndex(el => el.id === canvasElementId);
        const newElements = [...prev];
        
        // Remove element from current position
        newElements.splice(currentIndex, 1);
        
        // Insert at new position, adjusting for removal
        let newIndex = insertIndex;
        if (currentIndex < insertIndex) {
          newIndex = insertIndex - 1;
        }
        
        newElements.splice(newIndex, 0, elementToMove);
        return newElements;
      });
    }
    
    setDraggedElement(null);
    setDraggedCanvasElement(null);
    setDragOverIndex(null);
  }, [createElement]);

  // Handle element selection
  const selectElement = (elementId: string) => {
    setSelectedElement(elementId);
  };

  // Update element properties
  const updateElement = useCallback((elementId: string, updates: Partial<ReceiptElement>) => {
    setElements(prev => {
      const newElements = prev.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      );
      return newElements;
    });
  }, []);

  // Delete element
  const deleteElement = useCallback((elementId: string) => {
    setElements(prev => {
      const newElements = prev.filter(el => el.id !== elementId);
      return newElements;
    });
    setSelectedElement(null);
  }, []);

  // Move element up/down
  const moveElement = useCallback((elementId: string, direction: 'up' | 'down') => {
    setElements(prev => {
      const currentIndex = prev.findIndex(el => el.id === elementId);
      if (currentIndex === -1) return prev;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newElements = [...prev];
      [newElements[currentIndex], newElements[newIndex]] = [newElements[newIndex], newElements[currentIndex]];
      return newElements;
    });
  }, []);

  // Load template
  const loadTemplate = useCallback((templateName: string) => {
    let template: ReceiptElement[] = [];
    
    switch (templateName) {
      case 'basic':
        template = [
          createElement('align'),
          { ...createElement('text'), content: 'Welcome to {{STORE_NAME}}', style: { bold: true, size: TextSize.LARGE } },
          { ...createElement('text'), content: 'Store #{{STORE_NUMBER}}' },
          createElement('feedLine'),
          { ...createElement('align'), alignment: Alignment.LEFT },
          { ...createElement('text'), content: 'Order ID: {{ORDER_ID}}' },
          createElement('feedLine'),
          createElement('divider'),
          createElement('feedLine'),
          createElement('items_list'),
          createElement('feedLine'),
          createElement('divider'),
          { ...createElement('align'), alignment: Alignment.CENTER },
          { ...createElement('text'), content: 'Thank you for your order!' },
          { ...createElement('feedLine'), lines: 3 },
          createElement('cutPaper')
        ];
        break;
      case 'detailed':
        template = [
          { ...createElement('align'), alignment: Alignment.CENTER },
          { ...createElement('text'), content: '{{STORE_NAME}}', style: { bold: true, size: TextSize.XLARGE } },
          { ...createElement('text'), content: 'Store Address Line 1' },
          { ...createElement('text'), content: 'Phone: (555) 123-4567' },
          createElement('feedLine'),
          createElement('divider'),
          { ...createElement('align'), alignment: Alignment.LEFT },
          { ...createElement('text'), content: 'Date: {{TIMESTAMP}}' },
          { ...createElement('text'), content: 'Order: {{ORDER_ID}}' },
          { ...createElement('text'), content: 'Cashier: {{CASHIER_NAME}}' },
          createElement('feedLine'),
          createElement('items_list'),
          createElement('feedLine'),
          createElement('divider'),
          { ...createElement('text'), content: 'Subtotal: {{SUBTOTAL}}' },
          { ...createElement('text'), content: 'Tax: {{TAX}}' },
          { ...createElement('text'), content: 'Total: {{TOTAL}}', style: { bold: true, size: TextSize.LARGE } },
          createElement('feedLine'),
          { ...createElement('align'), alignment: Alignment.CENTER },
          { ...createElement('qrcode'), data: 'https://{{STORE_NAME}}.com/receipt/{{ORDER_ID}}' },
          createElement('feedLine'),
          { ...createElement('text'), content: 'Thank you for your business!' },
          { ...createElement('feedLine'), lines: 2 },
          createElement('cutPaper')
        ];
        break;
    }
    
    setElements(template);
    setShowTemplates(false);
    // Clear saved design when loading a template
    localStorage.removeItem('receipt-designer-elements');
  }, [createElement]);

  // Clear saved design function  
  const clearSavedDesign = useCallback(() => {
    localStorage.removeItem('receipt-designer-elements');
    // Reload basic template directly
    const basicTemplate = [
      createElement('align'),
      { ...createElement('text'), content: 'Welcome to {{STORE_NAME}}', style: { bold: true, size: TextSize.LARGE } },
      { ...createElement('text'), content: 'Store #{{STORE_NUMBER}}' },
      createElement('feedLine'),
      { ...createElement('align'), alignment: Alignment.LEFT },
      { ...createElement('text'), content: 'Order ID: {{ORDER_ID}}' },
      createElement('feedLine'),
      createElement('divider'),
      createElement('feedLine'),
      createElement('items_list'),
      createElement('feedLine'),
      createElement('divider'),
      { ...createElement('align'), alignment: Alignment.CENTER },
      { ...createElement('text'), content: 'Thank you for your order!' },
      { ...createElement('feedLine'), lines: 3 },
      createElement('cutPaper')
    ];
    setElements(basicTemplate);
  }, [createElement]);

  // Get selected element
  const selectedElementData = selectedElement ? elements.find(el => el.id === selectedElement) : null;

  // Initialize with saved design or basic template on mount
  React.useEffect(() => {
    const initialElements = loadSavedDesign();
    setElements(initialElements);
  }, [loadSavedDesign]);

  return (
    <div className="h-full flex bg-gray-900">
      {/* Element Palette */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
        <h3 className="text-white font-bold mb-4 flex items-center">
          🎨 Element Palette
        </h3>
        <div className="space-y-2">
          {Object.entries(ELEMENT_TYPES).map(([type, config]) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
              className={`${config.color} text-white p-3 rounded cursor-move hover:opacity-80 flex items-center space-x-2 transition-all`}
            >
              <span className="text-lg">{config.icon}</span>
              <span className="font-medium">{config.label}</span>
            </div>
          ))}
        </div>
        
        {/* Template Section */}
        <div className="mt-6">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded flex items-center justify-center space-x-2"
          >
            <span>📋</span>
            <span>Templates</span>
          </button>
          
          {showTemplates && (
            <div className="mt-2 space-y-2">
              <button
                onClick={() => loadTemplate('basic')}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white p-2 rounded text-sm"
              >
                Basic Receipt
              </button>
              <button
                onClick={() => loadTemplate('detailed')}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white p-2 rounded text-sm"
              >
                Detailed Receipt
              </button>
              <hr className="border-gray-600 my-2" />
              <button
                onClick={clearSavedDesign}
                className="w-full bg-red-600 hover:bg-red-700 text-white p-2 rounded text-sm"
              >
                🗑️ Reset to Default
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <h2 className="text-white font-bold text-xl">Receipt Designer</h2>
          <p className="text-gray-400 text-sm">Drag elements from the palette to design your receipt. Drag elements within the receipt to reorder them.</p>
          <p className="text-green-400 text-xs mt-1">✅ Your design is automatically saved and will persist between page refreshes</p>
            </div>

        <div 
          className="flex-1 overflow-auto p-6"
          onDragOver={handleDragOver}
          onDrop={handleCanvasDrop}
        >
          <div className="max-w-md mx-auto">
            {/* Receipt Paper Visual */}
            <div className="bg-white min-h-96 p-4 shadow-xl border border-gray-300" style={{ width: '300px' }}>
              {elements.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <p className="text-2xl mb-2">📄</p>
                  <p>Drop elements here to start designing</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {elements.map((element, index) => (
                    <React.Fragment key={element.id}>
                      {/* Drop zone at the top of first element or between elements */}
                      <div
                        className={`h-2 transition-all ${
                          dragOverIndex === index ? 'bg-blue-300 h-4 rounded' : 'bg-transparent'
                        } ${draggedCanvasElement || draggedElement ? 'hover:bg-blue-200' : ''}`}
                        onDragOver={(e) => handleDropZoneDragOver(e, index)}
                        onDrop={(e) => handleDropZoneDrop(e, index)}
                      />
                      
                      {/* Element */}
                      <div
                        draggable={true}
                        onDragStart={(e) => handleCanvasElementDragStart(e, element.id)}
                        onDragEnd={handleCanvasElementDragEnd}
                        className={`group relative p-2 border border-dashed transition-all ${
                          draggedCanvasElement === element.id 
                            ? 'opacity-50 border-blue-400 bg-blue-50' 
                            : selectedElement === element.id 
                              ? 'bg-blue-50 border-blue-400' 
                              : 'border-transparent hover:border-blue-400 hover:bg-gray-50'
                        } ${draggedCanvasElement ? 'cursor-grabbing' : 'cursor-grab'}`}
                        onClick={() => selectElement(element.id)}
                      >
                        {/* Drag handle indicator */}
                        <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-4 bg-gray-400 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                          draggedCanvasElement === element.id ? 'opacity-100' : ''
                        }`} />
                        
                        <div className={`${getElementAlignment(element)} ${getElementStyle(element)} ml-2`}>
                          {renderElementPreview(element)}
                </div>
                        
                        {/* Element controls */}
                        <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 flex space-x-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveElement(element.id, 'up'); }}
                            className="bg-blue-500 text-white px-1 py-0.5 rounded text-xs hover:bg-blue-600"
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveElement(element.id, 'down'); }}
                            className="bg-blue-500 text-white px-1 py-0.5 rounded text-xs hover:bg-blue-600"
                            disabled={index === elements.length - 1}
                          >
                            ↓
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteElement(element.id); }}
                            className="bg-red-500 text-white px-1 py-0.5 rounded text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
              </div>
            </div>

                      {/* Drop zone at the bottom of last element */}
                      {index === elements.length - 1 && (
                        <div
                          className={`h-2 transition-all ${
                            dragOverIndex === elements.length ? 'bg-blue-300 h-4 rounded' : 'bg-transparent'
                          } ${draggedCanvasElement || draggedElement ? 'hover:bg-blue-200' : ''}`}
                          onDragOver={(e) => handleDropZoneDragOver(e, elements.length)}
                          onDrop={(e) => handleDropZoneDrop(e, elements.length)}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
        <h3 className="text-white font-bold mb-4 flex items-center">
          ⚙️ Properties
        </h3>
        
        {selectedElementData ? (
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm font-medium">Element Type</label>
              <div className="bg-gray-700 p-2 rounded text-white text-sm">
                {ELEMENT_TYPES[selectedElementData.type as keyof typeof ELEMENT_TYPES]?.label || selectedElementData.type}
              </div>
            </div>

            {renderElementProperties(selectedElementData, updateElement)}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-8">
            <p className="text-4xl mb-2">👆</p>
            <p>Select an element to edit its properties</p>
          </div>
        )}
      </div>
    </div>
  );

  // Helper functions for rendering
  function getElementAlignment(element: ReceiptElement): string {
    if (element.type === 'align') return '';
    if (element.type === 'divider') return ''; // Dividers handle their own alignment
    // Use the last alignment set in the elements array
    let alignment = Alignment.LEFT;
    const elementIndex = elements.findIndex(el => el.id === element.id);
    for (let i = elementIndex - 1; i >= 0; i--) {
      if (elements[i].type === 'align' && elements[i].alignment) {
        alignment = elements[i].alignment!;
        break;
      }
    }
    
    switch (alignment) {
      case Alignment.CENTER: return 'text-center';
      case Alignment.RIGHT: return 'text-right';
      default: return 'text-left';
    }
  }

  function getElementStyle(element: ReceiptElement): string {
    const classes = [];
    if (element.style?.bold) classes.push('font-bold');
    if (element.style?.underline) classes.push('underline');
    
    switch (element.style?.size) {
      case TextSize.SMALL: classes.push('text-xs'); break;
      case TextSize.LARGE: classes.push('text-lg'); break;
      case TextSize.XLARGE: classes.push('text-xl'); break;
      default: classes.push('text-sm'); break;
    }
    
    return classes.join(' ');
  }

  function renderElementPreview(element: ReceiptElement): React.ReactNode {
    switch (element.type) {
      case 'text':
        return element.content || 'Text';
      case 'align':
        return <span className="text-blue-500 text-xs">↔️ Align: {element.alignment}</span>;
      case 'feedLine':
        return <span className="text-purple-500 text-xs">↩️ Feed {element.lines} line(s)</span>;
      case 'barcode':
        return (
          <div className="text-center">
            <div className="bg-black h-8 w-32 mx-auto mb-1 flex items-center justify-center">
              <span className="text-white text-xs">BARCODE</span>
            </div>
            <span className="text-xs">{element.data}</span>
          </div>
        );
      case 'qrcode':
        return (
          <div className="text-center">
            <div className="bg-black h-16 w-16 mx-auto mb-1 flex items-center justify-center">
              <span className="text-white text-xs">QR</span>
            </div>
            <span className="text-xs">{element.data?.substring(0, 20)}...</span>
          </div>
        );
      case 'divider':
        return <div className="text-center">{element.content || '================================'}</div>;
      case 'dynamic':
        return <span className="text-yellow-600 bg-yellow-100 px-1 rounded">{`{{${element.field}}}`}</span>;
      case 'items_list':
        return (
          <div className="text-indigo-500 text-xs">
            <div>📋 Items List</div>
            <div className="text-gray-400 font-mono text-xs mt-1 whitespace-pre-line">
              {element.itemTemplate || "{{align:left}}{{quantity}}x {{name}}\n{{align:right}}${{totalPrice}}\n{{feedLine}}"}
            </div>
          </div>
        );
      case 'split_payments':
        return <span className="text-teal-500 text-xs">💳 Split Payments</span>;
      case 'cutPaper':
        return <span className="text-red-500 text-xs">✂️ Cut Paper</span>;
      default:
        return element.type;
    }
  }

  function renderElementProperties(element: ReceiptElement, updateElement: (id: string, updates: Partial<ReceiptElement>) => void): React.ReactNode {
    switch (element.type) {
      case 'text':
        return (
          <>
            <div>
              <label className="text-gray-300 text-sm font-medium">Content</label>
              <input
                type="text"
                value={element.content || ''}
                onChange={(e) => updateElement(element.id, { content: e.target.value })}
                className="w-full bg-gray-700 text-white p-2 rounded mt-1"
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm font-medium">Size</label>
              <select
                value={element.style?.size || TextSize.NORMAL}
                onChange={(e) => updateElement(element.id, { style: { ...element.style, size: e.target.value as TextSize } })}
                className="w-full bg-gray-700 text-white p-2 rounded mt-1"
              >
                <option value={TextSize.SMALL}>Small</option>
                <option value={TextSize.NORMAL}>Normal</option>
                <option value={TextSize.LARGE}>Large</option>
                <option value={TextSize.XLARGE}>X-Large</option>
              </select>
            </div>
            <div className="flex space-x-4">
              <label className="flex items-center text-gray-300">
                <input
                  type="checkbox"
                  checked={element.style?.bold || false}
                  onChange={(e) => updateElement(element.id, { style: { ...element.style, bold: e.target.checked } })}
                  className="mr-2"
                />
                Bold
              </label>
              <label className="flex items-center text-gray-300">
                <input
                  type="checkbox"
                  checked={element.style?.underline || false}
                  onChange={(e) => updateElement(element.id, { style: { ...element.style, underline: e.target.checked } })}
                  className="mr-2"
                />
                Underline
              </label>
            </div>
          </>
        );
      case 'align':
        return (
          <div>
            <label className="text-gray-300 text-sm font-medium">Alignment</label>
            <select
              value={element.alignment || Alignment.LEFT}
              onChange={(e) => updateElement(element.id, { alignment: e.target.value as Alignment })}
              className="w-full bg-gray-700 text-white p-2 rounded mt-1"
            >
              <option value={Alignment.LEFT}>Left</option>
              <option value={Alignment.CENTER}>Center</option>
              <option value={Alignment.RIGHT}>Right</option>
            </select>
          </div>
        );
      case 'feedLine':
        return (
          <div>
            <label className="text-gray-300 text-sm font-medium">Lines</label>
            <input
              type="number"
              min="1"
              max="10"
              value={element.lines || 1}
              onChange={(e) => updateElement(element.id, { lines: parseInt(e.target.value) })}
              className="w-full bg-gray-700 text-white p-2 rounded mt-1"
            />
          </div>
        );
      case 'barcode':
        return (
          <>
            <div>
              <label className="text-gray-300 text-sm font-medium">Data</label>
              <input
                type="text"
                value={element.data || ''}
                onChange={(e) => updateElement(element.id, { data: e.target.value })}
                className="w-full bg-gray-700 text-white p-2 rounded mt-1"
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm font-medium">Barcode Type</label>
              <select
                value={element.barcodeType || BarcodeType.CODE128}
                onChange={(e) => updateElement(element.id, { barcodeType: e.target.value as BarcodeType })}
                className="w-full bg-gray-700 text-white p-2 rounded mt-1"
              >
                {Object.values(BarcodeType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </>
        );
      case 'qrcode':
        return (
          <>
            <div>
              <label className="text-gray-300 text-sm font-medium">Data</label>
              <input
                type="text"
                value={element.data || ''}
                onChange={(e) => updateElement(element.id, { data: e.target.value })}
                className="w-full bg-gray-700 text-white p-2 rounded mt-1"
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm font-medium">Size</label>
              <input
                type="number"
                min="1"
                max="10"
                value={element.qrSize || 3}
                onChange={(e) => updateElement(element.id, { qrSize: parseInt(e.target.value) })}
                className="w-full bg-gray-700 text-white p-2 rounded mt-1"
              />
            </div>
          </>
        );
      case 'dynamic':
        return (
          <div>
            <label className="text-gray-300 text-sm font-medium">Field</label>
            <select
              value={element.field || ''}
              onChange={(e) => updateElement(element.id, { field: e.target.value })}
              className="w-full bg-gray-700 text-white p-2 rounded mt-1"
            >
              {DYNAMIC_FIELDS.map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </div>
        );
      case 'divider':
        return (
          <div>
            <label className="text-gray-300 text-sm font-medium">Line Style</label>
            <input
              type="text"
              value={element.content || '================================'}
              onChange={(e) => updateElement(element.id, { content: e.target.value })}
              className="w-full bg-gray-700 text-white p-2 rounded mt-1"
            />
          </div>
        );
      case 'items_list':
        return (
          <div className="space-y-4">
            <div className="text-sm text-gray-300">
              Define how each order item should be displayed:
            </div>
            <div>
              <label className="text-gray-300 text-sm font-medium block mb-1">
                Item Template
              </label>
              <textarea
                value={element.itemTemplate || "{{align:left}}{{quantity}}x {{name}}\n{{align:right}}${{totalPrice}}\n{{feedLine}}"}
                onChange={(e) => updateElement(element.id, { itemTemplate: e.target.value })}
                className="w-full bg-gray-700 text-white p-2 rounded font-mono text-sm"
                rows={4}
                placeholder="{{align:left}}{{quantity}}x {{name}}\n{{align:right}}${{totalPrice}}\n{{feedLine}}"
              />
              <div className="text-xs text-gray-400 mt-1 space-y-1">
                <div>Available fields: name, quantity, unitPrice, totalPrice, sku, category, modifiers</div>
                <div>Alignment directives: {"{{align:left}}, {{align:center}}, {{align:right}}"}</div>
                <div>Line feed directives: {"{{feedLine}}, {{feedLine:2}}, {{feedLine:3}}"}</div>
                <div className="font-mono">Example: Add spacing between item details</div>
              </div>
            </div>
            <div>
              <label className="text-gray-300 text-sm font-medium block mb-2">
                Show Item Details
              </label>
              <div className="space-y-2">
                <label className="flex items-center text-gray-300">
                  <input
                    type="checkbox"
                    checked={element.showSku || false}
                    onChange={(e) => updateElement(element.id, { showSku: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Show SKU</span>
                </label>
                <label className="flex items-center text-gray-300">
                  <input
                    type="checkbox"
                    checked={element.showCategory || false}
                    onChange={(e) => updateElement(element.id, { showCategory: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Show Category</span>
                </label>
                <label className="flex items-center text-gray-300">
                  <input
                    type="checkbox"
                    checked={element.showModifiers || false}
                    onChange={(e) => updateElement(element.id, { showModifiers: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Show Modifiers</span>
                </label>
                <label className="flex items-center text-gray-300">
                  <input
                    type="checkbox"
                    checked={element.showUnitPrice || false}
                    onChange={(e) => updateElement(element.id, { showUnitPrice: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Show Unit Price (when quantity &gt; 1)</span>
                </label>
              </div>
            </div>
          </div>
        );
      default:
        return <p className="text-gray-400 text-sm">No properties available for this element type.</p>;
    }
  }
};