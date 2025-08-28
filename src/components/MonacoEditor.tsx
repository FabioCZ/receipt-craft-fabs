'use client';

import React, { useRef, useEffect } from 'react';
import type * as MonacoType from 'monaco-editor';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'javascript' | 'kotlin';
  height?: string;
  readOnly?: boolean;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language,
  height = '400px',
  readOnly = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MonacoType.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof MonacoType | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const initEditor = async () => {
      // Dynamically import monaco-editor
      const monaco = await import('monaco-editor');
      monacoRef.current = monaco;

      // Configure for JavaScript
      if (language === 'javascript') {
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

          interface EpsonPrinter {
            addText(text: string, options?: TextStyle): void;
            addTextAlign(alignment: 'left' | 'center' | 'right'): void;
            addTextSize(width: number, height: number): void;
            addTextStyle(style: TextStyle): void;
            addFeedLine(lines: number): void;
            addLineSpace(space: number): void;
            addBarcode(data: string, type: 'CODE39' | 'CODE128' | 'QR', options?: BarcodeOptions): void;
            addQRCode(data: string, options?: QRCodeOptions): void;
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
      }

      // Create editor
      const editor = monaco.editor.create(containerRef.current, {
        value,
        language: language === 'kotlin' ? 'kotlin' : 'javascript',
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
        },
        scrollBeyondLastLine: false,
        renderWhitespace: 'none' as const,
        cursorBlinking: 'smooth' as const,
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
    };

    initEditor();

    // Cleanup
    return () => {
      editorRef.current?.dispose();
    };
  }, [language]);

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

export default MonacoEditor;