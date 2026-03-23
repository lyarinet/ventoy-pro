# 🎨 Ventoy Theme Generator Pro

A powerful, user-friendly web application for creating custom themes for Ventoy USB boot drives. Build beautiful, professional-looking boot menus with ease!

![Ventoy Theme Generator](https://img.shields.io/badge/Ventoy-Theme%20Generator-blue)
![React](https://img.shields.io/badge/React-19.2.0-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646cff)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🎨 Advanced Customization
- **Custom Background Images** - Upload and use your own background images
- **Icon Management** - 12+ built-in OS icons + unlimited custom icon support
- **Color Schemes** - Full control over all theme colors
- **Font Configuration** - Choose from multiple fonts and adjust sizes
- **Visual Effects** - Glass morphism, glow effects, rounded corners, animations
- **Layout Control** - Precise positioning and sizing of menu elements

### 💾 Smart Configuration Saving
- **Persistent Storage** - Save configurations to browser's localStorage
- **Quick Load** - Access saved configs from the top bar instantly
- **Export/Import** - Backup and share your configurations as JSON files
- **Auto-Save** - Last used config is automatically preserved

### 🛡️ Advanced Features
- **Password Protection** - Secure your boot menu with passwords
- **Custom Menu Entries** - Add custom ISO paths and aliases
- **Icon Mapping** - Automatic icon assignment based on ISO names
- **Multi-Resolution Support** - From 720p to 4K UHD

### 🎯 User Experience
- **Interactive Tooltips** - Helpful guidance for every feature
- **Live Preview** - See changes in real-time
- **Responsive Design** - Works on desktop and mobile devices
- **Professional UI** - Clean, modern GitHub-themed interface

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v20.19.6 or higher recommended)
- npm (comes with Node.js)

### Installation

1. **Clone or navigate to the project directory:**
```bash
cd /Users/asifagaria/Downloads/app
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the application:**

**Option A: Using the start script (Recommended)**
```bash
./start.sh
```

This script will:
- Kill any processes using ports 3001 or 5173
- Install all dependencies
- Build the frontend
- Start the server automatically

**Option B: Manual start**
```bash
# Build the project first
npm run build

# Start the server
npm run server
```

4. **Open your browser:**
   - Server URL: `http://localhost:3001`
   - The app will be available immediately

## 🌐 Deployment

### Easiest Production Option: Render

If you want the whole app to work together with:

- login/auth
- uploads
- shared themes
- SQLite database
- generated ZIP packages

then `Render` is the easiest option for this codebase.

This repo now includes `render.yaml`, so you can deploy it as a single Render Web Service.

Included:

- frontend served by Express
- backend API
- SQLite database
- persistent disk for uploads and database files

Render files:

- `render.yaml`

### Netlify Frontend + Separate Backend

This project now supports a clean deployment split:

- `Frontend`: deploy to `Netlify`
- `Backend/API`: deploy `server/server.js` to a Node host such as `Render`, `Railway`, or `Fly.io`
- `Database`: keep the backend database on the backend host

Important:

- `Netlify` is great for the React frontend
- the current `Express + SQLite` backend should **not** be hosted as a static Netlify site
- for production, set `VITE_API_URL` in Netlify to your backend URL

Example Netlify environment variable:

```bash
VITE_API_URL=https://your-backend.example.com
```

### Netlify Build Settings

- Build command: `npm run build`
- Publish directory: `dist`

### Local Env Example

Copy `.env.example` to `.env` if needed:

```bash
cp .env.example .env
```

### Why This Split Is Recommended

The frontend is fully Netlify-compatible now, but the backend needs persistent server-side storage for:

- auth sessions
- shared themes
- uploaded files
- SQLite data

That production data should live on the backend host, not on a static frontend deployment.

## 📖 Usage Guide

### Creating Your First Theme

1. **Choose a Template (Optional)**
   - Click the "Templates" tab
   - Select from pre-made themes like Cyberpunk, Matrix, Neon Tokyo, etc.

2. **Upload Background**
   - Go to "BG" tab
   - Click to upload your background image
   - Or use solid color

3. **Configure Icons**
   - Navigate to "Icons" tab
   - Click any icon to upload custom images
   - Add custom icon types for specific OSes
   - Toggle "Show Icons" to enable/disable

4. **Customize Colors**
   - Open "Colors" tab
   - Adjust primary, secondary, and accent colors
   - Configure text and background colors
   - Use color picker or enter hex values

5. **Adjust Fonts**
   - Go to "Fonts" tab
   - Select title and item fonts
   - Adjust font sizes with sliders

6. **Add Effects**
   - Open "Effects" tab
   - Enable glass morphism
   - Add glow effects
   - Choose menu animations
   - Enable rounded corners

7. **Set Layout**
   - Navigate to "Layout" tab
   - Adjust menu position (left/top)
   - Set menu width and height
   - Choose screen resolution

8. **Advanced Settings**
   - Click "Advanced" tab
   - Add custom menu entries
   - Configure password protection
   - Set timeout and other options

9. **Save Your Configuration**
   - Click the Save button in the header
   - Enter a name for your config
   - Click "Save Configuration"
   - Config is now saved to browser storage!

10. **Generate Theme**
    - Click "Generate & Download"
    - Wait for processing
    - Download complete ZIP package
    - Extract to your Ventoy USB drive

### Managing Saved Configurations

**Load Saved Config:**
- Click any config name in the top bar
- All settings are instantly restored
- Custom icons are also loaded

**Export Config:**
- Click "Export" button
- Downloads JSON file with all settings
- Share with others or backup

**Import Config:**
- Click "Import" button
- Select previously exported JSON
- Configuration is loaded immediately

**Reset to Defaults:**
- Click "Reset" button
- All settings return to factory defaults

## 🏗️ Project Structure

```
app/
├── src/                    # Source files
│   ├── components/ui/     # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Entry point
├── server/                 # Backend server
│   ├── server.js          # Express server
│   └── uploads/           # Uploaded files (auto-created)
├── dist/                   # Built production files
├── start.sh               # Startup script
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── vite.config.ts         # Vite configuration
```

## 🛠️ Development

### Available Scripts

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Start server only
npm run server

# Lint code
npm run lint
```

### Tech Stack

- **Frontend:**
  - React 19.2.0
  - TypeScript 5.9.3
  - Vite 7.2.4
  - Radix UI Components
  - Tailwind CSS
  - Lucide Icons
  - Sonner (Toasts)

- **Backend:**
  - Node.js
  - Express 5.2.1
  - Multer (File uploads)
  - Archiver (ZIP generation)
  - CORS

## 📦 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/background` | Upload background image |
| POST | `/api/upload/icon/:type` | Upload icon for specific type |
| POST | `/api/generate/theme` | Generate theme.txt file |
| POST | `/api/generate/ventoy-json` | Generate ventoy.json config |
| POST | `/api/download/theme` | Download complete theme ZIP |
| GET | `/api/status` | Get current upload status |

## 🔧 Troubleshooting

### Port Already in Use
If port 3001 is already in use:
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Build Fails
Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Config Not Saving
- Check browser console for errors
- Ensure localStorage is enabled
- Try a different browser

### Icons Not Showing
- Verify icon files are uploaded
- Check that "Show Icons" is enabled
- Ensure ISO filenames match icon keywords

## 🎨 Icon Types

Built-in supported icon types:
- Windows (all versions)
- Linux (generic)
- Ubuntu
- Debian
- Fedora
- Kali Linux
- macOS
- Arch Linux
- Linux Mint
- Manjaro
- Pop!_OS
- Generic USB/ISO

You can add unlimited custom icon types through the UI!

## 📝 Configuration File Format

The app generates two main files:

**theme.txt** - GRUB theme configuration:
```
desktop-color: "#0d1117"
title-text: "Ventoy Boot Menu"
title-color: "#58a6ff"
+ boot_menu {
    left = 25%
    top = 30%
    width = 50%
    # ... more settings
}
```

**ventoy.json** - Ventoy settings:
```json
{
  "theme": {
    "file": "/ventoy/theme/theme.txt",
    "resolution": "1920x1080"
  },
  "menu_class": [
    { "key": "windows", "class": "windows" }
  ]
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Ventoy](https://www.ventoy.net/) - Amazing boot tool
- [Radix UI](https://www.radix-ui.com/) - Excellent UI components
- [Lucide Icons](https://lucide.dev/) - Beautiful icons
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

## 📞 Support

For issues, questions, or suggestions:
1. Check this README
2. Review tooltip guidance in the app
3. Check browser console for errors
4. Verify server is running on port 3001

## 🌟 Made with ❤️

Built with React, TypeScript, and lots of ☕

---

**Enjoy creating beautiful Ventoy themes!** 🎉
