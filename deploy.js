import fs from "fs/promises"
import { existsSync } from "fs"
import { fileURLToPath } from "url"
import { dirname } from "path"
import archiver from "archiver"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Deployment configurations for different platforms
export const deploymentConfigs = {
  heroku: {
    name: "Heroku",
    icon: "🟣",
    description: "Deploy to Heroku with automatic scaling",
    requirements: ["Heroku CLI", "Git repository"],
    files: ["Procfile", "package.json"],
    envVars: ["NODE_ENV", "PORT", "OPENAI_API_KEY"],
    steps: [
      "Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli",
      "Login to Heroku: heroku login",
      "Create app: heroku create your-bot-name",
      "Set environment variables: heroku config:set NODE_ENV=production",
      "Deploy: git push heroku main",
      "Scale dynos: heroku ps:scale web=1",
    ],
    docs: "https://devcenter.heroku.com/articles/deploying-nodejs",
  },

  render: {
    name: "Render",
    icon: "🟢",
    description: "Deploy to Render with automatic builds",
    requirements: ["GitHub repository", "Render account"],
    files: ["package.json", "render.yaml"],
    envVars: ["NODE_ENV", "OPENAI_API_KEY", "ADMIN_NUMBERS"],
    steps: [
      "Connect GitHub repository to Render",
      "Create new Web Service",
      "Set build command: npm install",
      "Set start command: npm start",
      "Add environment variables in dashboard",
      "Deploy automatically on git push",
    ],
    docs: "https://render.com/docs/deploy-node-express-app",
  },

  railway: {
    name: "Railway",
    icon: "🚂",
    description: "Deploy to Railway with zero configuration",
    requirements: ["GitHub repository", "Railway account"],
    files: ["package.json"],
    envVars: ["NODE_ENV", "OPENAI_API_KEY"],
    steps: [
      "Connect GitHub repository to Railway",
      "Railway auto-detects Node.js project",
      "Add environment variables in dashboard",
      "Deploy automatically on git push",
      "Custom domain available in pro plan",
    ],
    docs: "https://docs.railway.app/deploy/deployments",
  },

  netlify: {
    name: "Netlify",
    icon: "🌐",
    description: "Deploy static dashboard to Netlify",
    requirements: ["GitHub repository", "Netlify account"],
    files: ["netlify.toml", "package.json"],
    envVars: ["NODE_ENV"],
    steps: [
      "Connect GitHub repository to Netlify",
      "Set build command: npm run build",
      "Set publish directory: dist",
      "Add environment variables in dashboard",
      "Deploy automatically on git push",
    ],
    docs: "https://docs.netlify.com/configure-builds/overview/",
    note: "For static dashboard only - bot logic needs separate hosting",
  },

  codespaces: {
    name: "GitHub Codespaces",
    icon: "🐙",
    description: "Develop and test in cloud environment",
    requirements: ["GitHub repository", "Codespaces access"],
    files: [".devcontainer/devcontainer.json", "package.json"],
    envVars: ["OPENAI_API_KEY", "ADMIN_NUMBERS"],
    steps: [
      "Open repository in GitHub",
      "Click 'Code' > 'Codespaces' > 'Create codespace'",
      "Wait for environment setup",
      "Run: npm install",
      "Run: npm start",
      "Access via forwarded ports",
    ],
    docs: "https://docs.github.com/en/codespaces",
  },

  koyeb: {
    name: "Koyeb",
    icon: "☁️",
    description: "Deploy to Koyeb with global edge locations",
    requirements: ["GitHub repository", "Koyeb account"],
    files: ["Dockerfile", "package.json"],
    envVars: ["NODE_ENV", "PORT", "OPENAI_API_KEY"],
    steps: [
      "Connect GitHub repository to Koyeb",
      "Create new service",
      "Select Docker deployment",
      "Add environment variables",
      "Deploy with automatic scaling",
    ],
    docs: "https://www.koyeb.com/docs/deploy/docker",
  },

  huggingface: {
    name: "Hugging Face Spaces",
    icon: "🤗",
    description: "Deploy AI-focused bot to Hugging Face",
    requirements: ["Hugging Face account", "Git repository"],
    files: ["app.py", "requirements.txt", "README.md"],
    envVars: ["OPENAI_API_KEY", "HF_TOKEN"],
    steps: [
      "Create new Space on Hugging Face",
      "Select Gradio or Streamlit SDK",
      "Upload files or connect Git repository",
      "Add secrets in Space settings",
      "Space builds and deploys automatically",
    ],
    docs: "https://huggingface.co/docs/hub/spaces",
    note: "Requires Python adaptation of the bot",
  },

  termux: {
    name: "Termux (Android)",
    icon: "📱",
    description: "Run bot locally on Android device",
    requirements: ["Android device", "Termux app"],
    files: ["package.json", "termux-setup.sh"],
    envVars: ["NODE_ENV", "OPENAI_API_KEY"],
    steps: [
      "Install Termux from F-Droid or Google Play",
      "Update packages: pkg update && pkg upgrade",
      "Install Node.js: pkg install nodejs git",
      "Clone repository: git clone <repo-url>",
      "Install dependencies: npm install",
      "Run bot: npm start",
    ],
    docs: "https://termux.dev/en/",
  },
}

// Generate platform-specific configuration files
export async function generateConfigFiles() {
  const configs = {}

  // Heroku Procfile
  configs["Procfile"] = `web: node server.js
worker: node server.js`

  // Render configuration
  configs["render.yaml"] = `services:
  - type: web
    name: gaga09-xmd-bot
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        generateValue: true
    autoDeploy: true`

  // Netlify configuration
  configs["netlify.toml"] = `[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[functions]
  node_bundler = "esbuild"`

  // Docker configuration
  configs["Dockerfile"] = `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create temp directory for media processing
RUN mkdir -p temp logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["npm", "start"]`

  // Docker Compose for development
  configs["docker-compose.yml"] = `version: '3.8'

services:
  gaga09-xmd:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
    volumes:
      - ./session:/app/session
      - ./logs:/app/logs
      - ./temp:/app/temp
    restart: unless-stopped

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    restart: unless-stopped`

  // GitHub Codespaces devcontainer
  configs[".devcontainer/devcontainer.json"] = JSON.stringify(
    {
      name: "Gaga09 XMD Bot Development",
      image: "mcr.microsoft.com/devcontainers/javascript-node:18",
      features: {
        "ghcr.io/devcontainers/features/docker-in-docker:2": {},
      },
      customizations: {
        vscode: {
          extensions: ["ms-vscode.vscode-json", "bradlc.vscode-tailwindcss", "esbenp.prettier-vscode"],
          settings: {
            "terminal.integrated.defaultProfile.linux": "bash",
          },
        },
      },
      forwardPorts: [3000],
      postCreateCommand: "npm install",
      remoteUser: "node",
    },
    null,
    2,
  )

  // Termux setup script
  configs["termux-setup.sh"] = `#!/bin/bash
# Termux setup script for Gaga09 XMD Bot

echo "🤖 Setting up Gaga09 XMD Bot on Termux..."

# Update packages
pkg update -y && pkg upgrade -y

# Install required packages
pkg install -y nodejs git python ffmpeg imagemagick

# Install PM2 globally
npm install -g pm2

# Create necessary directories
mkdir -p ~/gaga09-xmd/session
mkdir -p ~/gaga09-xmd/logs
mkdir -p ~/gaga09-xmd/temp

echo "✅ Termux setup complete!"
echo "📝 Next steps:"
echo "1. Clone the repository: git clone <repo-url>"
echo "2. Navigate to directory: cd gaga09-xmd"
echo "3. Install dependencies: npm install"
echo "4. Configure .env file"
echo "5. Start bot: npm start"
echo ""
echo "🔧 To run in background: pm2 start server.js --name gaga09-xmd"
echo "📊 To monitor: pm2 monit"
echo "🔄 To restart: pm2 restart gaga09-xmd"`

  return configs
}

// GitHub Actions workflows
export async function generateGitHubActions() {
  const workflows = {}

  // Main deployment workflow
  workflows[".github/workflows/deploy.yml"] = `name: Deploy Gaga09 XMD Bot

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test --if-present
    
    - name: Check code formatting
      run: npm run format:check --if-present

  deploy-heroku:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.14
      with:
        heroku_api_key: \${{ secrets.HEROKU_API_KEY }}
        heroku_app_name: \${{ secrets.HEROKU_APP_NAME }}
        heroku_email: \${{ secrets.HEROKU_EMAIL }}

  deploy-render:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to Render
      run: |
        curl -X POST \\
          -H "Authorization: Bearer \${{ secrets.RENDER_API_KEY }}" \\
          -H "Content-Type: application/json" \\
          -d '{"serviceId": "\${{ secrets.RENDER_SERVICE_ID }}"}' \\
          https://api.render.com/v1/services/\${{ secrets.RENDER_SERVICE_ID }}/deploys

  build-docker:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: \${{ secrets.DOCKER_USERNAME }}
        password: \${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: \${{ secrets.DOCKER_USERNAME }}/gaga09-xmd:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max`

  // Release workflow
  workflows[".github/workflows/release.yml"] = `name: Create Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Create deployment package
      run: |
        zip -r gaga09-xmd-\${{ github.ref_name }}.zip . \\
          -x "node_modules/*" ".git/*" "temp/*" "logs/*" "session/*"
    
    - name: Create Release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: \${{ github.ref }}
        release_name: Gaga09 XMD \${{ github.ref }}
        body: |
          ## Changes in this Release
          - Bug fixes and improvements
          - Updated dependencies
          - Enhanced performance
          
          ## Deployment
          Download the zip file and follow the deployment instructions in README.md
        draft: false
        prerelease: false
    
    - name: Upload Release Asset
      uses: actions/upload-release-asset@v1
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: \${{ steps.create_release.outputs.upload_url }}
        asset_path: ./gaga09-xmd-\${{ github.ref_name }}.zip
        asset_name: gaga09-xmd-\${{ github.ref_name }}.zip
        asset_content_type: application/zip`

  return workflows
}

// Create deployment package
export async function createDeploymentPackage(options = {}) {
  try {
    const { includeNodeModules = false, outputPath = "gaga09-xmd-deploy.zip" } = options

    console.log("Creating deployment package...")

    const output = fs.createWriteStream(outputPath)
    const archive = archiver("zip", { zlib: { level: 9 } })

    return new Promise((resolve, reject) => {
      output.on("close", () => {
        console.log(`Deployment package created: ${outputPath} (${archive.pointer()} bytes)`)
        resolve({
          success: true,
          path: outputPath,
          size: archive.pointer(),
          sizeFormatted: `${(archive.pointer() / 1024 / 1024).toFixed(2)}MB`,
        })
      })

      archive.on("error", (err) => {
        reject(err)
      })

      archive.pipe(output)

      // Add all necessary files
      const filesToInclude = [
        "server.js",
        "apiHandler.js",
        "adminCommands.js",
        "utils.js",
        "mediaProcessor.js",
        "deploy.js",
        "package.json",
        "pm2.config.js",
        ".env.example",
        "README.md",
        "CHANGELOG.md",
      ]

      // Add directories
      const directoriesToInclude = ["views", "public", "scripts"]

      // Add files
      for (const file of filesToInclude) {
        if (existsSync(file)) {
          archive.file(file, { name: file })
        }
      }

      // Add directories
      for (const dir of directoriesToInclude) {
        if (existsSync(dir)) {
          archive.directory(dir, dir)
        }
      }

      // Add configuration files
      const configs = await generateConfigFiles()
      for (const [filename, content] of Object.entries(configs)) {
        archive.append(content, { name: filename })
      }

      // Add GitHub Actions workflows
      const workflows = await generateGitHubActions()
      for (const [filename, content] of Object.entries(workflows)) {
        archive.append(content, { name: filename })
      }

      // Optionally include node_modules (not recommended for most deployments)
      if (includeNodeModules && existsSync("node_modules")) {
        archive.directory("node_modules", "node_modules")
      }

      // Create empty directories that might be needed
      archive.append("", { name: "session/.gitkeep" })
      archive.append("", { name: "temp/.gitkeep" })
      archive.append("", { name: "logs/.gitkeep" })

      archive.finalize()
    })
  } catch (error) {
    throw new Error(`Failed to create deployment package: ${error.message}`)
  }
}

// Get deployment instructions for a specific platform
export function getDeploymentInstructions(platform) {
  const config = deploymentConfigs[platform]
  if (!config) {
    throw new Error(`Unknown platform: ${platform}`)
  }

  return {
    platform: config.name,
    icon: config.icon,
    description: config.description,
    requirements: config.requirements,
    files: config.files,
    envVars: config.envVars,
    steps: config.steps,
    docs: config.docs,
    note: config.note,
  }
}

// Generate platform-specific deployment script
export async function generateDeploymentScript(platform, options = {}) {
  const config = deploymentConfigs[platform]
  if (!config) {
    throw new Error(`Unknown platform: ${platform}`)
  }

  const { appName = "gaga09-xmd-bot", region = "us-east-1" } = options

  let script = ""

  switch (platform) {
    case "heroku":
      script = `#!/bin/bash
# Heroku deployment script for Gaga09 XMD Bot

echo "🚀 Deploying to Heroku..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI not found. Please install it first."
    echo "📥 Download: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Login to Heroku
echo "🔐 Logging in to Heroku..."
heroku login

# Create app if it doesn't exist
echo "📱 Creating Heroku app: ${appName}"
heroku create ${appName} --region ${region} || echo "App might already exist"

# Set environment variables
echo "⚙️ Setting environment variables..."
heroku config:set NODE_ENV=production --app ${appName}
heroku config:set NPM_CONFIG_PRODUCTION=false --app ${appName}

# Add buildpacks
echo "🔧 Adding buildpacks..."
heroku buildpacks:add heroku/nodejs --app ${appName}

# Deploy
echo "🚀 Deploying to Heroku..."
git add .
git commit -m "Deploy to Heroku" || echo "No changes to commit"
git push heroku main

# Scale dynos
echo "📊 Scaling dynos..."
heroku ps:scale web=1 --app ${appName}

echo "✅ Deployment complete!"
echo "🌐 App URL: https://${appName}.herokuapp.com"
echo "📊 Logs: heroku logs --tail --app ${appName}"`
      break

    case "railway":
      script = `#!/bin/bash
# Railway deployment script for Gaga09 XMD Bot

echo "🚂 Deploying to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "🔐 Logging in to Railway..."
railway login

# Initialize project
echo "📱 Initializing Railway project..."
railway init

# Set environment variables
echo "⚙️ Setting environment variables..."
railway variables set NODE_ENV=production

# Deploy
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Check your Railway dashboard for the app URL"`
      break

    case "render":
      script = `#!/bin/bash
# Render deployment guide for Gaga09 XMD Bot

echo "🟢 Render Deployment Guide"
echo "=========================="
echo ""
echo "1. 🌐 Go to https://render.com and sign in"
echo "2. 📂 Connect your GitHub repository"
echo "3. ➕ Create a new Web Service"
echo "4. ⚙️ Configure the service:"
echo "   - Name: ${appName}"
echo "   - Environment: Node"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo "5. 🔐 Add environment variables:"
echo "   - NODE_ENV=production"
echo "   - PORT=10000"
echo "   - Add your API keys"
echo "6. 🚀 Click 'Create Web Service'"
echo ""
echo "✅ Your bot will deploy automatically!"
echo "📖 Full docs: https://render.com/docs/deploy-node-express-app"`
      break

    default:
      script = `#!/bin/bash
# Generic deployment script for ${config.name}

echo "🚀 Deploying to ${config.name}..."
echo "📖 Please follow the manual steps:"
echo ""

${config.steps.map((step, index) => `echo "${index + 1}. ${step}"`).join("\n")}

echo ""
echo "📚 Documentation: ${config.docs}"
${config.note ? `echo "⚠️ Note: ${config.note}"` : ""}`
  }

  return script
}

// Validate deployment environment
export function validateDeploymentEnvironment(platform) {
  const config = deploymentConfigs[platform]
  if (!config) {
    return { valid: false, error: `Unknown platform: ${platform}` }
  }

  const issues = []
  const warnings = []

  // Check required files
  for (const file of config.files) {
    if (!existsSync(file)) {
      issues.push(`Missing required file: ${file}`)
    }
  }

  // Check package.json
  if (existsSync("package.json")) {
    try {
      const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
      if (!pkg.scripts?.start) {
        issues.push("Missing 'start' script in package.json")
      }
      if (!pkg.engines?.node) {
        warnings.push("Consider specifying Node.js version in package.json engines field")
      }
    } catch (error) {
      issues.push("Invalid package.json file")
    }
  }

  // Platform-specific checks
  switch (platform) {
    case "heroku":
      if (!existsSync("Procfile")) {
        warnings.push("Consider adding a Procfile for better control over dyno processes")
      }
      break

    case "docker":
    case "koyeb":
      if (!existsSync("Dockerfile")) {
        issues.push("Dockerfile is required for containerized deployment")
      }
      break

    case "netlify":
      if (!existsSync("netlify.toml")) {
        warnings.push("Consider adding netlify.toml for build configuration")
      }
      break
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    platform: config.name,
  }
}

// Export all deployment utilities
export { platforms }
