# Android Server API Specification

This document describes the API endpoints that the Android Print Server needs to implement to support the hackathon system.

## Base Information
- **Android Server URL (Development)**: `http://192.168.0.7:8080`
- **Android Server URL (Production)**: `http://192.168.29.2:8080`

## Required Endpoints

### 1. Health Check
**GET** `/health`

Check if the Android server is running and accessible.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "Android Print Server"
}
```

---

### 2. Team Submission Notification
**POST** `/api/team-submission`

Notifies Android when a team submits their interpreter code, showing compilation status.

**Request Body:**
```json
{
  "teamId": "team_123",
  "teamName": "Cool Team",
  "compilationStatus": "success", // or "failure"
  "timestamp": 1699123456789,
  "error": null,  // Contains error message if compilation failed
  "lineNumber": null  // Line number of error if applicable
}
```

**Expected UI Behavior:**
- Display a card for this team
- Green card if `compilationStatus` is "success"
- Red card if `compilationStatus` is "failure"
- Show error details on red cards

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Team submission recorded"
}
```

---

### 3. Print Commands
**POST** `/api/print-commands`

Receives printer commands to execute on the physical printer.

**Request Body:**
```json
{
  "team_id": "team_123",
  "round": 2,  // Round number (0-5)
  "commands": [
    {
      "type": "ADD_TEXT",
      "text": "Hello World"
    },
    {
      "type": "ADD_TEXT_STYLE",
      "bold": true,
      "size": "LARGE",
      "underline": false
    },
    {
      "type": "CUT_PAPER"
    }
  ],
  "timestamp": 1699123456789
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Print job executed",
  "commandCount": 3
}
```

---

### 4. Track Round Completion
**POST** `/api/track-round`

Records that a team has successfully printed for a specific round.

**Request Body:**
```json
{
  "team_id": "team_123",
  "round": 2,
  "printed": true,
  "timestamp": 1699123456789
}
```

**Expected UI Behavior:**
- When clicking on a team card, show rounds 0-5
- Display checkmarks next to completed rounds
- Track which rounds each team has printed

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Round tracked"
}
```

---

## UI Requirements

### Team Cards Display
1. **Card Colors:**
   - Green: Successful compilation
   - Red: Failed compilation
   
2. **Card Information:**
   - Team ID/Name
   - Compilation status
   - Timestamp
   - Error message (if failed)

3. **Card Interaction:**
   - Clicking a card shows a list of rounds (0-5)
   - Checkmarks appear next to rounds that have been printed
   - Shows completion progress for each team

### Example UI Flow
1. Team submits interpreter → Card appears (green/red based on compilation)
2. Team prints for round 0 → Round 0 gets checkmark
3. Team prints for round 2 → Round 2 gets checkmark
4. Clicking team card shows: ✓ Round 0, ⬜ Round 1, ✓ Round 2, ⬜ Round 3, etc.

## Data Storage Recommendations

The Android server should maintain:
- Team information (ID, name, compilation status)
- Round completion tracking per team
- Print history with timestamps

Example data structure:
```kotlin
data class Team(
    val teamId: String,
    val teamName: String,
    val compilationStatus: String,
    val lastUpdated: Long,
    val completedRounds: Set<Int> = setOf(),
    val errorMessage: String? = null
)
```

## Error Handling

All endpoints should:
- Return appropriate HTTP status codes
- Include error messages in response body
- Log errors for debugging
- Not crash the server on malformed requests

## Testing

You can test these endpoints using curl:

```bash
# Health check
curl http://192.168.0.7:8080/health

# Team submission
curl -X POST http://192.168.0.7:8080/api/team-submission \
  -H "Content-Type: application/json" \
  -d '{"teamId":"test_team","teamName":"Test Team","compilationStatus":"success","timestamp":1699123456789}'

# Track round
curl -X POST http://192.168.0.7:8080/api/track-round \
  -H "Content-Type: application/json" \
  -d '{"team_id":"test_team","round":0,"printed":true,"timestamp":1699123456789}'
```