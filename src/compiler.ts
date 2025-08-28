import { ReceiptCompiler } from './interfaces/receipt-compiler';
import { LayoutModel, ReceiptDSL } from './interfaces/receipt-models';

export class DefaultReceiptCompiler implements ReceiptCompiler {
    compile(layout: LayoutModel): ReceiptDSL {
        // TODO: Implement compilation logic
        throw new Error("Not implemented");
    }
}
