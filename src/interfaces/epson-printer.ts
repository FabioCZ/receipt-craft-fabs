// Types and interfaces for the EpsonSDK-compatible receipt printer

export type TextAlignment = 'left' | 'center' | 'right';

export interface TextStyle {
  /** Enable/disable bold text */
  bold?: boolean;
  /** Enable/disable underline */
  underline?: boolean;
  /** Font family to use (defaults to monospace) */
  fontFamily?: string;

}

export interface BarcodeOptions {
  /** Width of the barcode in pixels */
  width?: number;
  /** Height of the barcode in pixels */
  height?: number;
  /** Human Readable Interpretation text position */
  hri?: 'none' | 'above' | 'below' | 'both';
}

export interface QRCodeOptions {
  /** Size of QR code in pixels */
  size?: number;
  /** Error correction level */
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
}

export interface ImageOptions {
  /** Width to scale image to in pixels */
  width?: number;
  /** Height to scale image to in pixels */
  height?: number;
  /** Image alignment on paper */
  alignment?: TextAlignment;
}

export enum BarcodeType {
  UPC_A = 'UPC_A',
  CODE39 = 'CODE39',
  CODE93 = 'CODE93',
  CODE128 = 'CODE128',
  QR = 'QR'
}

/**
 * IEpsonPrinter defines a standard interface for receipt printers compatible with the Epson ePOS/Android SDK.
 * Methods correspond to printer commands for formatting, printing text, barcodes, images, and controlling paper feed/cut.
 *
 * Implementations should follow the expected behavior of the Epson ePOS SDK, including parameter ranges and option handling.
 */
export interface EpsonPrinter {
  /**
   * Appends a line of text to the print buffer.
   * @param text The text string to print.
   * @param options Optional text styling (bold, underline, font, color).
   */
  addText(text: string, options?: TextStyle): void;

  /**
   * Sets the text alignment for subsequent text (left, center, right).
   * @param alignment Text alignment mode.
   */
  addTextAlign(alignment: TextAlignment): void;

  /**
   * Sets the text size for subsequent text output.
   * @param width Text width multiplier (typically 1-8).
   * @param height Text height multiplier (typically 1-8).
   */
  addTextSize(width: number, height: number): void;

  /**
   * Sets the text style (bold, underline, font, color) for subsequent text.
   * @param style TextStyle options.
   */
  addTextStyle(style: TextStyle): void;

  /**
   * Feeds the paper by the specified number of lines.
   * @param lines Number of lines to feed.
   */
  addFeedLine(lines: number): void;

  /**
   * Sets the line spacing (in pixels or printer units) for subsequent lines.
   * @param space Line spacing value.
   */
  addLineSpace(space: number): void;

  /**
   * Appends a barcode to the print buffer.
   * @param data The data string to encode in the barcode.
   * @param type The barcode symbology/type.
   * @param options Optional barcode settings (width, height, HRI position).
   */
  addBarcode(data: string, type: BarcodeType, options?: BarcodeOptions): void;

  /**
   * Appends a QR code to the print buffer.
   * @param data The data string to encode in the QR code.
   * @param options Optional QR code settings (size, error correction).
   */
  addQRCode(data: string, options?: QRCodeOptions): void;

  /**
   * Appends an image to the print buffer.
   * @param imageData The image data to print.
   * @param options Optional image settings (width, height, alignment).
   */
  addImage(imageData: ImageData, options?: ImageOptions): void;

  /**
   * Cuts the paper at the current position.
   */
  cutPaper(): void;
}
