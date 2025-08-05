# Scripts Directory

This directory contains utility scripts for maintaining the GradeIdea application.

## fix-public-ideas-structure.js

A one-time script to scan and fix Firestore data structure for public ideas.

### Purpose
This script ensures that all ideas in Firestore have the proper structure for the public ideas feature to work correctly.

### What it does
1. **Scans all ideas** in Firestore under `users/{uid}/ideas/{ideaId}`
2. **Adds missing public fields** - sets `public: false` for ideas without the field
3. **Validates public ideas** - ensures public ideas have valid score structures
4. **Fixes legacy data** - explicitly sets `public: true` for legacy public ideas
5. **Reports issues** - logs malformed entries that need manual review

### Prerequisites
1. **Firebase Service Account Key**: You need a `serviceAccountKey.json` file in the project root
   - Download from Firebase Console → Project Settings → Service Accounts
   - Generate new private key and save as `serviceAccountKey.json`

2. **Firebase Admin SDK**: Already included in dependencies

### Usage

#### Option 1: Using npm script (Recommended)
```bash
npm run fix-public-ideas
```

#### Option 2: Direct execution
```bash
node scripts/fix-public-ideas-structure.js
```

### Output
The script provides detailed logging:
- Progress updates for each idea processed
- Summary statistics at the end
- List of skipped entries (with reasons)
- List of malformed entries requiring manual review

### Example Output
```
=== Starting Public Ideas Structure Fix ===
Found 150 total ideas to scan...
[user123/idea456] Missing public field, adding public: false
[user123/idea456] ✅ Updated successfully
[user789/idea101] Public idea found, checking score structure...
[user789/idea101] ✅ Updated successfully

=== SUMMARY ===
Total ideas scanned: 150
Documents updated: 45
Skipped entries: 0
Malformed entries: 2

=== MALFORMED ENTRIES (Manual Review Required) ===
[user999/idea777]: Public idea missing valid score structure
  Data: { hasInitialScores: false, hasAnalysisScoreBreakdown: false, ... }

=== Public Ideas Structure Fix Complete ===
```

### Safety Features
- **Read-only by default**: The script only updates documents that need changes
- **No destructive changes**: Only adds missing fields, doesn't modify existing valid data
- **Detailed logging**: Every action is logged for audit purposes
- **Error handling**: Failed updates are logged but don't stop the script
- **Validation**: Checks for valid score structures before marking ideas as public

### After Running
1. **Check the logs** for any malformed entries that need manual review
2. **Verify the public ideas feature** works correctly on the `/examples` page
3. **Monitor the application** to ensure no issues were introduced

### Troubleshooting
- **Permission errors**: Ensure your service account has Firestore read/write permissions
- **Missing service account**: Download the key from Firebase Console
- **Network issues**: Check your internet connection and Firebase project access 