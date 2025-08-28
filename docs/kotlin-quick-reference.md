# Kotlin Interpreter Quick Reference

## Required Function Signature ⚠️
```kotlin
fun interpret(jsonString: String, printer: EpsonPrinter, order: Order?)
```

## Available Imports (Already included - DON'T import again!)
```kotlin
org.json.JSONObject         // For parsing JSON
org.json.JSONArray          // For JSON arrays
All printer classes         // TextStyle, Alignment, etc.
All order classes          // Order, OrderItem, CustomerInfo, etc.
kotlin.math.*              // Math functions
```

## JSON Parsing Basics
```kotlin
// Parse JSON string
val json = JSONObject(jsonString)

// Get values with defaults
val text = json.optString("text", "default")
val number = json.optInt("count", 0)
val flag = json.optBoolean("bold", false)

// Get arrays
val items = json.getJSONArray("items")
for (i in 0 until items.length()) {
    val item = items.getJSONObject(i)
    val name = item.getString("name")
}

// Check if key exists
if (json.has("specialField")) {
    // do something
}
```

## Common Printer Operations
```kotlin
// Text with style
printer.addText("Hello", TextStyle(bold = true, size = TextSize.LARGE))

// Alignment
printer.addTextAlign(Alignment.CENTER)  // LEFT, CENTER, RIGHT

// Barcode
printer.addBarcode("123456", BarcodeType.CODE128, null)

// QR Code
printer.addQRCode("https://example.com", null)

// Feed lines
printer.addFeedLine(2)  // Add 2 blank lines

// Cut paper (always do this at the end!)
printer.cutPaper()
```

## Using Order Data
```kotlin
if (order != null) {
    // Access order fields
    printer.addText(order.storeName)
    printer.addText("Order #${order.orderId}")
    
    // Loop through items
    for (item in order.items) {
        printer.addText("${item.name} - $${item.unitPrice}")
    }
    
    // Format currency
    val total = "%.2f".format(order.totalAmount)
    printer.addText("Total: $$total")
    
    // Check for customer
    order.customerInfo?.let { customer ->
        printer.addText("Member: ${customer.name}")
    }
} else {
    // Practice round - no order
    printer.addText("Practice Mode")
}
```

## Text Formatting
```kotlin
// Padding strings
val padded = "Item".padEnd(20) + "$9.99"  // "Item                $9.99"

// String formatting
val price = "%.2f".format(9.9)  // "9.90"
val percent = "%.0f%%".format(15.0)  // "15%"

// Multi-line strings
val header = """
    ═══════════════
    STORE NAME
    ═══════════════
""".trimIndent()
```

## TextSize Options
- `TextSize.SMALL`
- `TextSize.NORMAL`
- `TextSize.LARGE`
- `TextSize.XLARGE`

## BarcodeType Options
- `BarcodeType.CODE128` (most common)
- `BarcodeType.CODE39`
- `BarcodeType.EAN13`
- `BarcodeType.UPC_A`
- And more...

## Common Patterns

### Header
```kotlin
printer.addTextAlign(Alignment.CENTER)
printer.addText(order.storeName, TextStyle(bold = true, size = TextSize.LARGE))
printer.addFeedLine(1)
```

### Item Line
```kotlin
val line = "${item.quantity}x ${item.name}".padEnd(25) + "%.2f".format(item.totalPrice)
printer.addText(line)
```

### Divider
```kotlin
printer.addText("─────────────────────────")
// Or use equals: ═══════════════════════
```

### Footer with QR
```kotlin
printer.addFeedLine(2)
printer.addTextAlign(Alignment.CENTER)
printer.addQRCode("https://yoursite.com/order/${order.orderId}", null)
printer.addText("Scan for details", TextStyle(size = TextSize.SMALL))
printer.addFeedLine(3)
printer.cutPaper()
```

## Debugging Tips
1. Check if order is null before using it
2. Use optString/optInt instead of getString/getInt to avoid crashes
3. Always call cutPaper() at the end
4. Test with Round 0 (practice) first
5. Format currency with "%.2f".format()
6. Remember the header is added automatically (team name + round)

## Round Differences
- **Round 0**: order is null, use JSON only
- **Round 1**: Basic order with items
- **Round 2**: Includes promotions/discounts
- **Round 3**: Has customer info
- **Round 4**: Everything combined
- **Round 5**: Special celebration order