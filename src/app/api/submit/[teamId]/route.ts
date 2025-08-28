import { NextRequest, NextResponse } from 'next/server';

const DEBUG_MODE = process.env.DEBUG === 'true';
const COMPILATION_SERVER = process.env.COMPILATION_SERVER_URL || 
    (DEBUG_MODE ? 'http://localhost:3001' : 'http://192.168.29.3:3001');
const ANDROID_SERVER = process.env.ANDROID_SERVER_URL || 
    (DEBUG_MODE ? 'http://192.168.0.7:8080' : 'http://192.168.29.2:8080');

export async function PUT(request: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const teamId = params.teamId;
    const body = await request.json();
    const { interpreterCode, teamName } = body;
    
    console.log(`[SUBMIT API - PUT] Updating interpreter for team: ${teamId} (${teamName || teamId})`);
    
    // Forward to compilation server (same as POST)
    const compileResponse = await fetch(`${COMPILATION_SERVER}/compile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamId: teamId,
        teamName: teamName || teamId, // Use provided teamName or fall back to teamId
        code: interpreterCode
      }),
    });

    const compileResult = await compileResponse.json();
    const compilationSuccess = compileResponse.ok && compileResult.success;
    
    // Notify Android server about the update result (same as POST)
    console.log(`[SUBMIT API - PUT] Notifying Android server about ${compilationSuccess ? 'successful' : 'failed'} update`);
    try {
      const androidNotification = {
        teamId: teamId,
        teamName: teamName || teamId,
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
        console.warn('[SUBMIT API - PUT] Failed to notify Android server:', androidResponse.status);
      } else {
        console.log('[SUBMIT API - PUT] Android server notified successfully');
      }
    } catch (androidError) {
      console.error('[SUBMIT API - PUT] Error notifying Android server:', androidError);
      // Don't fail the update if Android notification fails
    }

    // Return appropriate response based on compilation result
    if (!compilationSuccess) {
      console.error('Update compilation failed:', compileResult);
      return NextResponse.json(
        { 
          error: 'Compilation failed', 
          details: compileResult.error || 'Unknown compilation error',
          lineNumber: compileResult.lineNumber 
        },
        { status: 400 }
      );
    }

    // Return success
    return NextResponse.json({
      status: 'updated',
      success: true,
      message: compileResult.message || `Interpreter updated successfully for ${teamName || teamId}`,
      teamId: teamId
    });
  } catch (error) {
    console.error('Update proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to update interpreter', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
