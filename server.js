import express from "express"
import { createServer } from "http"
import { WebSocketServer } from "ws"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import fs from "fs/promises"
import { existsSync } from "fs"
import dotenv from "dotenv"
import chalk from "chalk"
import pino from "pino"
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState as createAuthState,
  Browsers,
} from "@whiskeysockets/baileys"
import QRCode from "qrcode"
import { handleMessage } from "./apiHandler.js"
import { exportSession, importSession, validateGitHubRepo, getSystemStats } from "./utils.js"

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize logger
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
    },
  },
})

// App configuration
const PORT = process.env.PORT || 3000
const OWNER_NUMBERS = ["+263780078177", "+263716857999"]
const BRAND_SIGNATURE =
  "\n\nCreated by Lil Gaga Traxx09 copyright ©️ 2025 — Gaga is the King\nPowered by Vincent Gaga a.k.a Lil Gaga Traxx09\nChannel: https://whatsapp.com/channel/0029Vb6huGcJJhzUGbPbkN3W"

// Global state
let sock = null
let qrString = null
let connectionState = "disconnected"
const sessionData = null

// Initialize Express app
const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

// Middleware
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use(express.static(join(__dirname, "public")))

// Ensure session directory exists
const sessionDir = join(__dirname, "session")
if (!existsSync(sessionDir)) {
  fs.mkdir(sessionDir, { recursive: true }).catch((error) => {
    logger.error("Failed to create session directory:", error)
  })
}

// WebSocket connection handler
wss.on("connection", (ws) => {
  logger.info("Dashboard client connected")

  // Send current state to new client
  ws.send(
    JSON.stringify({
      type: "connection_state",
      state: connectionState,
      qr: qrString,
      stats: getSystemStats(),
    }),
  )

  ws.on("close", () => {
    logger.info("Dashboard client disconnected")
  })
})

// Broadcast to all WebSocket clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      // WebSocket.OPEN
      client.send(JSON.stringify(data))
    }
  })
}

// Initialize WhatsApp connection
async function startWhatsApp() {
  const authState = await createAuthState(sessionDir)

  try {
    const { state, saveCreds } = authState

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: logger.child({ module: "baileys" }),
      browser: Browsers.macOS("Desktop"),
      generateHighQualityLinkPreview: true,
      markOnlineOnConnect: true,
    })

    // Connection update handler
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        qrString = qr
        const qrImage = await QRCode.toDataURL(qr)

        broadcast({
          type: "qr_update",
          qr: qrImage,
          qrString: qr,
        })

        logger.info("QR Code generated and broadcasted")
      }

      if (connection === "close") {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

        connectionState = "disconnected"
        broadcast({
          type: "connection_state",
          state: connectionState,
        })

        logger.warn("Connection closed:", lastDisconnect?.error)

        if (shouldReconnect) {
          logger.info("Reconnecting...")
          setTimeout(startWhatsApp, 3000)
        }
      } else if (connection === "open") {
        connectionState = "connected"
        qrString = null

        broadcast({
          type: "connection_state",
          state: connectionState,
          qr: null,
        })

        logger.info(chalk.green("WhatsApp connection established!"))
      }
    })

    // Save credentials on update
    sock.ev.on("creds.update", saveCreds)

    // Message handler
    sock.ev.on("messages.upsert", async (m) => {
      const message = m.messages[0]
      if (!message.key.fromMe && m.type === "notify") {
        await handleMessage(sock, message, OWNER_NUMBERS, BRAND_SIGNATURE, logger)
      }
    })
  } catch (error) {
    logger.error("Failed to start WhatsApp:", error)
    setTimeout(startWhatsApp, 5000)
  }
}

// Routes

// Dashboard
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "views", "index.html"))
})

// QR Code endpoint
app.get("/qr.png", async (req, res) => {
  if (!qrString) {
    return res.status(404).json({ error: "No QR code available" })
  }

  try {
    const qrBuffer = await QRCode.toBuffer(qrString)
    res.setHeader("Content-Type", "image/png")
    res.send(qrBuffer)
  } catch (error) {
    logger.error("QR generation error:", error)
    res.status(500).json({ error: "Failed to generate QR code" })
  }
})

// Session management
app.get("/session/export/:id?", async (req, res) => {
  try {
    const sessionId = req.params.id || "default"
    const exported = await exportSession(sessionId)
    res.json(exported)
  } catch (error) {
    logger.error("Session export error:", error)
    res.status(500).json({ error: "Failed to export session" })
  }
})

app.post("/session/import", async (req, res) => {
  try {
    const { sessionData, sessionId = "default" } = req.body
    await importSession(sessionData, sessionId)
    res.json({ success: true, message: "Session imported successfully" })
  } catch (error) {
    logger.error("Session import error:", error)
    res.status(500).json({ error: "Failed to import session" })
  }
})

app.post("/api/generate-qr", async (req, res) => {
  try {
    if (connectionState === "connected") {
      return res.status(400).json({ error: "Bot is already connected" })
    }

    // Restart WhatsApp connection to generate new QR
    if (sock) {
      sock.end()
    }

    logger.info("Generating new QR code...")
    await startWhatsApp()

    res.json({ success: true, message: "QR generation initiated" })
  } catch (error) {
    logger.error("QR generation error:", error)
    res.status(500).json({ error: "Failed to generate QR code" })
  }
})

app.post("/api/pair-code", async (req, res) => {
  try {
    const { phoneNumber } = req.body

    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" })
    }

    if (connectionState === "connected") {
      return res.status(400).json({ error: "Bot is already connected" })
    }

    // Generate pairing code for phone number
    if (sock && sock.requestPairingCode) {
      const code = await sock.requestPairingCode(phoneNumber)

      broadcast({
        type: "pairing_code",
        code: code,
        phoneNumber: phoneNumber,
      })

      logger.info(`Pairing code generated for ${phoneNumber}: ${code}`)
      res.json({ success: true, code: code, message: "Pairing code generated" })
    } else {
      res.status(400).json({ error: "Pairing code not available" })
    }
  } catch (error) {
    logger.error("Pairing code generation error:", error)
    res.status(500).json({ error: "Failed to generate pairing code" })
  }
})

// System stats
app.get("/api/stats", (req, res) => {
  res.json(getSystemStats())
})

// Repository validation
app.post("/api/validate-repo", (req, res) => {
  const { repoUrl } = req.body
  const isValid = validateGitHubRepo(repoUrl)
  res.json({ valid: isValid })
})

// Bot commands API
app.post("/api/command", async (req, res) => {
  try {
    const { command, target } = req.body

    if (!sock || connectionState !== "connected") {
      return res.status(400).json({ error: "Bot not connected" })
    }

    // Execute command (implement based on command type)
    res.json({ success: true, message: "Command executed" })
  } catch (error) {
    logger.error("Command execution error:", error)
    res.status(500).json({ error: "Failed to execute command" })
  }
})

// Start server
server.listen(PORT, () => {
  console.log(
    chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════╗
║                    GAGA09 XMD BOT v4.2.0                    ║
║              Created by Lil Gaga Traxx09                    ║
╠══════════════════════════════════════════════════════════════╣
║  🌐 Dashboard: http://localhost:${PORT}                     ║
║  📱 Status: Starting WhatsApp connection...                 ║
║  💾 RAM: 367.40MB / 63254MB                                ║
╚══════════════════════════════════════════════════════════════╝
  `),
  )

  logger.info(`Server running on port ${PORT}`)

  // Start WhatsApp connection
  startWhatsApp()
})

// Graceful shutdown
process.on("SIGINT", () => {
  logger.info("Shutting down gracefully...")
  if (sock) {
    sock.end()
  }
  server.close(() => {
    process.exit(0)
  })
})

export { sock, broadcast, logger, OWNER_NUMBERS, BRAND_SIGNATURE }
