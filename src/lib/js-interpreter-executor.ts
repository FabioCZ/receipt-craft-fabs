import type { EpsonPrinter } from '../interfaces/epson-printer-exact';

/**
 * Executes a JavaScript interpreter function with the given inputs
 * @param interpreterCode The JavaScript code containing the interpret function
 * @param jsonString The JSON DSL string to interpret
 * @param printer The EpsonPrinter instance to use for rendering
 * @param order The order object (or null for preview)
 */
export async function executeJavaScriptInterpreter(
  interpreterCode: string,
  jsonString: string,
  printer: EpsonPrinter,
  order: any = null
): Promise<void> {
  try {
    // Validate that the JSON is valid
    try {
      JSON.parse(jsonString);
    } catch (jsonError) {
      throw new Error(`Invalid JSON DSL: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
    }

    // Create a function from the interpreter code
    // Using Function constructor for safer execution than eval
    const wrappedCode = `
      ${interpreterCode}
      
      // Check if interpret function exists
      if (typeof interpret !== 'function') {
        throw new Error('No interpret function found. Make sure your code defines: function interpret(jsonString, printer, order) {...}');
      }
      
      // Call the interpret function
      try {
        interpret(jsonString, printer, order);
      } catch (interpretError) {
        throw new Error('Interpreter execution error: ' + (interpretError.message || interpretError));
      }
    `;

    // Create a sandboxed function with limited scope
    const sandboxedFunction = new Function(
      'jsonString',
      'printer', 
      'order',
      'console',
      wrappedCode
    );

    // Create a safe console object that only allows certain methods
    const safeConsole = {
      log: (...args: any[]) => console.log('[Interpreter]:', ...args),
      warn: (...args: any[]) => console.warn('[Interpreter]:', ...args),
      error: (...args: any[]) => console.error('[Interpreter]:', ...args),
      info: (...args: any[]) => console.info('[Interpreter]:', ...args)
    };

    // Execute the sandboxed function with timeout protection
    await Promise.race([
      new Promise<void>((resolve, reject) => {
        try {
          sandboxedFunction(jsonString, printer, order, safeConsole);
          resolve();
        } catch (error) {
          reject(error);
        }
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Interpreter execution timed out (5 seconds)'));
        }, 5000);
      })
    ]);

  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('interpret is not defined') || error.message.includes('No interpret function')) {
        throw new Error('Your code must define a function named "interpret" with signature: function interpret(jsonString, printer, order) {...}');
      }
      if (error.message.includes('Unexpected token') || error.message.includes('SyntaxError')) {
        throw new Error(`JavaScript syntax error: ${error.message}`);
      }
      throw error;
    }
    throw new Error(`Unknown interpreter error: ${String(error)}`);
  }
}

/**
 * Validates that the interpreter code is safe and contains required function
 * @param code The JavaScript code to validate
 * @returns True if valid, throws error otherwise
 */
export function validateInterpreterCode(code: string): boolean {
  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /\beval\s*\(/,
    /\bnew\s+Function\s*\(/,
    /\bimport\s+/,
    /\brequire\s*\(/,
    /\bprocess\./,
    /\bglobal\./,
    /\bwindow\./,
    /\bdocument\./,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest/,
    /\blocalStorage\./,
    /\bsessionStorage\./
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      throw new Error(`Security: Your code contains a restricted pattern: ${pattern.source}`);
    }
  }

  // Check that it contains an interpret function
  if (!/function\s+interpret\s*\(/.test(code) && !/const\s+interpret\s*=/.test(code) && !/let\s+interpret\s*=/.test(code)) {
    throw new Error('Your code must define an interpret function');
  }

  return true;
}