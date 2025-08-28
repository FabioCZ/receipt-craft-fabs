'use client';

import React, { useState } from 'react';

interface PrinterCheatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrinterCheatSheet: React.FC<PrinterCheatSheetProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'printer' | 'order' | 'examples'>('printer');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-100 flex items-center">
            <span className="text-2xl mr-2">🤖</span>
            Printer AI - Kotlin Reference
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-900 border-b border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('printer')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'printer'
                  ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              EpsonPrinter Interface
            </button>
            <button
              onClick={() => setActiveTab('order')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'order'
                  ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Order Data Model
            </button>
            <button
              onClick={() => setActiveTab('examples')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'examples'
                  ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Code Examples
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {activeTab === 'printer' && (
            <div className="p-6 space-y-6">
              {/* Main Interface */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-bold text-green-400 mb-3">EpsonPrinter Interface</h3>
                <pre className="text-gray-300 text-sm overflow-x-auto">{`interface EpsonPrinter {
    fun addText(text: String)
    fun addText(text: String, style: TextStyle?)
    fun addTextStyle(style: TextStyle)
    fun addTextAlign(alignment: Alignment)
    fun addBarcode(data: String, type: BarcodeType, options: BarcodeOptions? = null)
    fun addQRCode(data: String, options: QRCodeOptions? = null)
    fun addFeedLine(lines: Int)
    fun cutPaper()
}`}</pre>
              </div>

              {/* TextStyle */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-bold text-yellow-400 mb-3">TextStyle</h3>
                <pre className="text-gray-300 text-sm overflow-x-auto">{`data class TextStyle(
    val bold: Boolean = false,
    val underline: Boolean = false,
    val size: TextSize = TextSize.NORMAL
)

enum class TextSize {
    SMALL,    // Small text
    NORMAL,   // Normal text (default)
    LARGE,    // Large text
    XLARGE    // Extra large text
}`}</pre>
              </div>

              {/* Alignment */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-bold text-purple-400 mb-3">Alignment</h3>
                <pre className="text-gray-300 text-sm overflow-x-auto">{`enum class Alignment {
    LEFT,     // Left aligned (default)
    CENTER,   // Center aligned
    RIGHT     // Right aligned
}`}</pre>
              </div>

              {/* Barcode Types */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-bold text-red-400 mb-3">BarcodeType</h3>
                <pre className="text-gray-300 text-sm overflow-x-auto">{`enum class BarcodeType {
    UPC_A, UPC_E,           // UPC codes
    EAN13, EAN8,            // European Article Numbers
    CODE39, CODE93, CODE128,// Common 1D barcodes
    ITF, CODABAR,           // Industrial codes
    GS1_128,                // GS1 standard
    GS1_DATABAR_OMNIDIRECTIONAL,
    GS1_DATABAR_TRUNCATED,
    GS1_DATABAR_LIMITED,
    GS1_DATABAR_EXPANDED
}`}</pre>
              </div>

              {/* Barcode Options */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-bold text-orange-400 mb-3">BarcodeOptions</h3>
                <pre className="text-gray-300 text-sm overflow-x-auto">{`data class BarcodeOptions(
    val width: BarcodeWidth = BarcodeWidth.MEDIUM,
    val height: Int = 50,           // Height in dots
    val hri: Boolean = true         // Human Readable Interpretation
)

enum class BarcodeWidth {
    THIN,     // Thin barcode
    MEDIUM,   // Medium width (default)
    THICK     // Thick barcode
}`}</pre>
              </div>

              {/* QR Code Options */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-bold text-cyan-400 mb-3">QRCodeOptions</h3>
                <pre className="text-gray-300 text-sm overflow-x-auto">{`data class QRCodeOptions(
    val size: Int = 3,  // Size multiplier (1-8)
    val errorCorrection: QRErrorCorrection = QRErrorCorrection.M
)

enum class QRErrorCorrection {
    L,  // Low (7% error correction)
    M,  // Medium (15% error correction) - default
    Q,  // Quartile (25% error correction)
    H   // High (30% error correction)
}`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'order' && (
            <div className="p-6 space-y-6">
              {/* Main Order */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-bold text-green-400 mb-3">Order Data Class</h3>
                <pre className="text-gray-300 text-sm overflow-x-auto">{`data class Order(
    // Required fields (always present)
    val orderId: String,
    val storeNumber: String,
    val storeName: String,
    val timestamp: Long,
    val items: List<OrderItem>,
    val subtotal: Double,
    val taxRate: Double,
    val taxAmount: Double,
    val totalAmount: Double,
    
    // Optional fields (Round 2+)
    val itemPromotions: List<ItemPromotion> = emptyList(),
    val orderPromotions: List<OrderPromotion> = emptyList(),
    
    // Optional fields (Round 3+)
    val customerInfo: CustomerInfo? = null,
    val paymentMethod: String? = null,
    
    // Optional fields (Round 4+)
    val splitPayments: List<SplitPayment> = emptyList(),
    val tableInfo: TableInfo? = null
)`}</pre>
              </div>

              {/* OrderItem */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-bold text-yellow-400 mb-3">OrderItem</h3>
                <pre className="text-gray-300 text-sm overflow-x-auto">{`data class OrderItem(
    // Required fields
    val name: String,
    val quantity: Int,
    val unitPrice: Double,
    val totalPrice: Double,
    
    // Optional fields
    val sku: String? = null,
    val category: String? = null,
    val modifiers: List<String> = emptyList()
)`}</pre>
              </div>

              {/* CustomerInfo */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-bold text-purple-400 mb-3">CustomerInfo (Round 3+)</h3>
                <pre className="text-gray-300 text-sm overflow-x-auto">{`data class CustomerInfo(
    val customerId: String,
    val name: String,
    val memberStatus: String? = null,
    val loyaltyPoints: Int = 0,
    val memberSince: String? = null
)`}</pre>
              </div>

              {/* Promotions */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-bold text-red-400 mb-3">Promotions (Round 2+)</h3>
                <pre className="text-gray-300 text-sm overflow-x-auto">{`data class ItemPromotion(
    val itemSku: String,
    val promotionName: String,
    val discountAmount: Double
)

data class OrderPromotion(
    val promotionName: String,
    val discountAmount: Double,
    val promotionType: String  // "PERCENTAGE" or "FIXED"
)`}</pre>
              </div>

              {/* Split Payment */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-bold text-orange-400 mb-3">SplitPayment (Round 4+)</h3>
                <pre className="text-gray-300 text-sm overflow-x-auto">{`data class SplitPayment(
    val payerName: String,
    val amount: Double,
    val method: String,
    val tip: Double = 0.0,
    val items: List<String> = emptyList()
)`}</pre>
              </div>

              {/* Table Info */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-bold text-cyan-400 mb-3">TableInfo (Round 4+)</h3>
                <pre className="text-gray-300 text-sm overflow-x-auto">{`data class TableInfo(
    val tableNumber: String,
    val serverName: String,
    val guestCount: Int,
    val serviceRating: Int? = null
)`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'examples' && (
            <div className="p-6 space-y-6">
              {/* Basic Example */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-bold text-green-400 mb-3">Basic Receipt Example</h3>
                <pre className="text-gray-300 text-sm overflow-x-auto">{`fun interpret(jsonString: String, printer: EpsonPrinter, order: Order?) {
    // Print centered header
    printer.addTextAlign(Alignment.CENTER)
    printer.addText("BYTE BURGERS", TextStyle(
        bold = true,
        size = TextSize.LARGE
    ))
    printer.addFeedLine(1)
    
    // Print order details
    printer.addTextAlign(Alignment.LEFT)
    printer.addText("Order #\${order?.orderId ?: "N/A"}")
    printer.addFeedLine(2)
    
    // Print items
    order?.items?.forEach { item ->
        printer.addText("\${item.quantity}x \${item.name}")
        printer.addTextAlign(Alignment.RIGHT)
        printer.addText("$\${item.totalPrice}")
        printer.addTextAlign(Alignment.LEFT)
        printer.addFeedLine(1)
    }
    
    // Print total
    printer.addFeedLine(1)
    printer.addText("TOTAL", TextStyle(bold = true))
    printer.addTextAlign(Alignment.RIGHT)
    printer.addText("$\${order?.totalAmount ?: 0.0}", TextStyle(bold = true))
    
    // Cut paper
    printer.addFeedLine(3)
    printer.cutPaper()
}`}</pre>
              </div>

              {/* JSON Processing Example */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-bold text-yellow-400 mb-3">Processing JSON Design</h3>
                <pre className="text-gray-300 text-sm overflow-x-auto">{`fun interpret(jsonString: String, printer: EpsonPrinter, order: Order?) {
    val json = JSONObject(jsonString)
    
    if (json.has("elements")) {
        val elements = json.getJSONArray("elements")
        
        for (i in 0 until elements.length()) {
            val element = elements.getJSONObject(i)
            
            when (element.optString("type")) {
                "text" -> {
                    val content = element.optString("content", "")
                    if (element.has("style")) {
                        val style = element.getJSONObject("style")
                        printer.addText(content, TextStyle(
                            bold = style.optBoolean("bold", false),
                            underline = style.optBoolean("underline", false),
                            size = when (style.optString("size", "NORMAL")) {
                                "SMALL" -> TextSize.SMALL
                                "LARGE" -> TextSize.LARGE
                                "XLARGE" -> TextSize.XLARGE
                                else -> TextSize.NORMAL
                            }
                        ))
                    } else {
                        printer.addText(content)
                    }
                }
                
                "align" -> {
                    val alignment = when (element.optString("alignment", "LEFT")) {
                        "CENTER" -> Alignment.CENTER
                        "RIGHT" -> Alignment.RIGHT
                        else -> Alignment.LEFT
                    }
                    printer.addTextAlign(alignment)
                }
                
                "qrcode" -> {
                    val data = element.optString("data", "")
                    val size = element.optInt("size", 3)
                    printer.addQRCode(data, QRCodeOptions(size = size))
                }
                
                "barcode" -> {
                    val data = element.optString("data", "")
                    val type = BarcodeType.valueOf(
                        element.optString("type", "CODE128")
                    )
                    printer.addBarcode(data, type)
                }
                
                "feedLine" -> {
                    printer.addFeedLine(element.optInt("lines", 1))
                }
                
                "cutPaper" -> {
                    printer.cutPaper()
                }
            }
        }
    }
}`}</pre>
              </div>

              {/* Template Variables Example */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-bold text-purple-400 mb-3">Template Variables</h3>
                <pre className="text-gray-300 text-sm overflow-x-auto">{`fun replaceTemplateVars(text: String, order: Order?): String {
    if (order == null) return text
    
    return text
        .replace("{{STORE_NAME}}", order.storeName)
        .replace("{{STORE_NUMBER}}", order.storeNumber)
        .replace("{{ORDER_ID}}", order.orderId)
        .replace("{{TOTAL}}", String.format("%.2f", order.totalAmount))
        .replace("{{DATE}}", SimpleDateFormat("MM/dd/yyyy").format(Date(order.timestamp)))
        .replace("{{TIME}}", SimpleDateFormat("HH:mm:ss").format(Date(order.timestamp)))
        .replace("{{ITEM_COUNT}}", order.items.size.toString())
}

// Usage in interpret function
val content = replaceTemplateVars(element.optString("content", ""), order)
printer.addText(content)`}</pre>
              </div>

              {/* Advanced Features Example */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-bold text-red-400 mb-3">Advanced Features</h3>
                <pre className="text-gray-300 text-sm overflow-x-auto">{`// QR Code with error correction
printer.addQRCode(
    "https://example.com/order/\${order.orderId}",
    QRCodeOptions(
        size = 5,
        errorCorrection = QRErrorCorrection.H
    )
)

// Barcode with options
printer.addBarcode(
    order.orderId,
    BarcodeType.CODE128,
    BarcodeOptions(
        width = BarcodeWidth.MEDIUM,
        height = 60,
        hri = true  // Show human-readable text
    )
)

// Loyalty points display (Round 3+)
order.customerInfo?.let { customer ->
    printer.addText("Member: \${customer.name}")
    printer.addText("Points: \${customer.loyaltyPoints}")
    customer.memberStatus?.let {
        printer.addText("Status: \$it", TextStyle(bold = true))
    }
}

// Split payment handling (Round 4+)
if (order.splitPayments.isNotEmpty()) {
    printer.addText("SPLIT PAYMENT", TextStyle(bold = true))
    order.splitPayments.forEach { payment ->
        printer.addText("\${payment.payerName}: $\${payment.amount}")
        if (payment.tip > 0) {
            printer.addText("  Tip: $\${payment.tip}")
        }
    }
}`}</pre>
              </div>

              {/* Tips */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-bold text-orange-400 mb-3">Pro Tips</h3>
                <div className="text-gray-300 text-sm space-y-2">
                  <p>• Always check for null values when accessing optional Order fields</p>
                  <p>• Use <code className="bg-gray-700 px-1 rounded">optString()</code>, <code className="bg-gray-700 px-1 rounded">optInt()</code>, etc. for safe JSON parsing</p>
                  <p>• Remember to reset alignment after changing it</p>
                  <p>• Use <code className="bg-gray-700 px-1 rounded">addFeedLine()</code> for proper spacing</p>
                  <p>• Always call <code className="bg-gray-700 px-1 rounded">cutPaper()</code> at the end</p>
                  <p>• Test with different order data to handle all rounds</p>
                  <p>• Import <code className="bg-gray-700 px-1 rounded">org.json.JSONObject</code> for JSON parsing</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};