/**
 * Mock implementation of the Epson printer for local testing
 * This class simulates printer behavior by printing to console
 * The real printer will use the same interface during judging
 */
class MockEpsonPrinter : EpsonPrinter {
    private val buffer = mutableListOf<String>()
    private var currentLine = StringBuilder()
    
    override fun addText(text: String, style: TextStyle?) {
        val styledText = if (style != null) {
            val prefix = buildString {
                if (style.bold) append("[BOLD]")
                when (style.size) {
                    TextSize.SMALL -> append("[SMALL]")
                    TextSize.LARGE -> append("[LARGE]")
                    TextSize.XLARGE -> append("[XLARGE]")
                    else -> {}
                }
            }
            "$prefix $text"
        } else {
            text
        }
        
        println("[TEXT] $styledText")
        currentLine.append(text)
        
        // Check for newlines and flush
        if (text.contains("\n")) {
            flushCurrentLine()
        }
    }
    
    override fun addBarcode(data: String, type: BarcodeType, options: BarcodeOptions?) {
        flushCurrentLine()
        val height = options?.height ?: 50
        val width = options?.width ?: BarcodeWidth.MEDIUM
        println("[BARCODE] Type=$type, Data=$data, Height=$height, Width=$width")
        buffer.add("|||||| $data ||||||")
    }
    
    override fun addQRCode(data: String, options: QRCodeOptions?) {
        flushCurrentLine()
        val size = options?.size ?: 3
        val errorCorrection = options?.errorCorrection ?: QRErrorCorrection.MEDIUM
        println("[QRCODE] Data=$data, Size=$size, ErrorCorrection=$errorCorrection")
        buffer.add("[QR: $data]")
    }
    
    override fun addImage(imageData: String, options: ImageOptions?) {
        flushCurrentLine()
        val width = options?.width ?: 384
        val alignment = options?.alignment ?: Alignment.CENTER
        println("[IMAGE] Width=$width, Alignment=$alignment, DataLength=${imageData.length}")
        buffer.add("[IMAGE PLACEHOLDER]")
    }
    
    override fun addFeedLine(lines: Int) {
        flushCurrentLine()
        println("[FEED] Lines=$lines")
        repeat(lines) {
            buffer.add("")
        }
    }
    
    override fun cutPaper() {
        flushCurrentLine()
        println("[CUT] ✂️ Paper cut")
        buffer.add("=" + "=".repeat(46) + "=")
        printReceipt()
    }
    
    override fun addTextStyle(style: TextStyle) {
        // Apply text style for subsequent text
        println("[STYLE] Bold=${style.bold}, Size=${style.size}")
    }
    
    override fun addTextAlign(alignment: Alignment) {
        println("[ALIGN] $alignment")
    }
    
    override fun addTextFont(font: Font) {
        println("[FONT] $font")
    }
    
    private fun flushCurrentLine() {
        if (currentLine.isNotEmpty()) {
            buffer.add(currentLine.toString())
            currentLine.clear()
        }
    }
    
    private fun printReceipt() {
        println("\n" + "=".repeat(48))
        println("         RECEIPT PREVIEW")
        println("=".repeat(48))
        buffer.forEach { line ->
            println(line)
        }
        println("=".repeat(48))
        println("         END OF RECEIPT")
        println("=".repeat(48) + "\n")
        buffer.clear()
    }
    
    fun getBuffer(): List<String> = buffer.toList()
}

// Printer interface that matches the real Epson SDK
interface EpsonPrinter {
    fun addText(text: String, style: TextStyle? = null)
    fun addBarcode(data: String, type: BarcodeType, options: BarcodeOptions? = null)
    fun addQRCode(data: String, options: QRCodeOptions? = null)
    fun addImage(imageData: String, options: ImageOptions? = null)
    fun addFeedLine(lines: Int)
    fun cutPaper()
    fun addTextStyle(style: TextStyle)
    fun addTextAlign(alignment: Alignment)
    fun addTextFont(font: Font)
}

// Enums and data classes for printer options
enum class BarcodeType {
    UPC_A, UPC_E, EAN13, EAN8, CODE39, ITF, CODABAR, CODE93, CODE128, GS1_128, GS1_DATABAR_OMNIDIRECTIONAL, GS1_DATABAR_TRUNCATED, GS1_DATABAR_LIMITED, GS1_DATABAR_EXPANDED
}

enum class BarcodeWidth {
    THIN, MEDIUM, THICK
}

enum class TextSize {
    SMALL, NORMAL, LARGE, XLARGE
}

enum class Alignment {
    LEFT, CENTER, RIGHT
}

enum class Font {
    FONT_A, FONT_B, FONT_C
}

enum class QRErrorCorrection {
    LOW, MEDIUM, QUARTILE, HIGH
}

data class TextStyle(
    val bold: Boolean = false,
    val size: TextSize = TextSize.NORMAL,
    val underline: Boolean = false,
    val reverse: Boolean = false
)

data class BarcodeOptions(
    val width: BarcodeWidth = BarcodeWidth.MEDIUM,
    val height: Int = 50,
    val hri: Boolean = true  // Human Readable Interpretation
)

data class QRCodeOptions(
    val size: Int = 3,
    val errorCorrection: QRErrorCorrection = QRErrorCorrection.MEDIUM
)

data class ImageOptions(
    val width: Int = 384,
    val alignment: Alignment = Alignment.CENTER,
    val dithering: Boolean = true
)