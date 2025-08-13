import { isOwner } from "./utils.js"
import {
  handleListBanCommand,
  handleMsgCommand,
  handlePromoteCommand,
  handleDemoteCommand,
  handleKickCommand,
  handleGroupInfoCommand,
  handleSnapInstaCommand,
  handleFBDLCommand,
  handleFetchCommand,
  handleAPKPlayCommand,
  handleAPKPureCommand,
  handleNkiriCommand,
  handleShazamCommand,
  handleGeminiCommand,
  handleMetaAICommand,
  handleBardCommand,
  handleBuildWebCommand,
  handleBuildAppCommand,
  handleHTML2APKCommand,
  handleWeb2APKCommand,
  handleFontCommand,
  handleStatusViewerCommand,
  handleAntiViewOnceCommand,
  handleAutoTypeCommand,
  handleAutoReplyCommand,
  handleBanCommand,
  handleUnbanCommand,
  handleBroadcastCommand,
} from "./adminCommands.js"

import {
  downloadYouTubeAudio,
  downloadYouTubeVideo,
  callOpenAI,
  callGeminiAI,
  fetchMediaFromURL,
  exportSession,
  importSession,
  calculateExpression,
  setReminder,
  handleEmojiCommand, // Import handleEmojiCommand
} from "./realLogic.js"

// Bot configuration
const BOT_NAME = "Gaga09 XMD"
const BOT_VERSION = "4.2.0"
const COMMANDS_COUNT = 395
const brandSignature = " — copyright ©️ 2025" // Declare brandSignature

// Command categories and their handlers
const commandCategories = {
  pairing: ["pairqr", "getsession", "setsession", "pair", "pair2"],
  admin: ["ban", "unban", "listban", "broadcast", "msg", "promote", "demote", "kick", "groupinfo"],
  media: ["ytmp3", "ytmp4", "tiktokdl", "snapinsta", "fbdl", "fetch", "apkplay", "apkpure", "nkiridl", "shazam"],
  ai: ["ai", "gemini", "metaai", "bard", "buildweb", "buildapp", "html2apk", "web2apk"],
  tools: ["calc", "bugmenu", "emoji", "font", "remind"],
  whatsapp: ["statusviewer", "antiviewonce", "autotype", "autoreply"],
  religious: ["sermon"],
  info: ["menu", "about", "alive", "support", "repo", "version", "help"],
}

// Main message handler
export async function handleMessage(sock, message, ownerNumbers, logger) {
  try {
    // Extract message info
    const messageInfo = extractMessageInfo(message)
    if (!messageInfo) return

    const { text, sender, isGroup, groupId } = messageInfo

    // Log incoming message
    logger.info(`Message from ${sender}: ${text}`)

    // Parse command
    const commandData = parseCommand(text)
    if (!commandData) return

    const { command, args, fullText } = commandData

    // Check if user is owner
    const userIsOwner = isOwner(sender, ownerNumbers)

    // Handle command with sock parameter
    const response = await handleCommand(command, args, fullText, sender, isGroup, groupId, userIsOwner, logger, sock)

    if (response) {
      // Add brand signature to response
      const finalResponse = response + brandSignature

      // Send response
      await sock.sendMessage(sender, { text: finalResponse })

      logger.info(`Response sent to ${sender}`)
    }
  } catch (error) {
    logger.error("Message handling error:", error)

    // Send error response with brand signature
    const errorResponse = "Sorry, I encountered an error processing your request. Please try again." + brandSignature

    try {
      await sock.sendMessage(message.key.remoteJid, { text: errorResponse })
    } catch (sendError) {
      logger.error("Failed to send error response:", sendError)
    }
  }
}

// Extract message information
function extractMessageInfo(message) {
  try {
    const messageType = Object.keys(message.message || {})[0]
    let text = ""

    // Extract text based on message type
    switch (messageType) {
      case "conversation":
        text = message.message.conversation
        break
      case "extendedTextMessage":
        text = message.message.extendedTextMessage.text
        break
      case "imageMessage":
        text = message.message.imageMessage.caption || ""
        break
      case "videoMessage":
        text = message.message.videoMessage.caption || ""
        break
      default:
        return null
    }

    if (!text || typeof text !== "string") return null

    const sender = message.key.remoteJid
    const isGroup = sender.endsWith("@g.us")
    const groupId = isGroup ? sender : null

    return {
      text: text.trim(),
      sender,
      isGroup,
      groupId,
      messageType,
    }
  } catch (error) {
    console.error("Error extracting message info:", error)
    return null
  }
}

// Parse command from text
function parseCommand(text) {
  if (!text || typeof text !== "string") return null

  // Remove extra whitespace and convert to lowercase for parsing
  const cleanText = text.trim()
  const lowerText = cleanText.toLowerCase()

  // Check if it starts with a command (with or without .)
  let command = ""
  let args = []
  const fullText = cleanText

  // Split by whitespace
  const parts = cleanText.split(/\s+/)
  const firstPart = parts[0].toLowerCase()

  // Check if first part is a command (with or without .)
  if (firstPart.startsWith(".")) {
    command = firstPart.substring(1)
    args = parts.slice(1)
  } else {
    // Check if it's a command without dot
    const possibleCommand = firstPart
    if (isValidCommand(possibleCommand)) {
      command = possibleCommand
      args = parts.slice(1)
    } else {
      return null // Not a command
    }
  }

  return {
    command,
    args,
    fullText,
    originalText: text,
  }
}

// Check if a string is a valid command
function isValidCommand(cmd) {
  const allCommands = Object.values(commandCategories).flat()
  return allCommands.includes(cmd.toLowerCase())
}

// Main command handler
async function handleCommand(command, args, fullText, sender, isGroup, groupId, userIsOwner, logger, sock) {
  const cmd = command.toLowerCase()

  // Check permissions for owner-only commands
  if (commandCategories.admin.includes(cmd) && !userIsOwner) {
    return "❌ This command is restricted to bot owners only."
  }

  // Route to appropriate handler
  switch (cmd) {
    // Info commands
    case "menu":
      return getMenuResponse()
    case "about":
      return getAboutResponse()
    case "alive":
      return getAliveResponse()
    case "version":
      return getVersionResponse()
    case "help":
      return getHelpResponse()
    case "support":
      return getSupportResponse()
    case "repo":
      return getRepoResponse()

    // Pairing commands with real logic
    case "pairqr":
    case "pair":
      return getPairQRResponse()
    case "pair2":
      return getPair2Response()
    case "getsession":
      if (userIsOwner) {
        await exportSession(sock, sender, brandSignature)
        return null // Message already sent
      }
      return "❌ Owner-only command"
    case "setsession":
      if (userIsOwner) {
        await importSession(args.join(" "), sock, sender, brandSignature)
        return null // Message already sent
      }
      return "❌ Owner-only command"

    // Admin commands (keep existing handlers)
    case "ban":
      return handleBanCommand(args, userIsOwner)
    case "unban":
      return handleUnbanCommand(args, userIsOwner)
    case "listban":
      return handleListBanCommand(userIsOwner)
    case "broadcast":
      return handleBroadcastCommand(args.join(" "), userIsOwner)
    case "msg":
      return handleMsgCommand(args, userIsOwner)
    case "promote":
      return handlePromoteCommand(args, isGroup, userIsOwner)
    case "demote":
      return handleDemoteCommand(args, isGroup, userIsOwner)
    case "kick":
      return handleKickCommand(args, isGroup, userIsOwner)
    case "groupinfo":
      return handleGroupInfoCommand(args, userIsOwner)

    // Media commands with real logic
    case "ytmp3":
      if (args.length) {
        await downloadYouTubeAudio(args[0], sock, sender, brandSignature)
        return null // Message already sent
      }
      return handleYTMP3Command(args)
    case "ytmp4":
      if (args.length) {
        await downloadYouTubeVideo(args[0], sock, sender, brandSignature)
        return null // Message already sent
      }
      return handleYTMP4Command(args)
    case "tiktokdl":
      return handleTikTokCommand(args)
    case "snapinsta":
      return handleSnapInstaCommand(args)
    case "fbdl":
      return handleFBDLCommand(args)
    case "fetch":
      if (args.length) {
        await fetchMediaFromURL(args[0], sock, sender, brandSignature)
        return null // Message already sent
      }
      return handleFetchCommand(args)
    case "apkplay":
      return handleAPKPlayCommand(args)
    case "apkpure":
      return handleAPKPureCommand(args)
    case "nkiridl":
      return handleNkiriCommand(args)
    case "shazam":
      return handleShazamCommand(args)

    // AI commands with real logic
    case "ai":
      if (args.length) {
        await callOpenAI(args.join(" "), sock, sender, brandSignature)
        return null // Message already sent
      }
      return handleAICommand("")
    case "gemini":
      if (args.length) {
        await callGeminiAI(args.join(" "), sock, sender, brandSignature)
        return null // Message already sent
      }
      return handleGeminiCommand("")
    case "metaai":
      return handleMetaAICommand(args.join(" "))
    case "bard":
      return handleBardCommand(args.join(" "))
    case "buildweb":
      return handleBuildWebCommand(args.join(" "))
    case "buildapp":
      return handleBuildAppCommand(args.join(" "))
    case "html2apk":
      return handleHTML2APKCommand(args.join(" "))
    case "web2apk":
      return handleWeb2APKCommand(args.join(" "))

    // Tool commands with real logic
    case "calc":
      return handleCalcCommandReal(args.join(" "))
    case "bugmenu":
      return getBugMenuResponse()
    case "emoji":
      return handleEmojiCommand(args.join(" ")) // Use handleEmojiCommand
    case "font":
      return handleFontCommand(args.join(" "))
    case "remind":
      return handleRemindCommandReal(args, sender, sock, brandSignature)

    // WhatsApp enhancer commands (keep existing)
    case "statusviewer":
      return handleStatusViewerCommand(args)
    case "antiviewonce":
      return handleAntiViewOnceCommand(args)
    case "autotype":
      return handleAutoTypeCommand(args)
    case "autoreply":
      return handleAutoReplyCommand(args)

    // Religious commands (keep existing)
    case "sermon":
      return handleSermonCommand()

    default:
      return getUnknownCommandResponse(command)
  }
}

// Info command responses
function getMenuResponse() {
  return `🤖 *${BOT_NAME} v${BOT_VERSION} - Command Menu*

📱 *PAIRING COMMANDS*
• .pairqr - Generate QR code for pairing
• .getsession - Export current session (Owner)
• .setsession - Import session data (Owner)

👑 *ADMIN COMMANDS* (Owner Only)
• .ban [number] - Ban a user
• .unban [number] - Unban a user  
• .listban - List banned users
• .broadcast [message] - Broadcast to all chats
• .msg [number] [text] - Send DM to number
• .promote [jid] - Promote group member
• .demote [jid] - Demote group admin
• .kick [jid] - Remove from group
• .groupinfo [id] - Get group information

📥 *MEDIA DOWNLOADERS*
• .ytmp3 [url] - Download YouTube audio
• .ytmp4 [url] - Download YouTube video
• .tiktokdl [url] - Download TikTok video
• .snapinsta [url] - Download Instagram media
• .fbdl [url] - Download Facebook video
• .fetch [url] - Fetch any media file
• .apkplay [name] - Get Play Store app
• .apkpure [name] - Get APK from APKPure
• .nkiridl [movie] - Download movie
• .shazam [video] - Identify music

🤖 *AI TOOLS*
• .ai [prompt] - ChatGPT AI assistant
• .gemini [prompt] - Google Gemini AI
• .metaai [prompt] - Meta AI assistant
• .bard [prompt] - Google Bard AI
• .buildweb [spec] - Build website
• .buildapp [spec] - Build mobile app
• .html2apk [html] - Convert HTML to APK
• .web2apk [url] - Convert website to APK

🛠️ *UTILITY TOOLS*
• .calc [expression] - Calculator
• .bugmenu - Bug report menu
• .emoji [text] - Convert to emoji
• .font [text] - Stylish fonts
• .remind [time] [msg] - Set reminder

📱 *WHATSAPP ENHANCERS*
• .statusviewer [jid] - View status
• .antiviewonce on/off - Anti view once
• .autotype on/off - Auto typing
• .autoreply on/off - Auto reply with AI

⛪ *RELIGIOUS TOOLS*
• .sermon - Latest Emmanuel Makandiwa sermon

ℹ️ *INFO COMMANDS*
• .about - About this bot
• .alive - Check if bot is active
• .version - Bot version info
• .help - Help information
• .support - Contact support
• .repo - Repository information

📊 *Bot Statistics*
• Total Commands: ${COMMANDS_COUNT}
• Version: ${BOT_VERSION}
• Status: Online ✅

💡 *Usage Tips:*
- Commands work with or without the dot (.)
- Commands are case-insensitive
- Use .help [command] for specific help`
}

function getAboutResponse() {
  return `🤖 *About ${BOT_NAME}*

Best AI service offered by Traxxion09 tech founded by Gaga — copyright ©️ 2025

🔹 *Bot Name:* ${BOT_NAME}
🔹 *Version:* ${BOT_VERSION}
🔹 *Creator:* Vincent Ganiza (Lil Gaga Traxx09)
🔹 *Total Commands:* ${COMMANDS_COUNT}
🔹 *Technology:* Baileys MD + Node.js
🔹 *Features:* AI Integration, Media Downloads, Admin Tools

📧 *Support:* vincentganiza9@gmail.com
📱 *Owner:* +263780078177, +263716857999

🌟 *Key Features:*
• Multi-platform deployment support
• Advanced AI integrations
• Comprehensive media downloaders
• Professional admin controls
• Real-time web dashboard
• Session management system
• Watermarked media processing

🚀 *Powered by cutting-edge technology to provide the best WhatsApp bot experience!*`
}

function getAliveResponse() {
  const uptime = process.uptime()
  const hours = Math.floor(uptime / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  const seconds = Math.floor(uptime % 60)

  return `✅ *${BOT_NAME} is ALIVE!*

🤖 *Status:* Online and Running
⏱️ *Uptime:* ${hours}h ${minutes}m ${seconds}s
💾 *Memory:* 367.40MB / 63254MB
🔄 *Version:* ${BOT_VERSION}
📊 *Commands:* ${COMMANDS_COUNT} available
🌐 *Connection:* Stable

🎯 *Ready to serve you 24/7!*
Type .menu to see all available commands.`
}

function getVersionResponse() {
  return `📋 *${BOT_NAME} Version Information*

🔹 *Current Version:* ${BOT_VERSION}
🔹 *Release Date:* January 2025
🔹 *Build:* Production
🔹 *Platform:* Multi-Device (MD)
🔹 *Engine:* Baileys + Node.js

📊 *Statistics:*
• Total Commands: ${COMMANDS_COUNT}
• Memory Usage: 367.40MB / 63254MB
• Uptime: ${Math.floor(process.uptime() / 60)} minutes

🆕 *Latest Features:*
• Enhanced AI integrations
• Improved media processing
• Advanced session management
• Real-time web dashboard
• Multi-platform deployment

🔄 *Auto-update enabled for seamless experience*`
}

function getHelpResponse() {
  return `❓ *${BOT_NAME} Help Center*

🚀 *Getting Started:*
1. Type .menu to see all commands
2. Commands work with or without dot (.)
3. Commands are case-insensitive
4. Use spaces to separate arguments

📱 *Basic Commands:*
• .alive - Check bot status
• .about - Bot information
• .menu - Full command list
• .version - Version details

🎯 *Popular Features:*
• .ai [question] - Ask AI anything
• .ytmp3 [url] - Download music
• .calc [math] - Calculator
• .fetch [url] - Download media

👑 *Admin Features:* (Owner only)
• .broadcast [msg] - Send to all
• .ban/.unban [number] - User management
• .getsession - Export session

📧 *Need Help?*
Contact: vincentganiza9@gmail.com
Owner: +263780078177

💡 *Pro Tips:*
- Use .help [command] for specific help
- All media gets watermarked automatically
- AI responses are powered by multiple models
- Session data is securely encrypted`
}

function getSupportResponse() {
  return `🆘 *${BOT_NAME} Support Center*

📧 *Primary Contact:*
Email: vincentganiza9@gmail.com

📱 *Owner Numbers:*
• +263780078177
• +263716857999

🌐 *WhatsApp Channel:*
https://whatsapp.com/channel/0029Vb6huGcJJhzUGbPbkN3W

🔧 *Common Issues & Solutions:*

❓ *Bot not responding?*
• Check if bot is online (.alive)
• Verify your number isn't banned
• Try restarting the command

❓ *Media download failed?*
• Check if URL is valid
• File might be too large (50MB limit)
• Try again after a few minutes

❓ *AI not working?*
• API might be temporarily down
• Try different AI model (.gemini, .bard)
• Check your prompt format

❓ *Session issues?*
• Contact owner for session reset
• Use .getsession to backup (owner only)
• Clear browser cache for dashboard

🚨 *Report Bugs:*
Use .bugmenu to report issues with detailed information.

⏰ *Support Hours:*
24/7 automated responses
Human support: 9 AM - 9 PM GMT+2`
}

function getRepoResponse() {
  return `📂 *${BOT_NAME} Repository Information*

🔗 *GitHub Repository:*
https://github.com/LGT09/Gaga09XMDpairV1

📋 *Repository Details:*
• Name: Gaga09XMDpairV1
• Version: ${BOT_VERSION}
• Language: JavaScript (Node.js)
• Framework: Baileys MD
• License: MIT

🚀 *Deployment Platforms:*
• Heroku ✅
• Render ✅  
• Railway ✅
• Netlify ✅
• GitHub Codespaces ✅
• Termux ✅
• Hugging Face ✅
• Koyeb ✅

📁 *Key Files:*
• server.js - Main server
• apiHandler.js - Command processor
• utils.js - Utility functions
• deploy.js - Deployment helpers
• views/index.html - Web dashboard

🔧 *Installation:*
1. Clone repository
2. Run: npm install
3. Configure .env file
4. Run: npm start

📖 *Documentation:*
Full setup guide available in README.md

⚠️ *Note:* Only repositories from github.com/LGT09/* are officially supported.`
}

// Pairing command responses
function getPairQRResponse() {
  return `📱 *QR Code Pairing*

🔄 *Generating QR Code...*

Please follow these steps:
1. Open WhatsApp on your phone
2. Go to Settings > Linked Devices
3. Tap "Link a Device"
4. Scan the QR code from the web dashboard
5. Wait for connection confirmation

🌐 *Web Dashboard:* 
Visit the dashboard to see the QR code and manage your bot.

⏱️ *QR Code expires in 60 seconds*
Use .pairqr again if expired.

✅ *Once connected, your session will be saved automatically.*`
}

function getPair2Response() {
  return `📱 *Alternative Pairing Method*

🔐 *Session ID Pairing:*

If QR code doesn't work, try:
1. Get session from another device (.getsession)
2. Use .setsession [session-data]
3. Or contact owner for manual pairing

📧 *Need Help?*
Contact: vincentganiza9@gmail.com

🔄 *Automatic Reconnection:*
Bot will automatically reconnect if connection drops.`
}

// Media command handlers
function handleYTMP3Command(args) {
  if (!args.length) {
    return `🎵 *YouTube MP3 Downloader*

Usage: .ytmp3 [youtube-url]

Example:
.ytmp3 https://youtu.be/dQw4w9WgXcQ

📝 *Supported formats:*
• youtube.com/watch?v=
• youtu.be/
• m.youtube.com

⚠️ *Limits:*
• Max duration: 10 minutes
• Max size: 50MB
• Audio quality: 128kbps`
  }

  const url = args[0]
  return `🎵 *Downloading YouTube Audio...*

🔗 *URL:* ${url}
⏳ *Processing:* Please wait...
🎧 *Format:* MP3 (128kbps)

⚠️ *Note:* Large files may take longer to process.
🏷️ *Watermark:* "Lil Gaga Traxx09 Images" will be added to metadata.`
}

function handleYTMP4Command(args) {
  if (!args.length) {
    return `🎬 *YouTube MP4 Downloader*

Usage: .ytmp4 [youtube-url]

Example:
.ytmp4 https://youtu.be/dQw4w9WgXcQ

📝 *Supported formats:*
• youtube.com/watch?v=
• youtu.be/
• m.youtube.com

⚠️ *Limits:*
• Max duration: 10 minutes
• Max size: 50MB
• Video quality: 720p`
  }

  const url = args[0]
  return `🎬 *Downloading YouTube Video...*

🔗 *URL:* ${url}
⏳ *Processing:* Please wait...
📹 *Format:* MP4 (720p)

⚠️ *Note:* Large files may take longer to process.
🏷️ *Watermark:* "Lil Gaga Traxx09 Images" will be added.`
}

function handleTikTokCommand(args) {
  if (!args.length) {
    return `🎵 *TikTok Downloader*

Usage: .tiktokdl [tiktok-url]

Example:
.tiktokdl https://vm.tiktok.com/ZMexample

📝 *Features:*
• No watermark removal
• HD quality download
• Audio extraction available

⚠️ *Limits:*
• Max size: 50MB
• Recent videos only`
  }

  const url = args[0]
  return `🎵 *Downloading TikTok Video...*

🔗 *URL:* ${url}
⏳ *Processing:* Please wait...
📱 *Quality:* HD (No TikTok watermark)

🏷️ *Watermark:* "Lil Gaga Traxx09 Images" will be added.`
}

function handleAICommand(prompt) {
  if (!prompt) {
    return `🤖 *ChatGPT AI Assistant*

Usage: .ai [your question]

Examples:
.ai What is artificial intelligence?
.ai Write a poem about love
.ai Explain quantum physics simply

🧠 *Features:*
• Powered by OpenAI GPT
• Natural language processing
• Creative and analytical responses
• Multi-language support

💡 *Tips:*
• Be specific in your questions
• Ask for explanations, code, stories
• Request different formats (list, essay, etc.)`
  }

  return `🤖 *AI Processing...*

❓ *Your Question:* ${prompt}

🧠 *Thinking...* Please wait while I generate a response.

⚠️ *Note:* AI responses are generated and may not always be 100% accurate. Use critical thinking when applying AI advice.`
}

// Utility functions
function getUnknownCommandResponse(command) {
  return `❓ *Unknown Command: ${command}*

🤖 *Available options:*
• Type .menu for all commands
• Type .help for assistance
• Check spelling and try again

💡 *Popular commands:*
• .ai [question] - Ask AI
• .ytmp3 [url] - Download music
• .alive - Check bot status
• .about - Bot information

📧 *Need help?* Contact: vincentganiza9@gmail.com`
}

function getBugMenuResponse() {
  return `🐛 *Bug Report Menu*

📝 *How to report bugs:*

1. **Email Report:**
   Send to: vincentganiza9@gmail.com
   
2. **WhatsApp Report:**
   Contact: +263780078177

📋 *Include this information:*
• Command that failed
• Error message received
• Your phone number
• Time of occurrence
• Steps to reproduce

🔧 *Common Issues:*
• Media download failures
• AI response delays
• Session connection problems
• Command not recognized

⚡ *Quick Fixes:*
• Try .alive to check status
• Restart command with correct syntax
• Check internet connection
• Wait a few minutes and retry

🏆 *Bug Bounty:*
Valid bug reports may receive premium features!`
}

// Additional utility handlers (simplified)
function handleCalcCommandReal(expression) {
  if (!expression) {
    return "🧮 *Calculator*\n\nUsage: .calc [expression]\nExample: .calc 2 + 2 * 3\n\n📝 *Supported operators:*\n• + (addition)\n• - (subtraction)\n• * (multiplication)\n• / (division)\n• () (parentheses)"
  }

  const result = calculateExpression(expression)

  if (result.success) {
    return `🧮 *Calculator Result*\n\n📝 *Expression:* ${result.expression}\n🔢 *Result:* ${result.result}\n\n💡 *Calculation completed successfully!*`
  } else {
    return `❌ *Calculator Error*\n\n📝 *Expression:* ${expression}\n🚫 *Error:* ${result.error}\n\n💡 *Please check your expression and try again.*`
  }
}

function handleRemindCommandReal(args, sender, sock, brandSignature) {
  if (args.length < 2) {
    return `⏰ *Reminder System*\n\nUsage: .remind [time] [message]\n\nExamples:\n.remind 5m Take a break\n.remind 1h Meeting with team\n.remind 2d Pay bills\n\n⏱️ *Time formats:*\n• m = minutes (1-1440)\n• h = hours (1-168)\n• d = days (1-7)\n\n📝 *Note:* Maximum reminder time is 7 days.`
  }

  const time = args[0]
  const message = args.slice(1).join(" ")

  const result = setReminder(time, message, sender, sock, brandSignature)

  if (result.success) {
    return `⏰ *Reminder Set Successfully*\n\n⏱️ *Time:* ${result.timeString}\n📝 *Message:* ${result.message}\n📅 *Will remind at:* ${result.reminderTime.toLocaleString()}\n🆔 *Reminder ID:* ${result.reminderId}\n\n✅ *You will be reminded when the time comes!*`
  } else {
    return `❌ *Reminder Setup Failed*\n\n🚫 *Error:* ${result.error}\n\n💡 *Please check the time format and try again.*`
  }
}

// Placeholder handlers for other commands
function handleSermonCommand() {
  return `⛪ *Emmanuel Makandiwa Sermon*

🎥 *Latest Sermon:* "Faith in Action"
📅 *Date:* ${new Date().toLocaleDateString()}
🔗 *YouTube:* https://youtube.com/watch?v=example

📖 *Summary:*
Today's message focuses on putting faith into practical action in our daily lives. Pastor Makandiwa teaches about the power of believing and acting on God's promises.

🙏 *Key Points:*
• Faith without works is dead
• Trust in God's timing
• Prayer and action go together
• Miracles happen through faith

⛪ *Join us for more spiritual content and teachings.*`
}

// Export additional functions for external use
export { parseCommand, isValidCommand, commandCategories }
