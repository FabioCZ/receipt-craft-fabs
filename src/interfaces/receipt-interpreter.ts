import { ReceiptDSL } from './receipt-models';
import { EpsonPrinter } from './epson-printer';

export interface ReceiptInterpreter {
    interpret(printer: EpsonPrinter, dsl: ReceiptDSL): void;
}
