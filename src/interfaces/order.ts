// Order interface matching Kotlin Order data class exactly
export interface Order {
  // Basic fields (Round 1+)
  orderId: string           // "A-0042"
  storeNumber: string       // "001"
  storeName: string         // "BYTE BURGERS"
  timestamp: number         // Unix timestamp
  
  // Items array
  items: OrderItem[]        // Array of items
  
  // Totals (pre-calculated)
  subtotal: number          // 27.95
  taxRate: number           // 0.08
  taxAmount: number         // 2.24
  totalAmount: number       // 30.19
  
  // Promotions (Round 2+)
  itemPromotions?: ItemPromotion[]
  orderPromotions?: OrderPromotion[]
  
  // Customer (Round 3+)
  customerInfo?: CustomerInfo
  paymentMethod?: string    // "VISA ****1234"
  
  // Split Payment (Round 5+)
  splitPayments?: SplitPayment[]
  tableInfo?: TableInfo
}

export interface OrderItem {
  name: string              // "Cheeseburger"
  quantity: number          // 2
  unitPrice: number         // 8.99
  totalPrice: number        // 17.98
  sku?: string              // "BURG-001"
  category?: string         // "BURGERS"
  modifiers?: string[]      // ["Medium Rare", "Extra Cheese"]
}

export interface ItemPromotion {
  itemSku: string           // "COFF-002"
  promotionName: string     // "Buy One Get One 50% Off"
  discountAmount: number    // 3.00
}

export interface OrderPromotion {
  promotionName: string     // "Morning Rush Special"
  discountAmount: number    // 2.00
  promotionType: string     // "PERCENTAGE" or "FIXED"
}

export interface CustomerInfo {
  customerId: string        // "CUST-8826"
  name: string              // "John Doe"
  memberStatus?: string     // "GOLD", "PLATINUM", etc.
  loyaltyPoints?: number    // 1247
  memberSince?: string      // "2019-03-15"
}

export interface SplitPayment {
  payerName: string         // "Alice Chen"
  amount: number            // 156.43
  method: string            // "VISA ****7823"
  tip?: number              // 25.00
  items?: string[]          // ["Wagyu Steak", "Truffle Fries"]
}

export interface TableInfo {
  tableNumber: string       // "12"
  serverName: string        // "Jennifer K."
  guestCount: number        // 3
  serviceRating?: number    // 5
}