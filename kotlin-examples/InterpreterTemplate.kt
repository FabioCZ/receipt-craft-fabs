// Your team name: ___________

import kotlinx.serialization.json.*

/**
 * Main interpreter function that processes your JSON DSL and sends commands to the printer
 * 
 * @param jsonString The JSON string containing your receipt DSL
 * @param printer The Epson printer interface (will be real hardware during judging!)
 */
fun interpret(jsonString: String, printer: EpsonPrinter) {
    try {
        // Parse your JSON format
        val receipt = parseReceipt(jsonString)
        
        // Process each element in your receipt
        for (element in receipt.elements) {
            when (element.type) {
                "text" -> {
                    // Apply styles and print text
                    val text = element.content ?: ""
                    val style = TextStyle(
                        bold = element.style?.bold ?: false,
                        size = element.style?.size ?: TextSize.NORMAL
                    )
                    printer.addText(text, style)
                }
                "barcode" -> {
                    // Generate barcode
                    val data = element.data ?: ""
                    val type = BarcodeType.valueOf(element.barcodeType ?: "CODE39")
                    printer.addBarcode(data, type, null)
                }
                "qrcode" -> {
                    // Generate QR code
                    val data = element.data ?: ""
                    printer.addQRCode(data, QRCodeOptions())
                }
                "image" -> {
                    // Add image (base64 encoded)
                    val imageData = element.imageData ?: ""
                    printer.addImage(imageData, ImageOptions())
                }
                "divider" -> {
                    // Add a divider line
                    printer.addText("-".repeat(48), null)
                    printer.addFeedLine(1)
                }
                "feed" -> {
                    // Add blank lines
                    val lines = element.lines ?: 1
                    printer.addFeedLine(lines)
                }
                "dynamic" -> {
                    // Handle dynamic fields like {store_name}, {timestamp}, etc.
                    val field = element.field ?: ""
                    val value = resolveDynamicField(field)
                    printer.addText(value, null)
                }
                else -> {
                    // Unknown element type - skip or handle as needed
                    println("Warning: Unknown element type: ${element.type}")
                }
            }
        }
        
        // Cut the paper at the end
        printer.cutPaper()
        
    } catch (e: Exception) {
        // Error handling - print error message on receipt
        printer.addText("ERROR: ${e.message}", TextStyle(bold = true))
        printer.addFeedLine(2)
        printer.cutPaper()
    }
}

/**
 * Parse the JSON string into your receipt data structure
 * Implement your own parsing logic based on your JSON DSL format
 */
fun parseReceipt(json: String): Receipt {
    val jsonElement = Json.parseToJsonElement(json)
    val jsonObject = jsonElement.jsonObject
    
    val elements = mutableListOf<ReceiptElement>()
    
    // Example parsing - modify based on your DSL structure
    jsonObject["elements"]?.jsonArray?.forEach { elementJson ->
        val elementObj = elementJson.jsonObject
        elements.add(ReceiptElement(
            type = elementObj["type"]?.jsonPrimitive?.content ?: "",
            content = elementObj["content"]?.jsonPrimitive?.contentOrNull,
            data = elementObj["data"]?.jsonPrimitive?.contentOrNull,
            field = elementObj["field"]?.jsonPrimitive?.contentOrNull,
            lines = elementObj["lines"]?.jsonPrimitive?.intOrNull,
            imageData = elementObj["imageData"]?.jsonPrimitive?.contentOrNull,
            barcodeType = elementObj["barcodeType"]?.jsonPrimitive?.contentOrNull,
            style = elementObj["style"]?.let { styleJson ->
                val styleObj = styleJson.jsonObject
                ElementStyle(
                    bold = styleObj["bold"]?.jsonPrimitive?.booleanOrNull ?: false,
                    size = styleObj["size"]?.jsonPrimitive?.contentOrNull?.let { 
                        TextSize.valueOf(it) 
                    } ?: TextSize.NORMAL
                )
            }
        ))
    }
    
    return Receipt(elements = elements)
}

/**
 * Resolve dynamic field values
 * In a real implementation, these would come from the POS system
 */
fun resolveDynamicField(field: String): String {
    return when (field) {
        "{store_name}" -> "Byte Burgers"
        "{store_address}" -> "123 Tech Ave, Silicon Valley"
        "{cashier_name}" -> "Alice"
        "{timestamp}" -> "2024-01-15 14:30:00"
        "{order_number}" -> "ORD-001234"
        "{subtotal}" -> "$25.99"
        "{tax}" -> "$2.34"
        "{total}" -> "$28.33"
        "{item_list}" -> "1x Burger\n1x Fries\n1x Soda"
        else -> field // Return as-is if not recognized
    }
}

// Data classes for your receipt structure
data class Receipt(
    val elements: List<ReceiptElement>
)

data class ReceiptElement(
    val type: String,
    val content: String? = null,
    val data: String? = null,
    val field: String? = null,
    val lines: Int? = null,
    val imageData: String? = null,
    val barcodeType: String? = null,
    val style: ElementStyle? = null
)

data class ElementStyle(
    val bold: Boolean = false,
    val size: TextSize = TextSize.NORMAL
)