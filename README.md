# 🧾 Receipt Printer Hackathon - Setup Guide

This is a GitHub template repository for the Receipt Printer Hackathon. Follow these instructions to get started with your hackathon project.

## 📋 Prerequisites

### Network Requirements
⚠️ **IMPORTANT**: You must be connected to the `192.168.29.*` network for the application to communicate with the compilation server and printer. Connect to the hackathon WiFi network before proceeding.

## 🚀 Quick Start

### Step 1: Create Your Repository from Template

1. Go to the GitHub repository page
2. Click the green **"Use this template"** button
3. Choose **"Create a new repository"**
4. Name your repository (e.g., `team-name-receipt-hackathon`)
5. Make it public or private as you prefer
6. Click **"Create repository from template"**

### Step 2: Clone Your New Repository

```bash
# Replace YOUR-USERNAME and YOUR-REPO-NAME with your actual values
git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
cd YOUR-REPO-NAME
```

## 💻 Platform-Specific Setup

### Windows Setup

#### 1. Install Node.js and npm

1. **Download Node.js**:
   - Visit [https://nodejs.org/](https://nodejs.org/)
   - Download the **LTS version** (should be 20.x or higher)
   - Choose the Windows Installer (.msi) 64-bit

2. **Run the Installer**:
   - Double-click the downloaded `.msi` file
   - Follow the installation wizard
   - ✅ Make sure to check "Automatically install the necessary tools" when prompted
   - Click "Next" through all steps and "Install"

3. **Verify Installation**:
   Open **Command Prompt** or **PowerShell** and run:
   ```cmd
   node --version
   npm --version
   ```
   You should see version numbers for both commands.

4. **Install Git** (if not already installed):
   - Download from [https://git-scm.com/download/win](https://git-scm.com/download/win)
   - Run the installer with default settings
   - Restart your terminal after installation

#### 2. Install Project Dependencies

Open **Command Prompt** or **PowerShell** in your project directory:
```cmd
cd path\to\your\cloned\repo
npm install
```

#### 3. Run the Development Server

```cmd
npm run dev
```

The application will open at [http://localhost:3000](http://localhost:3000)

---

### macOS Setup

#### 1. Install Node.js and npm

**Option A: Using Homebrew (Recommended)**

1. **Install Homebrew** (if not already installed):
   Open **Terminal** and run:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Node.js**:
   ```bash
   brew install node
   ```

**Option B: Direct Download**

1. **Download Node.js**:
   - Visit [https://nodejs.org/](https://nodejs.org/)
   - Download the **LTS version** (should be 20.x or higher)
   - Choose the macOS Installer (.pkg)

2. **Run the Installer**:
   - Double-click the downloaded `.pkg` file
   - Follow the installation wizard
   - You may need to enter your password

3. **Verify Installation**:
   Open **Terminal** and run:
   ```bash
   node --version
   npm --version
   ```
   You should see version numbers for both commands.

#### 2. Install Project Dependencies

Open **Terminal** in your project directory:
```bash
cd ~/path/to/your/cloned/repo
npm install
```

#### 3. Run the Development Server

```bash
npm run dev
```

The application will open at [http://localhost:3000](http://localhost:3000)

## 🌐 Network Configuration

### Connecting to the Hackathon Network

1. **WiFi Network**: Connect to the hackathon WiFi network (credentials will be provided)
2. **IP Range**: Ensure you're on the `192.168.29.*` subnet
3. **Verify Connection**:
   - Windows: Run `ipconfig` in Command Prompt
   - macOS: Run `ifconfig` in Terminal
   - Look for an IP address starting with `192.168.29.`

### Server Endpoints

The application is pre-configured to connect to:
- **Compilation Server**: `http://192.168.29.X:8080` (exact IP will be provided)
- **Print Server**: Connected via the compilation server

## 🔧 Troubleshooting

### Common Issues and Solutions

#### "npm: command not found"
- **Solution**: Node.js is not installed or not in your PATH. Reinstall Node.js and restart your terminal.

#### "EACCES" or Permission Errors (macOS/Linux)
- **Solution**: Don't use `sudo` with npm. If you see permission errors, fix npm permissions:
  ```bash
  mkdir ~/.npm-global
  npm config set prefix '~/.npm-global'
  echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
  source ~/.profile
  ```

#### Cannot Connect to Server
- **Check Network**: Ensure you're on the `192.168.29.*` network
- **Check Firewall**: Temporarily disable firewall if testing
- **Verify Server**: Ask organizers if the server is running

#### Port 3000 Already in Use
- **Windows**: 
  ```cmd
  netstat -ano | findstr :3000
  taskkill /PID <PID_NUMBER> /F
  ```
- **macOS/Linux**:
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```

#### Build Errors
- **Clear Cache and Reinstall**:
  ```bash
  rm -rf node_modules package-lock.json .next
  npm install
  npm run dev
  ```

## 📱 Using the Application

Once running, you'll see four tabs in the application:

1. **📜 Rules**: Competition rules and system architecture
2. **📝 Design**: Build your receipt designer here (YOU IMPLEMENT THIS)
3. **👁️ Preview**: Test your designs with the JavaScript interpreter
4. **🚀 Submit**: Submit your Kotlin code to the server

## 🏁 Getting Started with Development

1. **Start with the Design Tab** (`src/components/ReceiptDesigner.tsx`):
   - This is currently empty - you need to build it!
   - Create a drag-and-drop interface for receipt design
   - Generate JSON from your design

2. **Implement the JavaScript Interpreter** (`src/components/ReceiptPreview.tsx`):
   - Parse your JSON format
   - Render the receipt using the HTML Canvas

3. **Write Your Kotlin Interpreter**:
   - Use the same JSON format as your JavaScript interpreter
   - Submit via the Submit tab when ready

## 📞 Need Help?

- **Network Issues**: Ask the hackathon organizers for network credentials
- **Server Connection**: Verify the server IP address with organizers
- **Code Issues**: Check the browser console (F12) for errors
- **General Help**: Raise your hand and an organizer will assist you

## 🎯 Ready to Start!

Once you see the application running at [http://localhost:3000](http://localhost:3000) and you're connected to the correct network, you're ready to begin the hackathon!

Good luck! 🏆