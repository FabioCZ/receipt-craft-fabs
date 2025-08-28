import { NextRequest, NextResponse } from 'next/server';

const DEBUG_MODE = process.env.DEBUG === 'true';
const COMPILATION_SERVER = process.env.COMPILATION_SERVER_URL || 
    (DEBUG_MODE ? 'http://localhost:3001' : 'http://192.168.29.3:3001');
const ANDROID_SERVER = process.env.ANDROID_SERVER_URL || 
    (DEBUG_MODE ? 'http://192.168.0.7:8080' : 'http://192.168.29.2:8080');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { team_id, teamName, interpreterCode } = body;
    
    console.log(`[SUBMIT API] Processing submission for team: ${team_id} (${teamName})`);
    
    // Forward to compilation server
    const compileResponse = await fetch(`${COMPILATION_SERVER}/compile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamId: team_id,
        teamName: teamName,
        code: interpreterCode
      }),
    });

    const compileResult = await compileResponse.json();
    const compilationSuccess = compileResponse.ok && compileResult.success;
    
    // Notify Android server about the submission result
    console.log(`[SUBMIT API] Notifying Android server about ${compilationSuccess ? 'successful' : 'failed'} compilation`);
    try {
      const androidNotification = {
        teamId: team_id,
        teamName: teamName || team_id,
        compilationStatus: compilationSuccess ? 'success' : 'failure',
        timestamp: Date.now(),
        error: compilationSuccess ? null : (compileResult.error || 'Unknown compilation error'),
        lineNumber: compileResult.lineNumber || null
      };
      
      const androidResponse = await fetch(`${ANDROID_SERVER}/api/team-submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(androidNotification),
      });
      
      if (!androidResponse.ok) {
        console.warn('[SUBMIT API] Failed to notify Android server:', androidResponse.status);
      } else {
        console.log('[SUBMIT API] Android server notified successfully');
      }
    } catch (androidError) {
      console.error('[SUBMIT API] Error notifying Android server:', androidError);
      // Don't fail the submission if Android notification fails
    }

    // Return appropriate response based on compilation result
    if (!compilationSuccess) {
      console.error('Compilation failed:', compileResult);
      return NextResponse.json(
        { 
          error: 'Compilation failed', 
          details: compileResult.error || 'Unknown compilation error',
          lineNumber: compileResult.lineNumber 
        },
        { status: 400 }
      );
    }

    // Return success with team info
    return NextResponse.json({
      success: true,
      message: compileResult.message || `Interpreter compiled and uploaded successfully for ${teamName}`,
      teamId: team_id,
      team_id
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to compilation server', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}