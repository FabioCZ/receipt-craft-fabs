# JSON DSL Specification

This document defines the JSON format for receipt designs that your Kotlin interpreter must process.

## Basic Structure

```json
{
  "elements": [
    // Array of receipt elements
  ]
}
```

## Element Types

### 1. Text Element
Prints plain text with optional styling.

```json
{
  "type": "text",
  "content": "Hello World",
  "style": {
    "bold": true,
    "size": "LARGE"  // SMALL, NORMAL, LARGE, XLARGE
  }
}
```

### 2. Barcode Element
Generates and prints a barcode.

```json
{
  "type": "barcode",
  "data": "123456789",
  "barcodeType": "CODE39"  // CODE39, CODE128, EAN13, UPC_A, etc.
}
```

### 3. QR Code Element
Generates and prints a QR code.

```json
{
  "type": "qrcode",
  "data": "https://example.com"
}
```

### 4. Image Element
Prints an image (base64 encoded).

```json
{
  "type": "image",
  "imageData": "base64_encoded_image_data"
}
```

### 5. Divider Element
Prints a horizontal line separator.

```json
{
  "type": "divider"
}
```

### 6. Dynamic Field Element
Inserts dynamic data from the POS system.

```json
{
  "type": "dynamic",
  "field": "{store_name}"
}
```

Available fields:
- `{store_name}` - Store name
- `{store_address}` - Store address
- `{cashier_name}` - Cashier name
- `{timestamp}` - Current date/time
- `{order_number}` - Order number
- `{subtotal}` - Subtotal amount
- `{tax}` - Tax amount
- `{total}` - Total amount
- `{item_list}` - List of purchased items

### 7. Feed Element
Adds blank lines (paper feed).

```json
{
  "type": "feed",
  "lines": 2
}
```

## Complete Example

```json
{
  "elements": [
    {
      "type": "text",
      "content": "BYTE BURGERS",
      "style": {
        "bold": true,
        "size": "XLARGE"
      }
    },
    {
      "type": "text",
      "content": "123 Main Street"
    },
    {
      "type": "divider"
    },
    {
      "type": "dynamic",
      "field": "{timestamp}"
    },
    {
      "type": "feed",
      "lines": 1
    },
    {
      "type": "text",
      "content": "Order #: "
    },
    {
      "type": "dynamic",
      "field": "{order_number}"
    },
    {
      "type": "feed",
      "lines": 2
    },
    {
      "type": "dynamic",
      "field": "{item_list}"
    },
    {
      "type": "divider"
    },
    {
      "type": "text",
      "content": "Total: ",
      "style": {
        "bold": true
      }
    },
    {
      "type": "dynamic",
      "field": "{total}"
    },
    {
      "type": "feed",
      "lines": 2
    },
    {
      "type": "barcode",
      "data": "ORD123456",
      "barcodeType": "CODE128"
    },
    {
      "type": "feed",
      "lines": 1
    },
    {
      "type": "qrcode",
      "data": "https://byteburgers.com/order/123456"
    },
    {
      "type": "feed",
      "lines": 2
    },
    {
      "type": "text",
      "content": "Thank you for your visit!",
      "style": {
        "size": "SMALL"
      }
    }
  ]
}
```

## Implementation Notes

1. **Element Order**: Elements are processed sequentially in the order they appear in the array.

2. **Error Handling**: If an element type is unknown or data is invalid, your interpreter should:
   - Log a warning
   - Skip the element
   - Continue processing remaining elements

3. **Paper Cut**: Your interpreter must always call `printer.cutPaper()` at the end of processing.

4. **Null/Missing Values**: Handle gracefully:
   - Missing `content` in text elements → print empty string
   - Missing `lines` in feed elements → default to 1
   - Missing `style` → use default styling

5. **Dynamic Fields**: If a dynamic field is unknown, print it as-is (e.g., `{unknown_field}`).