import {
  EpsonPrinter,
  TextStyle,
  TextSize,
  Alignment,
  BarcodeType,
  BarcodeOptions,
  BarcodeWidth,
  QRCodeOptions,
  QRErrorCorrection
} from './interfaces/epson-printer-exact';

/**
 * HTML5 Canvas implementation of EpsonPrinter
 * Exact match to Kotlin interface
 */
export class HTMLCanvasEpsonPrinter implements EpsonPrinter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentY = 0;
  private currentAlignment: Alignment = Alignment.LEFT;
  private currentStyle: TextStyle = {
    bold: false,
    underline: false,
    size: TextSize.NORMAL
  };
  private lineSpacing = 20;
  private readonly baseFont = 'monospace';
  private readonly baseFontSize = 12;  // Smaller font for 80-char width
  private readonly paperWidth: number;
  private readonly charactersPerLine = 80;  // Real printer constraint

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.paperWidth = canvas.width;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    
    // Initialize
    this.clear();
  }

  /**
   * Clears the canvas and resets printer state
   */
  public clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.currentY = 0;
    this.currentAlignment = Alignment.LEFT;
    this.currentStyle = {
      bold: false,
      underline: false,
      size: TextSize.NORMAL
    };
    this.lineSpacing = 5;  // Tighter line spacing for receipt printer
    
    // Fill with white background
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw subtle 80-character boundary guides
    this.ctx.strokeStyle = '#f0f0f0';
    this.ctx.lineWidth = 0.5;
    const charWidth = 6; // Approximate character width at normal size
    const boundaryX = charWidth * 80;
    if (boundaryX < this.canvas.width) {
      this.ctx.beginPath();
      this.ctx.moveTo(boundaryX, 0);
      this.ctx.lineTo(boundaryX, this.canvas.height);
      this.ctx.stroke();
    }
    
    this.ctx.fillStyle = 'black';
    this.updateFont();
    this.ctx.textBaseline = 'top';
  }

  private updateFont(): void {
    const sizeMultiplier = this.getTextSizeMultiplier();
    const fontSize = this.baseFontSize * sizeMultiplier;
    const fontWeight = this.currentStyle.bold ? 'bold' : 'normal';
    this.ctx.font = `${fontWeight} ${fontSize}px ${this.baseFont}`;
  }

  private getTextSizeMultiplier(): number {
    switch (this.currentStyle.size) {
      case TextSize.SMALL: return 0.75;
      case TextSize.NORMAL: return 1.0;
      case TextSize.LARGE: return 1.25;
      case TextSize.XLARGE: return 1.5;
      default: return 1.0;
    }
  }

  private ensureCanvasHeight(requiredHeight: number): void {
    if (requiredHeight > this.canvas.height) {
      const newCanvas = document.createElement('canvas');
      newCanvas.width = this.canvas.width;
      newCanvas.height = Math.max(this.canvas.height * 2, requiredHeight + 500);
      const newCtx = newCanvas.getContext('2d');
      if (!newCtx) throw new Error('Could not get canvas context');
      
      // Copy existing content
      newCtx.drawImage(this.canvas, 0, 0);
      this.canvas.height = newCanvas.height;
      this.ctx.drawImage(newCanvas, 0, 0);
      
      // Restore context state
      this.ctx.fillStyle = 'black';
      this.ctx.textBaseline = 'top';
      this.updateFont();
    }
  }

  addText(text: string, style?: TextStyle | null): void {
    // If style is provided, apply it temporarily
    const previousStyle = this.currentStyle;
    if (style) {
      this.currentStyle = { ...this.currentStyle, ...style };
      this.updateFont();
    }

    const fontSize = this.baseFontSize * this.getTextSizeMultiplier();
    
    // Calculate effective characters per line based on text size
    // Real printer reduces character count for larger text
    let effectiveCharsPerLine = this.charactersPerLine; // 80 for NORMAL
    switch (this.currentStyle.size) {
      case TextSize.SMALL:
        effectiveCharsPerLine = 100; // More characters fit with small text
        break;
      case TextSize.NORMAL:
        effectiveCharsPerLine = 80; // Standard 80 columns
        break;
      case TextSize.LARGE:
        effectiveCharsPerLine = 53; // ~2/3 of normal (80 * 0.66)
        break;
      case TextSize.XLARGE:
        effectiveCharsPerLine = 40; // Half of normal (80 * 0.5)
        break;
    }
    
    const effectiveMaxChars = effectiveCharsPerLine;
    
    // Split text by newlines first
    const paragraphs = text.split('\n');
    const lines: string[] = [];
    
    for (const paragraph of paragraphs) {
      if (paragraph.length <= effectiveMaxChars) {
        lines.push(paragraph);
      } else {
        // Hard wrap long lines at character boundary
        let remainingText = paragraph;
        while (remainingText.length > 0) {
          lines.push(remainingText.substring(0, effectiveMaxChars));
          remainingText = remainingText.substring(effectiveMaxChars);
        }
      }
    }

    const lineHeight = fontSize + this.lineSpacing;
    const totalHeight = this.currentY + lines.length * lineHeight;
    this.ensureCanvasHeight(totalHeight);

    // Draw each line
    lines.forEach((line, idx) => {
      let x = 10; // Default left margin
      const y = this.currentY + idx * lineHeight;

      // Apply alignment
      switch (this.currentAlignment) {
        case Alignment.CENTER:
          x = this.paperWidth / 2;
          this.ctx.textAlign = 'center';
          break;
        case Alignment.RIGHT:
          x = this.paperWidth - 10;
          this.ctx.textAlign = 'right';
          break;
        default:
          this.ctx.textAlign = 'left';
      }

      this.ctx.fillText(line, x, y);

      // Underline if needed
      if (this.currentStyle.underline) {
        const metrics = this.ctx.measureText(line);
        let underlineStart = x;
        let underlineEnd = x;

        switch (this.currentAlignment) {
          case Alignment.CENTER:
            underlineStart = x - metrics.width / 2;
            underlineEnd = x + metrics.width / 2;
            break;
          case Alignment.RIGHT:
            underlineStart = x - metrics.width;
            underlineEnd = x;
            break;
          default:
            underlineEnd = x + metrics.width;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(underlineStart, y + fontSize + 2);
        this.ctx.lineTo(underlineEnd, y + fontSize + 2);
        this.ctx.stroke();
      }
    });

    this.currentY = totalHeight;

    // Restore previous style if it was temporarily changed
    if (style) {
      this.currentStyle = previousStyle;
      this.updateFont();
    }
  }

  addTextStyle(style: TextStyle): void {
    this.currentStyle = { ...this.currentStyle, ...style };
    this.updateFont();
  }

  addTextAlign(alignment: Alignment): void {
    this.currentAlignment = alignment;
  }

  addBarcode(data: string, type: BarcodeType, options?: BarcodeOptions | null): void {
    const height = options?.height || 50;
    const widthMultiplier = options?.width === BarcodeWidth.THIN ? 1 : 
                           options?.width === BarcodeWidth.THICK ? 3 : 2;
    
    this.ensureCanvasHeight(this.currentY + height + 40);
    
    this.ctx.save();
    this.ctx.strokeStyle = 'black';
    
    // Draw barcode placeholder
    const barcodeWidth = this.paperWidth - 40;
    const x = 20;
    
    // Simulate barcode bars
    this.ctx.fillStyle = 'black';
    let barX = x;
    for (let i = 0; i < 30; i++) {
      const barWidth = (Math.random() * 3 + 1) * widthMultiplier;
      if (i % 2 === 0) {
        this.ctx.fillRect(barX, this.currentY, barWidth, height);
      }
      barX += barWidth + widthMultiplier;
      if (barX > x + barcodeWidth) break;
    }
    
    // Add HRI (Human Readable Interpretation) if enabled
    if (options?.hri !== false) {
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`[${type}: ${data}]`, this.paperWidth / 2, this.currentY + height + 5);
    }
    
    this.ctx.restore();
    this.updateFont(); // Restore font
    this.currentY += height + 30;
  }

  addQRCode(data: string, options?: QRCodeOptions | null): void {
    const size = (options?.size || 3) * 50; // Size multiplier (3 = 150px)
    this.ensureCanvasHeight(this.currentY + size + 20);
    
    this.ctx.save();
    
    // Center the QR code
    const x = (this.paperWidth - size) / 2;
    
    // Draw QR code placeholder
    this.ctx.fillStyle = 'black';
    
    // Draw QR code pattern (simplified)
    const moduleSize = size / 25; // QR codes are typically 25x25 modules minimum
    
    for (let row = 0; row < 25; row++) {
      for (let col = 0; col < 25; col++) {
        // Create a pseudo-random pattern
        if ((row + col) % 2 === 0 || (row * col) % 3 === 0) {
          this.ctx.fillRect(
            x + col * moduleSize,
            this.currentY + row * moduleSize,
            moduleSize,
            moduleSize
          );
        }
      }
    }
    
    // Draw position markers (corners)
    this.ctx.fillRect(x, this.currentY, moduleSize * 7, moduleSize * 7);
    this.ctx.fillRect(x + size - moduleSize * 7, this.currentY, moduleSize * 7, moduleSize * 7);
    this.ctx.fillRect(x, this.currentY + size - moduleSize * 7, moduleSize * 7, moduleSize * 7);
    
    // Add white centers
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(x + moduleSize * 2, this.currentY + moduleSize * 2, moduleSize * 3, moduleSize * 3);
    this.ctx.fillRect(x + size - moduleSize * 5, this.currentY + moduleSize * 2, moduleSize * 3, moduleSize * 3);
    this.ctx.fillRect(x + moduleSize * 2, this.currentY + size - moduleSize * 5, moduleSize * 3, moduleSize * 3);
    
    // Add label
    this.ctx.fillStyle = 'black';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`[QR: ${data.substring(0, 20)}${data.length > 20 ? '...' : ''}]`, 
                     this.paperWidth / 2, this.currentY + size + 10);
    
    this.ctx.restore();
    this.updateFont(); // Restore font
    this.currentY += size + 20;
  }

  addFeedLine(lines: number): void {
    const lineHeight = this.baseFontSize * this.getTextSizeMultiplier();
    this.currentY += lines * (lineHeight + this.lineSpacing);
    this.ensureCanvasHeight(this.currentY);
  }

  cutPaper(): void {
    this.ctx.save();
    this.ctx.setLineDash([10, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.currentY);
    this.ctx.lineTo(this.paperWidth, this.currentY);
    this.ctx.strokeStyle = '#666';
    this.ctx.stroke();
    this.ctx.restore();
    this.currentY += 20;
    this.ensureCanvasHeight(this.currentY);
  }
}