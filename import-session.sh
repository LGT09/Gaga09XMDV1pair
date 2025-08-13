#!/bin/bash

# Import WhatsApp session script for Gaga09 XMD Bot
# Created by Lil Gaga Traxx09

echo "📱 Gaga09 XMD Session Import Tool"
echo "================================="
echo ""

# Function to show usage
show_usage() {
    echo "Usage: $0 [session-file]"
    echo ""
    echo "Supported formats:"
    echo "  • .tar.gz (Archive)"
    echo "  • .base64 (Base64 encoded)"
    echo "  • .json (JSON format)"
    echo ""
    echo "Examples:"
    echo "  $0 session_backup_20240108_120
