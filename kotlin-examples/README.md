# Kotlin Examples for Receipt Hackathon

This directory contains everything you need to develop and test your Kotlin interpreter locally before submitting it to the server.

## Files Included

### Core Files
- **`InterpreterTemplate.kt`** - Your starting template. Modify this to implement your interpreter logic.
- **`MockEpsonPrinter.kt`** - Mock printer implementation for local testing. Outputs to console.
- **`TestRunner.kts`** - Script to test your interpreter with sample receipts.

### Sample Receipts
- **`sample-receipts/simple.json`** - Basic receipt with common elements
- **`sample-receipts/complex.json`** - Advanced receipt with QR codes and styling
- **`sample-receipts/edge-cases.json`** - Edge cases to test error handling

## Quick Start

### 1. Install Kotlin (if not already installed)
```bash
# macOS
brew install kotlin

# Ubuntu/Debian
sudo snap install kotlin --classic

# Or download from https://kotlinlang.org/
```

### 2. Test Your Interpreter Locally
```bash
cd kotlin-examples
kotlin TestRunner.kts
```

This will:
- Load your interpreter implementation
- Run it against all sample receipts
- Show console output simulating printer behavior

### 3. Develop Your Solution

1. **Design your JSON DSL format** in the frontend designer
2. **Modify `InterpreterTemplate.kt`** to parse your specific format
3. **Test locally** with the mock printer
4. **Upload your code** through the web interface when ready

## Interpreter Requirements

Your interpreter must:
1. Accept a JSON string and an `EpsonPrinter` instance
2. Parse the JSON into your receipt format
3. Call appropriate printer methods to render the receipt
4. Handle errors gracefully (print error message, don't crash)
5. Always call `printer.cutPaper()` at the end

## Available Printer Methods

```kotlin
// Text printing
printer.addText(text: String, style: TextStyle?)
printer.addTextAlign(alignment: Alignment)
printer.addTextFont(font: Font)

// Barcodes and QR codes
printer.addBarcode(data: String, type: BarcodeType, options: BarcodeOptions?)
printer.addQRCode(data: String, options: QRCodeOptions?)

// Images (base64 encoded)
printer.addImage(imageData: String, options: ImageOptions?)

// Paper control
printer.addFeedLine(lines: Int)
printer.cutPaper()
```

## Testing Tips

1. **Start simple** - Get basic text printing working first
2. **Test edge cases** - Empty strings, null values, unknown fields
3. **Use the mock printer** - It shows exactly what commands are sent
4. **Check the console output** - Look for [TEXT], [BARCODE], [CUT] markers
5. **Validate your JSON** - Make sure it's valid before testing

## Dynamic Fields

Your interpreter should support these dynamic fields:
- `{store_name}` - Store name
- `{store_address}` - Store address
- `{cashier_name}` - Cashier name
- `{timestamp}` - Current date/time
- `{order_number}` - Order number
- `{subtotal}` - Subtotal amount
- `{tax}` - Tax amount
- `{total}` - Total amount
- `{item_list}` - List of items

During testing, these are replaced with mock values. In production, they'll come from the POS system.

## Submission

When you're ready:
1. Copy your entire interpreter code (including helper functions)
2. Paste it into the Kotlin submission box in the web UI
3. Click "Upload Interpreter"
4. Test with the "Test Print" button
5. Your code will run on real hardware during judging!

## Need Help?

- Check the sample receipts for JSON structure examples
- Review the mock printer output to understand command flow
- The `InterpreterTemplate.kt` has a working baseline implementation
- Test with `TestRunner.kts` to validate your changes

Good luck! 🚀