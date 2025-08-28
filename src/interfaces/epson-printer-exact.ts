/**
 * Exact mirror of the Kotlin EpsonPrinter interface
 * Must match kotlin-compilation-server/src/main/kotlin/com/example/compilation/compiler/PrinterInterface.kt
 */

// Enums matching Kotlin exactly
export enum TextSize {
  SMALL = 'SMALL',
  NORMAL = 'NORMAL',
  LARGE = 'LARGE',
  XLARGE = 'XLARGE'
}

export enum Alignment {
  LEFT = 'LEFT',
  CENTER = 'CENTER',
  RIGHT = 'RIGHT'
}

export enum QRErrorCorrection {
  L = 'L',
  M = 'M',
  Q = 'Q',
  H = 'H'
}

export enum BarcodeType {
  UPC_A = 'UPC_A',
  UPC_E = 'UPC_E',
  EAN13 = 'EAN13',
  EAN8 = 'EAN8',
  CODE39 = 'CODE39',
  ITF = 'ITF',
  CODABAR = 'CODABAR',
  CODE93 = 'CODE93',
  CODE128 = 'CODE128',
  GS1_128 = 'GS1_128',
  GS1_DATABAR_OMNIDIRECTIONAL = 'GS1_DATABAR_OMNIDIRECTIONAL',
  GS1_DATABAR_TRUNCATED = 'GS1_DATABAR_TRUNCATED',
  GS1_DATABAR_LIMITED = 'GS1_DATABAR_LIMITED',
  GS1_DATABAR_EXPANDED = 'GS1_DATABAR_EXPANDED'
}

export enum BarcodeWidth {
  THIN = 'THIN',
  MEDIUM = 'MEDIUM',
  THICK = 'THICK'
}

// Data classes matching Kotlin
export interface TextStyle {
  bold?: boolean;
  underline?: boolean;
  size?: TextSize;
}

export interface QRCodeOptions {
  size?: number; // default: 3
  errorCorrection?: QRErrorCorrection; // default: M
}

export interface BarcodeOptions {
  width?: BarcodeWidth; // default: MEDIUM
  height?: number; // default: 50
  hri?: boolean; // Human Readable Interpretation - default: true
}

// Main printer interface - exact match to Kotlin
export interface EpsonPrinter {
  addText(text: string): void;
  addText(text: string, style?: TextStyle | null): void;
  addTextStyle(style: TextStyle): void;
  addTextAlign(alignment: Alignment): void;
  addBarcode(data: string, type: BarcodeType, options?: BarcodeOptions | null): void;
  addQRCode(data: string, options?: QRCodeOptions | null): void;
  addFeedLine(lines: number): void;
  cutPaper(): void;
}

// Order models matching Kotlin exactly
export interface Order {
  orderId: string;
  storeNumber: string;
  storeName: string;
  timestamp: number;
  items: OrderItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  itemPromotions?: ItemPromotion[];
  orderPromotions?: OrderPromotion[];
  customerInfo?: CustomerInfo | null;
  paymentMethod?: string | null;
  splitPayments?: SplitPayment[];
  tableInfo?: TableInfo | null;
}

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku?: string | null;
  category?: string | null;
  modifiers?: string[];
}

export interface ItemPromotion {
  itemSku: string;
  promotionName: string;
  discountAmount: number;
}

export interface OrderPromotion {
  promotionName: string;
  discountAmount: number;
  promotionType: string; // "PERCENTAGE" or "FIXED"
}

export interface CustomerInfo {
  customerId: string;
  name: string;
  memberStatus?: string | null;
  loyaltyPoints?: number;
  memberSince?: string | null;
}

export interface SplitPayment {
  payerName: string;
  amount: number;
  method: string;
  tip?: number;
  items?: string[];
}

export interface TableInfo {
  tableNumber: string;
  serverName: string;
  guestCount: number;
  serviceRating?: number | null;
}

// Printer command for serialization
export interface PrinterCommand {
  type: string;
  text?: string | null;
  alignment?: string | null;
  bold?: boolean | null;
  size?: string | null;
  underline?: boolean | null;
  data?: string | null;
  qrSize?: number | null;
  lines?: number | null;
}