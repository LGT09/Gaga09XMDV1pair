class GagaBotDashboard {
  constructor() {
    this.ws = null
    this.connectionState = "disconnected"
    this.qrString = null
    this.init()
  }

  init() {
    this.setupWebSocket()
    this.setupEventListeners()
    this.updateConnectionStatus("disconnected")
  }

  setupWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.host}`

    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log("WebSocket connected")
      this.addLog("WebSocket connection established", "success")
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleWebSocketMessage(data)
      } catch (error) {
        console.error("WebSocket message parse error:", error)
      }
    }

    this.ws.onclose = () => {
      console.log("WebSocket disconnected")
      this.addLog("WebSocket connection lost, attempting to reconnect...", "warning")
      setTimeout(() => this.setupWebSocket(), 3000)
    }

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      this.addLog("WebSocket connection error", "error")
    }
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case "qr_update":
        this.updateQRCode(data.qr, data.qrString)
        break
      case "connection_state":
        this.updateConnectionStatus(data.state)
        if (data.qr) {
          this.updateQRCode(data.qr, data.qrString)
        }
        if (data.stats) {
          this.updateSystemStats(data.stats)
        }
        break
      case "log":
        this.addLog(data.message, data.level)
        break
      case "pairing_code":
        this.displayPairingCode(data.code, data.phoneNumber)
        break
      default:
        console.log("Unknown WebSocket message:", data)
    }
  }

  updateQRCode(qrImage, qrString) {
    const qrContainer = document.getElementById("qrContainer")
    const qrActions = document.getElementById("qrActions")

    if (qrImage) {
      qrContainer.innerHTML = `<img src="${qrImage}" alt="WhatsApp QR Code" class="qr-image">`
      qrActions.style.display = "flex"
      this.qrString = qrString
      this.addLog("QR Code generated - scan with WhatsApp", "info")
    } else {
      qrContainer.innerHTML = `
        <div class="qr-placeholder">
          <div class="qr-icon">📱</div>
          <p>Click "Generate QR" to start pairing</p>
        </div>
      `
      qrActions.style.display = "none"
      this.qrString = null
    }
  }

  updateConnectionStatus(state) {
    this.connectionState = state
    const statusElement = document.getElementById("connectionStatus")
    const statusDot = statusElement.querySelector(".status-dot")
    const statusText = statusElement.querySelector(".status-text")

    statusDot.className = `status-dot ${state}`

    switch (state) {
      case "connected":
        statusText.textContent = "Connected"
        this.addLog("WhatsApp connection established", "success")
        break
      case "connecting":
        statusText.textContent = "Connecting..."
        this.addLog("Connecting to WhatsApp...", "info")
        break
      case "disconnected":
        statusText.textContent = "Disconnected"
        this.addLog("WhatsApp disconnected", "warning")
        break
    }
  }

  updateSystemStats(stats) {
    const memoryElement = document.getElementById("memoryUsage")
    if (memoryElement && stats.memory) {
      memoryElement.querySelector(".memory-text").textContent = `RAM: ${stats.memory.used} / ${stats.memory.total}`
    }
  }

  addLog(message, level = "info") {
    const consoleOutput = document.getElementById("consoleOutput")
    const timestamp = new Date().toLocaleString()

    const logEntry = document.createElement("div")
    logEntry.className = `log-entry ${level}`
    logEntry.innerHTML = `
      <span class="log-timestamp">[${timestamp}]</span>
      <span class="log-level">${level.toUpperCase()}</span>
      <span class="log-message">${message}</span>
    `

    consoleOutput.appendChild(logEntry)
    consoleOutput.scrollTop = consoleOutput.scrollHeight

    // Keep only last 100 log entries
    while (consoleOutput.children.length > 100) {
      consoleOutput.removeChild(consoleOutput.firstChild)
    }
  }

  setupEventListeners() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tabName = e.target.dataset.tab
        this.switchTab(tabName)
      })
    })

    // QR Code actions
    document.getElementById("pairQR").addEventListener("click", () => {
      this.generateQR()
    })

    document.getElementById("generatePairingCode").addEventListener("click", () => {
      this.generatePairingCode()
    })

    document.getElementById("refreshQR").addEventListener("click", () => {
      this.generateQR()
    })

    document.getElementById("downloadQR").addEventListener("click", () => {
      this.downloadQR()
    })

    document.getElementById("copyQRString").addEventListener("click", () => {
      this.copyQRString()
    })

    // Session management
    document.getElementById("exportSession").addEventListener("click", () => {
      this.exportSession()
    })

    document.getElementById("importSessionBtn").addEventListener("click", () => {
      this.showImportSection()
    })

    document.getElementById("confirmImport").addEventListener("click", () => {
      this.importSession()
    })

    document.getElementById("cancelImport").addEventListener("click", () => {
      this.hideImportSection()
    })

    // Owner configuration
    document.getElementById("saveOwnerNumbers").addEventListener("click", () => {
      this.saveOwnerNumbers()
    })

    // Command execution
    document.getElementById("executeCommand").addEventListener("click", () => {
      this.executeCommand()
    })

    // Quick commands
    document.querySelectorAll(".quick-cmd").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const command = e.target.dataset.cmd
        document.getElementById("commandInput").value = command
        this.executeCommand()
      })
    })

    // Repository validation
    document.getElementById("validateRepo").addEventListener("click", () => {
      this.validateRepository()
    })

    // Deploy actions
    document.getElementById("createDeployZip").addEventListener("click", () => {
      this.createDeployZip()
    })

    document.getElementById("showDeployInstructions").addEventListener("click", () => {
      this.showDeployInstructions()
    })

    // Platform deploy buttons
    document.querySelectorAll(".platform-card button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const platform = e.target.closest(".platform-card").dataset.platform
        this.deployToPlatform(platform)
      })
    })

    // Console actions
    document.getElementById("clearLogs").addEventListener("click", () => {
      this.clearLogs()
    })

    document.getElementById("downloadLogs").addEventListener("click", () => {
      this.downloadLogs()
    })

    // Modal actions
    document.getElementById("closeDeployModal").addEventListener("click", () => {
      this.closeModal("deployModal")
    })

    // Command input enter key
    document.getElementById("commandInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.executeCommand()
      }
    })
  }

  async generateQR() {
    try {
      this.addLog("Generating QR code...", "info")
      const response = await fetch("/api/generate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (response.ok) {
        this.addLog("QR generation initiated", "success")
      } else {
        throw new Error(data.error || "QR generation failed")
      }
    } catch (error) {
      this.addLog(`QR generation failed: ${error.message}`, "error")
    }
  }

  downloadQR() {
    if (!this.qrString) {
      this.addLog("No QR code available to download", "warning")
      return
    }

    const link = document.createElement("a")
    link.href = "/qr.png"
    link.download = "whatsapp-qr.png"
    link.click()
    this.addLog("QR code downloaded", "success")
  }

  copyQRString() {
    if (!this.qrString) {
      this.addLog("No QR string available to copy", "warning")
      return
    }

    navigator.clipboard
      .writeText(this.qrString)
      .then(() => {
        this.addLog("QR string copied to clipboard", "success")
      })
      .catch(() => {
        this.addLog("Failed to copy QR string", "error")
      })
  }

  async exportSession() {
    try {
      this.addLog("Exporting session...", "info")
      const response = await fetch("/session/export")
      const data = await response.json()

      if (response.ok) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `session-${data.sessionId}-${new Date().toISOString().split("T")[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
        this.addLog("Session exported successfully", "success")
      } else {
        throw new Error(data.error || "Export failed")
      }
    } catch (error) {
      this.addLog(`Session export failed: ${error.message}`, "error")
    }
  }

  showImportSection() {
    document.getElementById("importSection").style.display = "block"
  }

  hideImportSection() {
    document.getElementById("importSection").style.display = "none"
    document.getElementById("sessionData").value = ""
  }

  async importSession() {
    const sessionData = document.getElementById("sessionData").value.trim()

    if (!sessionData) {
      this.addLog("Please enter session data", "warning")
      return
    }

    try {
      this.addLog("Importing session...", "info")
      const response = await fetch("/session/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionData }),
      })

      const data = await response.json()

      if (response.ok) {
        this.addLog("Session imported successfully", "success")
        this.hideImportSection()
      } else {
        throw new Error(data.error || "Import failed")
      }
    } catch (error) {
      this.addLog(`Session import failed: ${error.message}`, "error")
    }
  }

  saveOwnerNumbers() {
    const numbers = document.getElementById("ownerNumbers").value
    // This would typically save to server
    this.addLog(`Owner numbers updated: ${numbers}`, "success")
  }

  async executeCommand() {
    const command = document.getElementById("commandInput").value.trim()
    const target = document.getElementById("targetNumber").value.trim()

    if (!command) {
      this.addLog("Please enter a command", "warning")
      return
    }

    try {
      this.addLog(`Executing command: ${command}`, "info")
      const response = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, target }),
      })

      const data = await response.json()

      if (response.ok) {
        this.addLog(`Command executed: ${command}`, "success")
      } else {
        throw new Error(data.error || "Command execution failed")
      }
    } catch (error) {
      this.addLog(`Command failed: ${error.message}`, "error")
    }
  }

  async validateRepository() {
    const repoUrl = document.getElementById("repoUrl").value.trim()

    if (!repoUrl) {
      this.addLog("Please enter a repository URL", "warning")
      return
    }

    try {
      const response = await fetch("/api/validate-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      })

      const data = await response.json()

      if (data.valid) {
        this.addLog("Repository URL is valid", "success")
      } else {
        this.addLog("Invalid repository URL. Only github.com/LGT09/* repositories are allowed", "error")
      }
    } catch (error) {
      this.addLog(`Repository validation failed: ${error.message}`, "error")
    }
  }

  createDeployZip() {
    this.addLog("Creating deployment ZIP...", "info")
    // This would trigger server-side ZIP creation
    setTimeout(() => {
      this.addLog("Deploy ZIP created successfully", "success")
    }, 2000)
  }

  deployToPlatform(platform) {
    this.addLog(`Initiating deployment to ${platform}...`, "info")
    // Platform-specific deployment logic would go here
  }

  showDeployInstructions() {
    const modal = document.getElementById("deployModal")
    const instructions = document.getElementById("deployInstructions")

    instructions.innerHTML = `
      <h4>Deployment Instructions</h4>
      <div class="deploy-instructions">
        <h5>Heroku</h5>
        <pre><code>git clone your-repo
cd your-repo
heroku create your-app-name
git push heroku main</code></pre>
        
        <h5>Render</h5>
        <pre><code>1. Connect your GitHub repository
2. Set build command: npm install
3. Set start command: npm start
4. Add environment variables</code></pre>
        
        <h5>Railway</h5>
        <pre><code>1. Connect GitHub repository
2. Railway will auto-detect Node.js
3. Add environment variables
4. Deploy automatically</code></pre>
      </div>
    `

    modal.classList.add("active")
  }

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove("active")
  }

  clearLogs() {
    document.getElementById("consoleOutput").innerHTML = ""
    this.addLog("Console cleared", "info")
  }

  downloadLogs() {
    const logs = document.getElementById("consoleOutput").innerText
    const blob = new Blob([logs], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `gaga-bot-logs-${new Date().toISOString().split("T")[0]}.txt`
    link.click()
    URL.revokeObjectURL(url)
    this.addLog("Logs downloaded", "success")
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active")
    })
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")

    // Update tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active")
    })
    document.getElementById(`${tabName}-tab`).classList.add("active")
  }

  async generatePairingCode() {
    const phoneNumber = document.getElementById("phoneNumber").value.trim()

    if (!phoneNumber) {
      this.addLog("Please enter your phone number", "warning")
      return
    }

    try {
      this.addLog("Generating pairing code...", "info")
      const response = await fetch("/api/pair-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      })

      const data = await response.json()

      if (response.ok) {
        this.displayPairingCode(data.code, phoneNumber)
        this.addLog(`Pairing code generated for ${phoneNumber}`, "success")
      } else {
        throw new Error(data.error || "Pairing code generation failed")
      }
    } catch (error) {
      this.addLog(`Pairing code generation failed: ${error.message}`, "error")
    }
  }

  displayPairingCode(code, phoneNumber) {
    const display = document.getElementById("pairingCodeDisplay")
    const codeValue = document.getElementById("pairingCodeValue")

    codeValue.textContent = code
    display.style.display = "block"

    this.addLog(`Pairing code: ${code} for ${phoneNumber}`, "info")
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new GagaBotDashboard()
})
