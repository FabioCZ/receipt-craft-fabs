# Epson Printer API Reference

This document describes the Kotlin interface for the Epson printer that your interpreter will use.

## Required Function Signature

Your interpreter MUST use this exact signature:
```kotlin
fun interpret(jsonString: String, printer: EpsonPrinter, order: Order?)
```

## Pre-Imported Classes

The following imports are automatically available - you don't need to import them:
```kotlin
// JSON parsing
import org.json.JSONObject
import org.json.JSONArray

// Printer interfaces and classes
import com.example.compilation.compiler.*  // All printer classes
import com.example.compilation.models.*    // Order and related classes

// Kotlin utilities
import kotlin.math.*  // Math functions
```

## EpsonPrinter Interface

```kotlin
interface EpsonPrinter {
    fun addText(text: String, style: TextStyle? = null)
    fun addBarcode(data: String, type: BarcodeType, options: BarcodeOptions? = null)
    fun addQRCode(data: String, options: QRCodeOptions? = null)
    fun addImage(imageData: String, options: ImageOptions? = null)
    fun addFeedLine(lines: Int)
    fun cutPaper()
    fun addTextStyle(style: TextStyle)
    fun addTextAlign(alignment: Alignment)
    fun addTextFont(font: Font)
}
```

## Core Methods

### addText
Prints text with optional styling.

```kotlin
printer.addText("Hello World", TextStyle(bold = true, size = TextSize.LARGE))
```

### addBarcode
Generates and prints a barcode.

```kotlin
printer.addBarcode(
    data = "123456789",
    type = BarcodeType.CODE39,
    options = BarcodeOptions(height = 50, width = BarcodeWidth.MEDIUM)
)
```

### addQRCode
Generates and prints a QR code.

```kotlin
printer.addQRCode(
    data = "https://example.com",
    options = QRCodeOptions(size = 3, errorCorrection = QRErrorCorrection.MEDIUM)
)
```

### addImage
Prints an image from base64 encoded data.

```kotlin
printer.addImage(
    imageData = "base64_string_here",
    options = ImageOptions(width = 384, alignment = Alignment.CENTER)
)
```

### addFeedLine
Advances the paper by the specified number of lines.

```kotlin
printer.addFeedLine(2)  // Add 2 blank lines
```

### cutPaper
Cuts the paper. Always call this at the end of your receipt.

```kotlin
printer.cutPaper()
```

## Enumerations

### BarcodeType
```kotlin
enum class BarcodeType {
    UPC_A, UPC_E, EAN13, EAN8, 
    CODE39, ITF, CODABAR, CODE93, CODE128,
    GS1_128, GS1_DATABAR_OMNIDIRECTIONAL,
    GS1_DATABAR_TRUNCATED, GS1_DATABAR_LIMITED,
    GS1_DATABAR_EXPANDED
}
```

### TextSize
```kotlin
enum class TextSize {
    SMALL, NORMAL, LARGE, XLARGE
}
```

### Alignment
```kotlin
enum class Alignment {
    LEFT, CENTER, RIGHT
}
```

### Font
```kotlin
enum class Font {
    FONT_A, FONT_B, FONT_C
}
```

### BarcodeWidth
```kotlin
enum class BarcodeWidth {
    THIN, MEDIUM, THICK
}
```

### QRErrorCorrection
```kotlin
enum class QRErrorCorrection {
    LOW, MEDIUM, QUARTILE, HIGH
}
```

## Data Classes

### TextStyle
```kotlin
data class TextStyle(
    val bold: Boolean = false,
    val size: TextSize = TextSize.NORMAL,
    val underline: Boolean = false,
    val reverse: Boolean = false
)
```

### BarcodeOptions
```kotlin
data class BarcodeOptions(
    val width: BarcodeWidth = BarcodeWidth.MEDIUM,
    val height: Int = 50,
    val hri: Boolean = true  // Human Readable Interpretation
)
```

### QRCodeOptions
```kotlin
data class QRCodeOptions(
    val size: Int = 3,
    val errorCorrection: QRErrorCorrection = QRErrorCorrection.MEDIUM
)
```

### ImageOptions
```kotlin
data class ImageOptions(
    val width: Int = 384,
    val alignment: Alignment = Alignment.CENTER,
    val dithering: Boolean = true
)
```

## Usage Examples

### Example 1: Using JSON Design Data
```kotlin
fun interpret(jsonString: String, printer: EpsonPrinter, order: Order?) {
    // Parse your JSON design
    val json = JSONObject(jsonString)
    
    // Get elements array from your design
    val elements = json.getJSONArray("elements")
    
    for (i in 0 until elements.length()) {
        val element = elements.getJSONObject(i)
        val type = element.getString("type")
        
        when (type) {
            "text" -> {
                val content = element.getString("content")
                val bold = element.optBoolean("bold", false)
                val size = when(element.optString("size", "normal")) {
                    "small" -> TextSize.SMALL
                    "large" -> TextSize.LARGE
                    "xlarge" -> TextSize.XLARGE
                    else -> TextSize.NORMAL
                }
                printer.addText(content, TextStyle(bold = bold, size = size))
            }
            "barcode" -> {
                val data = element.getString("data")
                printer.addBarcode(data, BarcodeType.CODE128, null)
            }
            "qrcode" -> {
                val data = element.getString("data")
                printer.addQRCode(data, null)
            }
            "feed" -> {
                val lines = element.optInt("lines", 1)
                printer.addFeedLine(lines)
            }
        }
    }
    
    printer.cutPaper()
}
```

### Example 2: Using Order Data
```kotlin
fun interpret(jsonString: String, printer: EpsonPrinter, order: Order?) {
    if (order != null) {
        // Header
        printer.addTextAlign(Alignment.CENTER)
        printer.addText(order.storeName, TextStyle(bold = true, size = TextSize.XLARGE))
        printer.addText("Store #${order.storeNumber}")
        printer.addFeedLine(1)
        
        // Order info
        printer.addTextAlign(Alignment.LEFT)
        printer.addText("Order #${order.orderId}")
        val date = java.text.SimpleDateFormat("MM/dd/yyyy HH:mm").format(order.timestamp)
        printer.addText(date)
        printer.addFeedLine(1)
        
        // Items
        for (item in order.items) {
            val itemLine = "${item.quantity}x ${item.name}".padEnd(25) + 
                          "${"%.2f".format(item.totalPrice)}"
            printer.addText(itemLine)
        }
        
        printer.addFeedLine(1)
        printer.addText("─────────────────────────")
        
        // Totals
        printer.addText("Subtotal:".padEnd(20) + "${"%.2f".format(order.subtotal)}")
        printer.addText("Tax:".padEnd(20) + "${"%.2f".format(order.taxAmount)}")
        
        // Show discounts if any
        val totalDiscount = order.itemPromotions.sumOf { it.discountAmount } + 
                           order.orderPromotions.sumOf { it.discountAmount }
        if (totalDiscount > 0) {
            printer.addText("Discount:".padEnd(20) + "-${"%.2f".format(totalDiscount)}")
        }
        
        printer.addText("─────────────────────────")
        printer.addText("TOTAL:".padEnd(20) + "${"%.2f".format(order.totalAmount)}", 
                       TextStyle(bold = true, size = TextSize.LARGE))
        
        // Customer info if available
        order.customerInfo?.let { customer ->
            printer.addFeedLine(2)
            printer.addText("Member: ${customer.name}")
            printer.addText("Status: ${customer.memberStatus ?: "Regular"}")
            printer.addText("Points: ${customer.loyaltyPoints}")
        }
        
        // Payment method
        order.paymentMethod?.let {
            printer.addFeedLine(1)
            printer.addText("Paid with: $it")
        }
        
        // QR code for order tracking
        printer.addFeedLine(2)
        printer.addTextAlign(Alignment.CENTER)
        printer.addQRCode("https://store.com/order/${order.orderId}", null)
        printer.addText("Scan to track order")
        
        printer.addFeedLine(3)
        printer.cutPaper()
    } else {
        // Practice round - no order provided
        printer.addText("Practice Mode - No Order Data")
        printer.cutPaper()
    }
}
```

### Example 3: Combining JSON Design with Order Data
```kotlin
fun interpret(jsonString: String, printer: EpsonPrinter, order: Order?) {
    val json = JSONObject(jsonString)
    
    // Use design for layout/styling
    val headerStyle = json.optString("headerStyle", "modern")
    val showLogo = json.optBoolean("showLogo", true)
    
    // But use order data for content
    if (order != null) {
        // Apply design style to order data
        when (headerStyle) {
            "modern" -> {
                printer.addTextAlign(Alignment.CENTER)
                printer.addText("━━━━━━━━━━━━━━━━━━━━━")
                printer.addText(order.storeName, TextStyle(bold = true, size = TextSize.XLARGE))
                printer.addText("━━━━━━━━━━━━━━━━━━━━━")
            }
            "classic" -> {
                printer.addTextAlign(Alignment.CENTER)
                printer.addText("* * * * * * * * * * *")
                printer.addText(order.storeName, TextStyle(size = TextSize.LARGE))
                printer.addText("* * * * * * * * * * *")
            }
            else -> {
                printer.addText(order.storeName)
            }
        }
        
        // Rest of receipt using order data...
    }
    
    printer.cutPaper()
}
```

## Important Notes

1. **Default Values**: Most options have sensible defaults. You can pass `null` for options to use defaults.

2. **Text Encoding**: The printer supports UTF-8 text encoding.

3. **Image Format**: Images must be base64 encoded. The printer handles conversion internally.

4. **Paper Width**: Standard receipt paper is 384 pixels wide (58mm or 80mm paper).

5. **Error Handling**: The printer will throw exceptions for invalid operations. Always wrap in try-catch.

6. **Threading**: Printer operations are synchronous. Don't call from the UI thread in Android.