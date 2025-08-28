/**
 * API client for the receipt printer server
 */

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://192.168.29.2:8080';

export interface SubmissionResponse {
  success: boolean;
  message: string;
  teamId?: string;
  team_id?: string;
  endpoint?: string;
}

export interface PrintResponse {
  success: boolean;
  error?: string;
  message?: string;
  commandCount?: number;
  commands?: any[];
}

export interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * Upload interpreter code to the server with timeout and error handling
 */
export async function uploadInterpreter(teamName: string, code: string): Promise<SubmissionResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    // Use local API proxy to avoid CORS issues
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        team_id: teamName.toLowerCase().replace(/\s+/g, '_'), // Convert to valid ID format
        teamName: teamName,
        interpreterCode: code
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorMessage = `Server error: ${response.status}`;
      try {
        const errorData: any = await response.json();
        
        // Check for compilation error structure
        if (errorData.error === 'Compilation failed' && errorData.details) {
          errorMessage = `Compilation failed:\n${errorData.details}`;
          
          // Add line number if available
          if (errorData.lineNumber) {
            errorMessage += `\n\nError at line: ${errorData.lineNumber}`;
          }
        } else {
          // Standard error handling
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) {
            errorMessage += ` - ${errorData.details}`;
          }
        }
      } catch {
        // If response isn't JSON, use status text
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out - server took too long to respond. Please check your connection and try again.');
      }
      throw error;
    }
    throw new Error('Failed to connect to server. Please check if the server is running.');
  }
}

/**
 * Test print with uploaded interpreter
 */
export async function testPrint(endpoint: string, json: object, round: number = 0): Promise<PrintResponse> {
  // Extract team ID from endpoint (format: /api/submit/{teamId})
  const teamId = endpoint.split('/').pop();
  
  if (!teamId) {
    throw new Error('Invalid endpoint - cannot extract team ID');
  }
  
  // Use the new print API that goes through compilation server
  const response = await fetch('/api/print', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      team_id: teamId,
      jsonData: json,
      round: round
    })
  });
  
  if (!response.ok) {
    let errorMessage = `Print failed: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
      if (errorData.details) {
        errorMessage += ` - ${errorData.details}`;
      }
    } catch {
      const errorText = await response.text();
      errorMessage = `Print failed: ${response.status} - ${errorText}`;
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Update interpreter code (before submission freeze) with timeout and error handling
 */
export async function updateInterpreter(teamId: string, code: string, teamName?: string): Promise<{ status: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    // Use local API proxy to avoid CORS issues
    const response = await fetch(`/api/submit/${teamId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        interpreterCode: code,
        teamName: teamName || teamId // Include team name if available
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorMessage = `Server error: ${response.status}`;
      try {
        const errorData: any = await response.json();
        
        // Check for compilation error structure (same as uploadInterpreter)
        if (errorData.error === 'Compilation failed' && errorData.details) {
          errorMessage = `Compilation failed:\n${errorData.details}`;
          
          // Add line number if available
          if (errorData.lineNumber) {
            errorMessage += `\n\nError at line: ${errorData.lineNumber}`;
          }
        } else {
          // Standard error handling
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) {
            errorMessage += ` - ${errorData.details}`;
          }
        }
      } catch {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out - server took too long to respond. Please check your connection and try again.');
      }
      throw error;
    }
    throw new Error('Failed to connect to server. Please check if the server is running.');
  }
}

/**
 * Check server health
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${SERVER_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}