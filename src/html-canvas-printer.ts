import type { EpsonPrinter } from './interfaces/epson-printer';
import { TextAlignment, BarcodeType, TextStyle, BarcodeOptions, QRCodeOptions, ImageOptions } from './interfaces/epson-printer';

/**
 * HTML5 Canvas implementation of EpsonPrinter
 */

export class HTMLCanvasEpsonPrinter implements EpsonPrinter {
  /**
   * Clears the canvas and resets printer state to initial.
   */
  public clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.currentY = 0;
    this.currentTextAlign = 'left';
    this.currentTextStyle = {};
    this.currentTextSize = { width: 1, height: 1 };
    this.lineSpacing = 30;
    // Optionally, fill with white to mimic paper
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'black';
    this.ctx.font = `${this.baseFontSize}px ${this.baseFont}`;
    this.ctx.textBaseline = 'top';
  }

  // Alignment constants
  readonly ALIGN_LEFT = 0;
  readonly ALIGN_CENTER = 1;
  readonly ALIGN_RIGHT = 2;

  // Font constants
  readonly FONT_A = 0;
  readonly FONT_B = 1;

  // Barcode type constants
  readonly BARCODE_UPC_A = 65;
  readonly BARCODE_CODE39 = 69;
  readonly BARCODE_CODE93 = 72;
  readonly BARCODE_CODE128 = 73;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public currentY = 0;
  private currentTextAlign: TextAlignment = 'left';
  private currentTextStyle: TextStyle = {};
  private currentTextSize = { width: 1, height: 1 };
  private lineSpacing = 30; // Default line spacing in pixels
  private readonly baseFont = 'monospace';
  private readonly baseFontSize = 16; // Base font size for 80-column width
  private readonly paperWidth: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.paperWidth = canvas.width;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    // Set default styles
    this.ctx.font = `${this.baseFontSize}px ${this.baseFont}`;
    this.ctx.fillStyle = 'black';
    this.ctx.textBaseline = 'top';
  }

  private ensureCanvasHeight(requiredHeight: number): void {
    if (requiredHeight > this.canvas.height) {
      const newCanvas = document.createElement('canvas');
      newCanvas.width = this.canvas.width;
      newCanvas.height = Math.max(this.canvas.height * 2, requiredHeight + 500);
      const newCtx = newCanvas.getContext('2d');
      if (!newCtx) throw new Error('Could not get canvas context');
      newCtx.drawImage(this.canvas, 0, 0);
      this.canvas.height = newCanvas.height;
      this.ctx.drawImage(newCanvas, 0, 0);
      this.ctx.font = `${this.baseFontSize * this.currentTextSize.height}px ${this.baseFont}`;
      this.ctx.fillStyle = 'black';
      this.ctx.textBaseline = 'top';
    }
  }

  addText(text: string, options?: TextStyle): void {
    const style = { ...this.currentTextStyle, ...options };
    const fontSize = this.baseFontSize * this.currentTextSize.height;
    this.ctx.font = `${style.bold ? 'bold' : ''} ${fontSize}px ${style.fontFamily || this.baseFont}`;
    this.ctx.fillStyle = 'black';
    const words = text.split(' ');
    let currentLine = words[0];
    const lines: string[] = [];
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = this.ctx.measureText(currentLine + ' ' + word).width;
      if (width < this.paperWidth - 20) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    const lineHeight = fontSize + this.lineSpacing;
    const totalHeight = this.currentY + lines.length * lineHeight;
    this.ensureCanvasHeight(totalHeight);
    lines.forEach((line, idx) => {
      let x = 0;
      let y = this.currentY + idx * lineHeight;
      // Set canvas text alignment and x position
      switch (this.currentTextAlign) {
        case 'center':
          this.ctx.textAlign = 'center';
          x = this.paperWidth / 2;
          break;
        case 'right':
          this.ctx.textAlign = 'right';
          x = this.paperWidth - 10;
          break;
        default:
          this.ctx.textAlign = 'left';
          x = 10;
      }
      this.ctx.fillText(line, x, y);
      if (style.underline) {
        const metrics = this.ctx.measureText(line);
        let underlineStart = x;
        let underlineEnd = x;
        switch (this.currentTextAlign) {
          case 'center':
            underlineStart = x - metrics.width / 2;
            underlineEnd = x + metrics.width / 2;
            break;
          case 'right':
            underlineStart = x - metrics.width;
            underlineEnd = x;
            break;
          default:
            underlineStart = x;
            underlineEnd = x + metrics.width;
        }
        this.ctx.beginPath();
        this.ctx.moveTo(underlineStart, y + fontSize + 2);
        this.ctx.lineTo(underlineEnd, y + fontSize + 2);
        this.ctx.stroke();
      }
    });
    this.currentY = totalHeight;
  }

  addTextAlign(alignment: TextAlignment): void {
    this.currentTextAlign = alignment;
  }

  addTextSize(width: number, height: number): void {
    this.currentTextSize = {
      width: Math.max(1, Math.min(8, width)),
      height: Math.max(1, Math.min(8, height))
    };
  }

  addTextStyle(style: TextStyle): void {
    this.currentTextStyle = { ...this.currentTextStyle, ...style };
  }

  addFeedLine(lines: number): void {
    const lineHeight = this.baseFontSize * this.currentTextSize.height;
    this.currentY += lines * (lineHeight + this.lineSpacing);
    this.ensureCanvasHeight(this.currentY);
  }

  addLineSpace(space: number): void {
    this.lineSpacing = space;
  }

  addBarcode(data: string, type: BarcodeType, options?: BarcodeOptions): void {
    const barcodeHeight = options?.height || 100;
    this.ensureCanvasHeight(this.currentY + barcodeHeight + 20);
    this.ctx.save();
    this.ctx.strokeStyle = 'black';
    this.ctx.strokeRect(10, this.currentY, this.paperWidth - 20, barcodeHeight);
    this.ctx.font = '12px monospace';
    this.ctx.fillStyle = 'black';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`[${type} Barcode: ${data}]`, this.paperWidth / 2, this.currentY + barcodeHeight / 2);
    this.ctx.restore();
    this.currentY += barcodeHeight + 20;
  }

  addQRCode(data: string, options?: QRCodeOptions): void {
    const size = options?.size || 200;
    this.ensureCanvasHeight(this.currentY + size + 20);
    this.ctx.save();
    this.ctx.strokeStyle = 'black';
    this.ctx.strokeRect(
      (this.paperWidth - size) / 2,
      this.currentY,
      size,
      size
    );
    this.ctx.font = '12px monospace';
    this.ctx.fillStyle = 'black';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('[QR Code]', this.paperWidth / 2, this.currentY + size / 2);
    this.ctx.restore();
    this.currentY += size + 20;
  }

  addImage(imageData: ImageData, options?: ImageOptions): void {
    const width = options?.width || imageData.width;
    const height = options?.height || (imageData.height * (width / imageData.width));
    this.ensureCanvasHeight(this.currentY + height + 20);
    let x = 0;
    switch (options?.alignment || 'left') {
      case 'center':
        x = (this.paperWidth - width) / 2;
        break;
      case 'right':
        x = this.paperWidth - width;
        break;
    }
    const imgCanvas = document.createElement('canvas');
    imgCanvas.width = imageData.width;
    imgCanvas.height = imageData.height;
    const imgCtx = imgCanvas.getContext('2d');
    if (!imgCtx) throw new Error('Could not get image canvas context');
    imgCtx.putImageData(imageData, 0, 0);
    this.ctx.drawImage(imgCanvas, x, this.currentY, width, height);
    this.currentY += height + 20;
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


