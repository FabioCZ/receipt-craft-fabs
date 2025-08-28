'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { uploadInterpreter, updateInterpreter } from '../lib/api';
import { PrinterCheatSheet } from './PrinterCheatSheet';

// Dynamically import the editor to avoid SSR issues
const KotlinEditor = dynamic(
  () => import('./KotlinEditor').then(mod => mod.KotlinEditor),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-black border border-gray-600 rounded-lg flex items-center justify-center">
        <div className="text-green-400">Loading Kotlin Editor...</div>
      </div>
    )
  }
);

interface KotlinSubmissionProps {
  jsonDsl: string;
  serverUrl?: string;
  onSubmissionSuccess?: (endpoint: string, teamId: string) => void;
}

export const KotlinSubmission: React.FC<KotlinSubmissionProps> = ({ 
  jsonDsl, 
  serverUrl,
  onSubmissionSuccess
}) => {
  const [teamName, setTeamName] = useState('');
  const [kotlinCode, setKotlinCode] = useState(`fun interpret(jsonString: String, printer: EpsonPrinter, order: Order?) {
    try {
        // Parse the JSON design
        val json = JSONObject(jsonString)
        
        // Helper function to replace template variables with actual order data
        fun replaceTemplateVars(text: String): String {
            var result = text
            if (order != null) {
                result = result.replace("{{STORE_NAME}}", order.storeName)
                result = result.replace("{{STORE_NUMBER}}", order.storeNumber)
                result = result.replace("{{ORDER_ID}}", order.orderId)
            }
            return result
        }
        
        // Process each element in the JSON
        if (json.has("elements")) {
            val elements = json.getJSONArray("elements")
            
            for (i in 0 until elements.length()) {
                val element = elements.getJSONObject(i)
                val type = element.getString("type")
                
                when (type) {
                    "text" -> {
                        // Get content and replace template variables
                        val content = replaceTemplateVars(element.optString("content", ""))
                        
                        // Check if there's a style object
                        if (element.has("style")) {
                            val style = element.getJSONObject("style")
                            val textStyle = TextStyle(
                                bold = style.optBoolean("bold", false),
                                underline = style.optBoolean("underline", false),
                                size = when (style.optString("size", "NORMAL")) {
                                    "SMALL" -> TextSize.SMALL
                                    "LARGE" -> TextSize.LARGE
                                    "XLARGE" -> TextSize.XLARGE
                                    else -> TextSize.NORMAL
                                }
                            )
                            printer.addText(content, textStyle)
                        } else {
                            printer.addText(content)
                        }
                    }
                    
                    "items_list" -> {
                        // Print items from the order
                        if (order != null) {
                            for (i in 0 until order.items.size) {
                                val item = order.items[i]
                                printer.addText("• " + item.name)
                            }
                        } else {
                            printer.addText("(No items)")
                        }
                    }
                    
                    "align" -> {
                        // Set text alignment
                        val alignmentStr = element.optString("alignment", "LEFT")
                        val alignment = when (alignmentStr) {
                            "CENTER" -> Alignment.CENTER
                            "RIGHT" -> Alignment.RIGHT
                            else -> Alignment.LEFT
                        }
                        printer.addTextAlign(alignment)
                    }
                    
                    "feedLine" -> {
                        // Add blank lines
                        val lines = element.optInt("lines", 1)
                        printer.addFeedLine(lines)
                    }
                    
                    "cutPaper" -> {
                        // Cut the paper
                        printer.cutPaper()
                    }
                    
                    else -> {
                        // Skip unknown types silently
                    }
                }
            }
        }
    } catch (e: Exception) {
        // If there's any error, print it to the receipt for debugging
        printer.addText("Error in interpreter: " + e.message)
    }
}`);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const handleSubmit = async () => {
    if (!teamName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a team name' });
      return;
    }
    
    if (!kotlinCode.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your Kotlin interpreter code' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await uploadInterpreter(teamName, kotlinCode);
      const returnedTeamId = response.teamId || response.team_id || teamName.toLowerCase().replace(/\s+/g, '_');
      const endpointUrl = `/api/submit/${returnedTeamId}`;
      setEndpoint(endpointUrl);
      setTeamId(returnedTeamId);
      setStatusMessage({ 
        type: 'success', 
        text: response.message || `Interpreter uploaded successfully! Your team ID: ${returnedTeamId}` 
      });
      
      // Notify parent component of successful submission
      if (onSubmissionSuccess) {
        onSubmissionSuccess(endpointUrl, returnedTeamId);
      }
    } catch (err) {
      // Extract detailed error information
      let errorText = 'Failed to submit interpreter';
      if (err instanceof Error) {
        errorText = err.message;
        
        // Check if the error contains compilation details
        if (err.message.includes('Compilation failed')) {
          // The error message already contains the details from the server
          errorText = err.message;
        }
      }
      
      setStatusMessage({ 
        type: 'error', 
        text: errorText
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!teamId) {
      setStatusMessage({ type: 'error', text: 'No team ID found. Please submit first.' });
      return;
    }

    if (!kotlinCode.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your Kotlin interpreter code' });
      return;
    }

    setIsUpdating(true);
    setStatusMessage(null);

    try {
      await updateInterpreter(teamId, kotlinCode, teamName);
      setStatusMessage({ 
        type: 'success', 
        text: 'Interpreter updated successfully!' 
      });
    } catch (err) {
      // Extract detailed error information
      let errorText = 'Failed to update interpreter';
      if (err instanceof Error) {
        errorText = err.message;
        
        // Check if the error contains compilation details
        if (err.message.includes('Compilation failed')) {
          // The error message already contains the details from the server
          errorText = err.message;
        }
      }
      
      setStatusMessage({ 
        type: 'error', 
        text: errorText
      });
    } finally {
      setIsUpdating(false);
    }
  };


  return (
    <div className="p-8 bg-gray-900">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-100">Kotlin Interpreter Submission</h2>
        
        {/* Team Info Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Team Name
            <span className="ml-2 text-xs text-gray-500 font-normal">
              (Make it unique - it will be used in your URL endpoint)
            </span>
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter your unique team name"
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              disabled={!!endpoint}
            />
            {!endpoint ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !teamName.trim() || !kotlinCode.trim()}
                className={`px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  isSubmitting || !teamName.trim() || !kotlinCode.trim()
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {isSubmitting ? 'Uploading...' : 'Submit Interpreter'}
              </button>
            ) : (
              <button
                onClick={handleUpdate}
                disabled={isUpdating || !kotlinCode.trim()}
                className={`px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  isUpdating || !kotlinCode.trim()
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700 active:bg-yellow-800'
                }`}
              >
                {isUpdating ? 'Updating...' : 'Update Interpreter'}
              </button>
            )}
          </div>
          {endpoint && (
            <div className="mt-2 p-3 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-300">
                <strong className="text-gray-100">Your Endpoint:</strong>{' '}
                <code className="text-green-400 bg-black px-2 py-1 rounded font-mono">{endpoint}</code>
              </p>
            </div>
          )}
        </div>

        {/* Kotlin Code Editor */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Kotlin Interpreter Code
              <span className="ml-2 text-xs text-gray-500">
                (Syntax highlighting • Auto-completion • IntelliSense)
              </span>
            </label>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Printer AI Button */}
              <button
                type="button"
                onClick={() => setShowCheatSheet(true)}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1 transition-colors"
              >
                <span className="text-base">🤖</span>
                Printer AI
              </button>
              
              {/* Keyboard Shortcuts Info Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Keyboard Shortcuts
                </button>
              
              {/* Shortcuts Bubble */}
              {showShortcuts && (
                <div className="absolute right-0 top-8 z-50 w-80 p-4 bg-gray-800 border border-gray-600 rounded-lg shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-200">Editor Shortcuts</h3>
                    <button
                      onClick={() => setShowShortcuts(false)}
                      className="text-gray-400 hover:text-gray-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <div className="text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Ctrl+Space</kbd>
                      </div>
                      <div className="text-gray-300">Trigger suggestions</div>
                      
                      <div className="text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Ctrl+F</kbd>
                      </div>
                      <div className="text-gray-300">Find</div>
                      
                      <div className="text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Ctrl+H</kbd>
                      </div>
                      <div className="text-gray-300">Replace</div>
                      
                      <div className="text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Ctrl+/</kbd>
                      </div>
                      <div className="text-gray-300">Toggle comment</div>
                      
                      <div className="text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Alt+Shift+F</kbd>
                      </div>
                      <div className="text-gray-300">Format code</div>
                      
                      <div className="text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">F1</kbd>
                      </div>
                      <div className="text-gray-300">Command palette</div>
                      
                      <div className="text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Ctrl+D</kbd>
                      </div>
                      <div className="text-gray-300">Select next match</div>
                      
                      <div className="text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Alt+Click</kbd>
                      </div>
                      <div className="text-gray-300">Multiple cursors</div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="font-semibold text-gray-300 mb-1">Quick Tips:</div>
                      <ul className="space-y-1 text-gray-400">
                        <li>• Type <code className="px-1 bg-gray-700 rounded">printer.</code> for all printer methods</li>
                        <li>• Type <code className="px-1 bg-gray-700 rounded">JSON</code> for JSON parsing helpers</li>
                        <li>• Type <code className="px-1 bg-gray-700 rounded">fun</code>, <code className="px-1 bg-gray-700 rounded">if</code>, <code className="px-1 bg-gray-700 rounded">when</code> for snippets</li>
                        <li>• Use Tab to accept suggestions</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
          
          <KotlinEditor
            value={kotlinCode}
            onChange={setKotlinCode}
            height="400px"
            readOnly={false}
          />
          
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            <span>💡 Press <kbd className="px-1 py-0.5 bg-gray-700 rounded">Ctrl+Space</kbd> for suggestions</span>
            <span>• Type "printer." for methods</span>
            <span>• Click info button above for more shortcuts</span>
          </div>
        </div>

        {/* Console Output Area - Always Visible */}
        <div className={`mb-6 rounded-lg border-2 ${
          statusMessage?.type === 'error' ? 'border-red-600 bg-red-950' :
          statusMessage?.type === 'success' ? 'border-green-600 bg-green-900' :
          'border-gray-600 bg-gray-900'
        }`}>
          <div className={`flex items-center gap-2 px-4 py-3 border-b ${
            statusMessage?.type === 'error' ? 'bg-red-900 border-red-700' :
            statusMessage?.type === 'success' ? 'bg-green-900 border-green-700' :
            'bg-gray-800 border-gray-700'
          }`}>
            {statusMessage?.type === 'error' ? (
              <>
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-red-200">Compilation Error</span>
              </>
            ) : statusMessage?.type === 'success' ? (
              <>
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-green-200">Success</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold text-gray-300">Console Output</span>
              </>
            )}
          </div>
          <div className="p-4">
            {statusMessage ? (
              statusMessage.type === 'error' ? (
                <>
                  {statusMessage.text.includes('\n') || statusMessage.text.includes('line') ? (
                    <div>
                      <pre className="whitespace-pre-wrap font-mono text-sm text-red-200 bg-black/30 p-3 rounded overflow-x-auto">
                        {statusMessage.text}
                      </pre>
                      {statusMessage.text.includes('lineNumber') && (
                        <p className="mt-3 text-xs text-red-300">
                          💡 Check the line number mentioned above in your code
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-red-200">{statusMessage.text}</p>
                  )}
                </>
              ) : (
                <p className={statusMessage.type === 'success' ? 'text-green-200' : 'text-blue-200'}>
                  {statusMessage.text}
                </p>
              )
            ) : (
              <div className="font-mono text-sm text-gray-500">
                <span className="animate-pulse">▌</span>
                <span className="ml-2 text-gray-600">Ready - Submit your interpreter to see compilation results</span>
              </div>
            )}
          </div>
        </div>


        {/* Info Section */}
        <div className="space-y-4">
          <div className="p-4 bg-gray-900 rounded-lg">
            <h4 className="font-semibold mb-2 text-gray-200">Current JSON DSL:</h4>
            <pre className="text-xs bg-black text-green-400 p-3 rounded overflow-x-auto max-h-40 font-mono">
              {jsonDsl || '// No JSON generated yet - design a receipt first!'}
            </pre>
          </div>
          
          <div className="p-4 bg-gray-700 border border-gray-600 rounded-lg">
            <p className="text-sm text-gray-400">
              <strong className="text-gray-300">Tips:</strong>
            </p>
            <ul className="text-sm text-gray-400 mt-1 list-disc list-inside">
              <li>Check <code className="px-1 py-0.5 bg-gray-900 text-green-400 rounded">kotlin-examples/</code> for templates</li>
              <li>Test locally with MockEpsonPrinter first</li>
              <li>Handle all element types in your JSON</li>
              <li>Always call printer.cutPaper() at the end</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Printer Cheat Sheet Modal */}
      <PrinterCheatSheet 
        isOpen={showCheatSheet}
        onClose={() => setShowCheatSheet(false)}
      />
    </div>
  );
};