# Implementation Instructions for Receipt Hackathon Kotlin Edition

This document contains detailed implementation instructions for creating two repositories:
1. **receipt-hackathon-kotlin** - Modified fork of the original receipt-hackathon
2. **receipt-printer-server** - New Android/Ktor server for running Kotlin interpreters

## Repository 1: receipt-hackathon-kotlin
(Modified fork of the original receipt-hackathon)

### Purpose
A web-based receipt designer where participants build a drag-drop interface in JavaScript/TypeScript AND write a Kotlin interpreter to process the JSON DSL on a real printer.

### Key Modifications Needed

#### 1. README.md - Complete Rewrite
```markdown
# 🧾 Receipt Designer Challenge: Full-Stack Edition

Build a visual receipt designer that compiles to JSON, then write a Kotlin interpreter to print it on real hardware!

## The Challenge
1. **Frontend (JS/TS)**: Build a drag-drop receipt designer that outputs JSON
2. **Backend (Kotlin)**: Write an interpreter that processes your JSON format
3. **Final Test**: Your Kotlin code runs on a real Epson receipt printer!

## Getting Started
- Frontend development: npm install && npm run dev
- Kotlin development: See kotlin-examples/ folder
- Test locally with mock printer, submit for real printing

## Submission Process
1. Design your JSON DSL format
2. Build the visual designer
3. Write Kotlin interpreter
4. Upload interpreter through the UI
5. Test with real printer during judging
```

#### 2. New Directory Structure
```
receipt-hackathon-kotlin/
├── src/                          (existing Next.js app)
├── kotlin-examples/
│   ├── README.md
│   ├── MockEpsonPrinter.kt      (mock for local testing)
│   ├── InterpreterTemplate.kt   (starter code)
│   ├── TestRunner.kts           (script to test locally)
│   ├── sample-receipts/
│   │   ├── simple.json
│   │   ├── complex.json
│   │   └── edge-cases.json
│   └── build.gradle.kts         (if using Gradle)
├── docs/
│   ├── json-dsl-spec.md        (JSON format guidelines)
│   ├── epson-api-reference.md  (Kotlin printer interface)
│   └── judging-criteria.md
└── package.json
```

#### 3. Frontend Modifications

**src/components/ReceiptDesigner.tsx** (NEW):
```typescript
// Drag-drop interface for receipt elements
// Element palette: Text, Barcode, QR, Image, Divider, Dynamic Field
// Properties panel for selected elements
// JSON preview panel
// "Compile to JSON" button
```

**src/components/KotlinSubmission.tsx** (NEW):
```typescript
// Large code textarea for Kotlin interpreter
// "Upload Interpreter" button
// Server endpoint URL display
// "Test Print" button (disabled until interpreter uploaded)
// Switch between "Canvas Preview" and "Server Print" modes
```

**src/app/page.tsx** (MODIFY):
```typescript
// Split screen: Designer on left, Kotlin code on right
// Tab interface: Design | Preview | Submit
// Status indicators for interpreter upload
```

#### 4. Kotlin Template Files

**kotlin-examples/InterpreterTemplate.kt**:
```kotlin
// Your team name: ___________

fun interpret(jsonString: String, printer: EpsonPrinter) {
    // Parse your JSON format
    val receipt = parseReceipt(jsonString)
    
    // Process each element
    for (element in receipt.elements) {
        when (element.type) {
            "text" -> {
                // Apply styles and print text
            }
            "barcode" -> {
                // Generate barcode
            }
            // ... handle other types
        }
    }
    
    printer.cutPaper()
}

// Helper function (implement your parsing logic)
fun parseReceipt(json: String): Receipt {
    // Your JSON parsing implementation
}
```

**kotlin-examples/MockEpsonPrinter.kt**:
```kotlin
class MockEpsonPrinter : EpsonPrinter {
    override fun addText(text: String, style: TextStyle?) {
        println("[TEXT] $text ${style?.let { "(bold=${it.bold}, size=${it.size})" } ?: ""}")
    }
    
    override fun addBarcode(data: String, type: BarcodeType, options: BarcodeOptions?) {
        println("[BARCODE] Type=$type, Data=$data")
    }
    
    // ... other methods that print to console
}
```

#### 5. API Integration
```typescript
// src/lib/api.ts
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

export async function uploadInterpreter(teamName: string, code: string) {
    const response = await fetch(`${SERVER_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, interpreterCode: code })
    });
    return response.json(); // { endpoint: "/print/team-xyz" }
}

export async function testPrint(endpoint: string, json: object) {
    const response = await fetch(`${SERVER_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json)
    });
    return response.json();
}
```

---

## Repository 2: receipt-printer-server
(New Android/Ktor server)

### Purpose
Android-based server that accepts Kotlin interpreter code, evaluates it, and runs it against a real Epson printer.

### Directory Structure
```
receipt-printer-server/
├── src/main/kotlin/
│   ├── Application.kt           (main Ktor setup)
│   ├── Server.kt               (route definitions)
│   ├── InterpreterManager.kt   (script evaluation)
│   ├── PrinterManager.kt       (Epson SDK wrapper)
│   ├── QueueManager.kt         (job queue)
│   ├── models/
│   │   ├── Submission.kt
│   │   ├── PrintJob.kt
│   │   └── TeamEndpoint.kt
│   └── printer/
│       ├── EpsonPrinter.kt     (interface matching JS version)
│       └── EpsonSDKPrinter.kt  (real implementation)
├── src/main/resources/
│   └── application.conf        (Ktor config)
├── build.gradle.kts
├── README.md
└── docker/                     (optional containerization)
```

### Implementation Details

#### 1. Application.kt
```kotlin
fun main() {
    embeddedServer(Netty, port = 8080) {
        install(ContentNegotiation) { json() }
        install(CORS) {
            anyHost() // for hackathon only
        }
        install(StatusPages) {
            exception<Exception> { call, cause ->
                call.respond(HttpStatusCode.InternalServerError, mapOf("error" to cause.message))
            }
        }
        routing {
            setupRoutes()
        }
    }.start(wait = true)
}
```

#### 2. Server.kt - Route Definitions
```kotlin
fun Routing.setupRoutes() {
    val interpreterManager = InterpreterManager()
    val queueManager = QueueManager(maxConcurrent = 3)
    val printerManager = PrinterManager()
    
    // Submit interpreter
    post("/submit") {
        val submission = call.receive<Submission>()
        val teamId = interpreterManager.store(submission.teamName, submission.interpreterCode)
        call.respond(mapOf(
            "endpoint" to "/print/$teamId",
            "status" to "ready"
        ))
    }
    
    // Print using team's interpreter
    post("/print/{teamId}") {
        val teamId = call.parameters["teamId"] ?: throw BadRequestException("Missing teamId")
        val json = call.receive<JsonElement>()
        
        if (!queueManager.tryAcquire()) {
            call.respond(HttpStatusCode.TooManyRequests, mapOf("error" to "Server busy, try again"))
            return@post
        }
        
        try {
            val interpreter = interpreterManager.load(teamId)
            val printer = if (printerManager.isRealPrintEnabled(teamId)) {
                printerManager.getRealPrinter()
            } else {
                printerManager.getMockPrinter()
            }
            
            interpreter.execute(json.toString(), printer)
            call.respond(mapOf("success" to true))
        } finally {
            queueManager.release()
        }
    }
    
    // Admin endpoint to enable real printing
    post("/admin/enable-printer/{teamId}") {
        val teamId = call.parameters["teamId"]!!
        printerManager.enableRealPrint(teamId)
        call.respond(mapOf("status" to "Real printer enabled for $teamId"))
    }
    
    // Update interpreter (before submission freeze)
    put("/submit/{teamId}") {
        val teamId = call.parameters["teamId"]!!
        val update = call.receive<InterpreterUpdate>()
        interpreterManager.update(teamId, update.interpreterCode)
        call.respond(mapOf("status" to "updated"))
    }
}
```

#### 3. InterpreterManager.kt
```kotlin
class InterpreterManager {
    private val interpreters = mutableMapOf<String, String>()
    private val scriptEngine = ScriptEngineManager().getEngineByExtension("kts")
    
    fun store(teamName: String, code: String): String {
        val teamId = teamName.lowercase().replace(" ", "-")
        interpreters[teamId] = wrapInterpreterCode(code)
        return teamId
    }
    
    fun load(teamId: String): InterpreterScript {
        val code = interpreters[teamId] ?: throw NotFoundException("No interpreter for $teamId")
        return InterpreterScript(scriptEngine, code)
    }
    
    private fun wrapInterpreterCode(code: String): String {
        // Wrap user code with imports and error handling
        return """
            import com.example.printer.*
            import kotlinx.serialization.json.*
            
            $code
            
            // Entry point for execution
            fun execute(jsonString: String, printer: EpsonPrinter) {
                try {
                    interpret(jsonString, printer)
                } catch (e: Exception) {
                    printer.addText("ERROR: ${'$'}{e.message}")
                    printer.cutPaper()
                }
            }
        """.trimIndent()
    }
}

class InterpreterScript(private val engine: ScriptEngine, private val code: String) {
    fun execute(json: String, printer: EpsonPrinter) {
        engine.eval(code)
        val bindings = engine.createBindings()
        bindings["jsonInput"] = json
        bindings["printer"] = printer
        engine.eval("execute(jsonInput as String, printer as EpsonPrinter)", bindings)
    }
}
```

#### 4. PrinterManager.kt
```kotlin
class PrinterManager {
    private val realPrinterEnabled = mutableSetOf<String>()
    private lateinit var epsonPrinter: Printer // Real Epson SDK
    
    init {
        // Initialize Epson printer connection
        initializePrinter()
    }
    
    fun getRealPrinter(): EpsonPrinter = EpsonSDKPrinter(epsonPrinter)
    fun getMockPrinter(): EpsonPrinter = LoggingPrinter()
    
    fun isRealPrintEnabled(teamId: String) = teamId in realPrinterEnabled
    fun enableRealPrint(teamId: String) { realPrinterEnabled.add(teamId) }
    
    private fun initializePrinter() {
        // Epson SDK initialization
        epsonPrinter = Printer(/* ... */)
        epsonPrinter.connect(/* ... */)
    }
}

// Wrapper around real Epson SDK
class EpsonSDKPrinter(private val printer: Printer) : EpsonPrinter {
    override fun addText(text: String, style: TextStyle?) {
        style?.let {
            if (it.bold) printer.addTextStyle(Printer.PARAM_DEFAULT, /* ... */)
            // Apply other styles
        }
        printer.addText(text)
    }
    // ... implement other methods
}
```

#### 5. QueueManager.kt
```kotlin
import java.util.concurrent.Semaphore

class QueueManager(private val maxConcurrent: Int = 3) {
    private val semaphore = Semaphore(maxConcurrent)
    
    fun tryAcquire(): Boolean = semaphore.tryAcquire()
    
    fun release() = semaphore.release()
    
    fun availableSlots() = semaphore.availablePermits()
}
```

#### 6. Models
```kotlin
// models/Submission.kt
@Serializable
data class Submission(
    val teamName: String,
    val interpreterCode: String
)

// models/InterpreterUpdate.kt
@Serializable
data class InterpreterUpdate(
    val interpreterCode: String
)

// models/PrintJob.kt
@Serializable
data class PrintJob(
    val teamId: String,
    val json: JsonElement,
    val timestamp: Long = System.currentTimeMillis()
)
```

#### 7. README.md for Server
```markdown
# Receipt Printer Server

Android-based server for the Receipt Designer Hackathon. Accepts Kotlin interpreter submissions and executes them against a real Epson receipt printer.

## Setup
1. Connect Epson printer via USB to Android device
2. Install app: ./gradlew installDebug
3. Start server: adb shell am start -n com.example.receipt.server/.MainActivity
4. Server runs on port 8080

## Endpoints
- POST /submit - Upload interpreter code
- POST /print/{teamId} - Execute interpreter with JSON
- PUT /submit/{teamId} - Update interpreter (before freeze)
- POST /admin/enable-printer/{teamId} - Enable real printing for judging

## Development Mode
By default, all print commands go to mock printer (logs only).
Real printer is only activated during judging phase.

## Queue Management
- Max 3 concurrent interpreter executions
- 429 response when queue is full
- Automatic cleanup after execution
```

#### 8. build.gradle.kts
```kotlin
plugins {
    id("com.android.application")
    kotlin("android")
    kotlin("plugin.serialization") version "1.9.20"
}

android {
    namespace = "com.example.receipt.server"
    compileSdk = 34
    
    defaultConfig {
        applicationId = "com.example.receipt.server"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }
}

dependencies {
    implementation("io.ktor:ktor-server-netty:2.3.5")
    implementation("io.ktor:ktor-server-content-negotiation:2.3.5")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.5")
    implementation("io.ktor:ktor-server-cors:2.3.5")
    implementation("io.ktor:ktor-server-status-pages:2.3.5")
    implementation("org.jetbrains.kotlin:kotlin-scripting-jsr223:1.9.20")
    implementation("com.epson.epos2:epos2:2.25.0") // Epson SDK
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
    implementation("ch.qos.logback:logback-classic:1.4.11")
}
```

### Key Features for Hackathon Success

1. **Offline Development**: Teams can work entirely offline with mocks
2. **Simple Submission**: One-click interpreter upload
3. **Queue Management**: Prevents server overload
4. **Judging Mode**: You control when real printing happens
5. **Error Handling**: Graceful failures with error messages
6. **Live Testing**: Teams see immediate feedback during development

### Testing Flow

1. **Local Development Phase**
   - Teams build UI with canvas printer
   - Write Kotlin interpreter using mock printer
   - Test JSON generation and interpretation locally

2. **Submission Phase**
   - Teams upload interpreter through UI
   - Receive unique endpoint
   - Can update interpreter until freeze

3. **Judging Phase**
   - You enable real printer for each team
   - Run standardized test cases
   - Teams can demo their custom features

This setup gives you complete control during judging while letting teams work independently during development.