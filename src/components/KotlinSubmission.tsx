'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { uploadInterpreter, updateInterpreter } from '../lib/api';
import { PrinterCheatSheet } from './PrinterCheatSheet';

// Dynamically import the editor to avoid SSR issues
const KotlinEditor = dynamic(
  () => import('./KotlinEditor').then(mod => mod.KotlinEditor),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-black border border-gray-600 rounded-lg flex items-center justify-center">
        <div className="text-green-400">Loading Kotlin Editor...</div>
      </div>
    )
  }
);

interface KotlinSubmissionProps {
  jsonDsl: string;
  serverUrl?: string;
  onSubmissionSuccess?: (endpoint: string, teamId: string) => void;
}

export const KotlinSubmission: React.FC<KotlinSubmissionProps> = ({ 
  jsonDsl, 
  serverUrl,
  onSubmissionSuccess
}) => {
  const [teamName, setTeamName] = useState('');
  const [kotlinCode, setKotlinCode] = useState(`

fun interpret(jsonString: String, printer: EpsonPrinter, order: Order?) {
    try {
        val jsonObject = JSONObject(jsonString)
        val elements = jsonObject.getJSONArray("elements")
        
        for (i in 0 until elements.length()) {
            val element = elements.getJSONObject(i)
            val type = element.getString("type")
            
            when (type) {
                "text" -> {
                    val content = element.optString("content", "")
                    val processed = processTemplateVariables(content, order)
                    
                    if (element.has("style")) {
                        val style = element.getJSONObject("style")
                        val bold = style.optBoolean("bold", false)
                        val underline = style.optBoolean("underline", false)
                        val sizeStr = style.optString("size", "NORMAL")
                        val textSize = when (sizeStr) {
                            "SMALL" -> TextSize.SMALL
                            "LARGE" -> TextSize.LARGE
                            "XLARGE" -> TextSize.XLARGE
                            else -> TextSize.NORMAL
                        }
                        printer.addText(processed, TextStyle(bold = bold, size = textSize, underline = underline))
                    } else {
                        printer.addText(processed)
                    }
                }
                "align" -> {
                    val alignmentStr = element.optString("alignment", "LEFT")
                    val alignment = when (alignmentStr) {
                        "CENTER" -> Alignment.CENTER
                        "RIGHT" -> Alignment.RIGHT
                        else -> Alignment.LEFT
                    }
                    printer.addTextAlign(alignment)
                }
                "feedLine" -> {
                    val lines = element.optInt("lines", 1)
                    printer.addFeedLine(lines)
                }
                "barcode" -> {
                    val data = element.optString("data", "")
                    val typeStr = element.optString("barcodeType", "CODE128")
                    val barcodeType = BarcodeType.valueOf(typeStr)
                    printer.addBarcode(data, barcodeType, null)
                }
                "qrcode" -> {
                    val data = element.optString("data", "")
                    val processed = processTemplateVariables(data, order)
                    val size = element.optInt("qrSize", 3)
                    printer.addQRCode(processed, QRCodeOptions(size = size))
                }
                "divider" -> {
                    val content = element.optString("content", "================================")
                    printer.addTextAlign(Alignment.CENTER)
                    printer.addText(content)
                }
                "dynamic" -> {
                    val field = element.optString("field", "")
                    val value = getDynamicValue(field, order)
                    printer.addText(value)
                }
                "items_list" -> {
                    if (order != null) {
                        val template = element.optString("itemTemplate", "")
                        val showSku = element.optBoolean("showSku", false)
                        val showCategory = element.optBoolean("showCategory", false)
                        val showModifiers = element.optBoolean("showModifiers", false)
                        val showUnitPrice = element.optBoolean("showUnitPrice", false)
                        printItems(printer, order, template, showSku, showCategory, showModifiers, showUnitPrice)
                    }
                }
                
                "cutPaper" -> {
                    printer.cutPaper()
                }
            }
        }
    } catch (e: Exception) {
        printer.addText("Error occurred", TextStyle(bold = true))
        printer.addFeedLine(1)
        printer.cutPaper()
    }
}

fun processTemplateVariables(content: String, order: Order?): String {
    var result = content
    if (order != null) {
        // Basic order fields
        result = result.replace("{{STORE_NAME}}", order.storeName)
        result = result.replace("{{STORE_NUMBER}}", order.storeNumber)
        result = result.replace("{{ORDER_ID}}", order.orderId)
        result = result.replace("{{TIMESTAMP}}", java.text.SimpleDateFormat("MM/dd/yyyy HH:mm").format(java.util.Date(order.timestamp)))
        result = result.replace("{{SUBTOTAL}}", String.format("$%.2f", order.subtotal))
        result = result.replace("{{TAX_RATE}}", String.format("%.1f%%", order.taxRate * 100))
        result = result.replace("{{TAX}}", String.format("$%.2f", order.taxAmount))
        result = result.replace("{{TOTAL}}", String.format("$%.2f", order.totalAmount))
        result = result.replace("{{PAYMENT_METHOD}}", order.paymentMethod ?: "Cash")
        
        // Customer info fields
        order.customerInfo?.let { customer ->
            result = result.replace("{{CUSTOMER_ID}}", customer.customerId)
            result = result.replace("{{CUSTOMER_NAME}}", customer.name)
            result = result.replace("{{MEMBER_STATUS}}", customer.memberStatus ?: "Regular")
            result = result.replace("{{LOYALTY_POINTS}}", customer.loyaltyPoints.toString())
            result = result.replace("{{MEMBER_SINCE}}", customer.memberSince ?: "N/A")
        }
        
        // Table info fields
        order.tableInfo?.let { table ->
            result = result.replace("{{TABLE_NUMBER}}", table.tableNumber)
            result = result.replace("{{SERVER_NAME}}", table.serverName)
            result = result.replace("{{GUEST_COUNT}}", table.guestCount.toString())
            result = result.replace("{{SERVICE_RATING}}", table.serviceRating?.toString() ?: "N/A")
        }
        
        // Item count
        result = result.replace("{{ITEM_COUNT}}", order.items.size.toString())
        result = result.replace("{{TOTAL_QUANTITY}}", order.items.sumOf { it.quantity }.toString())
    }
    return result
}

fun getDynamicValue(field: String, order: Order?): String {
    return when (field) {
        // Basic order fields
        "STORE_NAME" -> order?.storeName ?: "Store Name"
        "STORE_NUMBER" -> order?.storeNumber ?: "001"
        "ORDER_ID" -> order?.orderId ?: "ORD123456"
        "TIMESTAMP" -> order?.let { 
            java.text.SimpleDateFormat("MM/dd/yyyy HH:mm").format(java.util.Date(it.timestamp))
        } ?: java.text.SimpleDateFormat("MM/dd/yyyy HH:mm").format(java.util.Date())
        "SUBTOTAL" -> if (order != null) String.format("$%.2f", order.subtotal) else "$0.00"
        "TAX_RATE" -> if (order != null) String.format("%.1f%%", order.taxRate * 100) else "0.0%"
        "TAX" -> if (order != null) String.format("$%.2f", order.taxAmount) else "$0.00"
        "TOTAL" -> if (order != null) String.format("$%.2f", order.totalAmount) else "$0.00"
        "PAYMENT_METHOD" -> order?.paymentMethod ?: "Cash"
        "ITEM_COUNT" -> order?.items?.size?.toString() ?: "0"
        "TOTAL_QUANTITY" -> order?.items?.sumOf { it.quantity }?.toString() ?: "0"
        
        // Customer info fields
        "CUSTOMER_ID" -> order?.customerInfo?.customerId ?: "GUEST001"
        "CUSTOMER_NAME" -> order?.customerInfo?.name ?: "Guest"
        "MEMBER_STATUS" -> order?.customerInfo?.memberStatus ?: "Regular"
        "LOYALTY_POINTS" -> order?.customerInfo?.loyaltyPoints?.toString() ?: "0"
        "MEMBER_SINCE" -> order?.customerInfo?.memberSince ?: "N/A"
        
        // Table info fields
        "TABLE_NUMBER" -> order?.tableInfo?.tableNumber ?: "N/A"
        "SERVER_NAME" -> order?.tableInfo?.serverName ?: "Server"
        "GUEST_COUNT" -> order?.tableInfo?.guestCount?.toString() ?: "1"
        "SERVICE_RATING" -> order?.tableInfo?.serviceRating?.toString() ?: "N/A"
        
        // Default fallback
        "CASHIER_NAME" -> "Cashier"
        else -> field
    }
}

fun printItems(printer: EpsonPrinter, order: Order, template: String = "", showSku: Boolean = false, showCategory: Boolean = false, showModifiers: Boolean = false, showUnitPrice: Boolean = false) {
    for (item in order.items) {
        if (template.isNotEmpty()) {
            // Process the custom template with alignment directives
            var processedTemplate = template
            
            // Replace variables first
            processedTemplate = processedTemplate.replace("{{name}}", item.name)
            processedTemplate = processedTemplate.replace("{{quantity}}", item.quantity.toString())
            processedTemplate = processedTemplate.replace("{{unitPrice}}", String.format("%.2f", item.unitPrice))
            processedTemplate = processedTemplate.replace("{{totalPrice}}", String.format("%.2f", item.totalPrice))
            processedTemplate = processedTemplate.replace("{{sku}}", item.sku ?: "")
            processedTemplate = processedTemplate.replace("{{category}}", item.category ?: "")
            processedTemplate = processedTemplate.replace("{{modifiers}}", if (item.modifiers.isNotEmpty()) item.modifiers.joinToString(", ") else "")
            
            // Process alignment directives and print content
            processTemplateWithAlignment(printer, processedTemplate)
        } else {
            // Default fallback when no template is provided
            val line = if (item.quantity > 1) item.quantity.toString() + "x " + item.name else item.name
            printer.addText(line)
            printer.addTextAlign(Alignment.RIGHT)
            printer.addText(String.format("$%.2f", item.totalPrice))
            printer.addTextAlign(Alignment.LEFT)
        }
        
        // Show optional details based on configuration
        if (showSku && item.sku != null) {
            printer.addText("  SKU: " + item.sku, TextStyle(size = TextSize.SMALL))
        }
        
        if (showCategory && item.category != null) {
            printer.addText("  Category: " + item.category, TextStyle(size = TextSize.SMALL))
        }
        
        if (showModifiers && item.modifiers.isNotEmpty()) {
            for (modifier in item.modifiers) {
                printer.addText("  + " + modifier, TextStyle(size = TextSize.SMALL))
            }
        }
        
        if (showUnitPrice && item.quantity > 1) {
            printer.addTextAlign(Alignment.RIGHT)
            printer.addText(String.format("$%.2f ea", item.unitPrice), TextStyle(size = TextSize.SMALL))
            printer.addTextAlign(Alignment.LEFT)
        }
        
        printer.addFeedLine(1)
    }
    
    // Print promotions if any
    if (order.itemPromotions.isNotEmpty()) {
        printer.addFeedLine(1)
        printer.addText("ITEM DISCOUNTS:", TextStyle(bold = true))
        for (promo in order.itemPromotions) {
            printer.addText(promo.promotionName)
            printer.addTextAlign(Alignment.RIGHT)
            printer.addText("-" + String.format("$%.2f", promo.discountAmount))
            printer.addTextAlign(Alignment.LEFT)
        }
        printer.addFeedLine(1)
    }
    
    if (order.orderPromotions.isNotEmpty()) {
        printer.addText("ORDER DISCOUNTS:", TextStyle(bold = true))
        for (promo in order.orderPromotions) {
            val discountText = if (promo.promotionType == "PERCENTAGE") {
                promo.promotionName + " (" + String.format("%.1f%%", promo.discountAmount) + ")"
            } else {
                promo.promotionName
            }
            printer.addText(discountText)
            printer.addTextAlign(Alignment.RIGHT)
            printer.addText("-" + String.format("$%.2f", promo.discountAmount))
            printer.addTextAlign(Alignment.LEFT)
        }
        printer.addFeedLine(1)
    }
}

fun processTemplateWithAlignment(printer: EpsonPrinter, template: String) {
    if (template.isEmpty()) {
        // Fallback to default item display if no template provided
        return
    }
    
    // Handle alignment directives by processing line by line
    // Split on both actual newlines and escaped newlines
    val lines = template.split("\\n|\\\\n".toRegex())
    var currentAlignment = Alignment.LEFT // Default alignment
    
    for (line in lines) {
        var processedLine = line.trim()
        if (processedLine.isEmpty()) continue
        
        // Check for alignment and feedLine directives at the start of the line
        when {
            processedLine.startsWith("{{align:left}}") -> {
                currentAlignment = Alignment.LEFT
                processedLine = processedLine.removePrefix("{{align:left}}")
            }
            processedLine.startsWith("{{align:center}}") -> {
                currentAlignment = Alignment.CENTER
                processedLine = processedLine.removePrefix("{{align:center}}")
            }
            processedLine.startsWith("{{align:right}}") -> {
                currentAlignment = Alignment.RIGHT
                processedLine = processedLine.removePrefix("{{align:right}}")
            }
            processedLine.startsWith("{{feedLine:") -> {
                // Extract number of lines from {{feedLine:n}}
                val startIndex = processedLine.indexOf("{{feedLine:") + 11
                val endIndex = processedLine.indexOf("}}", startIndex)
                if (endIndex > startIndex) {
                    val numberStr = processedLine.substring(startIndex, endIndex)
                    val lines = numberStr.toIntOrNull() ?: 1
                    printer.addFeedLine(lines)
                    processedLine = processedLine.removePrefix("{{feedLine:" + numberStr + "}}")
                }
            }
            processedLine.startsWith("{{feedLine}}") -> {
                printer.addFeedLine(1)
                processedLine = processedLine.removePrefix("{{feedLine}}")
            }
        }
        
        // Set alignment and print the line content
        if (processedLine.isNotEmpty()) {
            printer.addTextAlign(currentAlignment)
            printer.addText(processedLine)
        }
    }
}

fun printContentLines(printer: EpsonPrinter, content: String) {
    // Handle newlines in content
    val lines = content.split("\\\\n".toRegex())
    for (line in lines) {
        if (line.isNotEmpty()) {
            printer.addText(line.trim())
        }
    }
}
`);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const handleSubmit = async () => {
    if (!teamName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a team name' });
      return;
    }
    
    if (!kotlinCode.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your Kotlin interpreter code' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await uploadInterpreter(teamName, kotlinCode);
      const returnedTeamId = response.teamId || response.team_id || teamName.toLowerCase().replace(/\s+/g, '_');
      const endpointUrl = `/api/submit/${returnedTeamId}`;
      setEndpoint(endpointUrl);
      setTeamId(returnedTeamId);
      setStatusMessage({ 
        type: 'success', 
        text: response.message || `Interpreter uploaded successfully! Your team ID: ${returnedTeamId}` 
      });
      
      // Notify parent component of successful submission
      if (onSubmissionSuccess) {
        onSubmissionSuccess(endpointUrl, returnedTeamId);
      }
    } catch (err) {
      // Extract detailed error information
      let errorText = 'Failed to submit interpreter';
      if (err instanceof Error) {
        errorText = err.message;
        
        // Check if the error contains compilation details
        if (err.message.includes('Compilation failed')) {
          // The error message already contains the details from the server
          errorText = err.message;
        }
      }
      
      setStatusMessage({ 
        type: 'error', 
        text: errorText
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!teamId) {
      setStatusMessage({ type: 'error', text: 'No team ID found. Please submit first.' });
      return;
    }

    if (!kotlinCode.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your Kotlin interpreter code' });
      return;
    }

    setIsUpdating(true);
    setStatusMessage(null);

    try {
      await updateInterpreter(teamId, kotlinCode, teamName);
      setStatusMessage({ 
        type: 'success', 
        text: 'Interpreter updated successfully!' 
      });
    } catch (err) {
      // Extract detailed error information
      let errorText = 'Failed to update interpreter';
      if (err instanceof Error) {
        errorText = err.message;
        
        // Check if the error contains compilation details
        if (err.message.includes('Compilation failed')) {
          // The error message already contains the details from the server
          errorText = err.message;
        }
      }
      
      setStatusMessage({ 
        type: 'error', 
        text: errorText
      });
    } finally {
      setIsUpdating(false);
    }
  };


  return (
    <div className="p-8 bg-gray-900">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-100">Kotlin Interpreter Submission</h2>
        
        {/* Team Info Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Team Name
            <span className="ml-2 text-xs text-gray-500 font-normal">
              (Make it unique - it will be used in your URL endpoint)
            </span>
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter your unique team name"
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              disabled={!!endpoint}
            />
            {!endpoint ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !teamName.trim() || !kotlinCode.trim()}
                className={`px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  isSubmitting || !teamName.trim() || !kotlinCode.trim()
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {isSubmitting ? 'Uploading...' : 'Submit Interpreter'}
              </button>
            ) : (
              <button
                onClick={handleUpdate}
                disabled={isUpdating || !kotlinCode.trim()}
                className={`px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  isUpdating || !kotlinCode.trim()
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700 active:bg-yellow-800'
                }`}
              >
                {isUpdating ? 'Updating...' : 'Update Interpreter'}
              </button>
            )}
          </div>
          {endpoint && (
            <div className="mt-2 p-3 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-300">
                <strong className="text-gray-100">Your Endpoint:</strong>{' '}
                <code className="text-green-400 bg-black px-2 py-1 rounded font-mono">{endpoint}</code>
              </p>
            </div>
          )}
        </div>

        {/* Kotlin Code Editor */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Kotlin Interpreter Code
              <span className="ml-2 text-xs text-gray-500">
                (Syntax highlighting • Auto-completion • IntelliSense)
              </span>
            </label>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Printer AI Button */}
              <button
                type="button"
                onClick={() => setShowCheatSheet(true)}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1 transition-colors"
              >
                <span className="text-base">🤖</span>
                Printer AI
              </button>
              
              {/* Keyboard Shortcuts Info Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Keyboard Shortcuts
                </button>
              
              {/* Shortcuts Bubble */}
              {showShortcuts && (
                <div className="absolute right-0 top-8 z-50 w-80 p-4 bg-gray-800 border border-gray-600 rounded-lg shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-200">Editor Shortcuts</h3>
                    <button
                      onClick={() => setShowShortcuts(false)}
                      className="text-gray-400 hover:text-gray-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <div className="text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Ctrl+Space</kbd>
                      </div>
                      <div className="text-gray-300">Trigger suggestions</div>
                      
                      <div className="text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Ctrl+F</kbd>
                      </div>
                      <div className="text-gray-300">Find</div>
                      
                      <div className="text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Ctrl+H</kbd>
                      </div>
                      <div className="text-gray-300">Replace</div>
                      
                      <div className="text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Ctrl+/</kbd>
                      </div>
                      <div className="text-gray-300">Toggle comment</div>
                      
                      <div className="text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Alt+Shift+F</kbd>
                      </div>
                      <div className="text-gray-300">Format code</div>
                      
                      <div className="text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">F1</kbd>
                      </div>
                      <div className="text-gray-300">Command palette</div>
                      
                      <div className="text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Ctrl+D</kbd>
                      </div>
                      <div className="text-gray-300">Select next match</div>
                      
                      <div className="text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Alt+Click</kbd>
                      </div>
                      <div className="text-gray-300">Multiple cursors</div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="font-semibold text-gray-300 mb-1">Quick Tips:</div>
                      <ul className="space-y-1 text-gray-400">
                        <li>• Type <code className="px-1 bg-gray-700 rounded">printer.</code> for all printer methods</li>
                        <li>• Type <code className="px-1 bg-gray-700 rounded">JSON</code> for JSON parsing helpers</li>
                        <li>• Type <code className="px-1 bg-gray-700 rounded">fun</code>, <code className="px-1 bg-gray-700 rounded">if</code>, <code className="px-1 bg-gray-700 rounded">when</code> for snippets</li>
                        <li>• Use Tab to accept suggestions</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
          
          <KotlinEditor
            value={kotlinCode}
            onChange={setKotlinCode}
            height="400px"
            readOnly={false}
          />
          
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            <span>💡 Press <kbd className="px-1 py-0.5 bg-gray-700 rounded">Ctrl+Space</kbd> for suggestions</span>
            <span>• Type "printer." for methods</span>
            <span>• Click info button above for more shortcuts</span>
          </div>
        </div>

        {/* Console Output Area - Always Visible */}
        <div className={`mb-6 rounded-lg border-2 ${
          statusMessage?.type === 'error' ? 'border-red-600 bg-red-950' :
          statusMessage?.type === 'success' ? 'border-green-600 bg-green-900' :
          'border-gray-600 bg-gray-900'
        }`}>
          <div className={`flex items-center gap-2 px-4 py-3 border-b ${
            statusMessage?.type === 'error' ? 'bg-red-900 border-red-700' :
            statusMessage?.type === 'success' ? 'bg-green-900 border-green-700' :
            'bg-gray-800 border-gray-700'
          }`}>
            {statusMessage?.type === 'error' ? (
              <>
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-red-200">Compilation Error</span>
              </>
            ) : statusMessage?.type === 'success' ? (
              <>
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-green-200">Success</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold text-gray-300">Console Output</span>
              </>
            )}
          </div>
          <div className="p-4">
            {statusMessage ? (
              statusMessage.type === 'error' ? (
                <>
                  {statusMessage.text.includes('\n') || statusMessage.text.includes('line') ? (
                    <div>
                      <pre className="whitespace-pre-wrap font-mono text-sm text-red-200 bg-black/30 p-3 rounded overflow-x-auto">
                        {statusMessage.text}
                      </pre>
                      {statusMessage.text.includes('lineNumber') && (
                        <p className="mt-3 text-xs text-red-300">
                          💡 Check the line number mentioned above in your code
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-red-200">{statusMessage.text}</p>
                  )}
                </>
              ) : (
                <p className={statusMessage.type === 'success' ? 'text-green-200' : 'text-blue-200'}>
                  {statusMessage.text}
                </p>
              )
            ) : (
              <div className="font-mono text-sm text-gray-500">
                <span className="animate-pulse">▌</span>
                <span className="ml-2 text-gray-600">Ready - Submit your interpreter to see compilation results</span>
              </div>
            )}
          </div>
        </div>


        {/* Info Section */}
        <div className="space-y-4">
          <div className="p-4 bg-gray-900 rounded-lg">
            <h4 className="font-semibold mb-2 text-gray-200">Current JSON DSL:</h4>
            <pre className="text-xs bg-black text-green-400 p-3 rounded overflow-x-auto max-h-40 font-mono">
              {jsonDsl || '// No JSON generated yet - design a receipt first!'}
            </pre>
          </div>
          
          <div className="p-4 bg-gray-700 border border-gray-600 rounded-lg">
            <p className="text-sm text-gray-400">
              <strong className="text-gray-300">Tips:</strong>
            </p>
            <ul className="text-sm text-gray-400 mt-1 list-disc list-inside">
              <li>Check <code className="px-1 py-0.5 bg-gray-900 text-green-400 rounded">kotlin-examples/</code> for templates</li>
              <li>Test locally with MockEpsonPrinter first</li>
              <li>Handle all element types in your JSON</li>
              <li>Always call printer.cutPaper() at the end</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Printer Cheat Sheet Modal */}
      <PrinterCheatSheet 
        isOpen={showCheatSheet}
        onClose={() => setShowCheatSheet(false)}
      />
    </div>
  );
};