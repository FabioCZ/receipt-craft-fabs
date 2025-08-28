import { LayoutModel, ReceiptDSL } from './receipt-models';

export interface ReceiptCompiler {
    compile(layout: LayoutModel): ReceiptDSL;
}
