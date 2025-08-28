# Order Object Structure

## Overview
During the hackathon, your Kotlin interpreter will receive an `Order` object as a third parameter. This object contains real order data that you should use to generate dynamic receipts.

## Function Signature
Your interpreter must use this signature:
```kotlin
fun interpret(jsonString: String, printer: EpsonPrinter, order: Order?)
```

## Order Class Structure

### Main Order Object
```kotlin
data class Order(
    val orderId: String,           // Unique order identifier
    val storeNumber: String,        // Store location number
    val storeName: String,          // Store name to display
    val timestamp: Long,            // Order timestamp (milliseconds)
    val items: List<OrderItem>,    // List of items in the order
    val subtotal: Double,          // Subtotal before tax
    val taxRate: Double,           // Tax rate (e.g., 0.08 for 8%)
    val taxAmount: Double,         // Calculated tax amount
    val totalAmount: Double,       // Final total after tax and discounts
    val itemPromotions: List<ItemPromotion>,  // Item-level discounts
    val orderPromotions: List<OrderPromotion>, // Order-level discounts
    val customerInfo: CustomerInfo?,          // Customer details (if available)
    val paymentMethod: String?               // Payment method used
)
```

### OrderItem
```kotlin
data class OrderItem(
    val name: String,          // Item name
    val quantity: Int,         // Quantity ordered
    val unitPrice: Double,     // Price per unit
    val totalPrice: Double,    // Total price for this item
    val sku: String?,          // Stock keeping unit (optional)
    val category: String?      // Item category (optional)
)
```

### ItemPromotion
```kotlin
data class ItemPromotion(
    val itemSku: String,        // SKU of the discounted item
    val promotionName: String,  // Name of the promotion
    val discountAmount: Double  // Discount amount
)
```

### OrderPromotion
```kotlin
data class OrderPromotion(
    val promotionName: String,   // Name of the promotion
    val discountAmount: Double,  // Discount amount
    val promotionType: String    // "PERCENTAGE" or "FIXED"
)
```

### CustomerInfo
```kotlin
data class CustomerInfo(
    val customerId: String,      // Unique customer ID
    val name: String,            // Customer name
    val memberStatus: String?,   // Membership level (e.g., "GOLD", "PLATINUM")
    val loyaltyPoints: Int,      // Current loyalty points
    val memberSince: String?     // Member since date
)
```

## Round-Based Order Data

Different rounds will have different Order complexity:

### Round 0: Practice (No Order)
- `order` will be `null`
- Focus on your JSON design rendering

### Round 1: Basic Order
- Simple order with items and totals
- No promotions or customer info
- Example: Basic restaurant order

### Round 2: Order with Promotions
- Includes item and order level discounts
- Calculate savings and show promotions
- Example: Coffee shop with "Buy One Get One" deals

### Round 3: Order with Customer
- Includes customer information
- Show loyalty points and member status
- Example: Pizza order with loyalty member

### Round 4: Complex Order
- All features combined
- Multiple promotions, customer info, various payment methods
- Example: Tech store with complex discounts

### Round 5: Final Challenge
- Special themed order
- Large quantities for team celebration
- All features at maximum complexity

## Example Usage

```kotlin
fun interpret(jsonString: String, printer: EpsonPrinter, order: Order?) {
    // Check if order exists (not practice round)
    if (order != null) {
        // Print store header
        printer.addTextAlign(Alignment.CENTER)
        printer.addText(order.storeName, TextStyle(bold = true, size = TextSize.LARGE))
        printer.addText("Store #${order.storeNumber}")
        printer.addFeedLine(1)
        
        // Print order details
        printer.addTextAlign(Alignment.LEFT)
        printer.addText("Order: ${order.orderId}")
        printer.addFeedLine(1)
        
        // Print items
        for (item in order.items) {
            val itemLine = "${item.name} (${item.quantity})".padEnd(20) + 
                          "$${String.format("%.2f", item.totalPrice)}"
            printer.addText(itemLine)
        }
        
        // Print totals
        printer.addFeedLine(1)
        printer.addText("Subtotal: $${String.format("%.2f", order.subtotal)}")
        printer.addText("Tax: $${String.format("%.2f", order.taxAmount)}")
        printer.addText("Total: $${String.format("%.2f", order.totalAmount)}", 
                       TextStyle(bold = true))
        
        // Print customer info if available
        order.customerInfo?.let { customer ->
            printer.addFeedLine(1)
            printer.addText("Member: ${customer.name}")
            printer.addText("Points: ${customer.loyaltyPoints}")
        }
        
        printer.addFeedLine(3)
        printer.cutPaper()
    } else {
        // Practice round - use your JSON design only
        // Parse jsonString and render receipt
    }
}
```

## Important Notes

1. **Null Checking**: Always check if `order` is null (practice rounds)
2. **Number Formatting**: Use proper formatting for currency values
3. **Optional Fields**: Many fields are nullable - check before using
4. **Calculations**: You can calculate additional values (like savings from promotions)
5. **Round Header**: The system automatically adds team name and round number - you don't need to add this

## Tips for Success

- **Round 1-2**: Focus on clean item layout and proper totals
- **Round 3**: Highlight customer benefits and loyalty status
- **Round 4**: Show all discounts clearly with original vs final prices
- **Round 5**: Be creative with the celebration theme!

Remember: The Order object provides real data - use it to create dynamic, data-driven receipts rather than hardcoded values!