#!/bin/bash

# Export WhatsApp session script for Gaga09 XMD Bot
# Created by Lil Gaga Traxx09

echo "📱 Gaga09 XMD Session Export Tool"
echo "================================="
echo ""

# Check if session directory exists
if [ ! -d "session" ]; then
    echo "❌ Session directory not found!"
    echo "💡 Make sure you're in the bot's root directory"
    exit 1
fi

# Check if session files exist
if [ ! -f "session/creds.json" ]; then
    echo "❌ No session files found!"
    echo "💡 Make sure the bot has been paired first"
    exit 1
fi

# Create backup directory
BACKUP_DIR="session-backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="session_backup_$TIMESTAMP"

echo "📦 Creating session backup..."

# Create backup archive
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" session/

# Create base64 export
echo "🔐 Generating base64 export..."
tar -czf - session/ | base64 > "$BACKUP_DIR/$BACKUP_NAME.base64"

# Create JSON export for web dashboard
echo "📄 Creating JSON export..."
node -e "
const fs = require('fs');
const path = require('path');

try {
    const sessionData = {};
    const sessionDir = 'session';
    const files = fs.readdirSync(sessionDir);
    
    files.forEach(file => {
        if (file.endsWith('.json')) {
            const content = fs.readFileSync(path.join(sessionDir, file), 'utf8');
            sessionData[file] = JSON.parse(content);
        }
    });
    
    fs.writeFileSync('$BACKUP_DIR/$BACKUP_NAME.json', JSON.stringify(sessionData, null, 2));
    console.log('✅ JSON export created');
} catch (error) {
    console.error('❌ JSON export failed:', error.message);
}
"

echo ""
echo "✅ Session export completed!"
echo ""
echo "📁 Backup files created:"
echo "   • $BACKUP_DIR/$BACKUP_NAME.tar.gz (Archive)"
echo "   • $BACKUP_DIR/$BACKUP_NAME.base64 (Base64)"
echo "   • $BACKUP_DIR/$BACKUP_NAME.json (JSON)"
echo ""
echo "🔐 Keep these files secure and private!"
echo "📱 Use the base64 file with .setsession command"
echo "🌐 Use the JSON file with the web dashboard"
echo ""
echo "💡 To import on another device:"
echo "   1. Copy the base64 file content"
echo "   2. Use: .setsession [base64-content]"
echo "   3. Or upload JSON file to web dashboard"
