import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { 
  Upload, Download, Image, Palette, Layout, Type, Lock,
  Check, RefreshCw, Info, ChevronRight, Menu, X,
  Sparkles, Save, FolderOpen, Eye, Zap, Shield, Settings2,
  MonitorPlay, Layers, FileCode, Pencil, Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import './App.css';

// API base URL
const API_URL = 'http://localhost:3001';

// Icon types
const ICON_TYPES = [
  { id: 'windows', name: 'Windows', color: '#00a4ef' },
  { id: 'linux', name: 'Linux', color: '#fcc624' },
  { id: 'ubuntu', name: 'Ubuntu', color: '#e95420' },
  { id: 'debian', name: 'Debian', color: '#d70a53' },
  { id: 'fedora', name: 'Fedora', color: '#294172' },
  { id: 'kali', name: 'Kali Linux', color: '#367bf0' },
  { id: 'macos', name: 'macOS', color: '#999999' },
  { id: 'usb', name: 'Generic', color: '#00d4ff' },
  { id: 'arch', name: 'Arch', color: '#1793d1' },
  { id: 'mint', name: 'Mint', color: '#87cf3e' },
  { id: 'manjaro', name: 'Manjaro', color: '#35bf5c' },
  { id: 'popos', name: 'Pop!_OS', color: '#48b9c7' },
];

// Custom icon type definition
interface CustomIconType {
  id: string;
  name: string;
  color: string;
  isCustom?: boolean;
}

interface SavedConfigRecord {
  name: string;
  config: ThemeConfig;
  customIconTypes?: CustomIconType[];
}

interface MarketplaceThemeRecord {
  id: string;
  name: string;
  previewImage: string;
  config: ThemeConfig;
  customIconTypes: CustomIconType[];
  createdAt: string;
}

interface PreviewMenuItem {
  name: string;
  icon: string;
}

interface CustomEntry {
  name: string;
  path: string;
  alias: string;
  icon?: string;
}

interface CommunityTheme {
  name: string;
  badge: string;
  summary: string;
  accent: string;
  background: string;
  config: Partial<ThemeConfig>;
}

interface BuiltInBackground {
  id: string;
  name: string;
  summary: string;
  filename: string;
  accent: string;
}

// Font options
const FONT_OPTIONS = [
  { value: 'Unifont Regular', label: 'Unifont (Default)' },
  { value: 'DejaVu Sans', label: 'DejaVu Sans' },
  { value: 'Terminus', label: 'Terminus' },
  { value: 'Liberation Sans', label: 'Liberation Sans' },
];

// Animation options
const ANIMATION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade In' },
  { value: 'slide', label: 'Slide Up' },
  { value: 'zoom', label: 'Zoom In' },
  { value: 'bounce', label: 'Bounce' },
];

// Resolution options
const RESOLUTION_OPTIONS = [
  { value: '1920x1080', label: '1920x1080 (Full HD)', aspect: '16/9' },
  { value: '1366x768', label: '1366x768 (HD)', aspect: '16/9' },
  { value: '2560x1440', label: '2560x1440 (2K QHD)', aspect: '16/9' },
  { value: '3840x2160', label: '3840x2160 (4K UHD)', aspect: '16/9' },
  { value: '1280x720', label: '1280x720 (720p)', aspect: '16/9' },
  { value: '1024x768', label: '1024x768 (XGA)', aspect: '4/3' },
];

// Advanced theme presets
const ADVANCED_PRESETS = [
  { 
    name: 'Cyberpunk 2077', 
    primary: '#fcee0a', 
    bg: '#0a0a0f', 
    text: '#00f0ff',
    secondary: '#ff006e',
    accent: '#8338ec'
  },
  { 
    name: 'Neon Tokyo', 
    primary: '#ff00ff', 
    bg: '#0d0221', 
    text: '#00ffff',
    secondary: '#ff006e',
    accent: '#fb5607'
  },
  { 
    name: 'Matrix Code', 
    primary: '#00ff41', 
    bg: '#000000', 
    text: '#008f11',
    secondary: '#003b00',
    accent: '#00ff41'
  },
  { 
    name: 'Sunset Vapor', 
    primary: '#ff6b6b', 
    bg: '#2d1b4e', 
    text: '#feca57',
    secondary: '#48dbfb',
    accent: '#ff9ff3'
  },
  { 
    name: 'Ocean Depth', 
    primary: '#00d2d3', 
    bg: '#001f3f', 
    text: '#7fdbff',
    secondary: '#39cccc',
    accent: '#54a0ff'
  },
  { 
    name: 'Lava Flow', 
    primary: '#ff4757', 
    bg: '#2f3542', 
    text: '#ffa502',
    secondary: '#ff6348',
    accent: '#ff7f50'
  },
  { 
    name: 'Arctic Ice', 
    primary: '#74b9ff', 
    bg: '#dfe6e9', 
    text: '#0984e3',
    secondary: '#a29bfe',
    accent: '#fd79a8'
  },
  { 
    name: 'Royal Gold', 
    primary: '#ffd700', 
    bg: '#1a1a2e', 
    text: '#f39c12',
    secondary: '#e74c3c',
    accent: '#f1c40f'
  },
];

const COMMUNITY_THEMES: CommunityTheme[] = [
  {
    name: 'Minimal Frost',
    badge: 'Minimal',
    summary: 'Clean glass layout with icy neutrals and quiet typography.',
    accent: '#7dd3fc',
    background: 'linear-gradient(135deg, #0f172a, #1e293b 45%, #334155)',
    config: {
      desktopColor: '#0f172a',
      primaryColor: '#7dd3fc',
      secondaryColor: '#38bdf8',
      accentColor: '#e2e8f0',
      normalTextColor: '#cbd5e1',
      selectedTextColor: '#f8fafc',
      headerColor: '#e0f2fe',
      footerColor: '#94a3b8',
      progressBgColor: '#1e293b',
      progressFgColor: '#38bdf8',
      titleFont: 'DejaVu Sans',
      itemFont: 'DejaVu Sans',
      titleFontSize: 22,
      itemFontSize: 15,
      menuLeft: 28,
      menuTop: 28,
      menuWidth: 44,
      menuHeight: 40,
      glassEffect: true,
      glowEffect: false,
      roundedCorners: true,
      menuAnimation: 'fade',
      resolution: '1920x1080',
      headerText: 'Ventoy Minimal',
    },
  },
  {
    name: 'Hacker Green',
    badge: 'Hacker',
    summary: 'Terminal-inspired matrix look with hard contrast and punchy glow.',
    accent: '#22c55e',
    background: 'linear-gradient(135deg, #020617, #052e16 52%, #14532d)',
    config: {
      desktopColor: '#020617',
      primaryColor: '#22c55e',
      secondaryColor: '#15803d',
      accentColor: '#4ade80',
      normalTextColor: '#86efac',
      selectedTextColor: '#dcfce7',
      headerColor: '#4ade80',
      footerColor: '#22c55e',
      progressBgColor: '#052e16',
      progressFgColor: '#22c55e',
      titleFont: 'Terminus',
      itemFont: 'Terminus',
      titleFontSize: 26,
      itemFontSize: 16,
      menuLeft: 24,
      menuTop: 26,
      menuWidth: 52,
      menuHeight: 46,
      glassEffect: false,
      glowEffect: true,
      roundedCorners: false,
      menuAnimation: 'slide',
      resolution: '1920x1080',
      headerText: 'Boot Sequence',
    },
  },
  {
    name: 'Retro BIOS',
    badge: 'Retro',
    summary: 'Amber-on-dark nostalgic boot screen with chunky system fonts.',
    accent: '#f59e0b',
    background: 'linear-gradient(135deg, #09090b, #1c1917 55%, #451a03)',
    config: {
      desktopColor: '#09090b',
      primaryColor: '#f59e0b',
      secondaryColor: '#d97706',
      accentColor: '#fbbf24',
      normalTextColor: '#fcd34d',
      selectedTextColor: '#fffbeb',
      headerColor: '#facc15',
      footerColor: '#f59e0b',
      progressBgColor: '#292524',
      progressFgColor: '#f59e0b',
      titleFont: 'Terminus',
      itemFont: 'Unifont Regular',
      titleFontSize: 24,
      itemFontSize: 17,
      menuLeft: 20,
      menuTop: 24,
      menuWidth: 58,
      menuHeight: 48,
      glassEffect: false,
      glowEffect: false,
      roundedCorners: false,
      menuAnimation: 'none',
      resolution: '1024x768',
      headerText: 'Legacy Boot Center',
    },
  },
  {
    name: 'Aurora Glass',
    badge: 'Community',
    summary: 'Soft neon gradients, curved panels and modern landing-screen vibes.',
    accent: '#a78bfa',
    background: 'linear-gradient(135deg, #0b1020, #1d4ed8 45%, #14b8a6)',
    config: {
      desktopColor: '#0b1020',
      primaryColor: '#a78bfa',
      secondaryColor: '#60a5fa',
      accentColor: '#2dd4bf',
      normalTextColor: '#dbeafe',
      selectedTextColor: '#ffffff',
      headerColor: '#c4b5fd',
      footerColor: '#93c5fd',
      progressBgColor: '#1e293b',
      progressFgColor: '#60a5fa',
      titleFont: 'Liberation Sans',
      itemFont: 'DejaVu Sans',
      titleFontSize: 24,
      itemFontSize: 15,
      menuLeft: 27,
      menuTop: 28,
      menuWidth: 48,
      menuHeight: 43,
      glassEffect: true,
      glowEffect: true,
      roundedCorners: true,
      menuAnimation: 'zoom',
      resolution: '2560x1440',
      headerText: 'Aurora Launchpad',
    },
  },
];

const BUILT_IN_BACKGROUNDS: BuiltInBackground[] = [
  {
    id: 'neon-waves',
    name: 'Neon Waves',
    summary: 'Electric cyan ribbons with a deep violet stage.',
    filename: 'neon-waves.svg',
    accent: '#38bdf8',
  },
  {
    id: 'cyan-grid',
    name: 'Cyan Grid',
    summary: 'Clean targeting frame with a centered glow.',
    filename: 'cyan-grid.svg',
    accent: '#22d3ee',
  },
  {
    id: 'star-grid',
    name: 'Star Grid',
    summary: 'Boot-ready starfield layered over a blueprint grid.',
    filename: 'star-grid.svg',
    accent: '#60a5fa',
  },
  {
    id: 'tech-frame',
    name: 'Tech Frame',
    summary: 'Polished metallic panel with neon edge lighting.',
    filename: 'tech-frame.svg',
    accent: '#a78bfa',
  },
];

const MARKETPLACE_PAGE_SIZE = 6;

const WIZARD_STEPS = [
  {
    value: 'background',
    title: 'Background',
    subtitle: 'Pick a preset wallpaper or upload your own custom background.',
  },
  {
    value: 'colors',
    title: 'Colors',
    subtitle: 'Tune the accents, selected text, and progress colors for your theme.',
  },
  {
    value: 'fonts',
    title: 'Fonts',
    subtitle: 'Choose readable fonts and sizes that fit your Ventoy menu.',
  },
  {
    value: 'icons',
    title: 'Icons',
    subtitle: 'Turn icons on, replace built-in logos, or upload custom icon packs.',
  },
  {
    value: 'layout',
    title: 'Layout',
    subtitle: 'Place the menu, set the resolution, and adjust timeout.',
  },
  {
    value: 'advanced',
    title: 'Advanced',
    subtitle: 'Add custom menu entries, passwords, and extra boot controls if needed.',
  },
  {
    value: 'download',
    title: 'Download',
    subtitle: 'Generate the files or download the complete package in one go.',
  },
] as const;

const TAB_ITEMS: Array<{
  value: string;
  label: string;
  shortLabel: string;
  hint: string;
  tooltip: string;
  icon: typeof Sparkles;
  accent: string;
}> = [
  {
    value: 'templates',
    label: 'Templates',
    shortLabel: 'Templates',
    hint: 'Ready-made visual themes',
    tooltip: 'Pre-made theme presets with custom colors',
    icon: Sparkles,
    accent: 'from-[#c084fc] via-[#8b5cf6] to-[#38bdf8]',
  },
  {
    value: 'marketplace',
    label: 'Share Themes',
    shortLabel: 'Share',
    hint: 'Open marketplace and shared PNG cards',
    tooltip: 'Community showcase for sharing and downloading themes',
    icon: FolderOpen,
    accent: 'from-[#60a5fa] via-[#3b82f6] to-[#22c55e]',
  },
  {
    value: 'background',
    label: 'Background',
    shortLabel: 'BG',
    hint: 'Pick presets, upload wallpapers and base color',
    tooltip: 'Choose built-in or uploaded background images',
    icon: Image,
    accent: 'from-[#22c55e] via-[#14b8a6] to-[#38bdf8]',
  },
  {
    value: 'icons',
    label: 'Icons',
    shortLabel: 'Icons',
    hint: 'Built-in and custom OS marks',
    tooltip: 'Manage OS icons (built-in & custom)',
    icon: Layers,
    accent: 'from-[#f59e0b] via-[#f97316] to-[#ef4444]',
  },
  {
    value: 'colors',
    label: 'Colors',
    shortLabel: 'Colors',
    hint: 'Tune accents and text palette',
    tooltip: 'Customize theme colors and accents',
    icon: Palette,
    accent: 'from-[#fb7185] via-[#f43f5e] to-[#ec4899]',
  },
  {
    value: 'fonts',
    label: 'Fonts',
    shortLabel: 'Fonts',
    hint: 'Control typography and sizing',
    tooltip: 'Adjust font families and sizes',
    icon: Type,
    accent: 'from-[#2dd4bf] via-[#06b6d4] to-[#3b82f6]',
  },
  {
    value: 'effects',
    label: 'Effects',
    shortLabel: 'Effects',
    hint: 'Motion, glow and glass styling',
    tooltip: 'Visual effects, animations & styling',
    icon: Zap,
    accent: 'from-[#facc15] via-[#eab308] to-[#f97316]',
  },
  {
    value: 'layout',
    label: 'Layout',
    shortLabel: 'Layout',
    hint: 'Place menu blocks precisely',
    tooltip: 'Menu position, size & resolution',
    icon: Layout,
    accent: 'from-[#38bdf8] via-[#3b82f6] to-[#6366f1]',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    shortLabel: 'Advanced',
    hint: 'Passwords and extra controls',
    tooltip: 'Custom entries, passwords & advanced settings',
    icon: Shield,
    accent: 'from-[#4ade80] via-[#22c55e] to-[#16a34a]',
  },
];

// Theme configuration type
type ThemeConfig = {
  // Basic colors
  desktopColor: string;
  primaryColor: string;
  normalTextColor: string;
  selectedTextColor: string;
  headerColor: string;
  footerColor: string;
  progressBgColor: string;
  progressFgColor: string;
  secondaryColor: string;
  accentColor: string;
  
  // Layout
  menuLeft: number;
  menuTop: number;
  menuWidth: number;
  menuHeight: number;
  headerText: string;
  timeout: number;
  resolution: string;
  
  // Fonts
  titleFont: string;
  itemFont: string;
  titleFontSize: number;
  itemFontSize: number;
  
  // Animation
  menuAnimation: string;
  itemAnimation: string;
  animationSpeed: number;
  
  // Features
  showProgressBar: boolean;
  showFooter: boolean;
  showIcons: boolean;
  roundedCorners: boolean;
  glassEffect: boolean;
  glowEffect: boolean;
  
  // Security
  passwordProtected: boolean;
  menuPassword: string;
  
  // Custom entries
  customEntries: CustomEntry[];
  
  // Files
  backgroundSource: 'upload' | 'builtin';
  backgroundFile?: string;
  iconFiles?: Record<string, string>;
};

// Default theme configuration
const DEFAULT_CONFIG: ThemeConfig = {
  desktopColor: '#0d1117',
  primaryColor: '#58a6ff',
  normalTextColor: '#8b949e',
  selectedTextColor: '#ffffff',
  headerColor: '#58a6ff',
  footerColor: '#6e7681',
  progressBgColor: '#21262d',
  progressFgColor: '#238636',
  secondaryColor: '#1f6feb',
  accentColor: '#2ea043',
  
  menuLeft: 25,
  menuTop: 30,
  menuWidth: 50,
  menuHeight: 45,
  headerText: 'Ventoy Boot Menu',
  timeout: 30,
  resolution: '1920x1080',
  
  titleFont: 'Unifont Regular',
  itemFont: 'Unifont Regular',
  titleFontSize: 24,
  itemFontSize: 16,
  
  menuAnimation: 'fade',
  itemAnimation: 'slide',
  animationSpeed: 300,
  
  showProgressBar: true,
  showFooter: true,
  showIcons: true,
  roundedCorners: true,
  glassEffect: true,
  glowEffect: true,
  
  passwordProtected: false,
  menuPassword: '',
  
  customEntries: [],
  
  backgroundSource: 'upload',
  backgroundFile: undefined,
  iconFiles: {},
};

const STORAGE_KEYS = {
  savedConfigs: 'ventoyThemeConfigs',
  currentConfig: 'ventoyCurrentConfig',
  currentCustomIconTypes: 'ventoyCurrentCustomIconTypes',
  lastConfig: 'ventoyLastConfig',
  marketplaceThemes: 'ventoyMarketplaceThemes',
};

const normalizeConfig = (storedConfig?: Partial<ThemeConfig> | null): ThemeConfig => ({
  ...DEFAULT_CONFIG,
  ...storedConfig,
  backgroundSource: storedConfig?.backgroundSource === 'builtin' ? 'builtin' : 'upload',
  customEntries: Array.isArray(storedConfig?.customEntries)
    ? storedConfig.customEntries.map((entry) => ({
        name: entry?.name ?? '',
        path: entry?.path ?? '',
        alias: entry?.alias ?? '',
        icon: entry?.icon || undefined,
      }))
    : [],
  iconFiles: storedConfig?.iconFiles ?? {},
});

const buildBackgroundPreviewUrl = (
  source: ThemeConfig['backgroundSource'],
  filename?: string
) => {
  if (!filename) {
    return null;
  }

  return source === 'builtin'
    ? `/backgrounds/${filename}`
    : `${API_URL}/uploads/backgrounds/${filename}`;
};

const buildIconPreviewUrls = (iconFiles?: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(iconFiles ?? {})
      .filter(([, filename]) => Boolean(filename))
      .map(([type, filename]) => [type, `${API_URL}/uploads/icons/${filename}`])
  );

const DEFAULT_PREVIEW_ITEMS: PreviewMenuItem[] = [
  { name: 'Windows 11 Pro.iso', icon: 'windows' },
  { name: 'Ubuntu 22.04 LTS.iso', icon: 'ubuntu' },
  { name: 'Kali Linux 2024.iso', icon: 'kali' },
  { name: 'Fedora Workstation.iso', icon: 'fedora' },
  { name: 'Arch Linux.iso', icon: 'arch' },
];

const inferPreviewIcon = (
  text: string,
  customIconTypes: CustomIconType[],
  iconFiles?: Record<string, string>
) => {
  const normalizedText = text.toLowerCase();

  const customMatch = customIconTypes.find((icon) => normalizedText.includes(icon.id.toLowerCase()));
  if (customMatch && iconFiles?.[customMatch.id]) {
    return customMatch.id;
  }

  const builtInMatch = ICON_TYPES.find((icon) => normalizedText.includes(icon.id.toLowerCase()));
  if (builtInMatch) {
    return builtInMatch.id;
  }

  if (normalizedText.includes('win')) return 'windows';
  if (normalizedText.includes('mint')) return 'mint';
  if (normalizedText.includes('manjaro')) return 'manjaro';
  if (normalizedText.includes('pop')) return 'popos';
  if (normalizedText.includes('mac')) return 'macos';
  if (normalizedText.includes('debian')) return 'debian';
  if (normalizedText.includes('fedora')) return 'fedora';
  if (normalizedText.includes('arch')) return 'arch';
  if (normalizedText.includes('ubuntu')) return 'ubuntu';
  if (normalizedText.includes('kali')) return 'kali';
  if (normalizedText.includes('linux')) return 'linux';

  return 'usb';
};

const getPreviewItems = (config: ThemeConfig, customIconTypes: CustomIconType[]) => {
  if (config.customEntries.length === 0) {
    return DEFAULT_PREVIEW_ITEMS;
  }

  return config.customEntries.slice(0, 5).map((entry) => {
    const label = entry.alias || entry.name || entry.path;
    const sourceText = `${entry.alias} ${entry.name} ${entry.path}`;

    return {
      name: label,
      icon: entry.icon || inferPreviewIcon(sourceText, customIconTypes, config.iconFiles),
    };
  });
};

const getPreviewAnimationClass = (animation: string) => {
  if (animation === 'none') return '';
  return `animate-${animation}`;
};

const getAllIconTypes = (customIconTypes: CustomIconType[]) => [...ICON_TYPES, ...customIconTypes];

const downloadJsonFile = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const waitForRenderedAssets = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll('img'));

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.onload = () => resolve();
          image.onerror = () => resolve();
        })
    )
  );

  if ('fonts' in document) {
    await document.fonts.ready;
  }
};

const renderElementToPngDataUrl = async (element: HTMLElement) => {
  await waitForRenderedAssets(element);

  try {
    return await toPng(element, {
      cacheBust: true,
      pixelRatio: Math.max(window.devicePixelRatio || 1, 2),
      backgroundColor: '#0d1117',
      includeQueryParams: true,
    });
  } catch (error) {
    throw new Error(
      error instanceof Error && error.message
        ? `Preview image could not be rendered: ${error.message}`
        : 'Preview image could not be rendered.'
    );
  }
};

const exportElementAsPng = async (element: HTMLElement, filename: string) => {
  const pngUrl = await renderElementToPngDataUrl(element);
  const link = document.createElement('a');
  link.href = pngUrl;
  link.download = filename;
  link.click();
};

// OS logos as SVG components
const OSLogo = ({ type, size = 48 }: { type: string; size?: number }): ReactNode => {
  const logos: Record<string, ReactNode> = {
    windows: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
      </svg>
    ),
    linux: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.41v.019c.002.089.008.179.02.267-.006.134-.087.266-.18.333a.71.71 0 01-.088.042c-.104.045-.198.064-.284.133a1.312 1.312 0 01-.22.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 01-.061-.4c.045-.134.101-.2.183-.333.084-.066.167-.132.267-.132z"/>
      </svg>
    ),
    ubuntu: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="3"/>
        <circle cx="18" cy="6" r="2"/>
        <circle cx="6" cy="18" r="2"/>
        <circle cx="18" cy="18" r="2"/>
        <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm0 6a2 2 0 110-4 2 2 0 010 4z"/>
      </svg>
    ),
    debian: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        <circle cx="12" cy="12" r="4"/>
      </svg>
    ),
    fedora: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
      </svg>
    ),
    kali: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 22h20L12 2zm0 4l6.5 13h-13L12 6z"/>
        <path d="M12 10l-3 6h6l-3-6z"/>
      </svg>
    ),
    macos: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
    arch: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C7.5 2 4 7.5 4 12s3.5 10 8 10 8-5.5 8-10S16.5 2 12 2zm0 16c-3.5 0-6-4.5-6-8s2.5-6 6-6 6 4.5 6 6-2.5 8-6 8z"/>
        <path d="M12 6l-3 8h6l-3-8z"/>
      </svg>
    ),
    mint: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6c-3.5 0-6 2.5-6 6s2.5 6 6 6 6-2.5 6-6-2.5-6-6-6z" fill="currentColor" fillOpacity="0.3"/>
      </svg>
    ),
    manjaro: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <rect x="4" y="4" width="6" height="16"/>
        <rect x="14" y="8" width="6" height="12"/>
      </svg>
    ),
    popos: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 7l5 5-5 5-5-5z"/>
      </svg>
    ),
    usb: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M15 7v4h1v2h-3V5h2l-3-4-3 4h2v8H8v-2.07c.7-.24 1.2-.95 1.2-1.79 0-1.03-.85-1.87-1.88-1.87s-1.87.84-1.87 1.87c0 .84.5 1.55 1.2 1.79V14c0 1.1.9 2 2 2h3v3.87c-.7.24-1.2.95-1.2 1.79 0 1.03.85 1.87 1.88 1.87s1.87-.84 1.87-1.87c0-.84-.5-1.55-1.2-1.79V17h3c1.1 0 2-.9 2-2V9h-1V7h-3z"/>
      </svg>
    ),
  };

  return (logos[type] || logos.usb) as ReactNode;
};

function App() {
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_CONFIG);
  const [iconPreviews, setIconPreviews] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('templates');
  const [wizardMode, setWizardMode] = useState(false);
  const [wizardStep, setWizardStep] = useState<(typeof WIZARD_STEPS)[number]['value']>('background');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newEntryName, setNewEntryName] = useState('');
  const [newEntryPath, setNewEntryPath] = useState('');
  const [newEntryAlias, setNewEntryAlias] = useState('');
  const [newEntryIcon, setNewEntryIcon] = useState('auto');
  const [editingEntryIndex, setEditingEntryIndex] = useState<number | null>(null);
  const [savedConfigs, setSavedConfigs] = useState<SavedConfigRecord[]>([]);
  const [marketplaceThemes, setMarketplaceThemes] = useState<MarketplaceThemeRecord[]>([]);
  const [marketplacePage, setMarketplacePage] = useState(1);
  const [configName, setConfigName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [customIconTypes, setCustomIconTypes] = useState<CustomIconType[]>([]);
  const [newCustomIconId, setNewCustomIconId] = useState('');
  const [newCustomIconName, setNewCustomIconName] = useState('');
  const [newCustomIconColor, setNewCustomIconColor] = useState('#ff00ff');
  
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const iconInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const previewCaptureRef = useRef<HTMLDivElement>(null);
  const isFirstPersistenceRun = useRef(true);
  const availableIconTypes = getAllIconTypes(customIconTypes);
  const detectedEntryIcon = inferPreviewIcon(`${newEntryAlias} ${newEntryName} ${newEntryPath}`, customIconTypes, config.iconFiles);
  const previewItems = getPreviewItems(config, customIconTypes);
  const previewAnimationClass = getPreviewAnimationClass(config.menuAnimation);
  const backgroundPreview = buildBackgroundPreviewUrl(config.backgroundSource, config.backgroundFile);
  const totalMarketplacePages = Math.max(1, Math.ceil(marketplaceThemes.length / MARKETPLACE_PAGE_SIZE));
  const currentWizardIndex = WIZARD_STEPS.findIndex((step) => step.value === wizardStep);
  const currentWizardStep = WIZARD_STEPS[currentWizardIndex] ?? WIZARD_STEPS[0];
  const visibleMarketplaceThemes = marketplaceThemes.slice(
    (marketplacePage - 1) * MARKETPLACE_PAGE_SIZE,
    marketplacePage * MARKETPLACE_PAGE_SIZE
  );

  const persistDraft = (nextConfig: ThemeConfig, nextCustomIconTypes: CustomIconType[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.currentConfig, JSON.stringify(nextConfig));
      localStorage.setItem(STORAGE_KEYS.currentCustomIconTypes, JSON.stringify(nextCustomIconTypes));
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const persistLastConfig = (savedConfig: SavedConfigRecord) => {
    try {
      localStorage.setItem(STORAGE_KEYS.lastConfig, JSON.stringify(savedConfig));
    } catch (error) {
      console.error('Last config save error:', error);
    }
  };

  const getResolvedEntryIcon = (entry: CustomEntry) =>
    entry.icon || inferPreviewIcon(`${entry.alias} ${entry.name} ${entry.path}`, customIconTypes, config.iconFiles);

  const buildApiConfig = () => ({
    ...config,
    customIconTypes,
    customEntries: config.customEntries.map((entry) => ({
      ...entry,
      icon: getResolvedEntryIcon(entry),
    })),
  });

  const resetCustomEntryForm = () => {
    setNewEntryName('');
    setNewEntryPath('');
    setNewEntryAlias('');
    setNewEntryIcon('auto');
    setEditingEntryIndex(null);
  };

  // Load saved configs from localStorage on mount
  useEffect(() => {
    try {
      const savedConfigsStr = localStorage.getItem(STORAGE_KEYS.savedConfigs);
      const parsedSavedConfigs = savedConfigsStr ? JSON.parse(savedConfigsStr) : [];
      const nextSavedConfigs = Array.isArray(parsedSavedConfigs)
        ? parsedSavedConfigs
            .filter((item): item is SavedConfigRecord => Boolean(item?.name && item?.config))
            .map((item) => ({
              ...item,
              config: normalizeConfig(item.config),
              customIconTypes: Array.isArray(item.customIconTypes) ? item.customIconTypes : [],
            }))
        : [];

      setSavedConfigs(nextSavedConfigs);

      const marketplaceThemesStr = localStorage.getItem(STORAGE_KEYS.marketplaceThemes);
      const parsedMarketplaceThemes = marketplaceThemesStr ? JSON.parse(marketplaceThemesStr) : [];
      const nextMarketplaceThemes = Array.isArray(parsedMarketplaceThemes)
        ? parsedMarketplaceThemes
            .filter((item): item is MarketplaceThemeRecord => Boolean(item?.id && item?.name && item?.config && item?.previewImage))
            .map((item) => ({
              ...item,
              config: normalizeConfig(item.config),
              customIconTypes: Array.isArray(item.customIconTypes) ? item.customIconTypes : [],
            }))
        : [];

      setMarketplaceThemes(nextMarketplaceThemes);

      const currentConfigStr = localStorage.getItem(STORAGE_KEYS.currentConfig);
      const currentCustomIconTypesStr = localStorage.getItem(STORAGE_KEYS.currentCustomIconTypes);
      const lastConfigStr = localStorage.getItem(STORAGE_KEYS.lastConfig);

      const restoredCurrentConfig = currentConfigStr ? normalizeConfig(JSON.parse(currentConfigStr)) : null;
      const restoredLastConfig = lastConfigStr ? (JSON.parse(lastConfigStr) as SavedConfigRecord) : null;
      const restoredConfig = restoredCurrentConfig ?? (restoredLastConfig?.config ? normalizeConfig(restoredLastConfig.config) : null);
      const restoredCustomIconTypes = currentCustomIconTypesStr
        ? JSON.parse(currentCustomIconTypesStr)
        : restoredLastConfig?.customIconTypes ?? nextSavedConfigs.find((item) => item.customIconTypes?.length)?.customIconTypes ?? [];

      if (Array.isArray(restoredCustomIconTypes)) {
        setCustomIconTypes(restoredCustomIconTypes);
      }

      if (restoredConfig) {
        setConfig(restoredConfig);
        setIconPreviews(buildIconPreviewUrls(restoredConfig.iconFiles));
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    if (isFirstPersistenceRun.current) {
      isFirstPersistenceRun.current = false;
      return;
    }

    persistDraft(config, customIconTypes);
  }, [config, customIconTypes]);

  useEffect(() => {
    if (marketplacePage > totalMarketplacePages) {
      setMarketplacePage(totalMarketplacePages);
    }
  }, [marketplacePage, totalMarketplacePages]);

  useEffect(() => {
    if (wizardMode && activeTab !== wizardStep) {
      setActiveTab(wizardStep);
    }
  }, [activeTab, wizardMode, wizardStep]);

  const updateConfig = <K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const goToWizardStep = (step: (typeof WIZARD_STEPS)[number]['value']) => {
    setWizardStep(step);
    setActiveTab(step);
  };

  const moveWizardStep = (direction: 'next' | 'prev') => {
    const nextIndex = direction === 'next' ? currentWizardIndex + 1 : currentWizardIndex - 1;
    const nextStep = WIZARD_STEPS[nextIndex];
    if (!nextStep) {
      return;
    }
    goToWizardStep(nextStep.value);
  };

  const applyAdvancedPreset = (preset: typeof ADVANCED_PRESETS[0]) => {
    setConfig(prev => ({
      ...prev,
      primaryColor: preset.primary,
      desktopColor: preset.bg,
      normalTextColor: preset.text,
      headerColor: preset.primary,
      progressFgColor: preset.secondary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    }));
    toast.success(`Applied ${preset.name} theme!`);
  };

  const applyCommunityTheme = (theme: CommunityTheme) => {
    setConfig((prev) => ({
      ...prev,
      ...theme.config,
    }));
    toast.success(`Applied ${theme.name} community theme!`);
  };

  const selectBuiltInBackground = (background: BuiltInBackground) => {
    setConfig((prev) => ({
      ...prev,
      backgroundSource: 'builtin',
      backgroundFile: background.filename,
    }));
    toast.success(`${background.name} background selected!`);
  };

  const clearBackgroundSelection = () => {
    setConfig((prev) => ({
      ...prev,
      backgroundSource: 'upload',
      backgroundFile: undefined,
    }));
    toast.success('Background cleared. Solid color mode is active.');
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('background', file);

    try {
      const response = await fetch(`${API_URL}/api/upload/background`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setConfig((prev) => ({
          ...prev,
          backgroundSource: 'upload',
          backgroundFile: data.filename,
        }));
        toast.success('Background uploaded!');
      }
    } catch (error) {
      toast.error('Error uploading background');
    } finally {
      e.target.value = '';
    }
  };

  const handleIconUpload = async (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('icon', file);

    try {
      const response = await fetch(`${API_URL}/api/upload/icon/${type}`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setConfig((prev) => ({
          ...prev,
          iconFiles: { ...(prev.iconFiles ?? {}), [type]: data.filename },
        }));
        setIconPreviews((prev) => ({
          ...prev,
          [type]: `${API_URL}/uploads/icons/${data.filename}`,
        }));
        toast.success(`${type} icon uploaded!`);
      }
    } catch (error) {
      toast.error(`Error uploading ${type} icon`);
    }
  };

  const submitCustomEntry = () => {
    if (!newEntryName || !newEntryPath) {
      toast.error('Please enter name and path');
      return;
    }

    const nextEntry: CustomEntry = {
      name: newEntryName,
      path: newEntryPath,
      alias: newEntryAlias || newEntryName,
      icon: newEntryIcon === 'auto' ? detectedEntryIcon : newEntryIcon,
    };

    if (editingEntryIndex === null) {
      updateConfig('customEntries', [...config.customEntries, nextEntry]);
      toast.success('Custom entry added!');
    } else {
      const nextEntries = config.customEntries.map((entry, index) =>
        index === editingEntryIndex ? nextEntry : entry
      );
      updateConfig('customEntries', nextEntries);
      toast.success('Custom entry updated!');
    }

    resetCustomEntryForm();
  };

  const removeCustomEntry = (index: number) => {
    const newEntries = config.customEntries.filter((_, i) => i !== index);
    updateConfig('customEntries', newEntries);

    if (editingEntryIndex === index) {
      resetCustomEntryForm();
      return;
    }

    if (editingEntryIndex !== null && index < editingEntryIndex) {
      setEditingEntryIndex(editingEntryIndex - 1);
    }
  };

  const editCustomEntry = (index: number) => {
    const entry = config.customEntries[index];
    if (!entry) {
      return;
    }

    setNewEntryName(entry.name);
    setNewEntryPath(entry.path);
    setNewEntryAlias(entry.alias);
    setNewEntryIcon(entry.icon || 'auto');
    setEditingEntryIndex(index);
    toast.success(`Editing ${entry.alias || entry.name}`);
  };

  const updateCustomEntryIcon = (index: number, iconValue: string) => {
    const nextEntries = config.customEntries.map((entry, entryIndex) => {
      if (entryIndex !== index) {
        return entry;
      }

      return {
        ...entry,
        icon: iconValue === 'auto'
          ? inferPreviewIcon(`${entry.alias} ${entry.name} ${entry.path}`, customIconTypes, config.iconFiles)
          : iconValue,
      };
    });

    updateConfig('customEntries', nextEntries);
  };

  const addCustomIconType = () => {
    if (!newCustomIconId || !newCustomIconName) {
      toast.error('Please enter icon ID and name');
      return;
    }
    if (ICON_TYPES.find(t => t.id === newCustomIconId) || customIconTypes.find(t => t.id === newCustomIconId)) {
      toast.error('Icon ID already exists');
      return;
    }
    const newIconType: CustomIconType = {
      id: newCustomIconId,
      name: newCustomIconName,
      color: newCustomIconColor,
      isCustom: true,
    };
    setCustomIconTypes((prev) => [...prev, newIconType]);
    setNewCustomIconId('');
    setNewCustomIconName('');
    setNewCustomIconColor('#ff00ff');
    toast.success('Custom icon type added!');
  };

  const removeCustomIconType = (iconId: string) => {
    setCustomIconTypes((prev) => prev.filter((t) => t.id !== iconId));
    setIconPreviews((prev) => {
      const nextPreviews = { ...prev };
      delete nextPreviews[iconId];
      return nextPreviews;
    });
    setConfig((prev) => {
      if (!prev.iconFiles?.[iconId]) {
        return prev;
      }

      const nextIconFiles = { ...prev.iconFiles };
      delete nextIconFiles[iconId];

      return {
        ...prev,
        iconFiles: nextIconFiles,
      };
    });
    toast.success('Custom icon type removed!');
  };

  const saveConfig = () => {
    const trimmedName = configName.trim();

    if (!trimmedName) {
      toast.error('Please enter a config name');
      return;
    }

    const savedConfig: SavedConfigRecord = {
      name: trimmedName,
      config: normalizeConfig(config),
      customIconTypes,
    };

    try {
      const nextSavedConfigs = [
        ...savedConfigs.filter((item) => item.name !== trimmedName),
        savedConfig,
      ];

      setSavedConfigs(nextSavedConfigs);
      localStorage.setItem(STORAGE_KEYS.savedConfigs, JSON.stringify(nextSavedConfigs));
      persistDraft(savedConfig.config, customIconTypes);
      persistLastConfig(savedConfig);

      toast.success(`"${trimmedName}" has been saved permanently.`);
    } catch (error) {
      toast.error('Failed to save to localStorage');
      console.error('localStorage save error:', error);
    }
    
    setConfigName('');
    setShowSaveDialog(false);
  };

  const loadConfig = (saved: SavedConfigRecord) => {
    const nextConfig = normalizeConfig(saved.config);
    const nextCustomIconTypes = saved.customIconTypes ?? [];

    setConfig(nextConfig);
    setCustomIconTypes(nextCustomIconTypes);
    setIconPreviews(buildIconPreviewUrls(nextConfig.iconFiles));
    persistDraft(nextConfig, nextCustomIconTypes);
    persistLastConfig({ ...saved, config: nextConfig, customIconTypes: nextCustomIconTypes });
    toast.success(`Loaded ${saved.name}`);
  };

  const exportSavedConfig = (saved: SavedConfigRecord) => {
    downloadJsonFile(`${saved.name.replace(/\s+/g, '-').toLowerCase()}-theme.json`, {
      ...saved.config,
      customIconTypes: saved.customIconTypes ?? [],
    });
    toast.success(`Exported ${saved.name}`);
  };

  const applyMarketplaceTheme = (theme: MarketplaceThemeRecord) => {
    const nextConfig = normalizeConfig(theme.config);
    setConfig(nextConfig);
    setCustomIconTypes(theme.customIconTypes);
    setIconPreviews(buildIconPreviewUrls(nextConfig.iconFiles));
    persistDraft(nextConfig, theme.customIconTypes);
    setActiveTab('marketplace');
    toast.success(`Loaded ${theme.name} from marketplace`);
  };

  const downloadMarketplaceTheme = (theme: MarketplaceThemeRecord) => {
    downloadJsonFile(`${theme.name.replace(/\s+/g, '-').toLowerCase()}-marketplace-theme.json`, {
      ...theme.config,
      customIconTypes: theme.customIconTypes,
    });
    toast.success(`Downloaded ${theme.name}`);
  };

  const shareCurrentThemeToMarketplace = async () => {
    if (!previewCaptureRef.current) {
      toast.error('Preview is not ready yet.');
      return;
    }

    setIsCapturing(true);

    try {
      const previewImage = await renderElementToPngDataUrl(previewCaptureRef.current);
      const record: MarketplaceThemeRecord = {
        id: `${Date.now()}`,
        name: config.headerText.trim() || `Theme ${marketplaceThemes.length + 1}`,
        previewImage,
        config: normalizeConfig(config),
        customIconTypes,
        createdAt: new Date().toISOString(),
      };

      const nextMarketplaceThemes = [record, ...marketplaceThemes].slice(0, 24);
      setMarketplaceThemes(nextMarketplaceThemes);
      setMarketplacePage(1);
      setActiveTab('marketplace');
      localStorage.setItem(STORAGE_KEYS.marketplaceThemes, JSON.stringify(nextMarketplaceThemes));
      toast.success('Theme shared to marketplace!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not share theme.');
    } finally {
      setIsCapturing(false);
    }
  };

  const exportConfig = () => {
    downloadJsonFile(`ventoy-theme-config-${Date.now()}.json`, config);
    toast.success('Configuration exported!');
  };

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        const nextConfig = normalizeConfig(imported);
        setConfig(nextConfig);
        setIconPreviews(buildIconPreviewUrls(nextConfig.iconFiles));
        if (Array.isArray(imported.customIconTypes)) {
          setCustomIconTypes(imported.customIconTypes);
        }
        toast.success('Configuration imported!');
      } catch {
        toast.error('Invalid configuration file');
      }
    };
    reader.readAsText(file);
  };

  const generateThemeFiles = async () => {
    setIsGenerating(true);
    try {
      const apiConfig = buildApiConfig();
      const [themeRes, ventoyRes] = await Promise.all([
        fetch(`${API_URL}/api/generate/theme`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiConfig),
        }),
        fetch(`${API_URL}/api/generate/ventoy-json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiConfig),
        }),
      ]);

      const themeData = await themeRes.json();
      const ventoyData = await ventoyRes.json();

      if (themeData.success && ventoyData.success) {
        const themeBlob = new Blob([themeData.content], { type: 'text/plain' });
        const themeUrl = URL.createObjectURL(themeBlob);
        const themeLink = document.createElement('a');
        themeLink.href = themeUrl;
        themeLink.download = 'theme.txt';
        themeLink.click();

        const ventoyBlob = new Blob([JSON.stringify(ventoyData.content, null, 2)], { type: 'application/json' });
        const ventoyUrl = URL.createObjectURL(ventoyBlob);
        const ventoyLink = document.createElement('a');
        ventoyLink.href = ventoyUrl;
        ventoyLink.download = 'ventoy.json';
        ventoyLink.click();

        toast.success('Theme files generated!');
      }
    } catch (error) {
      toast.error('Error generating theme files');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadThemePackage = async () => {
    setIsDownloading(true);
    try {
      const apiConfig = buildApiConfig();
      const response = await fetch(`${API_URL}/api/download/theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiConfig),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ventoy-theme-${Date.now()}.zip`;
        link.click();
        toast.success('Theme package downloaded!');
      }
    } catch (error) {
      toast.error('Error downloading theme package');
    } finally {
      setIsDownloading(false);
    }
  };

  const captureBootScreen = async () => {
    if (!previewCaptureRef.current) {
      toast.error('Preview is not ready yet.');
      return;
    }

    setIsCapturing(true);

    try {
      await exportElementAsPng(
        previewCaptureRef.current,
        `ventoy-preview-${config.headerText.trim().replace(/\s+/g, '-').toLowerCase() || 'theme'}.png`
      );
      toast.success('Boot screen screenshot exported!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not capture preview.');
    } finally {
      setIsCapturing(false);
    }
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_CONFIG);
    setCustomIconTypes([]);
    setIconPreviews({});
    toast.info('Reset to default values');
  };

  const getAspectRatio = (res: string) => {
    const option = RESOLUTION_OPTIONS.find(r => r.value === res);
    return option?.aspect || '16/9';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#0d1117] text-white">
      {/* Header */}
      <header className="border-b border-[#30363d] bg-[#010409]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#58a6ff] via-[#1f6feb] to-[#238636] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-[#58a6ff] via-[#a371f7] to-[#238636] bg-clip-text text-transparent">
                Ventoy Pro
              </h1>
              <p className="text-[10px] sm:text-xs text-[#8b949e] hidden sm:block">Advanced Theme Generator</p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-2">
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-[#30363d] hover:bg-[#21262d] text-[#c9d1d9]">
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#161b22] border-[#30363d]">
                <DialogHeader>
                  <DialogTitle className="text-[#c9d1d9]">Save Configuration</DialogTitle>
                  <DialogDescription className="sr-only">
                    Save your current theme configuration with a custom name
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Enter config name..."
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9]"
                  />
                  <Button onClick={saveConfig} className="w-full bg-[#238636] hover:bg-[#2ea043]">
                    Save Configuration
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" size="sm" onClick={exportConfig} className="border-[#30363d] hover:bg-[#21262d] text-[#c9d1d9]">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            
            <label className="cursor-pointer">
              <input type="file" accept=".json" onChange={importConfig} className="hidden" />
              <Button variant="outline" size="sm" className="border-[#30363d] hover:bg-[#21262d] text-[#c9d1d9]" asChild>
                <span><FolderOpen className="w-4 h-4 mr-1" /> Import</span>
              </Button>
            </label>
            
            <Button variant="outline" size="sm" onClick={resetToDefaults} className="border-[#30363d] hover:bg-[#21262d] text-[#c9d1d9]">
              <RefreshCw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>

          <button className="sm:hidden p-2 rounded-lg bg-[#21262d] border border-[#30363d]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-[#30363d] p-3 bg-[#0d1117] space-y-2">
            <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)} className="w-full border-[#30363d]">
              <Save className="w-4 h-4 mr-2" /> Save Config
            </Button>
            <Button variant="outline" size="sm" onClick={exportConfig} className="w-full border-[#30363d]">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <label className="cursor-pointer block">
              <input type="file" accept=".json" onChange={importConfig} className="hidden" />
              <Button variant="outline" size="sm" className="w-full border-[#30363d]">
                <FolderOpen className="w-4 h-4 mr-2" /> Import
              </Button>
            </label>
            <Button variant="outline" size="sm" onClick={resetToDefaults} className="w-full border-[#30363d]">
              <RefreshCw className="w-4 h-4 mr-2" /> Reset
            </Button>
          </div>
        )}
      </header>

      {/* Saved Configs Bar */}
      {savedConfigs.length > 0 && (
        <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-[#8b949e] whitespace-nowrap">Saved:</span>
            {savedConfigs.map((saved, idx) => (
              <div key={idx} className="flex items-center overflow-hidden rounded-full border border-[#30363d] bg-[#21262d]">
                <button
                  onClick={() => loadConfig(saved)}
                  className="px-3 py-1 text-xs text-[#58a6ff] whitespace-nowrap transition-colors hover:bg-[#30363d]"
                >
                  {saved.name}
                </button>
                <button
                  onClick={() => exportSavedConfig(saved)}
                  className="border-l border-[#30363d] px-2 py-1 text-[#8b949e] transition-colors hover:bg-[#30363d] hover:text-white"
                  title={`Export ${saved.name}`}
                >
                  <Download className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Panel - Controls */}
          <Card className="bg-[#161b22] border-[#30363d] order-2 xl:order-1">
            <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-[#c9d1d9]">
                <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#58a6ff]" />
                Advanced Customization
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="mb-5 rounded-[28px] border border-[#30363d] bg-[#0d1117] p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#58a6ff]">Theme Wizard</p>
                      <p className="text-sm font-medium text-[#e6edf3]">Beginner-friendly guided setup for your Ventoy theme.</p>
                      <p className="text-xs text-[#8b949e]">
                        Follow the guided steps: Background, Colors, Fonts, Icons, Layout, Advanced, then Download.
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#30363d] bg-[#161b22] px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#c9d1d9]">Wizard Mode</p>
                        <p className="text-[11px] text-[#8b949e]">Show one guided step at a time</p>
                      </div>
                      <Switch
                        checked={wizardMode}
                        onCheckedChange={(checked) => {
                          setWizardMode(checked);
                          if (checked) {
                            goToWizardStep(wizardStep);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {wizardMode && (
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                        {WIZARD_STEPS.map((step, index) => {
                          const isActive = step.value === wizardStep;
                          const isComplete = index < currentWizardIndex;

                          return (
                            <button
                              key={step.value}
                              type="button"
                              onClick={() => goToWizardStep(step.value)}
                              className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                                isActive
                                  ? 'border-[#58a6ff] bg-[#161b22] shadow-lg shadow-blue-500/10'
                                  : isComplete
                                    ? 'border-[#238636]/40 bg-[#0d1117]'
                                    : 'border-[#30363d] bg-[#0d1117] hover:border-[#58a6ff]'
                              }`}
                            >
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b949e]">
                                  Step {index + 1}
                                </span>
                                {isComplete ? (
                                  <Check className="h-4 w-4 text-[#238636]" />
                                ) : null}
                              </div>
                              <p className="text-sm font-semibold text-[#e6edf3]">{step.title}</p>
                            </button>
                          );
                        })}
                      </div>

                      <div className="rounded-2xl border border-[#30363d] bg-[#161b22]/70 px-4 py-3">
                        <p className="text-sm font-semibold text-[#e6edf3]">{currentWizardStep.title}</p>
                        <p className="text-xs text-[#8b949e]">{currentWizardStep.subtitle}</p>
                      </div>
                    </div>
                  )}
                </div>

                {!wizardMode && (
                <div className="control-tabs-shell mb-5 overflow-hidden rounded-[28px] border border-[#30363d]">
                  <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#58a6ff]">Control Deck</p>
                      <p className="text-xs text-[#8b949e]">Choose a section and shape your Ventoy menu from here.</p>
                    </div>
                    <div className="hidden rounded-full border border-[#30363d] bg-[#0d1117]/80 px-3 py-1 text-[11px] font-medium text-[#c9d1d9] sm:block">
                      Active: {TAB_ITEMS.find((item) => item.value === activeTab)?.label ?? 'Templates'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-4 py-3">
                    <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8b949e]">Quick Access</span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setActiveTab('marketplace')}
                      className="h-8 rounded-full bg-gradient-to-r from-[#1f6feb] via-[#58a6ff] to-[#238636] px-3 text-xs text-white hover:opacity-90"
                    >
                      <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                      Open Share Themes
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab('background')}
                      className="h-8 rounded-full border-[#30363d] bg-[#0d1117] px-3 text-xs text-[#c9d1d9] hover:bg-[#21262d]"
                    >
                      <Image className="mr-1.5 h-3.5 w-3.5" />
                      Backgrounds
                    </Button>
                  </div>

                  <TooltipProvider>
                    <TabsList className="control-tabs control-tabs-grid grid h-auto gap-3 bg-transparent p-3">
                      {TAB_ITEMS.map((item) => {
                        const Icon = item.icon;

                        return (
                          <Tooltip key={item.value}>
                            <TooltipTrigger asChild>
                              <TabsTrigger value={item.value} className="control-tab-trigger h-auto min-h-[150px] flex-col items-start justify-start gap-4 rounded-[22px] border border-transparent px-4 py-4 text-left whitespace-normal">
                                <div className="flex w-full items-start justify-between gap-3">
                                  <span className={`tab-icon flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-lg shadow-black/25`}>
                                    <Icon className="h-4 w-4" />
                                  </span>
                                  <ChevronRight className="tab-arrow mt-1 hidden h-4 w-4 text-[#6e7681] sm:block" />
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm font-semibold text-[#e6edf3]">
                                    <span className="sm:hidden">{item.shortLabel}</span>
                                    <span className="hidden sm:inline">{item.label}</span>
                                    {item.value === 'marketplace' ? (
                                      <span className="rounded-full border border-[#58a6ff]/40 bg-[#58a6ff]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7dd3fc]">
                                        New
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="tab-hint hidden text-[11px] leading-4 text-[#8b949e] sm:block">
                                    {item.hint}
                                  </p>
                                </div>
                              </TabsTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="bg-[#161b22] border-[#30363d] text-[#c9d1d9]">
                              <p className="text-xs">{item.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </TabsList>
                  </TooltipProvider>
                </div>
                )}

                {/* Templates Tab */}
                <TabsContent value="templates" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label className="text-[#a371f7] text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Premium Theme Templates
                    </Label>
                    <p className="text-xs text-[#8b949e]">Click to apply professional pre-made themes</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {ADVANCED_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyAdvancedPreset(preset)}
                        className="group relative p-3 sm:p-4 rounded-xl border-2 border-[#30363d] hover:border-[#58a6ff] transition-all overflow-hidden"
                        style={{ backgroundColor: preset.bg }}
                      >
                        <div className="absolute inset-0 opacity-20" style={{ 
                          background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` 
                        }} />
                        <div className="relative z-10">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg mb-2 flex items-center justify-center" style={{ backgroundColor: preset.primary }}>
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: preset.bg }} />
                          </div>
                          <p className="text-xs sm:text-sm font-bold" style={{ color: preset.primary }}>{preset.name}</p>
                          <p className="text-[10px] opacity-70" style={{ color: preset.text }}>{preset.text}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 pt-4 border-t border-[#30363d]">
                    <Label className="text-[#58a6ff] text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Community Themes
                    </Label>
                    <p className="text-xs text-[#8b949e]">
                      Curated theme starters. User-shared PNG cards now live in the dedicated `Marketplace` tab.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {COMMUNITY_THEMES.map((theme) => (
                      <button
                        key={theme.name}
                        onClick={() => applyCommunityTheme(theme)}
                        className="group overflow-hidden rounded-2xl border border-[#30363d] text-left transition-all hover:-translate-y-1 hover:border-[#58a6ff] hover:shadow-xl hover:shadow-blue-500/10"
                      >
                        <div className="p-4" style={{ background: theme.background }}>
                          <div className="mb-6 flex items-start justify-between gap-3">
                            <span
                              className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                              style={{ borderColor: `${theme.accent}80`, color: theme.accent, backgroundColor: '#0d111780' }}
                            >
                              {theme.badge}
                            </span>
                            <div
                              className="h-10 w-10 rounded-2xl border"
                              style={{
                                background: `linear-gradient(135deg, ${theme.accent}, rgba(255,255,255,0.15))`,
                                borderColor: `${theme.accent}66`,
                              }}
                            />
                          </div>
                          <h3 className="text-base font-semibold text-white">{theme.name}</h3>
                          <p className="mt-2 text-sm leading-5 text-white/80">{theme.summary}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="marketplace" className="space-y-4 mt-0">
                  <div className="rounded-2xl border border-[#30363d] bg-[#0d1117] p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <Label className="text-[#58a6ff] text-sm flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          Theme Marketplace
                        </Label>
                        <p className="text-xs sm:text-sm text-[#8b949e]">
                          Share your current preview as a PNG card, then browse user themes 6 at a time on this page.
                        </p>
                      </div>
                      <Button onClick={shareCurrentThemeToMarketplace} disabled={isCapturing} className="bg-gradient-to-r from-[#1f6feb] via-[#58a6ff] to-[#238636] text-white hover:opacity-90">
                        {isCapturing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                        Share Current Theme
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 rounded-2xl border border-[#30363d] bg-[#161b22]/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#e6edf3]">Shared Themes</p>
                      <p className="text-xs text-[#8b949e]">
                        {marketplaceThemes.length > 0
                          ? `Showing ${(marketplacePage - 1) * MARKETPLACE_PAGE_SIZE + 1}-${Math.min(marketplacePage * MARKETPLACE_PAGE_SIZE, marketplaceThemes.length)} of ${marketplaceThemes.length} shared themes`
                          : 'No shared themes yet. Publish the first one from your live preview.'}
                      </p>
                    </div>
                    <div className="rounded-full border border-[#30363d] bg-[#0d1117] px-3 py-1 text-[11px] font-medium text-[#c9d1d9]">
                      Page {marketplacePage} / {totalMarketplacePages}
                    </div>
                  </div>

                  {marketplaceThemes.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {visibleMarketplaceThemes.map((theme) => (
                          <div key={theme.id} className="overflow-hidden rounded-2xl border border-[#30363d] bg-[#0d1117]">
                            <div className="aspect-[16/10] overflow-hidden border-b border-[#30363d] bg-black">
                              <img src={theme.previewImage} alt={theme.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="space-y-3 p-4">
                              <div>
                                <h3 className="text-sm font-semibold text-[#e6edf3]">{theme.name}</h3>
                                <p className="text-[11px] text-[#8b949e]">
                                  Shared {new Date(theme.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Button onClick={() => applyMarketplaceTheme(theme)} size="sm" variant="outline" className="border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:bg-[#21262d]">
                                  Apply
                                </Button>
                                <Button onClick={() => downloadMarketplaceTheme(theme)} size="sm" className="bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] text-white hover:opacity-90">
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {totalMarketplacePages > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#30363d] bg-[#0d1117] p-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setMarketplacePage((prev) => Math.max(1, prev - 1))}
                            disabled={marketplacePage === 1}
                            className="border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:bg-[#21262d]"
                          >
                            Previous
                          </Button>
                          {Array.from({ length: totalMarketplacePages }, (_, index) => index + 1).map((page) => (
                            <Button
                              key={page}
                              type="button"
                              size="sm"
                              variant={page === marketplacePage ? 'default' : 'outline'}
                              onClick={() => setMarketplacePage(page)}
                              className={page === marketplacePage
                                ? 'bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] text-white hover:opacity-90'
                                : 'border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:bg-[#21262d]'}
                            >
                              {page}
                            </Button>
                          ))}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setMarketplacePage((prev) => Math.min(totalMarketplacePages, prev + 1))}
                            disabled={marketplacePage === totalMarketplacePages}
                            className="border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:bg-[#21262d]"
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#30363d] bg-[#0d1117] px-4 py-10 text-center text-sm text-[#8b949e]">
                      No user themes shared yet. Click `Share Current Theme` to publish the first preview card.
                    </div>
                  )}
                </TabsContent>

                {/* Background Tab */}
                <TabsContent value="background" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label className="text-[#58a6ff] text-sm">Preset Backgrounds</Label>
                    <p className="text-xs text-[#8b949e]">
                      Pick a built-in wallpaper, or keep the solid color and upload your own custom background.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {BUILT_IN_BACKGROUNDS.map((background) => {
                      const isSelected = config.backgroundSource === 'builtin' && config.backgroundFile === background.filename;
                      const previewSrc = buildBackgroundPreviewUrl('builtin', background.filename);

                      return (
                        <button
                          key={background.id}
                          type="button"
                          onClick={() => selectBuiltInBackground(background)}
                          className={`overflow-hidden rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'border-[#58a6ff] bg-[#0d1117] shadow-lg shadow-blue-500/10'
                              : 'border-[#30363d] bg-[#0d1117] hover:border-[#58a6ff]'
                          }`}
                        >
                          <div className="aspect-[16/9] overflow-hidden border-b border-[#30363d] bg-black">
                            {previewSrc ? (
                              <img src={previewSrc} alt={background.name} className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div className="space-y-2 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="text-sm font-semibold text-[#e6edf3]">{background.name}</h3>
                              <span
                                className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                                style={{ borderColor: `${background.accent}66`, color: background.accent }}
                              >
                                {isSelected ? 'Selected' : 'Preset'}
                              </span>
                            </div>
                            <p className="text-xs leading-5 text-[#8b949e]">{background.summary}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-3">
                    <div className="rounded-2xl border border-[#30363d] bg-[#0d1117] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <Label className="text-[#58a6ff] text-sm">Selected Background</Label>
                          <p className="text-xs text-[#8b949e]">
                            {config.backgroundFile
                              ? config.backgroundSource === 'builtin'
                                ? 'Using a built-in marketplace-ready background.'
                                : 'Using your uploaded custom wallpaper.'
                              : 'No image selected. Preview falls back to the solid background color.'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={clearBackgroundSelection}
                          className="border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:bg-[#21262d]"
                        >
                          Solid Color Only
                        </Button>
                      </div>

                      <div className="overflow-hidden rounded-xl border border-[#30363d] bg-[#111827]">
                        {backgroundPreview ? (
                          <img src={backgroundPreview} alt="Selected background" className="aspect-[16/9] w-full object-cover" />
                        ) : (
                          <div
                            className="aspect-[16/9] w-full"
                            style={{
                              background: `radial-gradient(circle at center, ${config.primaryColor}20 0%, ${config.desktopColor} 55%, #020617 100%)`,
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-dashed border-[#30363d] bg-[#0d1117] p-4">
                      <div className="space-y-2">
                        <Label className="text-[#58a6ff] text-sm">Upload Custom Background</Label>
                        <p className="text-xs text-[#8b949e]">
                          Your upload overrides the preset and becomes the active background instantly.
                        </p>
                      </div>
                      <div
                        onClick={() => backgroundInputRef.current?.click()}
                        className="mt-4 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#30363d] px-4 text-center transition-all hover:border-[#58a6ff] hover:bg-[#21262d]/50"
                      >
                        {config.backgroundSource === 'upload' && backgroundPreview ? (
                          <img src={backgroundPreview} alt="Uploaded background" className="max-h-36 rounded-lg object-contain" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mb-3 text-[#58a6ff]" />
                            <p className="text-sm text-[#c9d1d9]">Click to upload background</p>
                          </>
                        )}
                        <p className="mt-2 text-[11px] text-[#6e7681]">JPG, PNG, GIF, WebP (max 10MB)</p>
                      </div>
                      <input ref={backgroundInputRef} type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#58a6ff] text-sm">Fallback Background Color</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={config.desktopColor} onChange={(e) => updateConfig('desktopColor', e.target.value)} className="w-10 h-10 sm:w-12 sm:h-10 rounded cursor-pointer border-0" />
                      <Input value={config.desktopColor} onChange={(e) => updateConfig('desktopColor', e.target.value)} className="flex-1 bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-sm" />
                    </div>
                  </div>
                </TabsContent>

                {/* Icons Tab */}
                <TabsContent value="icons" className="space-y-4 mt-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-[#8b949e]">Click any icon to replace it or add custom icons</p>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-[#8b949e]">Show Icons</Label>
                      <Switch checked={config.showIcons} onCheckedChange={(v) => updateConfig('showIcons', v)} />
                    </div>
                  </div>
                  
                  {/* Built-in Icons */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-[#58a6ff]">Built-in Icons</h4>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
                      {ICON_TYPES.map((icon) => (
                        <div key={icon.id} onClick={() => iconInputRefs.current[icon.id]?.click()} className="relative group cursor-pointer">
                          <div className="aspect-square rounded-lg border-2 border-[#30363d] bg-[#0d1117] flex flex-col items-center justify-center gap-1 hover:border-[#58a6ff] hover:shadow-lg hover:shadow-blue-500/20 transition-all group-hover:scale-105" style={{ borderColor: iconPreviews[icon.id] ? icon.color : undefined }}>
                            {iconPreviews[icon.id] ? (
                              <img src={iconPreviews[icon.id]} alt={icon.name} className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
                            ) : (
                              <div style={{ color: icon.color }}><OSLogo type={icon.id} size={24} /></div>
                            )}
                            <span className="text-[8px] sm:text-[10px] text-[#8b949e]">{icon.name}</span>
                            {iconPreviews[icon.id] && (
                              <div className="absolute top-0.5 right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-[#238636] rounded-full flex items-center justify-center">
                                <Check className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <input ref={(el) => { iconInputRefs.current[icon.id] = el; }} type="file" accept="image/*" onChange={(e) => handleIconUpload(icon.id, e)} className="hidden" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Icons */}
                  {customIconTypes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-[#58a6ff]">Custom Icons</h4>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
                        {customIconTypes.map((icon) => (
                          <div key={icon.id} className="relative group">
                            <div className="aspect-square rounded-lg border-2 border-[#30363d] bg-[#0d1117] flex flex-col items-center justify-center gap-1 hover:border-[#f85149] transition-all">
                              <button
                                onClick={() => removeCustomIconType(icon.id)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-[#f85149] hover:bg-[#ff7b72] rounded-full flex items-center justify-center z-10"
                                title="Remove icon type"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                              <div onClick={() => iconInputRefs.current[icon.id]?.click()} className="cursor-pointer w-full flex flex-col items-center">
                                {iconPreviews[icon.id] ? (
                                  <img src={iconPreviews[icon.id]} alt={icon.name} className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
                                ) : (
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: icon.color }}>
                                    {icon.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <span className="text-[8px] sm:text-[10px] text-[#8b949e]">{icon.name}</span>
                              {iconPreviews[icon.id] && (
                                <div className="absolute top-0.5 right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-[#238636] rounded-full flex items-center justify-center">
                                  <Check className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <input ref={(el) => { iconInputRefs.current[icon.id] = el; }} type="file" accept="image/*" onChange={(e) => handleIconUpload(icon.id, e)} className="hidden" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Custom Icon Type */}
                  <div className="border-t border-[#30363d] pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-medium text-[#58a6ff] flex items-center gap-2">
                        Add New Icon Type
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-3 h-3 text-[#8b949e] hover:text-[#58a6ff] cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-[#161b22] border-[#30363d] text-[#c9d1d9] max-w-xs">
                              <p className="text-xs">Create custom icon types for your specific ISO files. The ID will be used to match ISO filenames.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input 
                              value={newCustomIconId} 
                              onChange={(e) => setNewCustomIconId(e.target.value.toLowerCase().replace(/\s/g, '_'))} 
                              placeholder="ID (e.g., myos)" 
                              className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-sm"
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-[#161b22] border-[#30363d] text-[#c9d1d9]">
                            <p className="text-xs">Unique identifier (auto-lowercase). Used to match ISO names.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input 
                              value={newCustomIconName} 
                              onChange={(e) => setNewCustomIconName(e.target.value)} 
                              placeholder="Name (e.g., My OS)" 
                              className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-sm"
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-[#161b22] border-[#30363d] text-[#c9d1d9]">
                            <p className="text-xs">Display name shown in the icon grid</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={newCustomIconColor} 
                                onChange={(e) => setNewCustomIconColor(e.target.value)} 
                                className="w-8 h-8 rounded cursor-pointer border-0"
                              />
                              <span className="text-xs text-[#8b949e]">Color</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-[#161b22] border-[#30363d] text-[#c9d1d9]">
                            <p className="text-xs">Brand color for this icon type</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={addCustomIconType} size="sm" className="bg-[#238636] hover:bg-[#2ea043] w-full">
                              <Check className="w-4 h-4 mr-1" /> Add Icon
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-[#161b22] border-[#30363d] text-[#c9d1d9]">
                            <p className="text-xs">Create new custom icon type</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </TabsContent>

                {/* Colors Tab */}
                <TabsContent value="colors" className="space-y-4 mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'primaryColor', label: 'Primary Accent', desc: 'Main highlights' },
                      { key: 'secondaryColor', label: 'Secondary', desc: 'Subtle accents' },
                      { key: 'accentColor', label: 'Accent', desc: 'Special elements' },
                      { key: 'normalTextColor', label: 'Normal Text', desc: 'Menu items' },
                      { key: 'selectedTextColor', label: 'Selected Text', desc: 'Active item' },
                      { key: 'headerColor', label: 'Header Color', desc: 'Title text' },
                      { key: 'footerColor', label: 'Footer Color', desc: 'Bottom text' },
                      { key: 'progressBgColor', label: 'Progress BG', desc: 'Bar background' },
                      { key: 'progressFgColor', label: 'Progress Fill', desc: 'Bar fill' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-[#c9d1d9] text-xs sm:text-sm">{label}</Label>
                        <p className="text-[10px] text-[#6e7681]">{desc}</p>
                        <div className="flex items-center gap-2">
                          <input type="color" value={config[key as keyof ThemeConfig] as string} onChange={(e) => updateConfig(key as keyof ThemeConfig, e.target.value)} className="w-8 h-8 sm:w-10 sm:h-8 rounded cursor-pointer border-0" />
                          <Input value={config[key as keyof ThemeConfig] as string} onChange={(e) => updateConfig(key as keyof ThemeConfig, e.target.value)} className="flex-1 bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-xs h-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Fonts Tab */}
                <TabsContent value="fonts" className="space-y-4 mt-0">
                  <div className="rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-xs text-[#8b949e]">
                    Preview auto-detects local fonts first. If your system does not have them, the app uses bundled project fonts automatically.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#58a6ff] text-sm">Title Font</Label>
                      <select value={config.titleFont} onChange={(e) => updateConfig('titleFont', e.target.value)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#c9d1d9]">
                        {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#58a6ff] text-sm">Item Font</Label>
                      <select value={config.itemFont} onChange={(e) => updateConfig('itemFont', e.target.value)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#c9d1d9]">
                        {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#58a6ff] text-sm">Title Size: {config.titleFontSize}px</Label>
                      <Slider value={[config.titleFontSize]} onValueChange={([v]) => updateConfig('titleFontSize', v)} min={16} max={48} step={1} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#58a6ff] text-sm">Item Size: {config.itemFontSize}px</Label>
                      <Slider value={[config.itemFontSize]} onValueChange={([v]) => updateConfig('itemFontSize', v)} min={12} max={24} step={1} />
                    </div>
                  </div>
                </TabsContent>

                {/* Effects Tab */}
                <TabsContent value="effects" className="space-y-4 mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#58a6ff] text-sm">Menu Animation</Label>
                      <select value={config.menuAnimation} onChange={(e) => updateConfig('menuAnimation', e.target.value)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#c9d1d9]">
                        {ANIMATION_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#58a6ff] text-sm">Animation Speed: {config.animationSpeed}ms</Label>
                      <Slider value={[config.animationSpeed]} onValueChange={([v]) => updateConfig('animationSpeed', v)} min={100} max={1000} step={50} />
                    </div>
                  </div>
                  
                  <div className="border-t border-[#30363d] pt-4">
                    <Label className="text-[#a371f7] text-sm mb-3 block">Visual Effects</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'showProgressBar', label: 'Progress Bar' },
                        { key: 'showFooter', label: 'Footer Text' },
                        { key: 'roundedCorners', label: 'Rounded Corners' },
                        { key: 'glassEffect', label: 'Glass Effect' },
                        { key: 'glowEffect', label: 'Glow Effect' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-[#0d1117] rounded-lg border border-[#30363d]">
                          <Label className="text-xs text-[#c9d1d9]">{label}</Label>
                          <Switch checked={config[key as keyof ThemeConfig] as boolean} onCheckedChange={(v) => updateConfig(key as keyof ThemeConfig, v)} />
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Layout Tab */}
                <TabsContent value="layout" className="space-y-4 mt-0">
                  <div className="space-y-3">
                    {[
                      { key: 'menuLeft', label: 'Menu Left', min: 0, max: 100 },
                      { key: 'menuTop', label: 'Menu Top', min: 0, max: 100 },
                      { key: 'menuWidth', label: 'Menu Width', min: 20, max: 100 },
                      { key: 'menuHeight', label: 'Menu Height', min: 20, max: 100 },
                    ].map(({ key, label, min, max }) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between">
                          <Label className="text-[#c9d1d9] text-xs sm:text-sm">{label}</Label>
                          <span className="text-xs sm:text-sm text-[#8b949e]">{String(config[key as keyof ThemeConfig])}%</span>
                        </div>
                        <Slider value={[config[key as keyof ThemeConfig] as number]} onValueChange={([v]) => updateConfig(key as keyof ThemeConfig, v)} min={min} max={max} step={1} />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-[#30363d]">
                    <Label className="text-[#58a6ff] text-sm">Header Text</Label>
                    <Input value={config.headerText} onChange={(e) => updateConfig('headerText', e.target.value)} className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-[#58a6ff] text-sm">Timeout (sec)</Label>
                      <Input type="number" value={config.timeout} onChange={(e) => updateConfig('timeout', parseInt(e.target.value) || 30)} className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-sm" min={5} max={300} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#58a6ff] text-sm">Resolution</Label>
                      <select value={config.resolution} onChange={(e) => updateConfig('resolution', e.target.value)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#c9d1d9]">
                        {RESOLUTION_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="download" className="space-y-4 mt-0">
                  <div className="rounded-2xl border border-[#30363d] bg-[#0d1117] p-4">
                    <div className="space-y-2">
                      <Label className="text-[#58a6ff] text-sm">Final Step: Download Your Theme</Label>
                      <p className="text-xs text-[#8b949e]">
                        Your theme is ready. Generate the raw config files or download the full ZIP package with assets.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <Button onClick={generateThemeFiles} disabled={isGenerating} variant="outline" className="h-auto justify-start border-[#30363d] bg-[#161b22] py-4 text-left text-[#c9d1d9] hover:bg-[#21262d]">
                      {isGenerating ? <RefreshCw className="mr-3 h-4 w-4 animate-spin" /> : <FileCode className="mr-3 h-4 w-4" />}
                      <div>
                        <div className="font-medium">Generate Files</div>
                        <div className="text-[11px] text-[#8b949e]">Download `theme.txt` and `ventoy.json` separately</div>
                      </div>
                    </Button>

                    <Button onClick={downloadThemePackage} disabled={isDownloading} className="h-auto justify-start bg-gradient-to-r from-[#a371f7] via-[#58a6ff] to-[#238636] py-4 text-left text-white hover:opacity-90">
                      {isDownloading ? <RefreshCw className="mr-3 h-4 w-4 animate-spin" /> : <Download className="mr-3 h-4 w-4" />}
                      <div>
                        <div className="font-medium">Download Package</div>
                        <div className="text-[11px] text-white/75">Complete ZIP with your assets, icons, and theme files</div>
                      </div>
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-4">
                    <p className="text-sm font-medium text-[#e6edf3]">Quick checklist</p>
                    <ul className="mt-2 space-y-2 text-xs text-[#8b949e]">
                      <li>Background: {config.backgroundFile ? 'selected' : 'color only'}</li>
                      <li>Header: {config.headerText || 'Ventoy Boot Menu'}</li>
                      <li>Fonts: {config.titleFont} / {config.itemFont}</li>
                      <li>Layout: {config.menuWidth}% width at {config.menuLeft}%, {config.menuTop}%</li>
                    </ul>
                  </div>
                </TabsContent>

                {/* Advanced Tab */}
                <TabsContent value="advanced" className="space-y-4 mt-0">
                  {/* Password Protection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#f85149]" />
                        <Label className="text-sm text-[#c9d1d9]">Password Protection</Label>
                      </div>
                      <Switch checked={config.passwordProtected} onCheckedChange={(v) => updateConfig('passwordProtected', v)} />
                    </div>
                    
                    {config.passwordProtected && (
                      <div className="space-y-2 pl-4 border-l-2 border-[#f85149]">
                        <Label className="text-[#f85149] text-xs">Menu Password</Label>
                        <Input type="password" value={config.menuPassword} onChange={(e) => updateConfig('menuPassword', e.target.value)} placeholder="Enter password..." className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-sm" />
                      </div>
                    )}
                  </div>

                  {/* Custom Entries */}
                  <div className="space-y-3 border-t border-[#30363d] pt-4">
                    <Label className="text-[#58a6ff] text-sm flex items-center gap-2">
                      <FileCode className="w-4 h-4" />
                      Custom Menu Entries
                    </Label>

                    {editingEntryIndex !== null && (
                      <div className="rounded-lg border border-[#58a6ff]/30 bg-[#0d1117] px-3 py-2 text-xs text-[#c9d1d9]">
                        Editing entry #{editingEntryIndex + 1}. Update the fields below and save your changes.
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-2">
                      <Input value={newEntryName} onChange={(e) => setNewEntryName(e.target.value)} placeholder="ISO Name (e.g. Windows 11)" className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-sm" />
                      <Input value={newEntryPath} onChange={(e) => setNewEntryPath(e.target.value)} placeholder="Path (e.g. /ISO/Win11.iso)" className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-sm" />
                      <Input value={newEntryAlias} onChange={(e) => setNewEntryAlias(e.target.value)} placeholder="Display Name (optional)" className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-sm" />
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_150px]">
                        <div className="flex items-center gap-2 rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2">
                          {config.showIcons && (
                            iconPreviews[detectedEntryIcon] ? (
                              <img src={iconPreviews[detectedEntryIcon]} alt={detectedEntryIcon} className="h-4 w-4 object-contain" />
                            ) : customIconTypes.find((icon) => icon.id === detectedEntryIcon) ? (
                              <div
                                className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                                style={{ backgroundColor: customIconTypes.find((icon) => icon.id === detectedEntryIcon)?.color }}
                              >
                                {(newEntryAlias || newEntryName || 'C').charAt(0).toUpperCase()}
                              </div>
                            ) : (
                              <div style={{ color: availableIconTypes.find((icon) => icon.id === detectedEntryIcon)?.color }}>
                                <OSLogo type={detectedEntryIcon} size={16} />
                              </div>
                            )
                          )}
                          <div className="text-xs">
                            <p className="text-[#c9d1d9]">Auto detected: <span className="text-[#58a6ff]">{availableIconTypes.find((icon) => icon.id === detectedEntryIcon)?.name ?? 'Generic'}</span></p>
                            <p className="text-[#6e7681]">You can keep auto or choose an icon manually.</p>
                          </div>
                        </div>
                        <select
                          value={newEntryIcon}
                          onChange={(e) => setNewEntryIcon(e.target.value)}
                          className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#c9d1d9]"
                        >
                          <option value="auto">Auto Detect</option>
                          {availableIconTypes.map((icon) => (
                            <option key={icon.id} value={icon.id}>
                              {icon.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Button onClick={submitCustomEntry} size="sm" className="bg-[#238636] hover:bg-[#2ea043]">
                          <Check className="w-4 h-4 mr-1" /> {editingEntryIndex === null ? 'Add Entry' : 'Update Entry'}
                        </Button>
                        {editingEntryIndex !== null && (
                          <Button onClick={resetCustomEntryForm} variant="outline" size="sm" className="border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:bg-[#21262d]">
                            <X className="w-4 h-4 mr-1" /> Cancel Edit
                          </Button>
                        )}
                      </div>
                    </div>

                    {config.customEntries.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {config.customEntries.map((entry, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-[#0d1117] rounded-lg border border-[#30363d]">
                            <div className="flex min-w-0 items-center gap-3">
                              {iconPreviews[getResolvedEntryIcon(entry)] ? (
                                <img
                                  src={iconPreviews[getResolvedEntryIcon(entry)]}
                                  alt={getResolvedEntryIcon(entry)}
                                  className="h-5 w-5 flex-shrink-0 object-contain"
                                />
                              ) : customIconTypes.find((icon) => icon.id === getResolvedEntryIcon(entry)) ? (
                                <div
                                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                  style={{ backgroundColor: customIconTypes.find((icon) => icon.id === getResolvedEntryIcon(entry))?.color }}
                                >
                                  {entry.alias.charAt(0).toUpperCase()}
                                </div>
                              ) : (
                                <div className="flex-shrink-0" style={{ color: availableIconTypes.find((icon) => icon.id === getResolvedEntryIcon(entry))?.color }}>
                                  <OSLogo type={getResolvedEntryIcon(entry)} size={18} />
                                </div>
                              )}
                              <div className="min-w-0 text-xs">
                                <p className="truncate text-[#c9d1d9] font-medium">{entry.alias}</p>
                                <p className="truncate text-[#6e7681]">{entry.path}</p>
                                <p className="text-[#58a6ff]">Icon: {availableIconTypes.find((icon) => icon.id === getResolvedEntryIcon(entry))?.name ?? 'Generic'}</p>
                              </div>
                            </div>
                            <div className="ml-3 flex items-center gap-2">
                              <select
                                value={getResolvedEntryIcon(entry)}
                                onChange={(e) => updateCustomEntryIcon(idx, e.target.value)}
                                className="max-w-[140px] rounded-md border border-[#30363d] bg-[#161b22] px-2 py-1 text-xs text-[#c9d1d9]"
                              >
                                <option value="auto">Auto Detect</option>
                                {availableIconTypes.map((icon) => (
                                  <option key={icon.id} value={icon.id}>
                                    {icon.name}
                                  </option>
                                ))}
                              </select>
                              <Button variant="ghost" size="sm" onClick={() => editCustomEntry(idx)} className="text-[#58a6ff] hover:text-white hover:bg-[#1f6feb]/20">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => removeCustomEntry(idx)} className="text-[#f85149] hover:text-[#ff7b72]">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {wizardMode && (
                  <div className="mt-5 rounded-2xl border border-[#30363d] bg-[#0d1117] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#e6edf3]">
                          Step {currentWizardIndex + 1} of {WIZARD_STEPS.length}: {currentWizardStep.title}
                        </p>
                        <p className="text-xs text-[#8b949e]">{currentWizardStep.subtitle}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => moveWizardStep('prev')}
                          disabled={currentWizardIndex === 0}
                          className="border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:bg-[#21262d]"
                        >
                          Previous
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => moveWizardStep('next')}
                          disabled={currentWizardIndex === WIZARD_STEPS.length - 1}
                          className="bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] text-white hover:opacity-90"
                        >
                          {currentWizardIndex === WIZARD_STEPS.length - 2 ? 'Go To Download' : 'Next Step'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Tabs>
            </CardContent>
          </Card>

          {/* Right Panel - Preview */}
          <div className="space-y-4 order-1 xl:order-2">
            {/* Preview Resolution Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <MonitorPlay className="w-4 h-4 text-[#8b949e] flex-shrink-0" />
              {RESOLUTION_OPTIONS.map((res) => (
                <button
                  key={res.value}
                  onClick={() => updateConfig('resolution', res.value)}
                  className={`px-2 py-1 rounded-md text-[10px] sm:text-xs whitespace-nowrap transition-colors ${
                    config.resolution === res.value 
                      ? 'bg-[#238636] text-white' 
                      : 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d]'
                  }`}
                >
                  {res.value}
                </button>
              ))}
            </div>

            <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
              <CardHeader className="pb-2 px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-[#c9d1d9]">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[#58a6ff]" />
                  Live Preview ({config.resolution})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div 
                  ref={previewCaptureRef}
                  className={`relative rounded-xl overflow-hidden mx-auto shadow-2xl ${previewAnimationClass}`}
                  style={{ 
                    aspectRatio: getAspectRatio(config.resolution),
                    maxHeight: '400px',
                    backgroundColor: config.desktopColor,
                    backgroundImage: backgroundPreview ? `url(${backgroundPreview})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    boxShadow: config.glowEffect ? `0 0 50px ${config.primaryColor}30` : undefined,
                    animationDuration: `${config.animationSpeed}ms`,
                  }}
                >
                  {/* Header */}
                  <div 
                    className="absolute top-2 sm:top-4 left-0 right-0 text-center font-bold px-2 sm:px-4 truncate"
                    style={{ 
                      color: config.headerColor,
                      fontSize: `${config.titleFontSize * 0.6}px`,
                      fontFamily: config.titleFont,
                      textShadow: config.glowEffect ? `0 0 10px ${config.primaryColor}` : undefined,
                    }}
                  >
                    {config.headerText}
                  </div>

                  {/* Boot Menu */}
                  <div
                    className="absolute overflow-hidden"
                    style={{
                      left: `${config.menuLeft}%`,
                      top: `${config.menuTop}%`,
                      width: `${config.menuWidth}%`,
                      height: `${config.menuHeight}%`,
                      borderColor: config.primaryColor,
                      backgroundColor: config.glassEffect ? 'rgba(13, 17, 23, 0.85)' : 'rgba(13, 17, 23, 0.98)',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderRadius: config.roundedCorners ? '12px' : '0px',
                      boxShadow: config.glowEffect ? `0 0 30px ${config.primaryColor}40, inset 0 0 30px ${config.primaryColor}10` : '0 10px 40px rgba(0,0,0,0.5)',
                      backdropFilter: config.glassEffect ? 'blur(10px)' : undefined,
                    }}
                  >
                    <div className="p-2 sm:p-3 space-y-0.5 sm:space-y-1">
                      {previewItems.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1 sm:py-1.5 transition-all"
                          style={{ 
                            color: i === 0 ? config.selectedTextColor : config.normalTextColor,
                            backgroundColor: i === 0 ? `${config.primaryColor}60` : 'transparent',
                            borderRadius: config.roundedCorners ? '6px' : '0px',
                            fontSize: `${config.itemFontSize * 0.7}px`,
                            fontFamily: config.itemFont,
                          }}
                        >
                          {config.showIcons && (
                            iconPreviews[item.icon] ? (
                              <img
                                src={iconPreviews[item.icon]}
                                alt={item.icon}
                                className="h-[14px] w-[14px] object-contain"
                              />
                            ) : customIconTypes.find((icon) => icon.id === item.icon) ? (
                              <div
                                className="flex h-[14px] w-[14px] items-center justify-center rounded-full text-[8px] font-bold text-white"
                                style={{ backgroundColor: customIconTypes.find((icon) => icon.id === item.icon)?.color }}
                              >
                                {item.name.charAt(0).toUpperCase()}
                              </div>
                            ) : (
                              <div style={{ color: ICON_TYPES.find(t => t.id === item.icon)?.color }}>
                                <OSLogo type={item.icon} size={14} />
                              </div>
                            )
                          )}
                          <span className="truncate">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {config.showProgressBar && (
                    <>
                      <div
                        className="absolute left-1/2 -translate-x-1/2 h-2 sm:h-4 rounded-full overflow-hidden border"
                        style={{ 
                          top: '82%',
                          width: '60%',
                          backgroundColor: config.progressBgColor,
                          borderColor: config.primaryColor,
                          borderRadius: config.roundedCorners ? '999px' : '0px',
                        }}
                      >
                        <div
                          className="h-full transition-all duration-500"
                          style={{ 
                            width: '60%',
                            background: `linear-gradient(90deg, ${config.progressFgColor}, ${config.accentColor})`,
                            boxShadow: config.glowEffect ? `0 0 10px ${config.progressFgColor}` : undefined,
                          }}
                        />
                      </div>
                      <div 
                        className="absolute text-center text-[8px] sm:text-xs font-medium"
                        style={{ 
                          top: '86%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          color: config.normalTextColor,
                        }}
                      >
                        Booting in {config.timeout}s
                      </div>
                    </>
                  )}

                  {/* Footer */}
                  {config.showFooter && (
                    <div 
                      className="absolute bottom-1 sm:bottom-2 left-0 right-0 text-center text-[8px] sm:text-[10px]"
                      style={{ color: config.footerColor }}
                    >
                      Use ↑↓ to select, Enter to boot {config.passwordProtected && '• 🔒 Protected'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
              <Button onClick={captureBootScreen} disabled={isCapturing} variant="outline" className="border-[#30363d] hover:bg-[#21262d] text-[#c9d1d9] h-auto py-2 sm:py-3 text-xs sm:text-sm">
                {isCapturing ? <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" /> : <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                <div className="text-left">
                  <div className="font-medium">Boot Screen Capture</div>
                  <div className="text-[8px] sm:text-[10px] text-[#6e7681]">PNG snapshot of the live preview</div>
                </div>
              </Button>

              <Button onClick={generateThemeFiles} disabled={isGenerating} variant="outline" className="border-[#30363d] hover:bg-[#21262d] text-[#c9d1d9] h-auto py-2 sm:py-3 text-xs sm:text-sm">
                {isGenerating ? <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" /> : <FileCode className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                <div className="text-left">
                  <div className="font-medium">Generate Files</div>
                  <div className="text-[8px] sm:text-[10px] text-[#6e7681]">theme.txt + ventoy.json</div>
                </div>
              </Button>

              <Button onClick={downloadThemePackage} disabled={isDownloading} className="bg-gradient-to-r from-[#a371f7] via-[#58a6ff] to-[#238636] hover:opacity-90 text-white h-auto py-2 sm:py-3 text-xs sm:text-sm">
                {isDownloading ? <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" /> : <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                <div className="text-left">
                  <div className="font-medium">Download Package</div>
                  <div className="text-[8px] sm:text-[10px] text-white/70">Complete ZIP with assets</div>
                </div>
              </Button>
            </div>

            {/* Info Card */}
            <Card className="bg-[#0d1117] border-[#30363d]">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#58a6ff] flex-shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-[#8b949e]">
                    <p className="mb-1 sm:mb-2 font-medium text-[#c9d1d9]">Installation Guide:</p>
                    <ol className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
                      <li className="flex items-center gap-1"><ChevronRight className="w-3 h-3 text-[#238636]" /> Extract ZIP file</li>
                      <li className="flex items-center gap-1"><ChevronRight className="w-3 h-3 text-[#238636]" /> Copy to USB&apos;s <code className="text-[#58a6ff] bg-[#21262d] px-1 rounded">ventoy</code> folder</li>
                      <li className="flex items-center gap-1"><ChevronRight className="w-3 h-3 text-[#238636]" /> Boot and enjoy your custom theme!</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
