import { ReceiptInterpreter } from './interfaces/receipt-interpreter';
import { ReceiptDSL } from './interfaces/receipt-models';
import { EpsonPrinter } from './interfaces/epson-printer';

export class DefaultReceiptInterpreter implements ReceiptInterpreter {
    interpret(printer: EpsonPrinter, dsl: ReceiptDSL): void {
        // TODO: Implement interpretation logic
        throw new Error("Not implemented");
    }
}
