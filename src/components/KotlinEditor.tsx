'use client';

import React, { useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface KotlinEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export const KotlinEditor: React.FC<KotlinEditorProps> = ({
  value,
  onChange,
  height = '400px',
  readOnly = false
}) => {
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorWillMount = (monaco: Monaco) => {
    // Register Kotlin language if not already registered
    if (!monaco.languages.getLanguages().some(lang => lang.id === 'kotlin')) {
      monaco.languages.register({ id: 'kotlin' });

      // Define Kotlin syntax highlighting
      monaco.languages.setMonarchTokensProvider('kotlin', {
        keywords: [
          'abstract', 'actual', 'annotation', 'as', 'break', 'by', 'catch', 'class',
          'companion', 'const', 'constructor', 'continue', 'crossinline', 'data', 'do',
          'else', 'enum', 'expect', 'external', 'false', 'final', 'finally', 'for',
          'fun', 'if', 'import', 'in', 'infix', 'init', 'inline', 'inner', 'interface',
          'internal', 'is', 'lateinit', 'noinline', 'null', 'object', 'open', 'operator',
          'out', 'override', 'package', 'private', 'protected', 'public', 'reified',
          'return', 'sealed', 'super', 'suspend', 'tailrec', 'this', 'throw', 'true',
          'try', 'typealias', 'typeof', 'val', 'var', 'vararg', 'when', 'where', 'while'
        ],
        typeKeywords: [
          'Boolean', 'Byte', 'Char', 'Double', 'Float', 'Int', 'Long', 'Short', 'String',
          'Any', 'Array', 'List', 'Map', 'Set', 'Unit', 'Nothing'
        ],
        operators: [
          '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
          '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
          '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
          '%=', '<<=', '>>=', '>>>='
        ],
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
        tokenizer: {
          root: [
            // identifiers and keywords
            [/[a-z_$][\w$]*/, {
              cases: {
                '@typeKeywords': 'keyword',
                '@keywords': 'keyword',
                '@default': 'identifier'
              }
            }],
            [/[A-Z][\w\$]*/, 'type.identifier'],
            
            // whitespace
            { include: '@whitespace' },
            
            // delimiters and operators
            [/[{}()\[\]]/, '@brackets'],
            [/[<>](?!@symbols)/, '@brackets'],
            [/@symbols/, {
              cases: {
                '@operators': 'operator',
                '@default': ''
              }
            }],
            
            // numbers
            [/\d*\.\d+([eE][\-+]?\d+)?[fFdD]?/, 'number.float'],
            [/0[xX][0-9a-fA-F_]+[lL]?/, 'number.hex'],
            [/0[bB][01_]+[lL]?/, 'number.binary'],
            [/\d+[lL]?/, 'number'],
            
            // delimiter: after number because of .\d floats
            [/[;,.]/, 'delimiter'],
            
            // strings
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"""/, 'string', '@multistring'],
            [/"/, 'string', '@string'],
            
            // characters
            [/'[^\\']'/, 'string'],
            [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
            [/'/, 'string.invalid']
          ],
          
          whitespace: [
            [/[ \t\r\n]+/, 'white'],
            [/\/\*/, 'comment', '@comment'],
            [/\/\/.*$/, 'comment'],
          ],
          
          comment: [
            [/[^\/*]+/, 'comment'],
            [/\/\*/, 'comment', '@push'],
            ["\\*/", 'comment', '@pop'],
            [/[\/*]/, 'comment']
          ],
          
          string: [
            [/[^\\"]+/, 'string'],
            [/@escapes/, 'string.escape'],
            [/\\./, 'string.escape.invalid'],
            [/"/, 'string', '@pop']
          ],
          
          multistring: [
            [/[^"]+/, 'string'],
            [/"""/, 'string', '@pop'],
            [/"/, 'string']
          ],
        },
      });

      // Configure language features
      monaco.languages.setLanguageConfiguration('kotlin', {
        comments: {
          lineComment: '//',
          blockComment: ['/*', '*/']
        },
        brackets: [
          ['{', '}'],
          ['[', ']'],
          ['(', ')']
        ],
        autoClosingPairs: [
          { open: '{', close: '}' },
          { open: '[', close: ']' },
          { open: '(', close: ')' },
          { open: '"', close: '"', notIn: ['string'] },
          { open: "'", close: "'", notIn: ['string', 'comment'] }
        ],
        surroundingPairs: [
          { open: '{', close: '}' },
          { open: '[', close: ']' },
          { open: '(', close: ')' },
          { open: '"', close: '"' },
          { open: "'", close: "'" }
        ],
        folding: {
          offSide: true
        }
      });

      // Add comprehensive IntelliSense for EpsonPrinter and Kotlin
      monaco.languages.registerCompletionItemProvider('kotlin', {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          };
          
          // Get the text before cursor to check context
          const lineContent = model.getLineContent(position.lineNumber);
          const textBeforeCursor = lineContent.substring(0, position.column - 1);
          
          // Check if we're after "printer."
          const isPrinterContext = textBeforeCursor.endsWith('printer.') || textBeforeCursor.match(/printer\.\w*$/);
          
          let suggestions = [];
          
          // EpsonPrinter methods - show when typing after "printer."
          if (isPrinterContext) {
            suggestions = [
              {
                label: 'addText',
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: 'addText("${1:text}")',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'fun addText(text: String)',
                documentation: {
                  value: '**Add text to the receipt**\n\nPrints the specified text at the current position.\n\n**Example:**\n```kotlin\nprinter.addText("Hello World!")\nprinter.addText("Total: $15.99")\n```'
                },
                range: range
              },
              {
                label: 'addTextAlign',
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: 'addTextAlign(Alignment.${1|LEFT,CENTER,RIGHT|})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'fun addTextAlign(alignment: Alignment)',
                documentation: {
                  value: '**Set text alignment**\n\nAligns subsequent text to the left, center, or right.\n\n**Parameters:**\n- `alignment`: Alignment.LEFT, Alignment.CENTER, or Alignment.RIGHT\n\n**Example:**\n```kotlin\nprinter.addTextAlign(Alignment.CENTER)\nprinter.addText("RECEIPT")\nprinter.addTextAlign(Alignment.LEFT)\n```'
                },
                range: range
              },
              {
                label: 'addTextStyle',
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: 'addTextStyle(TextStyle(\n    bold = ${1:false},\n    underline = ${2:false},\n    size = TextSize.${3|SMALL,NORMAL,LARGE,XLARGE|}\n))',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'fun addTextStyle(style: TextStyle)',
                documentation: {
                  value: '**Set text style**\n\nApplies formatting to subsequent text.\n\n**TextStyle Parameters:**\n- `bold`: Boolean (default: false)\n- `underline`: Boolean (default: false)\n- `size`: TextSize.SMALL, NORMAL, LARGE, or XLARGE\n\n**Example:**\n```kotlin\nprinter.addTextStyle(TextStyle(\n    bold = true,\n    size = TextSize.LARGE\n))\nprinter.addText("TOTAL")\n```'
                },
                range: range
              },
              {
                label: 'addQRCode',
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: 'addQRCode("${1:data}", QRCodeOptions(size = ${2:3}))',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'fun addQRCode(data: String, options: QRCodeOptions? = null)',
                documentation: {
                  value: '**Add QR code to the receipt**\n\nGenerates and prints a QR code containing the specified data.\n\n**Parameters:**\n- `data`: String data to encode\n- `options`: Optional QRCodeOptions with size (1-8, default: 3)\n\n**Example:**\n```kotlin\nprinter.addQRCode("https://example.com")\nprinter.addQRCode("Order #12345", QRCodeOptions(size = 5))\n```'
                },
                range: range
              },
              {
                label: 'addFeedLine',
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: 'addFeedLine(${1:2})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'fun addFeedLine(lines: Int)',
                documentation: {
                  value: '**Add blank lines**\n\nFeeds the paper by the specified number of lines.\n\n**Parameters:**\n- `lines`: Number of lines to feed\n\n**Example:**\n```kotlin\nprinter.addFeedLine(2)  // Add 2 blank lines\nprinter.addText("Thank you!")\nprinter.addFeedLine(3)\n```'
                },
                range: range
              },
              {
                label: 'cutPaper',
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: 'cutPaper()',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'fun cutPaper()',
                documentation: {
                  value: '**Cut the paper**\n\nCuts the receipt paper. This should typically be called at the end of your receipt.\n\n**Example:**\n```kotlin\nprinter.addText("Thank you for your purchase!")\nprinter.addFeedLine(3)\nprinter.cutPaper()\n```'
                },
                range: range
              },
              {
                label: 'addBarcode',
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: 'addBarcode("${1:data}", BarcodeType.${2|CODE128,CODE39,EAN13,EAN8,UPC_A,UPC_E|})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'fun addBarcode(data: String, type: BarcodeType)',
                documentation: {
                  value: '**Add barcode to the receipt**\n\nPrints a barcode of the specified type.\n\n**Parameters:**\n- `data`: Barcode data\n- `type`: BarcodeType (CODE128, CODE39, EAN13, etc.)\n\n**Example:**\n```kotlin\nprinter.addBarcode("123456789", BarcodeType.CODE128)\n```'
                },
                range: range
              },
              {
                label: 'addImage',
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: 'addImage(${1:imageData})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'fun addImage(imageData: ByteArray)',
                documentation: {
                  value: '**Add image to the receipt**\n\nPrints an image (logo, etc.) on the receipt.\n\n**Parameters:**\n- `imageData`: ByteArray of the image\n\n**Note:** Images should be monochrome and properly sized for receipt printers.'
                },
                range: range
              }
            ];
          } else {
            // General Kotlin completions and classes
            suggestions = [
              // Kotlin language constructs
              {
                label: 'fun',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'fun ${1:name}(${2:params}): ${3:Unit} {\n\t$0\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Function declaration'
              },
              {
                label: 'if',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'if (${1:condition}) {\n\t$0\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'If statement'
              },
              {
                label: 'when',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'when (${1:expression}) {\n\t${2:value} -> ${3:result}\n\telse -> ${4:default}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'When expression'
              },
              {
                label: 'for',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'for (${1:item} in ${2:collection}) {\n\t$0\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'For loop'
              },
              // Classes and types
              {
                label: 'TextStyle',
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: 'TextStyle(\n    bold = ${1:false},\n    underline = ${2:false},\n    size = TextSize.${3|SMALL,NORMAL,LARGE,XLARGE|}\n)',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'data class TextStyle',
                documentation: {
                  value: '**Text styling configuration**\n\n**Properties:**\n- `bold`: Boolean\n- `underline`: Boolean\n- `size`: TextSize (SMALL, NORMAL, LARGE, XLARGE)'
                }
              },
              {
                label: 'Alignment',
                kind: monaco.languages.CompletionItemKind.Enum,
                insertText: 'Alignment.${1|LEFT,CENTER,RIGHT|}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'enum class Alignment',
                documentation: 'Text alignment options: LEFT, CENTER, RIGHT'
              },
              {
                label: 'TextSize',
                kind: monaco.languages.CompletionItemKind.Enum,
                insertText: 'TextSize.${1|SMALL,NORMAL,LARGE,XLARGE|}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'enum class TextSize',
                documentation: 'Text size options: SMALL, NORMAL, LARGE, XLARGE'
              },
              {
                label: 'QRCodeOptions',
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: 'QRCodeOptions(\n    size = ${1:3},\n    errorCorrection = QRErrorCorrection.${2|L,M,Q,H|}\n)',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'data class QRCodeOptions',
                documentation: {
                  value: '**QR Code configuration**\n\n**Properties:**\n- `size`: Int (1-8, default: 3)\n- `errorCorrection`: QRErrorCorrection (L, M, Q, H)'
                }
              },
              // JSON handling
              {
                label: 'JSONObject',
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: 'JSONObject(${1:jsonString})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'class JSONObject',
                documentation: {
                  value: '**Parse JSON object**\n\n**Example:**\n```kotlin\nval json = JSONObject(jsonString)\nval name = json.getString("name")\nval price = json.getDouble("price")\n```'
                }
              },
              {
                label: 'JSONArray',
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: 'JSONArray(${1:jsonString})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'class JSONArray',
                documentation: {
                  value: '**Parse JSON array**\n\n**Example:**\n```kotlin\nval array = JSONArray(jsonString)\nfor (i in 0 until array.length()) {\n    val item = array.getJSONObject(i)\n}\n```'
                }
              },
              // Quick printer access
              {
                label: 'printer',
                kind: monaco.languages.CompletionItemKind.Variable,
                insertText: 'printer',
                detail: 'val printer: EpsonPrinter',
                documentation: 'The printer instance passed to your interpret function'
              }
            ];
          }
          
          return { suggestions };
        },
        triggerCharacters: ['.', ' ']
      });
    }

    monacoRef.current = monaco;
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontLigatures: true,
      renderWhitespace: 'selection',
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false
      },
      wordWrap: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true
    });
  };

  return (
    <div className="border border-gray-600 rounded-lg overflow-hidden">
      <Editor
        height={height}
        defaultLanguage="kotlin"
        language="kotlin"
        value={value}
        onChange={(val) => onChange(val || '')}
        theme="vs-dark"
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: 'on',
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 3,
          renderLineHighlight: 'all',
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible'
          }
        }}
      />
    </div>
  );
};