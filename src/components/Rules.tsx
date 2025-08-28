'use client';

import dynamic from 'next/dynamic';

const MermaidDiagram = dynamic(
  () => import('./MermaidDiagram').then(mod => mod.MermaidDiagram),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading diagram...</div>
      </div>
    )
  }
);

export default function Rules() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          🏆 Receipt Printer Hackathon
        </h1>
        <p className="text-gray-400 text-lg">Build a Visual Receipt Designer & Kotlin Interpreter</p>
      </div>

      {/* Main Challenge */}
      <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold mb-4 text-blue-400">🎯 The Challenge</h2>
        <div className="space-y-3 text-gray-300">
          <p>Build TWO components that work together to generate beautiful receipts:</p>
          <ol className="list-decimal list-inside space-y-3 ml-4">
            <li>
              <strong className="text-white">Visual Receipt Designer (JavaScript/React):</strong>
              <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                <li>Build a <span className="text-yellow-400 font-semibold">drag-and-drop interface</span> for designing receipts</li>
                <li>Support elements like text blocks, headers, item lists, totals, QR codes, etc.</li>
                <li>Generate a <span className="text-green-400 font-semibold">JSON DSL</span> that describes the receipt LAYOUT (not data)</li>
                <li>Must call <code className="bg-gray-700 px-2 py-1 rounded text-yellow-300">onJsonUpdate(jsonString)</code> when design changes</li>
              </ul>
            </li>
            <li>
              <strong className="text-white">Kotlin Interpreter Function:</strong>
              <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                <li>Parse your JSON DSL and Order data</li>
                <li>Convert them into printer commands using the EpsonPrinter interface</li>
                <li>Handle dynamic data from different competition rounds</li>
              </ul>
            </li>
          </ol>
        </div>
      </section>

      {/* System Architecture */}
      <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold mb-4 text-blue-400">🏗️ System Architecture</h2>
        <div className="bg-slate-900 p-6 rounded-lg">
          <MermaidDiagram diagram={`flowchart TB
    subgraph Frontend["🖥️ FRONTEND (This App)"]
        Design["📐 Design Tab<br/>Drag & Drop UI<br/>Generates JSON DSL"]
        Submit["📤 Submit Tab<br/>Kotlin Code Editor<br/>interpret() function"]
        Design -->|JSON| Submit
    end
    
    Submit -->|"HTTP POST<br/>{json, kotlin, order}"| Compiler
    
    subgraph Compiler["⚙️ COMPILATION SERVER"]
        direction TB
        C1["Compiles Kotlin code<br/>Executes interpret() function<br/>Passes JSON + Order<br/>Captures printer commands"]
    end
    
    Compiler -->|"ESC/POS Commands"| Android
    
    subgraph Android["🤖 ANDROID PRINT SERVER"]
        A1["Receives printer commands<br/>Sends to physical Epson printer"]
    end
    
    Android -->|Prints| Receipt["🧾 Physical Receipt!"]
    
    classDef frontendClass fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#fff
    classDef serverClass fill:#1e293b,stroke:#475569,stroke-width:2px,color:#fff
    classDef receiptClass fill:#059669,stroke:#10b981,stroke-width:2px,color:#fff
    
    class Frontend frontendClass
    class Compiler,Android serverClass
    class Receipt receiptClass`} />
          <div className="mt-4 p-3 bg-slate-800 rounded">
            <h3 className="font-semibold text-gray-200 mb-2">Data Flow:</h3>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li><strong>Design:</strong> Create visual receipt layout → Generate JSON DSL</li>
              <li><strong>Submit:</strong> JSON + Kotlin Code → Compilation Server</li>
              <li><strong>Execute:</strong> Server compiles & runs your interpreter with Order data</li>
              <li><strong>Print:</strong> ESC/POS commands → Android → Physical receipt</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Required Kotlin Function */}
      <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold mb-4 text-blue-400">⚡ Required Kotlin Function</h2>
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-600">
          <p className="text-gray-300 mb-3">Your Kotlin interpreter must have this exact signature:</p>
          <pre className="text-yellow-300 font-mono text-sm overflow-x-auto">{`fun interpret(jsonString: String, printer: EpsonPrinter, order: Order?) {
    // 1. Parse your JSON DSL (from Design tab)
    val json = JSONObject(jsonString)
    
    // 2. Read your layout template
    val layout = json.getJSONArray("sections")
    
    // 3. Use order data when available (null in practice round)
    if (order != null) {
        // Render receipt based on your layout + order data
    }
    
    // 4. Always end with:
    printer.cutPaper()
}`}</pre>
          <div className="mt-4 p-3 bg-blue-900/30 border border-blue-600/50 rounded">
            <p className="text-sm text-blue-300">
              💡 <strong>Key Point:</strong> Your JSON should describe HOW to display data (layout), 
              not WHAT data to display (content). The Order provides the content.
            </p>
          </div>
        </div>
      </section>

      {/* Rounds */}
      <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold mb-4 text-blue-400">🎮 Competition Rounds</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-600">
            <h3 className="font-bold text-green-400 mb-2">Round 0: Practice</h3>
            <p className="text-gray-300 text-sm">No order data - design static receipt</p>
          </div>
          
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-600">
            <h3 className="font-bold text-blue-400 mb-2">Round 1: Basic Order</h3>
            <p className="text-gray-300 text-sm">Simple items, subtotal, tax, total</p>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg border border-slate-600">
            <h3 className="font-bold text-blue-400 mb-2">Round 2: Promotions</h3>
            <p className="text-gray-300 text-sm">Discounts and special offers</p>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg border border-slate-600">
            <h3 className="font-bold text-blue-400 mb-2">Round 3: Customer</h3>
            <p className="text-gray-300 text-sm">Loyalty points and member info</p>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg border border-slate-600">
            <h3 className="font-bold text-purple-400 mb-2">Round 4: Complex Items</h3>
            <p className="text-gray-300 text-sm">Modifiers, categories, SKUs</p>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg border border-slate-600">
            <h3 className="font-bold text-purple-400 mb-2">Round 5: Split Payment</h3>
            <p className="text-gray-300 text-sm">Multiple payers, tips, table info</p>
          </div>
        </div>
      </section>

      {/* Order Data Schema */}
      <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold mb-4 text-blue-400">📊 Order Data Schema</h2>
        <div className="bg-slate-900 p-4 rounded-lg">
          <pre className="text-gray-300 text-xs font-mono overflow-x-auto">{`interface Order {
  // Basic fields (Round 1+)
  orderId: string           // "A-0042"
  storeNumber: string       // "001"
  storeName: string         // "BYTE BURGERS"
  timestamp: number         // Unix timestamp
  
  items: OrderItem[]        // Array of items
  subtotal: number          // 27.95
  taxRate: number           // 0.08
  taxAmount: number         // 2.24
  totalAmount: number       // 30.19
  
  // Round 2+ Promotions
  itemPromotions?: ItemPromotion[]
  orderPromotions?: OrderPromotion[]
  
  // Round 3+ Customer
  customerInfo?: CustomerInfo
  paymentMethod?: string    // "VISA ****1234"
  
  // Round 5+ Split Payment
  splitPayments?: SplitPayment[]
  tableInfo?: TableInfo
}

interface OrderItem {
  name: string              // "Cheeseburger"
  quantity: number          // 2
  unitPrice: number         // 8.99
  totalPrice: number        // 17.98
  sku?: string              // "BURG-001"
  category?: string         // "BURGERS"
  modifiers?: string[]      // ["Medium Rare", "Extra Cheese"]
}

interface CustomerInfo {
  customerId: string
  name: string
  memberStatus?: string     // "GOLD", "PLATINUM"
  loyaltyPoints?: number
  memberSince?: string
}`}</pre>
        </div>
      </section>

      {/* Scoring */}
      <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold mb-4 text-blue-400">🏅 Scoring</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-900 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-400">40%</div>
            <div className="text-gray-300">Accuracy</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-400">40%</div>
            <div className="text-gray-300">Design</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-yellow-400">20%</div>
            <div className="text-gray-300">Speed</div>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">💡 Pro Tips</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          <li>Design JSON should describe layout, not hardcode data</li>
          <li>Test locally with Preview tab before submitting</li>
          <li>Use optional chaining (?.) for nullable fields</li>
          <li>Make designs flexible to handle varying data</li>
          <li>Remember to call <code className="bg-black/30 px-2 py-1 rounded">printer.cutPaper()</code> at the end!</li>
        </ul>
      </section>
    </div>
  );
}