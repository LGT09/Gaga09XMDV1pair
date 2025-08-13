import ytdl from "ytdl-core"
import axios from "axios"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { watermarkImage, watermarkVideo } from "./utils.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Real YouTube Download Logic
export async function downloadYouTubeAudio(url, sock, sender, brandSignature) {
  try {
    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return await sock.sendMessage(sender, {
        text: `❌ Invalid YouTube URL provided.${brandSignature}`,
      })
    }

    // Get video info
    const info = await ytdl.getInfo(url)
    const title = info.videoDetails.title
    const duration = Number.parseInt(info.videoDetails.lengthSeconds)

    // Check duration limit (10 minutes = 600 seconds)
    if (duration > 600) {
      return await sock.sendMessage(sender, {
        text: `❌ Video too long! Maximum duration is 10 minutes.\nVideo duration: ${Math.floor(duration / 60)}:${duration % 60}${brandSignature}`,
      })
    }

    // Send processing message
    await sock.sendMessage(sender, {
      text: `🎵 *Downloading: ${title}*\n\n⏳ Processing audio... Please wait.${brandSignature}`,
    })

    // Download audio
    const audioPath = path.join(__dirname, "temp", `${Date.now()}.mp3`)
    const audioStream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
    })

    // Ensure temp directory exists
    const tempDir = path.dirname(audioPath)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Save audio file
    const writeStream = fs.createWriteStream(audioPath)
    audioStream.pipe(writeStream)

    return new Promise((resolve, reject) => {
      writeStream.on("finish", async () => {
        try {
          // Send audio file
          await sock.sendMessage(sender, {
            audio: { url: audioPath },
            mimetype: "audio/mpeg",
            ptt: false,
            contextInfo: {
              externalAdReply: {
                title: title,
                body: "Lil Gaga Traxx09 Images",
                thumbnailUrl: info.videoDetails.thumbnails[0]?.url,
                sourceUrl: url,
                mediaType: 2,
                renderLargerThumbnail: true,
              },
            },
          })

          // Clean up temp file
          fs.unlinkSync(audioPath)

          await sock.sendMessage(sender, {
            text: `✅ *Audio Downloaded Successfully!*\n\n🎵 *Title:* ${title}\n⏱️ *Duration:* ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}${brandSignature}`,
          })

          resolve()
        } catch (error) {
          console.error("Error sending audio:", error)
          fs.unlinkSync(audioPath) // Clean up on error
          reject(error)
        }
      })

      writeStream.on("error", (error) => {
        console.error("Error writing audio file:", error)
        reject(error)
      })
    })
  } catch (error) {
    console.error("YouTube download error:", error)
    return await sock.sendMessage(sender, {
      text: `❌ Failed to download audio. Please try again later.\n\nError: ${error.message}${brandSignature}`,
    })
  }
}

export async function downloadYouTubeVideo(url, sock, sender, brandSignature) {
  try {
    if (!ytdl.validateURL(url)) {
      return await sock.sendMessage(sender, {
        text: `❌ Invalid YouTube URL provided.${brandSignature}`,
      })
    }

    const info = await ytdl.getInfo(url)
    const title = info.videoDetails.title
    const duration = Number.parseInt(info.videoDetails.lengthSeconds)

    if (duration > 600) {
      return await sock.sendMessage(sender, {
        text: `❌ Video too long! Maximum duration is 10 minutes.\nVideo duration: ${Math.floor(duration / 60)}:${duration % 60}${brandSignature}`,
      })
    }

    await sock.sendMessage(sender, {
      text: `🎬 *Downloading: ${title}*\n\n⏳ Processing video... Please wait.${brandSignature}`,
    })

    const videoPath = path.join(__dirname, "temp", `${Date.now()}.mp4`)
    const videoStream = ytdl(url, {
      filter: "videoandaudio",
      quality: "highest",
    })

    const tempDir = path.dirname(videoPath)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const writeStream = fs.createWriteStream(videoPath)
    videoStream.pipe(writeStream)

    return new Promise((resolve, reject) => {
      writeStream.on("finish", async () => {
        try {
          // Add watermark to video
          const watermarkedPath = await watermarkVideo(videoPath, "Lil Gaga Traxx09 Images")

          // Send video file
          await sock.sendMessage(sender, {
            video: { url: watermarkedPath },
            caption: `🎬 *${title}*\n\n⏱️ Duration: ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}\n🏷️ Watermarked by Lil Gaga Traxx09${brandSignature}`,
            contextInfo: {
              externalAdReply: {
                title: title,
                body: "Lil Gaga Traxx09 Images",
                thumbnailUrl: info.videoDetails.thumbnails[0]?.url,
                sourceUrl: url,
                mediaType: 1,
                renderLargerThumbnail: true,
              },
            },
          })

          // Clean up temp files
          fs.unlinkSync(videoPath)
          if (watermarkedPath !== videoPath) {
            fs.unlinkSync(watermarkedPath)
          }

          resolve()
        } catch (error) {
          console.error("Error sending video:", error)
          fs.unlinkSync(videoPath)
          reject(error)
        }
      })

      writeStream.on("error", reject)
    })
  } catch (error) {
    console.error("YouTube video download error:", error)
    return await sock.sendMessage(sender, {
      text: `❌ Failed to download video. Please try again later.\n\nError: ${error.message}${brandSignature}`,
    })
  }
}

// Real AI Integration Logic
export async function callOpenAI(prompt, sock, sender, brandSignature) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return await sock.sendMessage(sender, {
        text: `❌ OpenAI API key not configured. Please contact the bot owner.${brandSignature}`,
      })
    }

    await sock.sendMessage(sender, {
      text: `🤖 *Processing your request...*\n\n❓ *Question:* ${prompt}\n\n⏳ AI is thinking... Please wait.${brandSignature}`,
    })

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are Gaga09 XMD, a helpful WhatsApp bot created by Lil Gaga Traxx09. Provide helpful, accurate, and friendly responses. Keep responses concise but informative.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    )

    const aiResponse = response.data.choices[0].message.content

    return await sock.sendMessage(sender, {
      text: `🤖 *AI Response:*\n\n${aiResponse}${brandSignature}`,
    })
  } catch (error) {
    console.error("OpenAI API error:", error)
    return await sock.sendMessage(sender, {
      text: `❌ AI service temporarily unavailable. Please try again later.\n\nError: ${error.response?.data?.error?.message || error.message}${brandSignature}`,
    })
  }
}

export async function callGeminiAI(prompt, sock, sender, brandSignature) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return await sock.sendMessage(sender, {
        text: `❌ Gemini API key not configured. Please contact the bot owner.${brandSignature}`,
      })
    }

    await sock.sendMessage(sender, {
      text: `🤖 *Gemini AI Processing...*\n\n❓ *Question:* ${prompt}\n\n⏳ Generating response... Please wait.${brandSignature}`,
    })

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `You are Gaga09 XMD, a WhatsApp bot created by Lil Gaga Traxx09. Answer this question helpfully and concisely: ${prompt}`,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    const aiResponse = response.data.candidates[0].content.parts[0].text

    return await sock.sendMessage(sender, {
      text: `🤖 *Gemini AI Response:*\n\n${aiResponse}${brandSignature}`,
    })
  } catch (error) {
    console.error("Gemini API error:", error)
    return await sock.sendMessage(sender, {
      text: `❌ Gemini AI service temporarily unavailable. Please try again later.\n\nError: ${error.response?.data?.error?.message || error.message}${brandSignature}`,
    })
  }
}

// Real Media Fetch Logic
export async function fetchMediaFromURL(url, sock, sender, brandSignature) {
  try {
    // Validate URL
    const urlPattern = /^https?:\/\/.+/i
    if (!urlPattern.test(url)) {
      return await sock.sendMessage(sender, {
        text: `❌ Invalid URL provided. Please provide a valid HTTP/HTTPS URL.${brandSignature}`,
      })
    }

    await sock.sendMessage(sender, {
      text: `📥 *Fetching media from URL...*\n\n🔗 *URL:* ${url}\n\n⏳ Analyzing file... Please wait.${brandSignature}`,
    })

    // Get file info
    const headResponse = await axios.head(url, { timeout: 10000 })
    const contentType = headResponse.headers["content-type"] || ""
    const contentLength = Number.parseInt(headResponse.headers["content-length"] || "0")

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (contentLength > maxSize) {
      return await sock.sendMessage(sender, {
        text: `❌ File too large! Maximum size is 50MB.\nFile size: ${(contentLength / 1024 / 1024).toFixed(2)}MB${brandSignature}`,
      })
    }

    // Download file
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 30000,
      maxContentLength: maxSize,
    })

    const buffer = Buffer.from(response.data)
    const fileName = path.basename(url.split("?")[0]) || "downloaded_file"

    // Determine file type and send accordingly
    if (contentType.startsWith("image/")) {
      // Add watermark to image
      const watermarkedBuffer = await watermarkImage(buffer, "Lil Gaga Traxx09 Images")

      await sock.sendMessage(sender, {
        image: watermarkedBuffer,
        caption: `📸 *Image Downloaded*\n\n🔗 Source: ${url}\n🏷️ Watermarked by Lil Gaga Traxx09${brandSignature}`,
      })
    } else if (contentType.startsWith("video/")) {
      // Save video temporarily for watermarking
      const tempPath = path.join(__dirname, "temp", `${Date.now()}_${fileName}`)
      fs.writeFileSync(tempPath, buffer)

      // Add watermark to video
      const watermarkedPath = await watermarkVideo(tempPath, "Lil Gaga Traxx09 Images")

      await sock.sendMessage(sender, {
        video: { url: watermarkedPath },
        caption: `🎬 *Video Downloaded*\n\n🔗 Source: ${url}\n🏷️ Watermarked by Lil Gaga Traxx09${brandSignature}`,
      })

      // Clean up temp files
      fs.unlinkSync(tempPath)
      if (watermarkedPath !== tempPath) {
        fs.unlinkSync(watermarkedPath)
      }
    } else if (contentType.startsWith("audio/")) {
      await sock.sendMessage(sender, {
        audio: buffer,
        mimetype: contentType,
        ptt: false,
      })

      await sock.sendMessage(sender, {
        text: `🎵 *Audio Downloaded*\n\n🔗 Source: ${url}${brandSignature}`,
      })
    } else {
      // Send as document
      await sock.sendMessage(sender, {
        document: buffer,
        fileName: fileName,
        mimetype: contentType || "application/octet-stream",
      })

      await sock.sendMessage(sender, {
        text: `📄 *File Downloaded*\n\n📁 Name: ${fileName}\n📊 Size: ${(buffer.length / 1024).toFixed(2)} KB\n🔗 Source: ${url}${brandSignature}`,
      })
    }
  } catch (error) {
    console.error("Media fetch error:", error)

    let errorMessage = "❌ Failed to fetch media from URL."

    if (error.code === "ENOTFOUND") {
      errorMessage += "\n\n🌐 URL not found or server unreachable."
    } else if (error.code === "ETIMEDOUT") {
      errorMessage += "\n\n⏰ Request timed out. Server may be slow."
    } else if (error.response?.status === 404) {
      errorMessage += "\n\n📄 File not found (404 error)."
    } else if (error.response?.status === 403) {
      errorMessage += "\n\n🔒 Access denied (403 error)."
    }

    return await sock.sendMessage(sender, {
      text: `${errorMessage}${brandSignature}`,
    })
  }
}

// Real Session Management Logic
export async function exportSession(sock, sender, brandSignature) {
  try {
    const sessionDir = path.join(__dirname, "session")

    if (!fs.existsSync(sessionDir)) {
      return await sock.sendMessage(sender, {
        text: `❌ No session data found. Please pair the bot first.${brandSignature}`,
      })
    }

    // Read session files
    const sessionData = {}
    const files = fs.readdirSync(sessionDir)

    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = path.join(sessionDir, file)
        const content = fs.readFileSync(filePath, "utf8")
        sessionData[file] = JSON.parse(content)
      }
    }

    // Convert to base64
    const sessionString = JSON.stringify(sessionData)
    const base64Session = Buffer.from(sessionString).toString("base64")

    // Send session data
    await sock.sendMessage(sender, {
      text: `💾 *Session Export Successful*\n\n🔐 *Session ID (Base64):*\n\`\`\`${base64Session}\`\`\`\n\n⚠️ *Security Warning:*\n• Keep this data private\n• Don't share with unauthorized users\n• Use secure channels for transfer\n\n💡 *Usage:*\nUse \`.setsession ${base64Session.substring(0, 20)}...\` on target device${brandSignature}`,
    })

    // Also send as document for easy copying
    const sessionFile = Buffer.from(base64Session)
    await sock.sendMessage(sender, {
      document: sessionFile,
      fileName: `gaga09_session_${Date.now()}.txt`,
      mimetype: "text/plain",
    })
  } catch (error) {
    console.error("Session export error:", error)
    return await sock.sendMessage(sender, {
      text: `❌ Failed to export session data.\n\nError: ${error.message}${brandSignature}`,
    })
  }
}

export async function importSession(sessionData, sock, sender, brandSignature) {
  try {
    if (!sessionData) {
      return await sock.sendMessage(sender, {
        text: `❌ No session data provided.\n\nUsage: .setsession [base64-data]${brandSignature}`,
      })
    }

    await sock.sendMessage(sender, {
      text: `💾 *Importing Session...*\n\n⏳ Processing session data... Please wait.${brandSignature}`,
    })

    // Decode base64 session data
    let decodedData
    try {
      decodedData = Buffer.from(sessionData, "base64").toString("utf8")
    } catch (error) {
      return await sock.sendMessage(sender, {
        text: `❌ Invalid session data format. Please provide valid base64 encoded session.${brandSignature}`,
      })
    }

    // Parse JSON
    let sessionObject
    try {
      sessionObject = JSON.parse(decodedData)
    } catch (error) {
      return await sock.sendMessage(sender, {
        text: `❌ Invalid session data structure. Please provide valid session JSON.${brandSignature}`,
      })
    }

    // Create session directory
    const sessionDir = path.join(__dirname, "session")
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true })
    }

    // Write session files
    for (const [fileName, fileData] of Object.entries(sessionObject)) {
      const filePath = path.join(sessionDir, fileName)
      fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2))
    }

    await sock.sendMessage(sender, {
      text: `✅ *Session Import Successful!*\n\n💾 Session data has been imported\n🔄 Bot will reconnect automatically\n⏱️ Please wait 10-30 seconds\n\n💡 Use .alive to check connection status${brandSignature}`,
    })

    // Trigger reconnection (this would need to be handled by the main server)
    setTimeout(() => {
      process.exit(0) // Restart the bot to use new session
    }, 2000)
  } catch (error) {
    console.error("Session import error:", error)
    return await sock.sendMessage(sender, {
      text: `❌ Failed to import session data.\n\nError: ${error.message}${brandSignature}`,
    })
  }
}

// Real Calculator Logic
export function calculateExpression(expression) {
  try {
    // Sanitize expression - only allow numbers, operators, parentheses, and decimal points
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, "")

    if (!sanitized) {
      throw new Error("Invalid expression")
    }

    // Use Function constructor for safe evaluation (better than eval)
    const result = new Function("return " + sanitized)()

    if (typeof result !== "number" || !isFinite(result)) {
      throw new Error("Invalid calculation result")
    }

    return {
      success: true,
      result: result,
      expression: sanitized,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      expression: expression,
    }
  }
}

// Real Reminder Logic
const activeReminders = new Map()

export function setReminder(timeString, message, sender, sock, brandSignature) {
  try {
    // Parse time string (e.g., "5m", "1h", "2d")
    const timeMatch = timeString.match(/^(\d+)([mhd])$/i)
    if (!timeMatch) {
      return {
        success: false,
        error: "Invalid time format. Use: 5m (minutes), 1h (hours), 2d (days)",
      }
    }

    const amount = Number.parseInt(timeMatch[1])
    const unit = timeMatch[2].toLowerCase()

    let milliseconds
    switch (unit) {
      case "m":
        milliseconds = amount * 60 * 1000
        break
      case "h":
        milliseconds = amount * 60 * 60 * 1000
        break
      case "d":
        milliseconds = amount * 24 * 60 * 60 * 1000
        break
      default:
        return {
          success: false,
          error: "Invalid time unit. Use m (minutes), h (hours), d (days)",
        }
    }

    // Set maximum reminder time (7 days)
    const maxTime = 7 * 24 * 60 * 60 * 1000
    if (milliseconds > maxTime) {
      return {
        success: false,
        error: "Maximum reminder time is 7 days",
      }
    }

    const reminderId = `${sender}_${Date.now()}`
    const reminderTime = new Date(Date.now() + milliseconds)

    // Set timeout for reminder
    const timeoutId = setTimeout(async () => {
      try {
        await sock.sendMessage(sender, {
          text: `⏰ *REMINDER*\n\n📝 *Message:* ${message}\n⏱️ *Set at:* ${new Date(Date.now() - milliseconds).toLocaleString()}\n📅 *Reminder time:* ${new Date().toLocaleString()}${brandSignature}`,
        })

        // Remove from active reminders
        activeReminders.delete(reminderId)
      } catch (error) {
        console.error("Error sending reminder:", error)
      }
    }, milliseconds)

    // Store reminder info
    activeReminders.set(reminderId, {
      timeoutId,
      message,
      sender,
      reminderTime,
      timeString,
    })

    return {
      success: true,
      reminderId,
      reminderTime,
      timeString,
      message,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

export function cancelReminder(reminderId) {
  const reminder = activeReminders.get(reminderId)
  if (reminder) {
    clearTimeout(reminder.timeoutId)
    activeReminders.delete(reminderId)
    return true
  }
  return false
}

export function getActiveReminders(sender) {
  const userReminders = []
  for (const [id, reminder] of activeReminders.entries()) {
    if (reminder.sender === sender) {
      userReminders.push({
        id,
        message: reminder.message,
        reminderTime: reminder.reminderTime,
        timeString: reminder.timeString,
      })
    }
  }
  return userReminders
}

// Emoji Command Handler
export function handleEmojiCommand(text) {
  if (!text) {
    return `😀 *Emoji Converter*

Usage: .emoji [text]

Examples:
.emoji hello world
.emoji I love coding
.emoji good morning

🎨 *Features:*
• Convert text to emojis
• Multiple emoji styles
• Creative text transformation
• Fun and expressive output

💡 *Try different words to see various emoji combinations!*`
  }

  // Simple emoji conversion (in production, use a proper emoji library)
  const emojiText = text
    .replace(/hello/gi, "👋")
    .replace(/hi/gi, "👋")
    .replace(/love/gi, "❤️")
    .replace(/heart/gi, "💖")
    .replace(/happy/gi, "😊")
    .replace(/smile/gi, "😄")
    .replace(/sad/gi, "😢")
    .replace(/cry/gi, "😭")
    .replace(/fire/gi, "🔥")
    .replace(/hot/gi, "🔥")
    .replace(/star/gi, "⭐")
    .replace(/cool/gi, "😎")
    .replace(/good/gi, "👍")
    .replace(/bad/gi, "👎")
    .replace(/morning/gi, "🌅")
    .replace(/night/gi, "🌙")
    .replace(/sun/gi, "☀️")
    .replace(/moon/gi, "🌙")
    .replace(/music/gi, "🎵")
    .replace(/dance/gi, "💃")
    .replace(/party/gi, "🎉")
    .replace(/food/gi, "🍕")
    .replace(/coffee/gi, "☕")
    .replace(/water/gi, "💧")
    .replace(/car/gi, "🚗")
    .replace(/home/gi, "🏠")
    .replace(/work/gi, "💼")
    .replace(/money/gi, "💰")
    .replace(/time/gi, "⏰")
    .replace(/phone/gi, "📱")
    .replace(/computer/gi, "💻")
    .replace(/book/gi, "📚")
    .replace(/game/gi, "🎮")

  return `😀 *Emoji Conversion Result*

📝 *Original:* ${text}
😊 *With Emojis:* ${emojiText}

🎨 *More emoji styles:*
🔤 *Bold Style:* **${emojiText}**
✨ *Sparkle Style:* ✨${emojiText}✨
🌟 *Star Style:* ⭐${emojiText}⭐

💡 *Tip:* Try words like love, fire, star, happy, cool for more emojis!`
}
