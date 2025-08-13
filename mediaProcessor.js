import fs from "fs/promises"
import { existsSync } from "fs"
import { join, extname } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"
import axios from "axios"
import sharp from "sharp"
import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic)

// Configuration
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const TEMP_DIR = join(__dirname, "temp")
const WATERMARK_TEXT = "Lil Gaga Traxx09 Images"

// Supported formats
const SUPPORTED_FORMATS = {
  image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"],
  video: [".mp4", ".avi", ".mov", ".webm", ".mkv", ".flv"],
  audio: [".mp3", ".wav", ".aac", ".ogg", ".m4a", ".flac"],
  document: [".pdf", ".doc", ".docx", ".txt", ".rtf"],
}

// Ensure temp directory exists
async function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    await fs.mkdir(TEMP_DIR, { recursive: true })
  }
}

// Download media from URL
export async function downloadMedia(url, options = {}) {
  try {
    await ensureTempDir()

    const { maxSize = MAX_FILE_SIZE, timeout = 30000 } = options

    // Validate URL
    if (!isValidUrl(url)) {
      throw new Error("Invalid URL provided")
    }

    console.log(`Downloading media from: ${url}`)

    // Get file info first
    const headResponse = await axios.head(url, { timeout })
    const contentLength = Number.parseInt(headResponse.headers["content-length"] || "0")
    const contentType = headResponse.headers["content-type"] || ""

    // Check file size
    if (contentLength > maxSize) {
      throw new Error(`File too large: ${(contentLength / 1024 / 1024).toFixed(2)}MB (max: ${maxSize / 1024 / 1024}MB)`)
    }

    // Download file
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout,
      maxContentLength: maxSize,
    })

    const buffer = Buffer.from(response.data)
    const fileExtension = getFileExtension(url, contentType)
    const fileName = `download_${Date.now()}${fileExtension}`
    const filePath = join(TEMP_DIR, fileName)

    await fs.writeFile(filePath, buffer)

    return {
      filePath,
      fileName,
      size: buffer.length,
      contentType,
      extension: fileExtension,
      buffer,
    }
  } catch (error) {
    console.error("Download error:", error)
    throw new Error(`Download failed: ${error.message}`)
  }
}

// Process media with watermarking
export async function processMedia(filePath, options = {}) {
  try {
    const { watermark = true, watermarkText = WATERMARK_TEXT } = options

    const extension = extname(filePath).toLowerCase()
    const mediaType = getMediaType(extension)

    if (!watermark) {
      // Return original file if no watermarking needed
      const buffer = await fs.readFile(filePath)
      return { buffer, processed: false, mediaType }
    }

    let processedBuffer

    switch (mediaType) {
      case "image":
        processedBuffer = await processImage(filePath, watermarkText)
        break
      case "video":
        processedBuffer = await processVideo(filePath, watermarkText)
        break
      case "audio":
        processedBuffer = await processAudio(filePath, watermarkText)
        break
      default:
        // For unsupported types, return original
        processedBuffer = await fs.readFile(filePath)
        break
    }

    return {
      buffer: processedBuffer,
      processed: true,
      mediaType,
      watermarkText,
    }
  } catch (error) {
    console.error("Media processing error:", error)
    throw new Error(`Processing failed: ${error.message}`)
  }
}

// Process image with enhanced watermarking
async function processImage(filePath, watermarkText) {
  try {
    const image = sharp(filePath)
    const metadata = await image.metadata()
    const { width, height } = metadata

    // Calculate watermark size based on image dimensions
    const fontSize = Math.max(16, Math.min(width / 20, 48))
    const padding = Math.max(10, fontSize / 2)

    // Create enhanced watermark with background
    const watermarkSvg = `
      <svg width="${width}" height="${height}">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="black" flood-opacity="0.5"/>
          </filter>
        </defs>
        <rect x="${width - watermarkText.length * (fontSize * 0.6) - padding * 2}" 
              y="${height - fontSize - padding * 2}" 
              width="${watermarkText.length * (fontSize * 0.6) + padding * 2}" 
              height="${fontSize + padding * 2}" 
              fill="black" 
              fill-opacity="0.7" 
              rx="5"/>
        <text x="${width - padding}" 
              y="${height - padding}" 
              font-family="Arial, sans-serif" 
              font-size="${fontSize}" 
              font-weight="bold"
              fill="white" 
              text-anchor="end" 
              dominant-baseline="bottom"
              filter="url(#shadow)">
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
      .jpeg({ quality: 90 })
      .toBuffer()

    return watermarkedBuffer
  } catch (error) {
    console.error("Image processing error:", error)
    // Return original if watermarking fails
    return await fs.readFile(filePath)
  }
}

// Process video with enhanced watermarking
async function processVideo(filePath, watermarkText) {
  return new Promise(async (resolve, reject) => {
    try {
      const outputPath = join(TEMP_DIR, `watermarked_${Date.now()}.mp4`)

      ffmpeg(filePath)
        .videoFilters([
          {
            filter: "drawbox",
            options: {
              x: "w-tw-20",
              y: "h-th-20",
              width: "tw+10",
              height: "th+10",
              color: "black@0.7",
              thickness: "fill",
            },
          },
          {
            filter: "drawtext",
            options: {
              text: watermarkText,
              fontsize: 24,
              fontcolor: "white",
              x: "w-tw-15",
              y: "h-th-15",
              shadowcolor: "black",
              shadowx: 2,
              shadowy: 2,
            },
          },
        ])
        .output(outputPath)
        .on("end", async () => {
          try {
            const buffer = await fs.readFile(outputPath)
            await fs.unlink(outputPath).catch(() => {}) // Clean up
            resolve(buffer)
          } catch (error) {
            reject(error)
          }
        })
        .on("error", async (error) => {
          console.error("Video processing error:", error)
          // Return original if watermarking fails
          try {
            const originalBuffer = await fs.readFile(filePath)
            resolve(originalBuffer)
          } catch (readError) {
            reject(readError)
          }
        })
        .run()
    } catch (error) {
      reject(error)
    }
  })
}

// Process audio with metadata watermarking
async function processAudio(filePath, watermarkText) {
  return new Promise(async (resolve, reject) => {
    try {
      const outputPath = join(TEMP_DIR, `watermarked_${Date.now()}.mp3`)

      ffmpeg(filePath)
        .outputOptions([
          "-metadata",
          `comment=${watermarkText}`,
          "-metadata",
          `copyright=Created by Lil Gaga Traxx09`,
          "-metadata",
          `artist=Lil Gaga Traxx09`,
        ])
        .output(outputPath)
        .on("end", async () => {
          try {
            const buffer = await fs.readFile(outputPath)
            await fs.unlink(outputPath).catch(() => {}) // Clean up
            resolve(buffer)
          } catch (error) {
            reject(error)
          }
        })
        .on("error", async (error) => {
          console.error("Audio processing error:", error)
          // Return original if processing fails
          try {
            const originalBuffer = await fs.readFile(filePath)
            resolve(originalBuffer)
          } catch (readError) {
            reject(readError)
          }
        })
        .run()
    } catch (error) {
      reject(error)
    }
  })
}

// YouTube downloader (placeholder - would use yt-dlp or similar)
export async function downloadYouTube(url, format = "mp4") {
  try {
    // This is a placeholder implementation
    // In production, you would use yt-dlp, youtube-dl, or similar
    console.log(`Downloading YouTube ${format}: ${url}`)

    // Simulate download process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Return mock data for now
    return {
      title: "Sample Video",
      duration: "3:45",
      quality: format === "mp3" ? "128kbps" : "720p",
      size: "15.2MB",
      url: url,
      downloadUrl: `https://example.com/download/${Date.now()}.${format}`,
    }
  } catch (error) {
    throw new Error(`YouTube download failed: ${error.message}`)
  }
}

// TikTok downloader (placeholder)
export async function downloadTikTok(url) {
  try {
    console.log(`Downloading TikTok: ${url}`)

    // Simulate download process
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return {
      title: "TikTok Video",
      author: "Sample User",
      duration: "0:30",
      quality: "HD",
      size: "8.5MB",
      url: url,
      downloadUrl: `https://example.com/tiktok/${Date.now()}.mp4`,
    }
  } catch (error) {
    throw new Error(`TikTok download failed: ${error.message}`)
  }
}

// Instagram downloader (placeholder)
export async function downloadInstagram(url) {
  try {
    console.log(`Downloading Instagram: ${url}`)

    // Simulate download process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    return {
      type: "post", // post, reel, story
      mediaCount: 1,
      quality: "HD",
      size: "12.3MB",
      url: url,
      downloadUrl: `https://example.com/instagram/${Date.now()}.jpg`,
    }
  } catch (error) {
    throw new Error(`Instagram download failed: ${error.message}`)
  }
}

// Facebook downloader (placeholder)
export async function downloadFacebook(url) {
  try {
    console.log(`Downloading Facebook: ${url}`)

    // Simulate download process
    await new Promise((resolve) => setTimeout(resolve, 2500))

    return {
      title: "Facebook Video",
      duration: "2:15",
      quality: "720p",
      size: "25.8MB",
      url: url,
      downloadUrl: `https://example.com/facebook/${Date.now()}.mp4`,
    }
  } catch (error) {
    throw new Error(`Facebook download failed: ${error.message}`)
  }
}

// Music recognition (placeholder - would use Shazam API or similar)
export async function recognizeMusic(audioBuffer) {
  try {
    console.log("Recognizing music...")

    // Simulate recognition process
    await new Promise((resolve) => setTimeout(resolve, 3000))

    return {
      title: "Sample Song",
      artist: "Sample Artist",
      album: "Sample Album",
      year: "2023",
      genre: "Pop",
      confidence: 0.95,
      spotifyUrl: "https://open.spotify.com/track/example",
      appleMusicUrl: "https://music.apple.com/song/example",
      lyrics: "Sample lyrics would appear here...",
    }
  } catch (error) {
    throw new Error(`Music recognition failed: ${error.message}`)
  }
}

// Utility functions
function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

function getFileExtension(url, contentType) {
  // Try to get extension from URL first
  const urlExtension = extname(new URL(url).pathname).toLowerCase()
  if (urlExtension) return urlExtension

  // Fallback to content type
  const mimeToExt = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "application/pdf": ".pdf",
  }

  return mimeToExt[contentType] || ".bin"
}

function getMediaType(extension) {
  const ext = extension.toLowerCase()

  if (SUPPORTED_FORMATS.image.includes(ext)) return "image"
  if (SUPPORTED_FORMATS.video.includes(ext)) return "video"
  if (SUPPORTED_FORMATS.audio.includes(ext)) return "audio"
  if (SUPPORTED_FORMATS.document.includes(ext)) return "document"

  return "unknown"
}

// Clean up temp files
export async function cleanupTempFiles(maxAge = 3600000) {
  // Default: 1 hour
  try {
    await ensureTempDir()
    const files = await fs.readdir(TEMP_DIR)

    for (const file of files) {
      const filePath = join(TEMP_DIR, file)
      const stats = await fs.stat(filePath)
      const age = Date.now() - stats.mtime.getTime()

      if (age > maxAge) {
        await fs.unlink(filePath)
        console.log(`Cleaned up temp file: ${file}`)
      }
    }
  } catch (error) {
    console.error("Cleanup error:", error)
  }
}

// Image generation with watermark
export async function generateImage(prompt, options = {}) {
  try {
    const { width = 512, height = 512, watermark = true } = options

    // This is a placeholder for AI image generation
    // In production, you would integrate with DALL-E, Midjourney, or similar
    console.log(`Generating image: ${prompt}`)

    // Simulate image generation
    await new Promise((resolve) => setTimeout(resolve, 5000))

    // Create a placeholder image
    const placeholderImage = sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })

    let imageBuffer = await placeholderImage.png().toBuffer()

    // Add watermark if requested
    if (watermark) {
      const tempPath = join(TEMP_DIR, `temp_${Date.now()}.png`)
      await fs.writeFile(tempPath, imageBuffer)
      imageBuffer = await processImage(tempPath, WATERMARK_TEXT)
      await fs.unlink(tempPath).catch(() => {})
    }

    return {
      buffer: imageBuffer,
      prompt,
      width,
      height,
      watermarked: watermark,
    }
  } catch (error) {
    throw new Error(`Image generation failed: ${error.message}`)
  }
}

// Export configuration and utilities
export { MAX_FILE_SIZE, TEMP_DIR, WATERMARK_TEXT, SUPPORTED_FORMATS, getMediaType, isValidUrl, getFileExtension }
