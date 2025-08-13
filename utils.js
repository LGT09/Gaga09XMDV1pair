import QRCode from "qrcode"
import fs from "fs/promises"
import { existsSync } from "fs"
import { join } from "path"
import sharp from "sharp"
import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"
import { fileURLToPath } from "url"
import { dirname } from "path"
import { extname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic)

// Generate QR Code
export async function generateQRCode(text) {
  try {
    const qrDataURL = await QRCode.toDataURL(text)
    const qrBuffer = await QRCode.toBuffer(text)
    return { dataURL: qrDataURL, buffer: qrBuffer }
  } catch (error) {
    throw new Error(`QR generation failed: ${error.message}`)
  }
}

// Export session data
export async function exportSession(sessionId = "default") {
  try {
    const sessionPath = join(__dirname, "session")
    const files = await fs.readdir(sessionPath)
    const sessionFiles = files.filter((file) => file.startsWith("creds.json") || file.startsWith("app-state-sync"))

    const sessionData = {}

    for (const file of sessionFiles) {
      const filePath = join(sessionPath, file)
      const content = await fs.readFile(filePath, "utf8")
      sessionData[file] = JSON.parse(content)
    }

    const base64Session = Buffer.from(JSON.stringify(sessionData)).toString("base64")

    return {
      sessionId,
      json: sessionData,
      base64: base64Session,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    throw new Error(`Session export failed: ${error.message}`)
  }
}

// Import session data
export async function importSession(sessionData, sessionId = "default") {
  try {
    const sessionPath = join(__dirname, "session")

    // Clear existing session
    if (existsSync(sessionPath)) {
      const files = await fs.readdir(sessionPath)
      for (const file of files) {
        await fs.unlink(join(sessionPath, file))
      }
    } else {
      await fs.mkdir(sessionPath, { recursive: true })
    }

    let parsedData

    // Handle base64 or JSON input
    if (typeof sessionData === "string") {
      try {
        // Try to parse as base64
        parsedData = JSON.parse(Buffer.from(sessionData, "base64").toString())
      } catch {
        // Try to parse as JSON string
        parsedData = JSON.parse(sessionData)
      }
    } else {
      parsedData = sessionData
    }

    // Write session files
    for (const [filename, content] of Object.entries(parsedData)) {
      const filePath = join(sessionPath, filename)
      await fs.writeFile(filePath, JSON.stringify(content, null, 2))
    }

    return { success: true, message: "Session imported successfully" }
  } catch (error) {
    throw new Error(`Session import failed: ${error.message}`)
  }
}

// Validate GitHub repository URL
export function validateGitHubRepo(repoUrl) {
  if (!repoUrl) return false

  const githubPattern = /^https:\/\/github\.com\/LGT09\/[a-zA-Z0-9._-]+\/?$/
  return githubPattern.test(repoUrl)
}

// Add watermark to image
export async function watermarkImage(inputBuffer, watermarkText = "Lil Gaga Traxx09 Images") {
  try {
    const image = sharp(inputBuffer)
    const { width, height } = await image.metadata()

    // Calculate responsive font size and padding
    const fontSize = Math.max(16, Math.min(width / 25, 40))
    const padding = Math.max(8, fontSize / 3)

    // Create professional watermark with semi-transparent background
    const watermarkSvg = `
      <svg width="${width}" height="${height}">
        <defs>
          <filter id="dropshadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="1" dy="1" result="offset"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge> 
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        <rect x="${width - watermarkText.length * (fontSize * 0.55) - padding * 2}" 
              y="${height - fontSize - padding * 2}" 
              width="${watermarkText.length * (fontSize * 0.55) + padding * 2}" 
              height="${fontSize + padding * 2}" 
              fill="black" 
              fill-opacity="0.6" 
              rx="4"/>
        <text x="${width - padding}" 
              y="${height - padding}" 
              font-family="Arial, Helvetica, sans-serif" 
              font-size="${fontSize}" 
              font-weight="600"
              fill="white" 
              text-anchor="end" 
              dominant-baseline="bottom"
              filter="url(#dropshadow)">
          ${watermarkText}
        </text>
      </svg>
    `

    const watermarkedBuffer = await image
      .composite([
        {
          input: Buffer.from(watermarkSvg),
          gravity: "southeast",
        },
      ])
      .png({ quality: 95, compressionLevel: 6 })
      .toBuffer()

    return watermarkedBuffer
  } catch (error) {
    console.error("Watermark error:", error)
    return inputBuffer // Return original if watermarking fails
  }
}

// Add watermark to video
export async function watermarkVideo(inputPath, outputPath, watermarkText = "Lil Gaga Traxx09 Images") {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters([
        // Add semi-transparent background box
        {
          filter: "drawbox",
          options: {
            x: "w-tw-25",
            y: "h-th-25",
            width: "tw+15",
            height: "th+15",
            color: "black@0.6",
            thickness: "fill",
          },
        },
        // Add main watermark text
        {
          filter: "drawtext",
          options: {
            text: watermarkText,
            fontsize: "w*0.03", // Responsive font size
            fontcolor: "white",
            x: "w-tw-20",
            y: "h-th-20",
            shadowcolor: "black@0.8",
            shadowx: 2,
            shadowy: 2,
            fontfile: "/System/Library/Fonts/Arial.ttf", // Fallback font
          },
        },
      ])
      .outputOptions([
        "-c:v libx264", // Video codec
        "-preset fast", // Encoding speed
        "-crf 23", // Quality (lower = better quality)
        "-c:a copy", // Copy audio without re-encoding
      ])
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (error) => {
        console.error("Video watermark error:", error)
        reject(error)
      })
      .run()
  })
}

// Get system statistics
export function getSystemStats() {
  const memUsage = process.memoryUsage()
  const uptime = process.uptime()

  return {
    version: "4.2.0",
    uptime: Math.floor(uptime),
    memory: {
      used: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      total: "63254MB",
      percentage: ((memUsage.heapUsed / 1024 / 1024 / 63254) * 100).toFixed(2),
    },
    timestamp: new Date().toISOString(),
  }
}

// Format phone number
export function formatPhoneNumber(number) {
  // Remove all non-digit characters
  let cleaned = number.replace(/\D/g, "")

  // Add country code if missing
  if (!cleaned.startsWith("263") && cleaned.length === 9) {
    cleaned = "263" + cleaned
  }

  return cleaned + "@s.whatsapp.net"
}

// Check if user is owner
export function isOwner(phoneNumber, ownerNumbers) {
  const cleanNumber = phoneNumber.replace("@s.whatsapp.net", "")
  return ownerNumbers.some(
    (owner) => owner.replace(/\D/g, "").includes(cleanNumber) || cleanNumber.includes(owner.replace(/\D/g, "")),
  )
}

// Sleep utility
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Generate random ID
export function generateId(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Validate media file
export function validateMediaFile(filePath, maxSize = 50 * 1024 * 1024) {
  try {
    if (!existsSync(filePath)) {
      throw new Error("File does not exist")
    }

    const stats = fs.statSync(filePath)
    if (stats.size > maxSize) {
      throw new Error(`File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max: ${maxSize / 1024 / 1024}MB)`)
    }

    const extension = extname(filePath).toLowerCase()
    const supportedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".bmp",
      ".mp4",
      ".avi",
      ".mov",
      ".webm",
      ".mkv",
      ".flv",
      ".mp3",
      ".wav",
      ".aac",
      ".ogg",
      ".m4a",
      ".flac",
      ".pdf",
      ".doc",
      ".docx",
      ".txt",
      ".rtf",
    ]

    if (!supportedExtensions.includes(extension)) {
      throw new Error(`Unsupported file format: ${extension}`)
    }

    return {
      valid: true,
      size: stats.size,
      extension,
      sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)}MB`,
    }
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    }
  }
}

// Rate limiting utility for media downloads
const downloadLimits = new Map()

export function checkDownloadLimit(userId, maxDownloads = 10, timeWindow = 3600000) {
  // Default: 10 downloads per hour
  const now = Date.now()
  const userLimits = downloadLimits.get(userId) || { count: 0, resetTime: now + timeWindow }

  if (now > userLimits.resetTime) {
    // Reset counter
    userLimits.count = 0
    userLimits.resetTime = now + timeWindow
  }

  if (userLimits.count >= maxDownloads) {
    const remainingTime = Math.ceil((userLimits.resetTime - now) / 60000) // minutes
    throw new Error(`Download limit exceeded. Try again in ${remainingTime} minutes.`)
  }

  userLimits.count++
  downloadLimits.set(userId, userLimits)

  return {
    remaining: maxDownloads - userLimits.count,
    resetTime: userLimits.resetTime,
  }
}
