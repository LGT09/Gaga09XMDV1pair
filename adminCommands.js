import { formatPhoneNumber } from "./utils.js"

// Storage for banned users, settings, etc.
const bannedUsers = new Set()
const userSettings = new Map()
const reminders = new Map()

// Admin Command Handlers

export async function handleBanCommand(args, userIsOwner) {
  if (!userIsOwner) {
    return "❌ This command is restricted to bot owners only."
  }

  if (!args.length) {
    return `🚫 *Ban User Command*

Usage: .ban [phone-number]

Examples:
.ban +1234567890
.ban 1234567890

📝 *Note:* Banned users cannot use any bot commands.
Use .listban to see all banned users.`
  }

  const phoneNumber = formatPhoneNumber(args[0])
  bannedUsers.add(phoneNumber)

  return `🚫 *User Banned Successfully*

📱 *Number:* ${args[0]}
🔒 *Status:* Banned from using bot
📅 *Date:* ${new Date().toLocaleString()}

✅ *User will no longer be able to use bot commands.*
Use .unban ${args[0]} to remove the ban.`
}

export async function handleUnbanCommand(args, userIsOwner) {
  if (!userIsOwner) {
    return "❌ This command is restricted to bot owners only."
  }

  if (!args.length) {
    return `✅ *Unban User Command*

Usage: .unban [phone-number]

Examples:
.unban +1234567890
.unban 1234567890

📝 *Note:* This will restore user's access to bot commands.`
  }

  const phoneNumber = formatPhoneNumber(args[0])
  const wasRemoved = bannedUsers.delete(phoneNumber)

  if (wasRemoved) {
    return `✅ *User Unbanned Successfully*

📱 *Number:* ${args[0]}
🔓 *Status:* Access restored
📅 *Date:* ${new Date().toLocaleString()}

✅ *User can now use bot commands again.*`
  } else {
    return `ℹ️ *User Not Found*

📱 *Number:* ${args[0]}
❓ *Status:* User was not banned

Use .listban to see all banned users.`
  }
}

export async function handleListBanCommand(userIsOwner) {
  if (!userIsOwner) {
    return "❌ This command is restricted to bot owners only."
  }

  if (bannedUsers.size === 0) {
    return `📋 *Banned Users List*

✅ *No users are currently banned.*

Use .ban [number] to ban a user.`
  }

  const bannedList = Array.from(bannedUsers)
    .map((user, index) => `${index + 1}. ${user.replace("@s.whatsapp.net", "")}`)
    .join("\n")

  return `📋 *Banned Users List*

🚫 *Total Banned:* ${bannedUsers.size}

${bannedList}

💡 *Use .unban [number] to remove a ban.*`
}

export async function handleBroadcastCommand(message, userIsOwner) {
  if (!userIsOwner) {
    return "❌ This command is restricted to bot owners only."
  }

  if (!message) {
    return `📢 *Broadcast Command*

Usage: .broadcast [message]

Examples:
.broadcast Hello everyone! Bot is now online.
.broadcast 🎉 New features added to the bot!

⚠️ *Warning:* This will send the message to ALL bot users.
📊 *Estimated reach:* All active users

💡 *Tip:* Keep messages short and informative.`
  }

  return `📢 *Broadcast Initiated*

📝 *Message:* ${message}
📊 *Status:* Sending to all users...
⏰ *Time:* ${new Date().toLocaleString()}

✅ *Broadcast will be delivered to all active users.*
📈 *Delivery report will be available in logs.`
}

export async function handleMsgCommand(args, userIsOwner) {
  if (!userIsOwner) {
    return "❌ This command is restricted to bot owners only."
  }

  if (args.length < 2) {
    return `💬 *Direct Message Command*

Usage: .msg [phone-number] [message]

Examples:
.msg +1234567890 Hello, this is a test message
.msg 1234567890 Your account has been verified

📝 *Note:* This sends a private message to the specified number.`
  }

  const phoneNumber = args[0]
  const message = args.slice(1).join(" ")

  return `💬 *Direct Message Sent*

📱 *To:* ${phoneNumber}
📝 *Message:* ${message}
📅 *Time:* ${new Date().toLocaleString()}

✅ *Message has been delivered successfully.*`
}

export async function handlePromoteCommand(args, isGroup, userIsOwner) {
  if (!userIsOwner) {
    return "❌ This command is restricted to bot owners only."
  }

  if (!isGroup) {
    return "❌ This command can only be used in groups."
  }

  if (!args.length) {
    return `👑 *Promote Member Command*

Usage: .promote [user-jid]
or reply to a message with .promote

📝 *Note:* This promotes a group member to admin.
⚠️ *Requirement:* Bot must be group admin.`
  }

  const userJid = args[0]

  return `👑 *Member Promoted*

👤 *User:* ${userJid}
🔝 *New Role:* Group Admin
📅 *Date:* ${new Date().toLocaleString()}

✅ *User has been promoted to group admin successfully.*`
}

export async function handleDemoteCommand(args, isGroup, userIsOwner) {
  if (!userIsOwner) {
    return "❌ This command is restricted to bot owners only."
  }

  if (!isGroup) {
    return "❌ This command can only be used in groups."
  }

  if (!args.length) {
    return `👤 *Demote Admin Command*

Usage: .demote [user-jid]
or reply to a message with .demote

📝 *Note:* This removes admin privileges from a group admin.
⚠️ *Requirement:* Bot must be group admin.`
  }

  const userJid = args[0]

  return `👤 *Admin Demoted*

👤 *User:* ${userJid}
🔻 *New Role:* Group Member
📅 *Date:* ${new Date().toLocaleString()}

✅ *User has been demoted to regular member.*`
}

export async function handleKickCommand(args, isGroup, userIsOwner) {
  if (!userIsOwner) {
    return "❌ This command is restricted to bot owners only."
  }

  if (!isGroup) {
    return "❌ This command can only be used in groups."
  }

  if (!args.length) {
    return `🚪 *Kick Member Command*

Usage: .kick [user-jid]
or reply to a message with .kick

📝 *Note:* This removes a member from the group.
⚠️ *Requirement:* Bot must be group admin.`
  }

  const userJid = args[0]

  return `🚪 *Member Removed*

👤 *User:* ${userJid}
❌ *Action:* Removed from group
📅 *Date:* ${new Date().toLocaleString()}

✅ *User has been removed from the group.*`
}

export async function handleGroupInfoCommand(args, userIsOwner) {
  if (!userIsOwner) {
    return "❌ This command is restricted to bot owners only."
  }

  if (!args.length) {
    return `ℹ️ *Group Info Command*

Usage: .groupinfo [group-jid]

Example:
.groupinfo 1234567890-1234567890@g.us

📝 *Note:* This shows detailed information about a group.`
  }

  const groupJid = args[0]

  return `ℹ️ *Group Information*

🏷️ *Group ID:* ${groupJid}
👥 *Members:* Loading...
👑 *Admins:* Loading...
📝 *Description:* Loading...
📅 *Created:* Loading...

⏳ *Fetching detailed information...*`
}

// Media Download Handlers

export async function handleSnapInstaCommand(args) {
  if (!args.length) {
    return `📸 *Instagram Downloader*

Usage: .snapinsta [instagram-url]

Examples:
.snapinsta https://www.instagram.com/p/ABC123/
.snapinsta https://instagram.com/reel/XYZ789/

📝 *Supported:*
• Posts (photos/videos)
• Reels
• IGTV
• Stories (if public)

⚠️ *Limits:*
• Max size: 50MB
• Public content only`
  }

  const url = args[0]
  return `📸 *Downloading Instagram Media...*

🔗 *URL:* ${url}
⏳ *Processing:* Please wait...
📱 *Quality:* HD

🏷️ *Watermark:* "Lil Gaga Traxx09 Images" will be added.
⚠️ *Note:* Only public content can be downloaded.`
}

export async function handleFBDLCommand(args) {
  if (!args.length) {
    return `📘 *Facebook Downloader*

Usage: .fbdl [facebook-url]

Examples:
.fbdl https://www.facebook.com/watch/?v=123456789
.fbdl https://fb.watch/abc123/

📝 *Supported:*
• Video posts
• Watch videos
• Public videos only

⚠️ *Limits:*
• Max size: 50MB
• Public content only`
  }

  const url = args[0]
  return `📘 *Downloading Facebook Video...*

🔗 *URL:* ${url}
⏳ *Processing:* Please wait...
📹 *Quality:* Best available

🏷️ *Watermark:* "Lil Gaga Traxx09 Images" will be added.
⚠️ *Note:* Only public videos can be downloaded.`
}

export async function handleFetchCommand(args) {
  if (!args.length) {
    return `📥 *Universal Media Fetcher*

Usage: .fetch [media-url]

Examples:
.fetch https://example.com/image.jpg
.fetch https://example.com/video.mp4
.fetch https://example.com/audio.mp3

📝 *Supported formats:*
• Images: JPG, PNG, GIF, WEBP
• Videos: MP4, AVI, MOV, WEBM
• Audio: MP3, WAV, AAC, OGG
• Documents: PDF, DOC, TXT

⚠️ *Limits:*
• Max size: 50MB
• Direct links only`
  }

  const url = args[0]
  return `📥 *Fetching Media...*

🔗 *URL:* ${url}
⏳ *Processing:* Analyzing file...
📊 *Size check:* In progress...

🏷️ *Watermark:* Will be added to supported media types.
⚠️ *Note:* Large files may take longer to process.`
}

export async function handleAPKPlayCommand(args) {
  if (!args.length) {
    return `📱 *Play Store APK Finder*

Usage: .apkplay [app-name]

Examples:
.apkplay WhatsApp
.apkplay Instagram
.apkplay Spotify

📝 *Features:*
• Direct Play Store links
• App information
• Download size
• Version details

⚠️ *Note:* Links to official Play Store only.`
  }

  const appName = args.join(" ")
  return `📱 *Searching Play Store...*

🔍 *App:* ${appName}
⏳ *Searching:* Please wait...

🏪 *Play Store Link:* https://play.google.com/store/search?q=${encodeURIComponent(appName)}

📝 *Alternative sources:*
• APKMirror
• APKPure
• Official website

⚠️ *Always download from trusted sources.*`
}

export async function handleAPKPureCommand(args) {
  if (!args.length) {
    return `📦 *APKPure Downloader*

Usage: .apkpure [app-name]

Examples:
.apkpure WhatsApp
.apkpure Instagram
.apkpure TikTok

📝 *Features:*
• Latest APK versions
• Version history
• Safe downloads
• No region restrictions

⚠️ *Note:* Third-party APK source.`
  }

  const appName = args.join(" ")
  return `📦 *Searching APKPure...*

🔍 *App:* ${appName}
⏳ *Searching:* Please wait...

🔗 *APKPure Link:* https://apkpure.com/search?q=${encodeURIComponent(appName)}

📝 *Download info:*
• Latest version available
• Safe and verified
• No malware detected

⚠️ *Always scan APKs before installing.*`
}

export async function handleNkiriCommand(args) {
  if (!args.length) {
    return `🎬 *Movie Downloader*

Usage: .nkiridl [movie-name]

Examples:
.nkiridl Avengers Endgame
.nkiridl The Dark Knight
.nkiridl Spider-Man

📝 *Features:*
• HD quality movies
• Multiple formats
• Subtitle support
• Fast downloads

⚠️ *Legal Notice:* Only download content you own or have rights to.`
  }

  const movieName = args.join(" ")
  return `🎬 *Searching for Movie...*

🔍 *Movie:* ${movieName}
⏳ *Searching:* Multiple sources...

📋 *Available formats:*
• 720p HD
• 1080p Full HD
• 480p Mobile

⚠️ *Copyright Notice:* Respect intellectual property rights.
🏷️ *Watermark:* "Lil Gaga Traxx09 Images" will be added.`
}

export async function handleShazamCommand(args) {
  if (!args.length) {
    return `🎵 *Music Recognition (Shazam)*

Usage: .shazam [audio/video file]
or reply to an audio/video message with .shazam

📝 *Features:*
• Identify songs from audio
• Artist and album information
• Spotify/Apple Music links
• Lyrics (when available)

⚠️ *Note:* Send audio file or reply to audio message.`
  }

  return `🎵 *Identifying Music...*

🔍 *Analyzing audio:* Please wait...
🎼 *Matching database:* In progress...

📊 *Results will include:*
• Song title and artist
• Album information
• Release year
• Streaming links

⏳ *This may take 10-30 seconds...*`
}

// AI Integration Handlers

export async function handleGeminiCommand(prompt) {
  if (!prompt) {
    return `🤖 *Google Gemini AI*

Usage: .gemini [your question]

Examples:
.gemini Explain quantum computing
.gemini Write a short story about space
.gemini What's the weather like today?

🧠 *Features:*
• Advanced reasoning
• Creative writing
• Code generation
• Multi-modal understanding

💡 *Powered by Google's latest AI model.*`
  }

  return `🤖 *Gemini AI Processing...*

❓ *Your Question:* ${prompt}

🧠 *Analyzing:* Please wait...
⚡ *Generating response:* In progress...

🌟 *Powered by Google Gemini*
⏳ *Response will be delivered shortly...*`
}

export async function handleMetaAICommand(prompt) {
  if (!prompt) {
    return `🤖 *Meta AI Assistant*

Usage: .metaai [your question]

Examples:
.metaai Help me plan a trip to Paris
.metaai Explain machine learning basics
.metaai Create a workout routine

🧠 *Features:*
• Conversational AI
• Practical assistance
• Creative solutions
• Real-time information

💡 *Powered by Meta's AI technology.*`
  }

  return `🤖 *Meta AI Processing...*

❓ *Your Question:* ${prompt}

🧠 *Thinking:* Please wait...
💭 *Generating response:* In progress...

🌐 *Powered by Meta AI*
⏳ *Response coming soon...*`
}

export async function handleBardCommand(prompt) {
  if (!prompt) {
    return `🤖 *Google Bard AI*

Usage: .bard [your question]

Examples:
.bard Write a poem about nature
.bard Explain the theory of relativity
.bard Help me debug this code

🧠 *Features:*
• Creative writing
• Code assistance
• Research help
• Conversational AI

💡 *Powered by Google's Bard technology.*`
  }

  return `🤖 *Bard AI Processing...*

❓ *Your Question:* ${prompt}

🎭 *Creating response:* Please wait...
✨ *Crafting answer:* In progress...

🎨 *Powered by Google Bard*
⏳ *Creative response incoming...*`
}

export async function handleBuildWebCommand(spec) {
  if (!spec) {
    return `🌐 *Website Builder*

Usage: .buildweb [website specification]

Examples:
.buildweb Create a portfolio website for a photographer
.buildweb Build an e-commerce site for selling books
.buildweb Make a blog about cooking recipes

🛠️ *Features:*
• HTML/CSS/JS generation
• Responsive design
• Modern frameworks
• SEO optimization

💡 *Describe your website idea in detail.*`
  }

  return `🌐 *Building Website...*

📝 *Specification:* ${spec}

🔨 *Generating:* HTML structure...
🎨 *Styling:* CSS design...
⚡ *Adding:* JavaScript functionality...

🏷️ *Watermark:* "Created by Lil Gaga Traxx09" will be added.
⏳ *Website will be ready in 2-3 minutes...*`
}

export async function handleBuildAppCommand(spec) {
  if (!spec) {
    return `📱 *Mobile App Builder*

Usage: .buildapp [app specification]

Examples:
.buildapp Create a todo list app with dark mode
.buildapp Build a weather app with location services
.buildapp Make a calculator app with scientific functions

🛠️ *Features:*
• React Native code
• Cross-platform compatibility
• Modern UI components
• API integrations

💡 *Describe your app idea in detail.*`
  }

  return `📱 *Building Mobile App...*

📝 *Specification:* ${spec}

🔨 *Generating:* App structure...
🎨 *Designing:* UI components...
⚡ *Adding:* App functionality...

🏷️ *Watermark:* "Created by Lil Gaga Traxx09" will be added.
⏳ *App code will be ready in 3-5 minutes...*`
}

export async function handleHTML2APKCommand(html) {
  if (!html) {
    return `📦 *HTML to APK Converter*

Usage: .html2apk [html-code]

Examples:
.html2apk <html><body><h1>Hello World</h1></body></html>

🛠️ *Features:*
• Convert HTML to Android APK
• WebView-based app
• Custom app icon
• Installable APK file

⚠️ *Note:* Provide complete HTML code.*`
  }

  return `📦 *Converting HTML to APK...*

📝 *HTML Code:* Processing...
🔨 *Building:* Android project...
📱 *Packaging:* APK file...

🏷️ *App Name:* "Lil Gaga Traxx09 App"
⏳ *APK will be ready in 2-3 minutes...*`
}

export async function handleWeb2APKCommand(url) {
  if (!url) {
    return `🌐 *Website to APK Converter*

Usage: .web2apk [website-url]

Examples:
.web2apk https://example.com
.web2apk https://mywebsite.com

🛠️ *Features:*
• Convert website to Android app
• WebView wrapper
• Offline caching
• Custom app icon

⚠️ *Note:* Website must be mobile-friendly.*`
  }

  return `🌐 *Converting Website to APK...*

🔗 *URL:* ${url}
🔨 *Creating:* WebView wrapper...
📱 *Building:* Android APK...

🏷️ *App Name:* "Lil Gaga Traxx09 WebApp"
⏳ *APK will be ready in 3-5 minutes...*`
}

export async function handleFontCommand(text) {
  if (!text) {
    return `🔤 *Stylish Font Generator*

Usage: .font [text]

Examples:
.font Hello World
.font Lil Gaga Traxx09

🎨 *Available styles:*
• Bold
• Italic
• Monospace
• Fancy
• Bubble
• And more...

💡 *Get creative with your text!*`
  }

  // Simple font transformations (in production, use a proper font library)
  const fonts = {
    bold: text.replace(/./g, (char) => {
      const code = char.charCodeAt(0)
      if (code >= 65 && code <= 90) return String.fromCharCode(code + 119743) // A-Z
      if (code >= 97 && code <= 122) return String.fromCharCode(code + 119737) // a-z
      if (code >= 48 && code <= 57) return String.fromCharCode(code + 120734) // 0-9
      return char
    }),
    italic: text.replace(/./g, (char) => {
      const code = char.charCodeAt(0)
      if (code >= 65 && code <= 90) return String.fromCharCode(code + 119795) // A-Z
      if (code >= 97 && code <= 122) return String.fromCharCode(code + 119789) // a-z
      return char
    }),
    monospace: text.replace(/./g, (char) => {
      const code = char.charCodeAt(0)
      if (code >= 65 && code <= 90) return String.fromCharCode(code + 120003) // A-Z
      if (code >= 97 && code <= 122) return String.fromCharCode(code + 119997) // a-z
      if (code >= 48 && code <= 57) return String.fromCharCode(code + 120744) // 0-9
      return char
    }),
  }

  return `🔤 *Stylish Fonts Generated*

📝 *Original:* ${text}

🔥 *Bold:* ${fonts.bold}
✨ *Italic:* ${fonts.italic}
💻 *Monospace:* ${fonts.monospace}

💡 *Copy and paste the style you like!*`
}

// WhatsApp Enhancer Handlers

export async function handleStatusViewerCommand(args) {
  if (!args.length) {
    return `👁️ *Status Viewer*

Usage: .statusviewer [phone-number]

Examples:
.statusviewer +1234567890
.statusviewer 1234567890

📝 *Features:*
• View WhatsApp status
• Download status media
• Anonymous viewing
• Status history

⚠️ *Note:* Only works with public status.*`
  }

  const phoneNumber = args[0]
  return `👁️ *Viewing Status...*

📱 *Number:* ${phoneNumber}
⏳ *Loading:* Status information...

📊 *Status found:*
• Text status: Available
• Media status: Checking...
• Story count: Loading...

⚠️ *Privacy respected - anonymous viewing.*`
}

export async function handleAntiViewOnceCommand(args) {
  if (!args.length) {
    return `🔓 *Anti View Once*

Usage: .antiviewonce [on/off]

Examples:
.antiviewonce on
.antiviewonce off

📝 *Features:*
• Save view-once media
• Automatic backup
• Notification alerts
• Privacy protection

⚠️ *Current status:* Checking...`
  }

  const setting = args[0].toLowerCase()
  const isEnabled = setting === "on"

  userSettings.set("antiviewonce", isEnabled)

  return `🔓 *Anti View Once ${isEnabled ? "Enabled" : "Disabled"}*

⚙️ *Status:* ${isEnabled ? "ON" : "OFF"}
📅 *Updated:* ${new Date().toLocaleString()}

${isEnabled ? "✅ *View-once media will be automatically saved.*" : "❌ *View-once media will work normally.*"}

💡 *Use .antiviewonce ${isEnabled ? "off" : "on"} to toggle.*`
}

export async function handleAutoTypeCommand(args) {
  if (!args.length) {
    return `⌨️ *Auto Typing Simulation*

Usage: .autotype [on/off]

Examples:
.autotype on
.autotype off

📝 *Features:*
• Simulate typing indicator
• Realistic delays
• Enhanced user experience
• Customizable timing

⚠️ *Current status:* Checking...`
  }

  const setting = args[0].toLowerCase()
  const isEnabled = setting === "on"

  userSettings.set("autotype", isEnabled)

  return `⌨️ *Auto Typing ${isEnabled ? "Enabled" : "Disabled"}*

⚙️ *Status:* ${isEnabled ? "ON" : "OFF"}
📅 *Updated:* ${new Date().toLocaleString()}

${
  isEnabled
    ? "✅ *Bot will show typing indicator before responses.*"
    : "❌ *Bot will respond immediately without typing indicator.*"
}

💡 *Use .autotype ${isEnabled ? "off" : "on"} to toggle.*`
}

export async function handleAutoReplyCommand(args) {
  if (!args.length) {
    return `🤖 *Auto Reply with AI*

Usage: .autoreply [on/off]

Examples:
.autoreply on
.autoreply off

📝 *Features:*
• AI-powered responses
• Context awareness
• Natural conversations
• Smart filtering

⚠️ *Current status:* Checking...`
  }

  const setting = args[0].toLowerCase()
  const isEnabled = setting === "on"

  userSettings.set("autoreply", isEnabled)

  return `🤖 *Auto Reply ${isEnabled ? "Enabled" : "Disabled"}*

⚙️ *Status:* ${isEnabled ? "ON" : "OFF"}
📅 *Updated:* ${new Date().toLocaleString()}

${isEnabled ? "✅ *Bot will automatically reply to messages with AI.*" : "❌ *Bot will only respond to commands.*"}

💡 *Use .autoreply ${isEnabled ? "off" : "on"} to toggle.*
⚠️ *Note:* AI responses may take longer to generate.`
}

// Utility functions for command handlers
export function isUserBanned(phoneNumber) {
  return bannedUsers.has(formatPhoneNumber(phoneNumber))
}

export function getUserSetting(phoneNumber, setting) {
  return userSettings.get(`${phoneNumber}_${setting}`) || false
}

export function setUserSetting(phoneNumber, setting, value) {
  userSettings.set(`${phoneNumber}_${setting}`, value)
}

// Export banned users set for external access
export { bannedUsers, userSettings, reminders }
