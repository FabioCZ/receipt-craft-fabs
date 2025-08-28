'use client';

import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';

interface JavaScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export const JavaScriptEditor: React.FC<JavaScriptEditorProps> = ({
  value,
  onChange,
  height = '400px',
  readOnly = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Configure Monaco for JavaScript
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Add type definitions for autocomplete
    monaco.languages.typescript.javascriptDefaults.addExtraLib(`
      interface TextStyle {
        bold?: boolean;
        underline?: boolean;
        italic?: boolean;
        fontFamily?: string;
        size?: 'small' | 'normal' | 'large' | 'xlarge';
      }

      interface BarcodeOptions {
        width?: number;
        height?: number;
        hri?: 'none' | 'above' | 'below' | 'both';
      }

      interface QRCodeOptions {
        size?: number;
        errorCorrection?: 'L' | 'M' | 'Q' | 'H';
      }

      interface ImageOptions {
        width?: number;
        height?: number;
        alignment?: 'left' | 'center' | 'right';
      }

      interface EpsonPrinter {
        addText(text: string, options?: TextStyle): void;
        addTextAlign(alignment: 'left' | 'center' | 'right'): void;
        addTextSize(width: number, height: number): void;
        addTextStyle(style: TextStyle): void;
        addFeedLine(lines: number): void;
        addLineSpace(space: number): void;
        addBarcode(data: string, type: 'CODE39' | 'CODE128' | 'QR', options?: BarcodeOptions): void;
        addQRCode(data: string, options?: QRCodeOptions): void;
        addImage(imageData: ImageData, options?: ImageOptions): void;
        cutPaper(): void;
        clear(): void;
      }

      interface OrderItem {
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }

      interface Order {
        orderId: string;
        storeName: string;
        items: OrderItem[];
        totalAmount: number;
      }

      declare function interpret(jsonString: string, printer: EpsonPrinter, order: Order | null): void;
    `, 'ts:filename/types.d.ts');

    // Create editor
    const editor = monaco.editor.create(containerRef.current, {
      value,
      language: 'javascript',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      readOnly,
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false
      },
      parameterHints: {
        enabled: true
      },
      wordBasedSuggestions: 'off' as const,
      suggest: {
        showKeywords: true,
        showSnippets: true,
        showClasses: true,
        showFunctions: true,
        showVariables: true,
        showConstants: true,
        showMethods: true,
        showProperties: true
      },
      scrollBeyondLastLine: false,
      renderWhitespace: 'none',
      cursorBlinking: 'smooth',
      smoothScrolling: true,
      formatOnPaste: true,
      formatOnType: true,
      tabSize: 2
    });

    editorRef.current = editor;

    // Handle changes
    editor.onDidChangeModelContent(() => {
      onChange(editor.getValue());
    });

    // Cleanup
    return () => {
      editor.dispose();
    };
  }, []);

  // Update value when it changes from outside
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%' }}
      className="border border-gray-600 rounded-lg overflow-hidden"
    />
  );
};

// Export with dynamic import support
export default JavaScriptEditor;