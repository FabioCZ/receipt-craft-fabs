'use client';

import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

interface SimpleJSEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export const SimpleJSEditor: React.FC<SimpleJSEditorProps> = ({
  value,
  onChange,
  height = '400px',
  readOnly = false
}) => {
  return (
    <div style={{ height, overflow: 'auto' }} className="border border-gray-600 rounded-lg">
      <CodeMirror
        value={value}
        height={height}
        theme={oneDark}
        extensions={[javascript()]}
        onChange={(val) => onChange(val)}
        editable={!readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          highlightSelectionMatches: true,
          searchKeymap: true,
        }}
        style={{
          fontSize: '14px',
        }}
      />
    </div>
  );
};

export default SimpleJSEditor;