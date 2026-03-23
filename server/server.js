import express from 'express';
import multer from 'multer';
import archiver from 'archiver';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from dist directory
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// Root route - serve index.html or API info
app.get('/', (req, res) => {
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      message: 'Ventoy Theme Generator Pro API',
      endpoints: {
        'GET /': 'This info',
        'POST /api/upload/background': 'Upload background image',
        'POST /api/upload/icon/:type': 'Upload icon',
        'POST /api/generate/theme': 'Generate theme.txt',
        'POST /api/generate/ventoy-json': 'Generate ventoy.json',
        'POST /api/download/theme': 'Download complete theme package',
        'GET /api/status': 'Get upload status'
      }
    });
  }
});

// Ensure directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const backgroundsDir = path.join(uploadsDir, 'backgrounds');
const iconsDir = path.join(uploadsDir, 'icons');
const outputDir = path.join(__dirname, 'output');
const builtInBackgroundsDir = path.join(__dirname, '..', 'public', 'backgrounds');

[uploadsDir, backgroundsDir, iconsDir, outputDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'background') {
      cb(null, backgroundsDir);
    } else {
      cb(null, iconsDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Store uploaded files info
const uploadedFiles = {
  background: null,
  icons: {}
};

// ==================== API ROUTES ====================

// Upload background image
app.post('/api/upload/background', upload.single('background'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    uploadedFiles.background = req.file.filename;
    res.json({ 
      success: true, 
      path: `/uploads/backgrounds/${req.file.filename}`,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload icon
app.post('/api/upload/icon/:type', upload.single('icon'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const iconType = req.params.type;
    uploadedFiles.icons[iconType] = req.file.filename;
    res.json({ 
      success: true, 
      path: `/uploads/icons/${req.file.filename}`,
      type: iconType,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate theme.txt
app.post('/api/generate/theme', (req, res) => {
  try {
    const config = req.body;
    const themeContent = generateThemeTxt(config);
    res.json({ success: true, content: themeContent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate ventoy.json
app.post('/api/generate/ventoy-json', (req, res) => {
  try {
    const config = req.body;
    const ventoyJson = generateVentoyJson(config);
    res.json({ success: true, content: ventoyJson });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download complete theme package
app.post('/api/download/theme', async (req, res) => {
  try {
    const config = req.body;
    const timestamp = Date.now();
    const zipFilename = `ventoy-theme-${timestamp}.zip`;
    const zipPath = path.join(outputDir, zipFilename);

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      // Set headers for download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        setTimeout(() => {
          if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
          }
        }, 60000);
      });
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);

    const ventoyRoot = 'ventoy';
    const themeRoot = `${ventoyRoot}/theme`;

    // Add theme.txt
    const themeContent = generateThemeTxt(config);
    archive.append(themeContent, { name: `${themeRoot}/theme.txt` });

    // Add ventoy.json
    const ventoyJson = generateVentoyJson(config);
    archive.append(JSON.stringify(ventoyJson, null, 2), { name: `${ventoyRoot}/ventoy.json` });

    // Add README.md
    const readmeContent = generateReadme(config);
    archive.append(readmeContent, { name: `${ventoyRoot}/README.md` });

    // Add INSTALL.md
    const installContent = generateInstallGuide(config);
    archive.append(installContent, { name: `${ventoyRoot}/INSTALL.md` });

    // Add background image
    const backgroundRoot = config.backgroundSource === 'builtin' ? builtInBackgroundsDir : backgroundsDir;
    if (config.backgroundFile && fs.existsSync(path.join(backgroundRoot, config.backgroundFile))) {
      archive.file(path.join(backgroundRoot, config.backgroundFile), { name: `${themeRoot}/backgrounds/${config.backgroundFile}` });
    }

    // Add icons
    Object.entries(config.iconFiles || {}).forEach(([iconType, filename]) => {
      if (filename && fs.existsSync(path.join(iconsDir, filename))) {
        const ext = path.extname(filename);
        archive.file(path.join(iconsDir, filename), { name: `${themeRoot}/icons/${iconType}${ext}` });
      }
    });

    await archive.finalize();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current uploads status
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    background: uploadedFiles.background,
    icons: uploadedFiles.icons
  });
});

// ==================== THEME GENERATION FUNCTIONS ====================

function generateThemeTxt(config) {
  const {
    desktopColor = '#0d1117',
    primaryColor = '#58a6ff',
    secondaryColor = '#1f6feb',
    accentColor = '#2ea043',
    normalTextColor = '#8b949e',
    selectedTextColor = '#ffffff',
    headerColor = '#58a6ff',
    footerColor = '#6e7681',
    progressBgColor = '#21262d',
    progressFgColor = '#238636',
    menuLeft = 25,
    menuTop = 30,
    menuWidth = 50,
    menuHeight = 45,
    headerText = 'Ventoy Boot Menu',
    timeout = 30,
    backgroundFile = null,
    titleFont = 'Unifont Regular',
    itemFont = 'Unifont Regular',
    titleFontSize = 24,
    itemFontSize = 16,
    showProgressBar = true,
    showFooter = true,
    roundedCorners = true,
    glassEffect = true,
    glowEffect = true,
    menuAnimation = 'fade',
    animationSpeed = 300,
  } = config;

  // Generate animation class based on selection
  const animationComment = {
    'none': '# No animation',
    'fade': '# Animation: Fade in effect',
    'slide': '# Animation: Slide up effect',
    'zoom': '# Animation: Zoom in effect',
    'bounce': '# Animation: Bounce effect',
  }[menuAnimation] || '# Animation: Default';

  return `# ============================================
# Lyaritech Ventoy Pro Theme Configuration for Ventoy
# Generated by Ventoy Theme Generator Pro
# ============================================

# Desktop background
desktop-color: "${desktopColor}"
${backgroundFile ? `desktop-image: "backgrounds/${backgroundFile}"` : '# desktop-image: "backgrounds/custom.jpg"'}

${animationComment}
# Animation speed: ${animationSpeed}ms

# Title configuration
title-text: "${headerText}"
title-color: "${headerColor}"
title-font: "${titleFont} ${titleFontSize}"

# Terminal box styling
terminal-box: "terminal_box_*.png"
terminal-font: "${itemFont} ${itemFontSize}"

# ============================================
# Boot Menu Configuration
# ============================================
+ boot_menu {
    left = ${menuLeft}%
    top = ${menuTop}%
    width = ${menuWidth}%
    height = ${menuHeight}%
    
    # Font settings
    item_font = "${itemFont} ${itemFontSize}"
    selected_item_font = "${itemFont} ${itemFontSize}"
    
    # Color settings
    item_color = "${normalTextColor}"
    selected_item_color = "${selectedTextColor}"
    
    # Icon settings
    icon_width = 32
    icon_height = 32
    item_icon_space = 12
    
    # Item spacing
    item_height = ${Math.max(36, itemFontSize + 16)}
    item_padding = 8
    item_spacing = 4
    
    # Visual effects
    ${roundedCorners ? '# Rounded corners enabled' : '# Sharp corners'}
    ${glassEffect ? '# Glass morphism effect enabled' : '# Solid background'}
    
    # Pixmap styles (if available)
    menu_pixmap_style = "menu_*.png"
    item_pixmap_style = "item_*.png"
    selected_item_pixmap_style = "selected_item_*.png"
}

# ============================================
# Progress Bar Configuration
# ============================================
${showProgressBar ? `+ progress_bar {
    id = "__timeout__"
    left = 20%
    top = 85%
    width = 60%
    height = 16
    
    # Colors
    bg_color = "${progressBgColor}"
    fg_color = "${progressFgColor}"
    border_color = "${primaryColor}"
    
    # Text settings
    show_text = 1
    text = "Booting in %d seconds"
    text_color = "${normalTextColor}"
    font = "${itemFont} 14"
    
    ${glowEffect ? '# Glow effect enabled' : '# No glow'}
}` : '# Progress bar disabled'}

# ============================================
# Footer Message
# ============================================
${showFooter ? `+ label {
    left = 0
    top = 95%
    width = 100%
    height = 20
    text = "Use ↑↓ to select, Enter to boot"
    color = "${footerColor}"
    font = "${itemFont} 12"
    align = "center"
}` : '# Footer disabled'}

# ============================================
# Custom styling notes
# ============================================
# Primary Color: ${primaryColor}
# Secondary Color: ${secondaryColor}
# Accent Color: ${accentColor}
# Glass Effect: ${glassEffect ? 'Enabled' : 'Disabled'}
# Glow Effect: ${glowEffect ? 'Enabled' : 'Disabled'}
# Rounded Corners: ${roundedCorners ? 'Enabled' : 'Disabled'}
`;
}

function addMenuClassEntry(menuClass, seenEntries, key, className) {
  const normalizedKey = String(key || '').trim().toLowerCase();
  const normalizedClass = String(className || '').trim();

  if (!normalizedKey || !normalizedClass) {
    return;
  }

  const entryId = `${normalizedKey}:${normalizedClass}`;
  if (seenEntries.has(entryId)) {
    return;
  }

  seenEntries.add(entryId);
  menuClass.push({ key: normalizedKey, class: normalizedClass });
}

function getCustomEntryKeys(entry) {
  const candidates = [
    entry?.alias,
    entry?.name,
    entry?.path,
    path.basename(entry?.path || ''),
    path.basename(entry?.path || '', path.extname(entry?.path || '')),
  ];

  const keys = new Set();

  candidates.forEach((value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) {
      return;
    }

    keys.add(normalized);
    keys.add(normalized.replace(/\s+/g, ''));
    keys.add(normalized.replace(/[^a-z0-9]+/g, ' ').trim());
    keys.add(normalized.replace(/[^a-z0-9]+/g, ''));
  });

  return [...keys].filter(Boolean);
}

function generateVentoyJson(config) {
  const {
    resolution = '1920x1080',
    timeout = 30,
    backgroundFile = null,
    passwordProtected = false,
    menuPassword = '',
    customEntries = [],
    iconFiles = {},
    customIconTypes = [],
  } = config;

  const menuClass = [];
  const seenMenuClassEntries = new Set();

  // Map icon types to file extensions
  const iconMappings = {
    windows: { keys: ['windows', 'win', 'win10', 'win11'], file: iconFiles.windows },
    linux: { keys: ['linux'], file: iconFiles.linux },
    ubuntu: { keys: ['ubuntu'], file: iconFiles.ubuntu },
    debian: { keys: ['debian'], file: iconFiles.debian },
    fedora: { keys: ['fedora'], file: iconFiles.fedora },
    kali: { keys: ['kali'], file: iconFiles.kali },
    macos: { keys: ['macos', 'osx', 'mac'], file: iconFiles.macos },
    arch: { keys: ['arch'], file: iconFiles.arch },
    mint: { keys: ['mint'], file: iconFiles.mint },
    manjaro: { keys: ['manjaro'], file: iconFiles.manjaro },
    popos: { keys: ['pop', 'popos'], file: iconFiles.popos },
    usb: { keys: ['iso'], file: iconFiles.usb }
  };

  customIconTypes.forEach((iconType) => {
    if (iconType?.id && iconFiles[iconType.id]) {
      iconMappings[iconType.id] = {
        keys: [iconType.id.toLowerCase()],
        file: iconFiles[iconType.id],
      };
    }
  });

  Object.entries(iconMappings).forEach(([type, data]) => {
    if (data.file) {
      data.keys.forEach(key => {
        addMenuClassEntry(menuClass, seenMenuClassEntries, key, type);
      });
    }
  });

  customEntries.forEach((entry) => {
    if (!entry?.icon || !iconFiles[entry.icon]) {
      return;
    }

    getCustomEntryKeys(entry).forEach((key) => {
      addMenuClassEntry(menuClass, seenMenuClassEntries, key, entry.icon);
    });
  });

  // Build menu_alias from custom entries
  const menuAlias = customEntries.map(entry => ({
    image: entry.path,
    alias: entry.alias || entry.name
  }));

  // Build menu_password if enabled
  const menuPasswordArr = passwordProtected && menuPassword ? [
    { pwd: menuPassword, boot: 1 }
  ] : [];

  const result = {
    theme: {
      file: "/ventoy/theme/theme.txt",
      resolution: resolution,
      gfxmode: `${resolution},auto`
    },
    control: [
      { VTOY_MENU_TIMEOUT: timeout.toString() },
      { VTOY_DEFAULT_SEARCH_ROOT: "/ISO" }
    ]
  };

  if (menuClass.length > 0) {
    result.menu_class = menuClass;
  }

  if (menuAlias.length > 0) {
    result.menu_alias = menuAlias;
  }

  if (menuPasswordArr.length > 0) {
    result.menu_password = menuPasswordArr;
  }

  return result;
}

function generateReadme(config) {
  const { headerText = 'Ventoy Boot Menu', timeout = 30 } = config;
  
  return `# 🎨 ${headerText}

## Theme Information
- **Generated by:** Ventoy Theme Generator Pro
- **Date:** ${new Date().toLocaleString()}
- **Header:** ${headerText}
- **Timeout:** ${timeout} seconds
- **Resolution:** ${config.resolution || '1920x1080'}

## 🚀 Features Included
${config.passwordProtected ? '- ✅ Password Protection' : ''}
${config.showProgressBar ? '- ✅ Progress Bar' : ''}
${config.showFooter ? '- ✅ Footer Message' : ''}
${config.showIcons ? '- ✅ OS Icons' : ''}
${config.glassEffect ? '- ✅ Glass Morphism Effect' : ''}
${config.glowEffect ? '- ✅ Glow Effects' : ''}
${config.roundedCorners ? '- ✅ Rounded Corners' : ''}
${config.customEntries?.length > 0 ? `- ✅ ${config.customEntries.length} Custom Menu Entries` : ''}

## 📁 Files Included

| File | Description |
|------|-------------|
| \`ventoy/theme/theme.txt\` | Main GRUB theme configuration |
| \`ventoy/ventoy.json\` | Ventoy settings & mappings |
| \`ventoy/README.md\` | This file |
| \`ventoy/INSTALL.md\` | Installation guide |
| \`ventoy/theme/backgrounds/\` | Background images |
| \`ventoy/theme/icons/\` | OS-specific icons |

## 🎨 Color Scheme

| Element | Color |
|---------|-------|
| Primary | ${config.primaryColor || '#58a6ff'} |
| Secondary | ${config.secondaryColor || '#1f6feb'} |
| Accent | ${config.accentColor || '#2ea043'} |
| Background | ${config.desktopColor || '#0d1117'} |
| Text | ${config.normalTextColor || '#8b949e'} |

## 📖 Documentation

For detailed instructions, see \`ventoy/INSTALL.md\`

---

*Created with Ventoy Theme Generator Pro* ⭐
`;
}

function generateInstallGuide(config) {
  return `# 📖 Installation Guide

## 🚀 Quick Install (3 Steps)

### Step 1: Extract
Extract the ZIP file to a temporary folder.

### Step 2: Copy to USB
Copy the extracted \`ventoy\` folder directly to your Ventoy USB drive root:

\`\`\`
E:\
  └── ventoy\
      ├── ventoy.json
      ├── README.md
      ├── INSTALL.md
      └── theme\
          ├── theme.txt
          ├── backgrounds\
          │   └── your-background.jpg
          └── icons\
              ├── windows.png
              ├── ubuntu.png
              └── ...
\`\`\`

### Step 3: Boot
Safely eject the USB drive and boot from it!

---

## 🔧 Troubleshooting

### Theme not showing?
1. Check that files are in the correct location
2. Verify \`ventoy.json\` has correct paths
3. Restart your computer

### Icons not displaying?
1. Ensure ISO filenames contain OS keywords
2. Check icon files exist in \`ventoy/theme/icons/\` folder
3. Verify file permissions

### Password not working?
1. Check \`ventoy.json\` has password configured
2. Ensure password is not empty
3. Try re-downloading the theme

---

## 🎨 Customization

To modify this theme, use Ventoy Theme Generator Pro:
1. Import your configuration
2. Make changes
3. Download updated theme

---

*Need help? Check the online documentation.*
`;
}

// Start server
app.listen(PORT, () => {
  console.log(`╔══════════════════════════════════════════════════════════╗`);
  console.log(`║     Ventoy Theme Generator Pro - Server Running          ║`);
  console.log(`╠══════════════════════════════════════════════════════════╣`);
  console.log(`║  URL: http://localhost:${PORT}                              ║`);
  console.log(`╠══════════════════════════════════════════════════════════╣`);
  console.log(`║  API Endpoints:                                          ║`);
  console.log(`║    POST /api/upload/background  - Upload background      ║`);
  console.log(`║    POST /api/upload/icon/:type  - Upload icon            ║`);
  console.log(`║    POST /api/generate/theme     - Generate theme.txt     ║`);
  console.log(`║    POST /api/generate/ventoy-json - Generate ventoy.json ║`);
  console.log(`║    POST /api/download/theme     - Download ZIP package   ║`);
  console.log(`║    GET  /api/status             - Get upload status      ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝`);
});

// Catch-all route for SPA - serve index.html for any other routes
app.get('/{*path}', (req, res) => {
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Not Found' });
  }
});
