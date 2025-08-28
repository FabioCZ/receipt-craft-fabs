#!/usr/bin/env kotlin

/**
 * Test runner script for local development
 * Run with: kotlin TestRunner.kts
 */

import java.io.File

// Include the printer and interpreter files
@file:Import("MockEpsonPrinter.kt")
@file:Import("InterpreterTemplate.kt")

fun main() {
    println("Receipt Interpreter Test Runner")
    println("================================\n")
    
    val printer = MockEpsonPrinter()
    
    // Test with sample receipts
    val sampleDir = File("sample-receipts")
    if (!sampleDir.exists()) {
        println("Creating sample-receipts directory...")
        sampleDir.mkdirs()
        createSampleReceipts()
    }
    
    val jsonFiles = sampleDir.listFiles { file -> file.extension == "json" } ?: emptyArray()
    
    if (jsonFiles.isEmpty()) {
        println("No JSON files found in sample-receipts/")
        println("Creating sample files...")
        createSampleReceipts()
    }
    
    jsonFiles.forEach { file ->
        println("\nTesting with: ${file.name}")
        println("-".repeat(40))
        
        try {
            val jsonContent = file.readText()
            interpret(jsonContent, printer)
            println("✅ Test passed!")
        } catch (e: Exception) {
            println("❌ Test failed: ${e.message}")
            e.printStackTrace()
        }
    }
    
    println("\n" + "=".repeat(40))
    println("All tests completed!")
}

fun createSampleReceipts() {
    // Create simple receipt
    File("sample-receipts/simple.json").writeText("""
    {
        "elements": [
            {"type": "text", "content": "Welcome to Byte Burgers\n", "style": {"bold": true, "size": "LARGE"}},
            {"type": "text", "content": "123 Tech Ave\n"},
            {"type": "text", "content": "Silicon Valley, CA 94000\n"},
            {"type": "divider"},
            {"type": "dynamic", "field": "{timestamp}"},
            {"type": "feed", "lines": 1},
            {"type": "text", "content": "Order #: "},
            {"type": "dynamic", "field": "{order_number}"},
            {"type": "feed", "lines": 2},
            {"type": "dynamic", "field": "{item_list}"},
            {"type": "feed", "lines": 1},
            {"type": "divider"},
            {"type": "text", "content": "Subtotal: "},
            {"type": "dynamic", "field": "{subtotal}"},
            {"type": "feed", "lines": 1},
            {"type": "text", "content": "Tax: "},
            {"type": "dynamic", "field": "{tax}"},
            {"type": "feed", "lines": 1},
            {"type": "text", "content": "Total: ", "style": {"bold": true}},
            {"type": "dynamic", "field": "{total}"},
            {"type": "feed", "lines": 2},
            {"type": "barcode", "data": "123456789", "barcodeType": "CODE39"},
            {"type": "feed", "lines": 2},
            {"type": "text", "content": "Thank you for your visit!\n", "style": {"size": "SMALL"}}
        ]
    }
    """.trimIndent())
    
    // Create complex receipt with QR code
    File("sample-receipts/complex.json").writeText("""
    {
        "elements": [
            {"type": "text", "content": "BYTE BURGERS", "style": {"bold": true, "size": "XLARGE"}},
            {"type": "feed", "lines": 1},
            {"type": "qrcode", "data": "https://byteburgers.com/menu"},
            {"type": "feed", "lines": 1},
            {"type": "text", "content": "Scan for menu\n"},
            {"type": "divider"},
            {"type": "dynamic", "field": "{store_name}"},
            {"type": "feed", "lines": 1},
            {"type": "dynamic", "field": "{store_address}"},
            {"type": "feed", "lines": 2},
            {"type": "text", "content": "Cashier: "},
            {"type": "dynamic", "field": "{cashier_name}"},
            {"type": "feed", "lines": 1},
            {"type": "dynamic", "field": "{timestamp}"},
            {"type": "feed", "lines": 2},
            {"type": "text", "content": "=== YOUR ORDER ===\n", "style": {"bold": true}},
            {"type": "dynamic", "field": "{item_list}"},
            {"type": "feed", "lines": 2},
            {"type": "text", "content": "Subtotal: "},
            {"type": "dynamic", "field": "{subtotal}"},
            {"type": "feed", "lines": 1},
            {"type": "text", "content": "Tax (9%): "},
            {"type": "dynamic", "field": "{tax}"},
            {"type": "feed", "lines": 1},
            {"type": "divider"},
            {"type": "text", "content": "TOTAL: ", "style": {"bold": true, "size": "LARGE"}},
            {"type": "dynamic", "field": "{total}"},
            {"type": "feed", "lines": 2},
            {"type": "barcode", "data": "ORD001234", "barcodeType": "CODE128"},
            {"type": "feed", "lines": 1},
            {"type": "text", "content": "Order: "},
            {"type": "dynamic", "field": "{order_number}"},
            {"type": "feed", "lines": 3},
            {"type": "text", "content": "Follow us @ByteBurgers", "style": {"size": "SMALL"}},
            {"type": "feed", "lines": 1},
            {"type": "text", "content": "Thank you! Come again!", "style": {"bold": true}}
        ]
    }
    """.trimIndent())
    
    // Create edge cases receipt
    File("sample-receipts/edge-cases.json").writeText("""
    {
        "elements": [
            {"type": "text", "content": "Edge Case Test Receipt\n"},
            {"type": "unknown", "content": "This should be handled gracefully"},
            {"type": "text", "content": null},
            {"type": "feed", "lines": 0},
            {"type": "feed", "lines": 5},
            {"type": "barcode", "data": "", "barcodeType": "INVALID_TYPE"},
            {"type": "text", "content": "Very long text that might wrap on the receipt printer and cause issues with formatting and alignment", "style": {"size": "XLARGE"}},
            {"type": "divider"},
            {"type": "dynamic", "field": "{unknown_field}"},
            {"type": "qrcode", "data": ""},
            {"type": "text", "content": "End of edge cases", "style": {"bold": false, "size": "NORMAL"}}
        ]
    }
    """.trimIndent())
    
    println("Sample receipt files created in sample-receipts/")
}

// Run the test
main()