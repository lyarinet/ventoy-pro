import express from 'express';
import multer from 'multer';
import archiver from 'archiver';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
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
        'POST /api/auth/register': 'Create a user account',
        'POST /api/auth/login': 'Login and create session',
        'GET /api/auth/session': 'Get current logged-in user',
        'POST /api/auth/logout': 'Logout current session',
        'PUT /api/auth/password': 'Change current user password',
        'GET /api/settings': 'Get global branding settings',
        'PUT /api/settings': 'Update global branding settings (admin only)',
        'POST /api/settings/logo': 'Upload and save global logo (admin only)',
        'GET /api/themes': 'List all shared themes',
        'POST /api/themes': 'Share a theme (login required)',
        'DELETE /api/themes/:id': 'Delete a shared theme (owner or admin)',
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
const brandingDir = path.join(uploadsDir, 'branding');
const outputDir = path.join(__dirname, 'output');
const builtInBackgroundsDir = path.join(__dirname, '..', 'public', 'backgrounds');
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const themesFile = path.join(dataDir, 'themes.json');
const sessionsFile = path.join(dataDir, 'sessions.json');
const settingsFile = path.join(dataDir, 'settings.json');

[uploadsDir, backgroundsDir, iconsDir, brandingDir, outputDir, dataDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const DEFAULT_SETTINGS = {
  siteTitle: 'Ventoy Pro',
  siteSubtitle: 'Advanced Theme Generator',
  logoUrl: '',
  logoText: 'VP',
};

function ensureJsonFile(filePath, fallbackValue) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallbackValue, null, 2));
  }
}

function readJsonFile(filePath, fallbackValue) {
  try {
    if (!fs.existsSync(filePath)) {
      return fallbackValue;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch (error) {
    console.error(`Failed to read ${filePath}:`, error);
    return fallbackValue;
  }
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const hashed = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hashed, 'hex'), Buffer.from(hash, 'hex'));
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function getUsers() {
  return readJsonFile(usersFile, []);
}

function saveUsers(users) {
  writeJsonFile(usersFile, users);
}

function getThemes() {
  return readJsonFile(themesFile, []);
}

function saveThemes(themes) {
  writeJsonFile(themesFile, themes);
}

function getSessions() {
  return readJsonFile(sessionsFile, []);
}

function saveSessions(sessions) {
  writeJsonFile(sessionsFile, sessions);
}

function getSettings() {
  return readJsonFile(settingsFile, DEFAULT_SETTINGS);
}

function saveSettings(settings) {
  writeJsonFile(settingsFile, settings);
}

function createSession(userId) {
  const sessions = getSessions();
  const token = crypto.randomBytes(24).toString('hex');
  const session = {
    token,
    userId,
    createdAt: new Date().toISOString(),
  };
  sessions.push(session);
  saveSessions(sessions);
  return token;
}

function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return null;
  }

  const sessions = getSessions();
  const session = sessions.find((entry) => entry.token === token);
  if (!session) {
    return null;
  }

  const users = getUsers();
  const user = users.find((entry) => entry.id === session.userId);
  if (!user) {
    return null;
  }

  return { token, user };
}

function requireAuth(req, res, next) {
  const auth = getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Login required' });
  }

  req.authToken = auth.token;
  req.user = sanitizeUser(auth.user);
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
}

ensureJsonFile(usersFile, []);
ensureJsonFile(themesFile, []);
ensureJsonFile(sessionsFile, []);
ensureJsonFile(settingsFile, DEFAULT_SETTINGS);

if (getUsers().length === 0) {
  const adminPassword = hashPassword('admin123');
  saveUsers([
    {
      id: 'user_admin',
      username: 'admin',
      role: 'admin',
      passwordSalt: adminPassword.salt,
      passwordHash: adminPassword.hash,
      createdAt: new Date().toISOString(),
    },
  ]);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'background') {
      cb(null, backgroundsDir);
    } else if (file.fieldname === 'logo') {
      cb(null, brandingDir);
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

app.post('/api/auth/register', (req, res) => {
  try {
    const username = String(req.body?.username || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (username.length < 3 || password.length < 4) {
      return res.status(400).json({ success: false, error: 'Username or password is too short' });
    }

    const users = getUsers();
    if (users.some((user) => user.username === username)) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }

    const passwordData = hashPassword(password);
    const newUser = {
      id: `user_${crypto.randomUUID()}`,
      username,
      role: 'user',
      passwordSalt: passwordData.salt,
      passwordHash: passwordData.hash,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    const token = createSession(newUser.id);
    res.json({ success: true, token, user: sanitizeUser(newUser) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const username = String(req.body?.username || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const users = getUsers();
    const user = users.find((entry) => entry.username === username);

    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const token = createSession(user.id);
    res.json({ success: true, token, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/auth/session', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const sessions = getSessions().filter((session) => session.token !== req.authToken);
  saveSessions(sessions);
  res.json({ success: true });
});

app.put('/api/auth/password', requireAuth, (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password are required' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters long' });
    }

    const users = getUsers();
    const userIndex = users.findIndex((entry) => entry.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const storedUser = users[userIndex];
    if (!verifyPassword(currentPassword, storedUser.passwordSalt, storedUser.passwordHash)) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const passwordData = hashPassword(newPassword);
    users[userIndex] = {
      ...storedUser,
      passwordSalt: passwordData.salt,
      passwordHash: passwordData.hash,
    };
    saveUsers(users);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/settings', (req, res) => {
  res.json({ success: true, settings: getSettings() });
});

app.put('/api/settings', requireAuth, requireAdmin, (req, res) => {
  try {
    const nextSettings = {
      siteTitle: String(req.body?.siteTitle || DEFAULT_SETTINGS.siteTitle).trim() || DEFAULT_SETTINGS.siteTitle,
      siteSubtitle: String(req.body?.siteSubtitle || DEFAULT_SETTINGS.siteSubtitle).trim() || DEFAULT_SETTINGS.siteSubtitle,
      logoUrl: String(req.body?.logoUrl || '').trim(),
      logoText: String(req.body?.logoText || DEFAULT_SETTINGS.logoText).trim().slice(0, 4) || DEFAULT_SETTINGS.logoText,
    };

    saveSettings(nextSettings);
    res.json({ success: true, settings: nextSettings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/settings/logo', requireAuth, requireAdmin, upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No logo file uploaded' });
    }

    const nextSettings = {
      ...getSettings(),
      logoUrl: `/uploads/branding/${req.file.filename}`,
    };

    saveSettings(nextSettings);
    res.json({
      success: true,
      settings: nextSettings,
      logoUrl: nextSettings.logoUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/themes', (req, res) => {
  const themes = getThemes()
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, themes });
});

app.post('/api/themes', requireAuth, (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const previewImage = String(req.body?.previewImage || '').trim();
    const config = req.body?.config;
    const customIconTypes = Array.isArray(req.body?.customIconTypes) ? req.body.customIconTypes : [];

    if (!name || !previewImage || !config) {
      return res.status(400).json({ success: false, error: 'Theme name, preview image, and config are required' });
    }

    const themes = getThemes();
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const ownedThemes = themes.filter((theme) => theme.ownerId === req.user.id);
    const sharedToday = ownedThemes.filter((theme) => new Date(theme.createdAt).getTime() >= oneDayAgo);

    if (req.user.role !== 'admin') {
      if (ownedThemes.length >= 2) {
        return res.status(400).json({ success: false, error: 'Delete one of your existing themes before sharing a new one' });
      }

      if (sharedToday.length >= 2) {
        return res.status(400).json({ success: false, error: 'You can share a maximum of two themes per day' });
      }
    }

    const record = {
      id: `theme_${crypto.randomUUID()}`,
      name,
      previewImage,
      config,
      customIconTypes,
      createdAt: new Date().toISOString(),
      ownerId: req.user.id,
      ownerName: req.user.username,
    };

    themes.push(record);
    saveThemes(themes);
    res.json({ success: true, theme: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/themes/:id', requireAuth, (req, res) => {
  try {
    const themeId = req.params.id;
    const themes = getThemes();
    const theme = themes.find((entry) => entry.id === themeId);

    if (!theme) {
      return res.status(404).json({ success: false, error: 'Theme not found' });
    }

    const canDelete = req.user.role === 'admin' || theme.ownerId === req.user.id;
    if (!canDelete) {
      return res.status(403).json({ success: false, error: 'You can delete only your own themes' });
    }

    saveThemes(themes.filter((entry) => entry.id !== themeId));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

app.use((error, req, res, next) => {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Payload too large. Try sharing a smaller preview image.',
    });
  }

  if (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }

  next();
});

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
