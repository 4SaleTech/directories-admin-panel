import { IconType } from 'react-icons';
import {
  FiHome,
  FiShoppingBag,
  FiShoppingCart,
  FiTruck,
  FiPackage,
  FiTag,
  FiHeart,
  FiStar,
  FiUser,
  FiUsers,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiCamera,
  FiImage,
  FiVideo,
  FiMusic,
  FiHeadphones,
  FiMonitor,
  FiSmartphone,
  FiTablet,
  FiWatch,
  FiCpu,
  FiHardDrive,
  FiPrinter,
  FiBook,
  FiBriefcase,
  FiCoffee,
  FiGift,
  FiDollarSign,
  FiCreditCard,
  FiPercent,
  FiTrendingUp,
  FiActivity,
  FiPieChart,
  FiBarChart2,
  FiGrid,
  FiLayers,
  FiFolder,
  FiFileText,
  FiDownload,
  FiUpload,
  FiSend,
  FiInbox,
  FiArchive,
  FiTrash2,
  FiEdit,
  FiSave,
  FiSettings,
  FiTool,
  FiCrop,
  FiDroplet,
  FiFeather,
  FiFlag,
  FiAward,
  FiZap,
  FiSun,
  FiMoon,
  FiCloud,
  FiUmbrella,
  FiWind,
  FiThermometer,
  FiGlobe,
  FiNavigation,
  FiCompass,
  FiAnchor,
  FiBattery,
  FiBluetooth,
  FiWifi,
  FiRadio,
  FiTv,
  FiFilm,
  FiAperture,
  FiDisc,
  FiHeadphones as FiHeadphonesAlt,
  FiKey,
  FiLock,
  FiUnlock,
  FiShield,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiInfo,
  FiHelpCircle,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiMaximize,
  FiMinimize,
  FiMove,
  FiCopy,
  FiClipboard,
  FiLink,
  FiExternalLink,
  FiShare2,
  FiMessageSquare,
  FiMessageCircle,
  FiBell,
  FiVolume2,
  FiVolumeX,
  FiPlay,
  FiPause,
  FiFastForward,
  FiRewind,
  FiSkipBack,
  FiSkipForward,
} from 'react-icons/fi';

export interface IconDefinition {
  name: string;
  icon: IconType;
  category: string;
  keywords: string[];
}

export const ICON_CATEGORIES = [
  'All',
  'Shopping',
  'Business',
  'Communication',
  'Technology',
  'Media',
  'Files',
  'UI',
  'Location',
  'Time',
  'Finance',
  'Social',
  'Weather',
  'Security',
] as const;

export type IconCategory = typeof ICON_CATEGORIES[number];

export const ICON_LIBRARY: IconDefinition[] = [
  // Shopping & E-commerce
  { name: 'FiShoppingBag', icon: FiShoppingBag, category: 'Shopping', keywords: ['shop', 'store', 'bag', 'buy', 'cart'] },
  { name: 'FiShoppingCart', icon: FiShoppingCart, category: 'Shopping', keywords: ['shop', 'cart', 'basket', 'buy'] },
  { name: 'FiTag', icon: FiTag, category: 'Shopping', keywords: ['tag', 'label', 'price', 'discount'] },
  { name: 'FiPackage', icon: FiPackage, category: 'Shopping', keywords: ['package', 'box', 'delivery', 'product'] },
  { name: 'FiTruck', icon: FiTruck, category: 'Shopping', keywords: ['truck', 'delivery', 'shipping', 'transport'] },
  { name: 'FiGift', icon: FiGift, category: 'Shopping', keywords: ['gift', 'present', 'box'] },

  // Business
  { name: 'FiBriefcase', icon: FiBriefcase, category: 'Business', keywords: ['business', 'work', 'job', 'career', 'case'] },
  { name: 'FiHome', icon: FiHome, category: 'Business', keywords: ['home', 'house', 'building'] },
  { name: 'FiTrendingUp', icon: FiTrendingUp, category: 'Business', keywords: ['trending', 'growth', 'chart', 'stats'] },
  { name: 'FiPieChart', icon: FiPieChart, category: 'Business', keywords: ['chart', 'stats', 'analytics', 'pie'] },
  { name: 'FiBarChart2', icon: FiBarChart2, category: 'Business', keywords: ['chart', 'bar', 'stats', 'analytics'] },
  { name: 'FiActivity', icon: FiActivity, category: 'Business', keywords: ['activity', 'pulse', 'stats'] },

  // Communication
  { name: 'FiMail', icon: FiMail, category: 'Communication', keywords: ['mail', 'email', 'message', 'envelope'] },
  { name: 'FiPhone', icon: FiPhone, category: 'Communication', keywords: ['phone', 'call', 'telephone'] },
  { name: 'FiMessageSquare', icon: FiMessageSquare, category: 'Communication', keywords: ['message', 'chat', 'comment'] },
  { name: 'FiMessageCircle', icon: FiMessageCircle, category: 'Communication', keywords: ['message', 'chat', 'bubble'] },
  { name: 'FiSend', icon: FiSend, category: 'Communication', keywords: ['send', 'share', 'message'] },
  { name: 'FiBell', icon: FiBell, category: 'Communication', keywords: ['bell', 'notification', 'alert'] },

  // Technology
  { name: 'FiMonitor', icon: FiMonitor, category: 'Technology', keywords: ['monitor', 'computer', 'screen', 'display'] },
  { name: 'FiSmartphone', icon: FiSmartphone, category: 'Technology', keywords: ['smartphone', 'phone', 'mobile'] },
  { name: 'FiTablet', icon: FiTablet, category: 'Technology', keywords: ['tablet', 'ipad', 'device'] },
  { name: 'FiWatch', icon: FiWatch, category: 'Technology', keywords: ['watch', 'smartwatch', 'time'] },
  { name: 'FiCpu', icon: FiCpu, category: 'Technology', keywords: ['cpu', 'processor', 'chip', 'tech'] },
  { name: 'FiHardDrive', icon: FiHardDrive, category: 'Technology', keywords: ['hard drive', 'storage', 'disk'] },
  { name: 'FiPrinter', icon: FiPrinter, category: 'Technology', keywords: ['printer', 'print', 'paper'] },
  { name: 'FiWifi', icon: FiWifi, category: 'Technology', keywords: ['wifi', 'wireless', 'internet'] },
  { name: 'FiBluetooth', icon: FiBluetooth, category: 'Technology', keywords: ['bluetooth', 'wireless', 'connect'] },

  // Media
  { name: 'FiCamera', icon: FiCamera, category: 'Media', keywords: ['camera', 'photo', 'picture'] },
  { name: 'FiImage', icon: FiImage, category: 'Media', keywords: ['image', 'picture', 'photo'] },
  { name: 'FiVideo', icon: FiVideo, category: 'Media', keywords: ['video', 'camera', 'film'] },
  { name: 'FiMusic', icon: FiMusic, category: 'Media', keywords: ['music', 'audio', 'sound', 'note'] },
  { name: 'FiHeadphones', icon: FiHeadphones, category: 'Media', keywords: ['headphones', 'audio', 'music'] },
  { name: 'FiFilm', icon: FiFilm, category: 'Media', keywords: ['film', 'movie', 'video'] },
  { name: 'FiDisc', icon: FiDisc, category: 'Media', keywords: ['disc', 'cd', 'dvd', 'music'] },
  { name: 'FiTv', icon: FiTv, category: 'Media', keywords: ['tv', 'television', 'screen'] },
  { name: 'FiRadio', icon: FiRadio, category: 'Media', keywords: ['radio', 'broadcast', 'signal'] },

  // Files & Documents
  { name: 'FiFolder', icon: FiFolder, category: 'Files', keywords: ['folder', 'directory', 'files'] },
  { name: 'FiFileText', icon: FiFileText, category: 'Files', keywords: ['file', 'document', 'text'] },
  { name: 'FiBook', icon: FiBook, category: 'Files', keywords: ['book', 'read', 'library', 'document'] },
  { name: 'FiDownload', icon: FiDownload, category: 'Files', keywords: ['download', 'save', 'file'] },
  { name: 'FiUpload', icon: FiUpload, category: 'Files', keywords: ['upload', 'file', 'share'] },
  { name: 'FiSave', icon: FiSave, category: 'Files', keywords: ['save', 'disk', 'store'] },
  { name: 'FiInbox', icon: FiInbox, category: 'Files', keywords: ['inbox', 'mail', 'messages'] },
  { name: 'FiArchive', icon: FiArchive, category: 'Files', keywords: ['archive', 'box', 'storage'] },

  // UI Elements
  { name: 'FiGrid', icon: FiGrid, category: 'UI', keywords: ['grid', 'layout', 'boxes'] },
  { name: 'FiLayers', icon: FiLayers, category: 'UI', keywords: ['layers', 'stack', 'levels'] },
  { name: 'FiSettings', icon: FiSettings, category: 'UI', keywords: ['settings', 'config', 'gear', 'preferences'] },
  { name: 'FiTool', icon: FiTool, category: 'UI', keywords: ['tool', 'wrench', 'settings', 'fix'] },
  { name: 'FiSearch', icon: FiSearch, category: 'UI', keywords: ['search', 'find', 'magnify'] },
  { name: 'FiFilter', icon: FiFilter, category: 'UI', keywords: ['filter', 'funnel', 'sort'] },
  { name: 'FiRefreshCw', icon: FiRefreshCw, category: 'UI', keywords: ['refresh', 'reload', 'sync'] },
  { name: 'FiEdit', icon: FiEdit, category: 'UI', keywords: ['edit', 'pencil', 'write'] },
  { name: 'FiTrash2', icon: FiTrash2, category: 'UI', keywords: ['trash', 'delete', 'remove'] },
  { name: 'FiCheck', icon: FiCheck, category: 'UI', keywords: ['check', 'done', 'complete'] },
  { name: 'FiX', icon: FiX, category: 'UI', keywords: ['x', 'close', 'cancel'] },
  { name: 'FiAlertCircle', icon: FiAlertCircle, category: 'UI', keywords: ['alert', 'warning', 'error'] },
  { name: 'FiInfo', icon: FiInfo, category: 'UI', keywords: ['info', 'information', 'help'] },
  { name: 'FiHelpCircle', icon: FiHelpCircle, category: 'UI', keywords: ['help', 'question', 'support'] },

  // Location & Navigation
  { name: 'FiMapPin', icon: FiMapPin, category: 'Location', keywords: ['map', 'pin', 'location', 'place'] },
  { name: 'FiGlobe', icon: FiGlobe, category: 'Location', keywords: ['globe', 'world', 'earth', 'global'] },
  { name: 'FiNavigation', icon: FiNavigation, category: 'Location', keywords: ['navigation', 'gps', 'direction'] },
  { name: 'FiCompass', icon: FiCompass, category: 'Location', keywords: ['compass', 'direction', 'navigation'] },
  { name: 'FiAnchor', icon: FiAnchor, category: 'Location', keywords: ['anchor', 'sea', 'ship'] },

  // Time
  { name: 'FiCalendar', icon: FiCalendar, category: 'Time', keywords: ['calendar', 'date', 'schedule'] },
  { name: 'FiClock', icon: FiClock, category: 'Time', keywords: ['clock', 'time', 'watch'] },

  // Finance
  { name: 'FiDollarSign', icon: FiDollarSign, category: 'Finance', keywords: ['dollar', 'money', 'price', 'cost'] },
  { name: 'FiCreditCard', icon: FiCreditCard, category: 'Finance', keywords: ['credit card', 'payment', 'card'] },
  { name: 'FiPercent', icon: FiPercent, category: 'Finance', keywords: ['percent', 'discount', 'sale'] },

  // Social
  { name: 'FiUser', icon: FiUser, category: 'Social', keywords: ['user', 'person', 'account', 'profile'] },
  { name: 'FiUsers', icon: FiUsers, category: 'Social', keywords: ['users', 'people', 'group', 'team'] },
  { name: 'FiHeart', icon: FiHeart, category: 'Social', keywords: ['heart', 'like', 'favorite', 'love'] },
  { name: 'FiStar', icon: FiStar, category: 'Social', keywords: ['star', 'favorite', 'rating'] },
  { name: 'FiShare2', icon: FiShare2, category: 'Social', keywords: ['share', 'send', 'forward'] },
  { name: 'FiAward', icon: FiAward, category: 'Social', keywords: ['award', 'badge', 'medal', 'achievement'] },

  // Weather
  { name: 'FiSun', icon: FiSun, category: 'Weather', keywords: ['sun', 'sunny', 'day', 'weather'] },
  { name: 'FiMoon', icon: FiMoon, category: 'Weather', keywords: ['moon', 'night', 'dark'] },
  { name: 'FiCloud', icon: FiCloud, category: 'Weather', keywords: ['cloud', 'cloudy', 'weather'] },
  { name: 'FiUmbrella', icon: FiUmbrella, category: 'Weather', keywords: ['umbrella', 'rain', 'weather'] },
  { name: 'FiWind', icon: FiWind, category: 'Weather', keywords: ['wind', 'air', 'weather'] },
  { name: 'FiThermometer', icon: FiThermometer, category: 'Weather', keywords: ['thermometer', 'temperature', 'heat'] },

  // Security
  { name: 'FiLock', icon: FiLock, category: 'Security', keywords: ['lock', 'secure', 'private', 'password'] },
  { name: 'FiUnlock', icon: FiUnlock, category: 'Security', keywords: ['unlock', 'open', 'access'] },
  { name: 'FiKey', icon: FiKey, category: 'Security', keywords: ['key', 'password', 'access'] },
  { name: 'FiShield', icon: FiShield, category: 'Security', keywords: ['shield', 'protect', 'security'] },
  { name: 'FiEye', icon: FiEye, category: 'Security', keywords: ['eye', 'view', 'visible'] },
  { name: 'FiEyeOff', icon: FiEyeOff, category: 'Security', keywords: ['eye off', 'hidden', 'invisible'] },

  // Misc
  { name: 'FiCoffee', icon: FiCoffee, category: 'Business', keywords: ['coffee', 'cafe', 'drink'] },
  { name: 'FiZap', icon: FiZap, category: 'UI', keywords: ['zap', 'lightning', 'fast', 'energy'] },
  { name: 'FiDroplet', icon: FiDroplet, category: 'UI', keywords: ['droplet', 'water', 'liquid'] },
  { name: 'FiFeather', icon: FiFeather, category: 'UI', keywords: ['feather', 'light', 'soft'] },
  { name: 'FiFlag', icon: FiFlag, category: 'UI', keywords: ['flag', 'marker', 'bookmark'] },
  { name: 'FiBattery', icon: FiBattery, category: 'Technology', keywords: ['battery', 'power', 'charge'] },
  { name: 'FiAperture', icon: FiAperture, category: 'Media', keywords: ['aperture', 'camera', 'lens'] },
  { name: 'FiCrop', icon: FiCrop, category: 'Media', keywords: ['crop', 'resize', 'cut'] },
  { name: 'FiClipboard', icon: FiClipboard, category: 'Files', keywords: ['clipboard', 'copy', 'paste'] },
  { name: 'FiCopy', icon: FiCopy, category: 'Files', keywords: ['copy', 'duplicate'] },
  { name: 'FiLink', icon: FiLink, category: 'UI', keywords: ['link', 'chain', 'url'] },
  { name: 'FiExternalLink', icon: FiExternalLink, category: 'UI', keywords: ['external', 'link', 'open'] },
  { name: 'FiMaximize', icon: FiMaximize, category: 'UI', keywords: ['maximize', 'fullscreen', 'expand'] },
  { name: 'FiMinimize', icon: FiMinimize, category: 'UI', keywords: ['minimize', 'shrink', 'collapse'] },
  { name: 'FiMove', icon: FiMove, category: 'UI', keywords: ['move', 'drag', 'arrows'] },
  { name: 'FiVolume2', icon: FiVolume2, category: 'Media', keywords: ['volume', 'sound', 'audio'] },
  { name: 'FiVolumeX', icon: FiVolumeX, category: 'Media', keywords: ['mute', 'silent', 'volume off'] },
  { name: 'FiPlay', icon: FiPlay, category: 'Media', keywords: ['play', 'start', 'video'] },
  { name: 'FiPause', icon: FiPause, category: 'Media', keywords: ['pause', 'stop', 'video'] },
  { name: 'FiFastForward', icon: FiFastForward, category: 'Media', keywords: ['fast forward', 'skip', 'next'] },
  { name: 'FiRewind', icon: FiRewind, category: 'Media', keywords: ['rewind', 'back', 'previous'] },
  { name: 'FiSkipBack', icon: FiSkipBack, category: 'Media', keywords: ['skip back', 'previous'] },
  { name: 'FiSkipForward', icon: FiSkipForward, category: 'Media', keywords: ['skip forward', 'next'] },
];

// Helper function to search icons
export function searchIcons(query: string, category?: IconCategory): IconDefinition[] {
  const lowerQuery = query.toLowerCase();
  let filtered = ICON_LIBRARY;

  // Filter by category
  if (category && category !== 'All') {
    filtered = filtered.filter((icon) => icon.category === category);
  }

  // Filter by search query
  if (query) {
    filtered = filtered.filter(
      (icon) =>
        icon.name.toLowerCase().includes(lowerQuery) ||
        icon.keywords.some((keyword) => keyword.includes(lowerQuery))
    );
  }

  return filtered;
}

// Helper function to get icon by name
export function getIconByName(name: string): IconDefinition | undefined {
  return ICON_LIBRARY.find((icon) => icon.name === name);
}
