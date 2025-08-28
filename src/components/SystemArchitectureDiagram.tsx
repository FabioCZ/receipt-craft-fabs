'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import mermaid to avoid SSR issues
const Mermaid = dynamic(() => import('react-mermaid2'), { ssr: false });

export const SystemArchitectureDiagram: React.FC = () => {
  const diagram = `
    flowchart TB
      subgraph Frontend["🖥️ FRONTEND (This App)"]
        Design["📐 Design Tab<br/>Drag & Drop UI<br/>Generates JSON DSL"]
        Submit["📤 Submit Tab<br/>Kotlin Code Editor<br/>interpret() function"]
        Design -->|JSON| Submit
      end
      
      Submit -->|"HTTP POST<br/>{json, kotlin, order}"| Compiler
      
      subgraph Compiler["⚙️ COMPILATION SERVER"]
        C1["• Compiles Kotlin code"]
        C2["• Executes interpret() function"]
        C3["• Passes JSON + Order to your code"]
        C4["• Captures printer commands"]
      end
      
      Compiler -->|"ESC/POS Commands"| Android
      
      subgraph Android["🤖 ANDROID PRINT SERVER"]
        A1["• Receives printer commands"]
        A2["• Sends to physical Epson printer"]
      end
      
      Android -->|Prints| Receipt["🧾 Physical Receipt!"]
      
      classDef frontendClass fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#fff
      classDef serverClass fill:#1e293b,stroke:#475569,stroke-width:2px,color:#fff
      classDef receiptClass fill:#059669,stroke:#10b981,stroke-width:2px,color:#fff
      
      class Design,Submit frontendClass
      class C1,C2,C3,C4,A1,A2 serverClass
      class Receipt receiptClass
  `;

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth: '800px' }}>
        <Mermaid chart={diagram} />
      </div>
    </div>
  );
};