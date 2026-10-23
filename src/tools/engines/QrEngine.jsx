import React, { useState, useEffect, useRef, useCallback, useContext, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { saveBlob } from '../ToolShell';
import { useToast } from '../../components/Toast';
import {
  QrCode,
  Link as LinkIcon,
  TextT,
  WifiHigh,
  User,
  EnvelopeSimple,
  Phone,
  ChatDots,
  WhatsappLogo,
  MapPin,
  CalendarBlank,
  CreditCard,
  ShareNetwork,
  PaintBrush,
  Shapes,
  Image as ImageIcon,
  FrameCorners,
  SlidersHorizontal,
  DownloadSimple,
  Copy,
  Check,
  LockKey,
  Sparkle,
  Trash,
  UploadSimple,
  ArrowsClockwise,
  Eye,
  FilePdf,
  Info
} from '@phosphor-icons/react';

// Preset color themes
const COLOR_PRESETS = [
  { id: 'classic', name: 'Classic Dark', dark: '#0a0b10', light: '#ffffff', type: 'solid' },
  { id: 'cyberpunk', name: 'Cyber Neon', start: '#00f2fe', end: '#4facfe', light: '#090d16', type: 'gradient', angle: 45 },
  { id: 'sunset', name: 'Sunset Fire', start: '#ff0844', end: '#ffb199', light: '#ffffff', type: 'gradient', angle: 135 },
  { id: 'emerald', name: 'Emerald Luxe', start: '#0ba360', end: '#3cba92', light: '#ffffff', type: 'gradient', angle: 90 },
  { id: 'royal', name: 'Royal Velvet', start: '#7f00ff', end: '#e100ff', light: '#ffffff', type: 'gradient', angle: 45 },
  { id: 'gold', name: 'Golden Sun', start: '#f7971e', end: '#ffd200', light: '#0d0f14', type: 'gradient', angle: 120 },
  { id: 'ocean', name: 'Deep Ocean', start: '#2e5c8a', end: '#4facfe', light: '#ffffff', type: 'gradient', angle: 180 },
  { id: 'midnight', name: 'Obsidian Glow', start: '#8a2387', end: '#e94057', light: '#0b0c10', type: 'gradient', angle: 45 },
  { id: 'forest', name: 'Nordic Forest', start: '#134e5e', end: '#71b280', light: '#ffffff', type: 'gradient', angle: 135 },
];

// Preset built-in vector icons for center logo
const PRESET_ICONS = [
  { id: 'pikfinder', label: 'PikFinder', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>' },
  { id: 'wifi', label: 'Wi-Fi', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>' },
  { id: 'whatsapp', label: 'WhatsApp', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' },
  { id: 'instagram', label: 'Instagram', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>' },
  { id: 'twitter', label: 'X (Twitter)', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' },
  { id: 'youtube', label: 'YouTube', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>' },
  { id: 'linkedin', label: 'LinkedIn', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>' },
  { id: 'github', label: 'GitHub', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>' },
  { id: 'phone', label: 'Phone', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' },
  { id: 'mail', label: 'Email', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' },
  { id: 'location', label: 'Location', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' },
  { id: 'star', label: 'Star', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
];

export default function QrEngine() {
  const { isLoggedIn, toggleAuthModal } = useContext(AppContext);
  const toast = useToast();

  // Active Main Steps / Tabs
  const [dataType, setDataType] = useState('url'); // 'url' | 'text' | 'wifi' | 'vcard' | 'email' | 'phone' | 'sms' | 'whatsapp' | 'location' | 'event' | 'crypto' | 'social'
  const [activeCustomTab, setActiveCustomTab] = useState('colors'); // 'colors' | 'pattern' | 'logo' | 'frames' | 'settings'

  // ============ 1. DATA STATE ============
  const [urlData, setUrlData] = useState({ protocol: 'https://', url: 'pikfinder.com', utmSource: '', utmMedium: '', utmCampaign: '' });
  const [textData, setTextData] = useState('Welcome to PikFinder! Design with intelligence.');
  const [wifiData, setWifiData] = useState({ ssid: 'MyHomeWiFi', password: '', encryption: 'WPA', hidden: false });
  const [vcardData, setVcardData] = useState({ firstName: 'Alex', lastName: 'Morgan', phone: '+1 555 019 2834', email: 'alex@example.com', company: 'PikFinder Inc', jobTitle: 'Creative Director', website: 'https://pikfinder.com', street: '123 Market St', city: 'San Francisco', country: 'USA', note: 'Scan to connect!' });
  const [emailData, setEmailData] = useState({ to: 'hello@pikfinder.com', subject: 'Inquiry', body: 'Hi, I would like to get in touch!' });
  const [phoneData, setPhoneData] = useState('+1 555 019 2834');
  const [smsData, setSmsData] = useState({ phone: '+1 555 019 2834', message: 'Hello from PikFinder!' });
  const [waData, setWaData] = useState({ countryCode: '1', phone: '5550192834', message: 'Hi! Let\'s collaborate.' });
  const [locData, setLocData] = useState({ query: 'Eiffel Tower, Paris', lat: '48.8584', lng: '2.2945', mode: 'search' });
  const [eventData, setEventData] = useState({ title: 'Product Launch 2026', location: 'San Francisco & Online', startDate: '2026-10-15T18:00', endDate: '2026-10-15T20:00', description: 'Join us for the next generation creative suite release!' });
  const [cryptoData, setCryptoData] = useState({ type: 'upi', upiId: 'creator@upi', payeeName: 'PikFinder Creator', amount: '', note: 'Support Creator' });
  const [socialData, setSocialData] = useState({ platform: 'instagram', username: 'pikfinder' });

  // ============ 2. DESIGN & CUSTOMIZATION STATE ============
  const [colorMode, setColorMode] = useState('solid'); // 'solid' | 'gradient'
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [transparentBg, setTransparentBg] = useState(false);
  const [gradStart, setGradStart] = useState('#00f2fe');
  const [gradEnd, setGradEnd] = useState('#4facfe');
  const [gradAngle, setGradAngle] = useState(45);
  const [gradType, setGradType] = useState('linear'); // 'linear' | 'radial'

  // Pattern / Module shapes
  const [moduleShape, setModuleShape] = useState('square'); // 'square' | 'dots' | 'rounded' | 'smooth' | 'diamond' | 'star'
  const [eyeOuterShape, setEyeOuterShape] = useState('square'); // 'square' | 'rounded' | 'circle' | 'leaf'
  const [eyeInnerShape, setEyeInnerShape] = useState('square'); // 'square' | 'circle' | 'diamond' | 'rounded'
  const [customEyeColor, setCustomEyeColor] = useState(false);
  const [eyeOuterColor, setEyeOuterColor] = useState('#000000');
  const [eyeInnerColor, setEyeInnerColor] = useState('#000000');

  // Logo & Branding
  const [logoMode, setLogoMode] = useState('none'); // 'none' | 'preset' | 'upload'
  const [selectedPresetIcon, setSelectedPresetIcon] = useState('pikfinder');
  const [uploadedLogo, setUploadedLogo] = useState(null);
  const [logoSizePercent, setLogoSizePercent] = useState(22); // 14 to 30
  const [logoBgPad, setLogoBgPad] = useState(true);
  const [logoBgColor, setLogoBgColor] = useState('#ffffff');
  const [logoBorderColor, setLogoBorderColor] = useState('#e2e8f0');

  // Frames & CTA Badges
  const [frameStyle, setFrameStyle] = useState('none'); // 'none' | 'bottom-banner' | 'top-banner' | 'pill-badge' | 'phone-card' | 'polaroid'
  const [frameText, setFrameText] = useState('SCAN ME');
  const [frameColor, setFrameColor] = useState('#0a0b10');
  const [frameTextColor, setFrameTextColor] = useState('#ffffff');

  // Quality & Resolution
  const [errorCorrection, setErrorCorrection] = useState('M'); // 'L' | 'M' | 'Q' | 'H'
  const [marginModules, setMarginModules] = useState(2);
  const [exportResolution, setExportResolution] = useState(1024); // 512, 1024, 2048, 4096
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Hidden/Canvas Refs
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-upgrade error correction to 'H' if a center logo is active to guarantee scanning
  useEffect(() => {
    if (logoMode !== 'none') {
      setErrorCorrection('H');
    }
  }, [logoMode]);

  // Compute final QR content string from data inputs
  const computedPayload = useMemo(() => {
    switch (dataType) {
      case 'url': {
        let full = urlData.url.trim();
        if (!full) return 'https://pikfinder.com';
        if (!full.startsWith('http://') && !full.startsWith('https://')) {
          full = `${urlData.protocol}${full}`;
        }
        const params = new URLSearchParams();
        if (urlData.utmSource) params.append('utm_source', urlData.utmSource.trim());
        if (urlData.utmMedium) params.append('utm_medium', urlData.utmMedium.trim());
        if (urlData.utmCampaign) params.append('utm_campaign', urlData.utmCampaign.trim());
        const qs = params.toString();
        return qs ? (full.includes('?') ? `${full}&${qs}` : `${full}?${qs}`) : full;
      }
      case 'text':
        return textData.trim() || 'PikFinder';
      case 'wifi':
        return `WIFI:T:${wifiData.encryption};S:${wifiData.ssid};P:${wifiData.password};H:${wifiData.hidden ? 'true' : 'false'};;`;
      case 'vcard':
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `N:${vcardData.lastName};${vcardData.firstName};;;`,
          `FN:${vcardData.firstName} ${vcardData.lastName}`.trim(),
          vcardData.company ? `ORG:${vcardData.company}` : '',
          vcardData.jobTitle ? `TITLE:${vcardData.jobTitle}` : '',
          vcardData.phone ? `TEL;TYPE=CELL:${vcardData.phone}` : '',
          vcardData.email ? `EMAIL:${vcardData.email}` : '',
          vcardData.website ? `URL:${vcardData.website}` : '',
          (vcardData.street || vcardData.city || vcardData.country) ? `ADR;TYPE=WORK:;;${vcardData.street};${vcardData.city};;;${vcardData.country}` : '',
          vcardData.note ? `NOTE:${vcardData.note}` : '',
          'END:VCARD'
        ].filter(Boolean).join('\n');
      case 'email': {
        const p = new URLSearchParams();
        if (emailData.subject) p.append('subject', emailData.subject);
        if (emailData.body) p.append('body', emailData.body);
        const qs = p.toString();
        return `mailto:${emailData.to.trim()}${qs ? `?${qs}` : ''}`;
      }
      case 'phone':
        return `tel:${phoneData.trim()}`;
      case 'sms':
        return `smsto:${smsData.phone.trim()}:${smsData.message}`;
      case 'whatsapp': {
        const cleanPhone = `${waData.countryCode.replace(/\D/g, '')}${waData.phone.replace(/\D/g, '')}`;
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waData.message)}`;
      }
      case 'location': {
        if (locData.mode === 'coords') {
          return `https://maps.google.com/?q=${locData.lat.trim()},${locData.lng.trim()}`;
        }
        return `https://maps.google.com/?q=${encodeURIComponent(locData.query.trim())}`;
      }
      case 'event': {
        const clean = (d) => d ? d.replace(/[-:]/g, '') + '00Z' : '';
        return [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'BEGIN:VEVENT',
          `SUMMARY:${eventData.title}`,
          eventData.location ? `LOCATION:${eventData.location}` : '',
          eventData.description ? `DESCRIPTION:${eventData.description}` : '',
          eventData.startDate ? `DTSTART:${clean(eventData.startDate)}` : '',
          eventData.endDate ? `DTEND:${clean(eventData.endDate)}` : '',
          'END:VEVENT',
          'END:VCALENDAR'
        ].filter(Boolean).join('\n');
      }
      case 'crypto': {
        if (cryptoData.type === 'upi') {
          const u = new URLSearchParams();
          u.append('pa', cryptoData.upiId.trim());
          if (cryptoData.payeeName) u.append('pn', cryptoData.payeeName.trim());
          if (cryptoData.amount) u.append('am', cryptoData.amount.trim());
          if (cryptoData.note) u.append('tn', cryptoData.note.trim());
          return `upi://pay?${u.toString()}`;
        }
        return `bitcoin:${cryptoData.upiId.trim()}`;
      }
      case 'social': {
        const u = socialData.username.trim().replace(/^@/, '');
        switch (socialData.platform) {
          case 'instagram': return `https://instagram.com/${u}`;
          case 'twitter': return `https://x.com/${u}`;
          case 'linkedin': return `https://linkedin.com/in/${u}`;
          case 'youtube': return `https://youtube.com/@${u}`;
          case 'tiktok': return `https://tiktok.com/@${u}`;
          case 'github': return `https://github.com/${u}`;
          case 'telegram': return `https://t.me/${u}`;
          default: return `https://${socialData.platform}.com/${u}`;
        }
      }
      default:
        return 'https://pikfinder.com';
    }
  }, [dataType, urlData, textData, wifiData, vcardData, emailData, phoneData, smsData, waData, locData, eventData, cryptoData, socialData]);

  // Auth Guard Helper: If user is not logged in and attempts any customisation, trigger signup modal
  const requireAuthForCustomization = useCallback((actionDescription = 'customize your QR code') => {
    if (!isLoggedIn) {
      toast(`Sign up free to ${actionDescription}, logos, gradients & 4K exports!`, 'info');
      toggleAuthModal('signup');
      return false;
    }
    return true;
  }, [isLoggedIn, toggleAuthModal, toast]);

  // Handle preset theme selection
  const applyPreset = (preset) => {
    if (!requireAuthForCustomization(`apply the "${preset.name}" style preset`)) return;
    if (preset.type === 'solid') {
      setColorMode('solid');
      setFgColor(preset.dark);
      setBgColor(preset.light);
      setTransparentBg(false);
    } else {
      setColorMode('gradient');
      setGradStart(preset.start);
      setGradEnd(preset.end);
      setGradAngle(preset.angle || 45);
      setBgColor(preset.light);
      setTransparentBg(false);
    }
    toast(`Applied "${preset.name}" theme`, 'success');
  };

  // Handle Logo Upload
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!requireAuthForCustomization('upload custom branding logos')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedLogo(reader.result);
      setLogoMode('upload');
      toast('Custom logo uploaded! Error correction set to High for scan safety.', 'success');
    };
    reader.readAsDataURL(file);
  };

  // ============ RENDER QR CODE TO CANVAS ============
  const renderQrToCanvas = useCallback(async (targetCanvas, targetSize = 1024) => {
    if (!targetCanvas || !computedPayload) return;
    const QRCode = (await import('qrcode')).default;

    // 1. Generate QR matrix representation
    const qr = QRCode.create(computedPayload, {
      errorCorrectionLevel: errorCorrection,
    });

    const modules = qr.modules;
    const moduleCount = modules.size;
    const margin = marginModules;
    const totalGrid = moduleCount + margin * 2;

    // Calculate frame dimensions if frame is enabled
    const hasBottomBanner = frameStyle === 'bottom-banner' || frameStyle === 'polaroid';
    const hasTopBanner = frameStyle === 'top-banner';
    const isPhoneCard = frameStyle === 'phone-card';
    const isPillBadge = frameStyle === 'pill-badge';

    // Vertical extra padding for frames
    let frameTopPad = 0;
    let frameBottomPad = 0;
    let frameSidePad = 0;

    if (hasBottomBanner) {
      frameBottomPad = targetSize * 0.22;
      frameTopPad = targetSize * 0.06;
      frameSidePad = targetSize * 0.06;
    } else if (hasTopBanner) {
      frameTopPad = targetSize * 0.22;
      frameBottomPad = targetSize * 0.06;
      frameSidePad = targetSize * 0.06;
    } else if (isPhoneCard) {
      frameTopPad = targetSize * 0.16;
      frameBottomPad = targetSize * 0.14;
      frameSidePad = targetSize * 0.08;
    } else if (isPillBadge) {
      frameBottomPad = targetSize * 0.18;
      frameTopPad = targetSize * 0.06;
      frameSidePad = targetSize * 0.06;
    }

    const canvasWidth = targetSize + frameSidePad * 2;
    const canvasHeight = targetSize + frameTopPad + frameBottomPad;

    targetCanvas.width = canvasWidth;
    targetCanvas.height = canvasHeight;
    const ctx = targetCanvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 2. Draw Frame / Card Background if frame style is active
    if (frameStyle !== 'none') {
      ctx.save();
      if (frameStyle === 'polaroid') {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 10;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else if (frameStyle === 'phone-card') {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(0, 0, canvasWidth, canvasHeight, targetSize * 0.08);
        ctx.fill();

        // Phone speaker / dynamic island
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(canvasWidth / 2 - 40, 16, 80, 18, 9);
        ctx.fill();
      } else if (frameStyle === 'bottom-banner' || frameStyle === 'top-banner' || frameStyle === 'pill-badge') {
        ctx.fillStyle = frameColor;
        ctx.beginPath();
        ctx.roundRect(0, 0, canvasWidth, canvasHeight, targetSize * 0.06);
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Draw QR Background
    const qrX = frameSidePad;
    const qrY = frameTopPad;
    const qrW = targetSize;
    const qrH = targetSize;

    if (!transparentBg) {
      ctx.fillStyle = bgColor;
      if (frameStyle !== 'none') {
        ctx.beginPath();
        ctx.roundRect(qrX + 12, qrY + 12, qrW - 24, qrH - 24, 16);
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
    }

    // Module cell size in px
    const cellSize = (targetSize - (margin * 2 * (targetSize / totalGrid))) / moduleCount;
    const startX = qrX + margin * cellSize;
    const startY = qrY + margin * cellSize;

    // Helper: Is cell inside any of the three 7x7 corner finder patterns?
    const isFinderPattern = (r, c) => {
      // Top-Left Eye
      if (r < 7 && c < 7) return true;
      // Top-Right Eye
      if (r < 7 && c >= moduleCount - 7) return true;
      // Bottom-Left Eye
      if (r >= moduleCount - 7 && c < 7) return true;
      return false;
    };

    // Helper: Is cell in center logo exclusion zone?
    const isLogoExclusionZone = (r, c) => {
      if (logoMode === 'none') return false;
      const center = moduleCount / 2;
      const radius = (moduleCount * (logoSizePercent / 100)) / 2 + 1;
      return Math.abs(r - center + 0.5) <= radius && Math.abs(c - center + 0.5) <= radius;
    };

    // Create Main Body Gradient or Solid Fill
    let bodyFillStyle = fgColor;
    if (colorMode === 'gradient') {
      if (gradType === 'linear') {
        const rad = (gradAngle * Math.PI) / 180;
        const x1 = startX + (Math.cos(rad) < 0 ? qrW : 0);
        const y1 = startY + (Math.sin(rad) < 0 ? qrH : 0);
        const x2 = startX + (Math.cos(rad) >= 0 ? qrW : 0);
        const y2 = startY + (Math.sin(rad) >= 0 ? qrH : 0);
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, gradStart);
        grad.addColorStop(1, gradEnd);
        bodyFillStyle = grad;
      } else {
        const cx = startX + (moduleCount * cellSize) / 2;
        const cy = startY + (moduleCount * cellSize) / 2;
        const r = (moduleCount * cellSize) / 2;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, gradStart);
        grad.addColorStop(1, gradEnd);
        bodyFillStyle = grad;
      }
    }

    // 4. Draw Data Modules (Excluding Eyes and Logo Zone)
    ctx.fillStyle = bodyFillStyle;
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (!modules.get(r, c)) continue;
        if (isFinderPattern(r, c)) continue;
        if (isLogoExclusionZone(r, c)) continue;

        const x = startX + c * cellSize;
        const y = startY + r * cellSize;
        const w = cellSize;
        const h = cellSize;

        ctx.beginPath();
        if (moduleShape === 'dots') {
          ctx.arc(x + w / 2, y + h / 2, (w / 2) * 0.92, 0, Math.PI * 2);
          ctx.fill();
        } else if (moduleShape === 'rounded') {
          ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, w * 0.35);
          ctx.fill();
        } else if (moduleShape === 'smooth') {
          ctx.roundRect(x + 0.2, y + 0.2, w - 0.4, h - 0.4, w * 0.45);
          ctx.fill();
        } else if (moduleShape === 'diamond') {
          ctx.moveTo(x + w / 2, y);
          ctx.lineTo(x + w, y + h / 2);
          ctx.lineTo(x + w / 2, y + h);
          ctx.lineTo(x, y + h / 2);
          ctx.closePath();
          ctx.fill();
        } else if (moduleShape === 'star') {
          ctx.moveTo(x + w / 2, y + 1);
          ctx.quadraticCurveTo(x + w / 2, y + h / 2, x + w - 1, y + h / 2);
          ctx.quadraticCurveTo(x + w / 2, y + h / 2, x + w / 2, y + h - 1);
          ctx.quadraticCurveTo(x + w / 2, y + h / 2, x + 1, y + h / 2);
          ctx.quadraticCurveTo(x + w / 2, y + h / 2, x + w / 2, y + 1);
          ctx.fill();
        } else {
          // Classic crisp square
          ctx.fillRect(x, y, w, h);
        }
      }
    }

    // 5. Draw the 3 Finder Pattern Eyes (Top-Left, Top-Right, Bottom-Left)
    const drawEye = (originRow, originCol) => {
      const eyeX = startX + originCol * cellSize;
      const eyeY = startY + originRow * cellSize;
      const eyeSize = 7 * cellSize;

      const outerColor = customEyeColor ? eyeOuterColor : bodyFillStyle;
      const innerColor = customEyeColor ? eyeInnerColor : bodyFillStyle;

      ctx.save();
      // Outer 7x7 Ring
      ctx.fillStyle = outerColor;
      ctx.beginPath();
      if (eyeOuterShape === 'circle') {
        ctx.arc(eyeX + eyeSize / 2, eyeY + eyeSize / 2, eyeSize / 2, 0, Math.PI * 2);
        ctx.fill();
        // Clear 5x5 inner ring
        ctx.fillStyle = transparentBg ? (bgColor || '#ffffff') : bgColor;
        ctx.beginPath();
        ctx.arc(eyeX + eyeSize / 2, eyeY + eyeSize / 2, (5 * cellSize) / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (eyeOuterShape === 'rounded') {
        ctx.roundRect(eyeX, eyeY, eyeSize, eyeSize, eyeSize * 0.28);
        ctx.fill();
        ctx.fillStyle = transparentBg ? (bgColor || '#ffffff') : bgColor;
        ctx.beginPath();
        ctx.roundRect(eyeX + cellSize, eyeY + cellSize, 5 * cellSize, 5 * cellSize, (5 * cellSize) * 0.22);
        ctx.fill();
      } else if (eyeOuterShape === 'leaf') {
        // Leaf/Teardrop style (diagonal round corners)
        const rad = eyeSize * 0.45;
        const isTL = originRow === 0 && originCol === 0;
        const isTR = originRow === 0 && originCol > 0;
        const isBL = originRow > 0 && originCol === 0;
        const radii = isTL ? [rad, rad, 2, rad] : isTR ? [rad, rad, rad, 2] : isBL ? [rad, 2, rad, rad] : [rad, rad, rad, rad];
        ctx.roundRect(eyeX, eyeY, eyeSize, eyeSize, radii);
        ctx.fill();
        ctx.fillStyle = transparentBg ? (bgColor || '#ffffff') : bgColor;
        ctx.beginPath();
        ctx.roundRect(eyeX + cellSize, eyeY + cellSize, 5 * cellSize, 5 * cellSize, (5 * cellSize) * 0.22);
        ctx.fill();
      } else {
        // Classic Square Eye
        ctx.fillRect(eyeX, eyeY, eyeSize, eyeSize);
        ctx.fillStyle = transparentBg ? (bgColor || '#ffffff') : bgColor;
        ctx.fillRect(eyeX + cellSize, eyeY + cellSize, 5 * cellSize, 5 * cellSize);
      }

      // Inner 3x3 Center Dot
      ctx.fillStyle = innerColor;
      const innerX = eyeX + 2 * cellSize;
      const innerY = eyeY + 2 * cellSize;
      const innerSize = 3 * cellSize;

      ctx.beginPath();
      if (eyeInnerShape === 'circle') {
        ctx.arc(innerX + innerSize / 2, innerY + innerSize / 2, innerSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (eyeInnerShape === 'diamond') {
        ctx.moveTo(innerX + innerSize / 2, innerY);
        ctx.lineTo(innerX + innerSize, innerY + innerSize / 2);
        ctx.lineTo(innerX + innerSize / 2, innerY + innerSize);
        ctx.lineTo(innerX, innerY + innerSize / 2);
        ctx.closePath();
        ctx.fill();
      } else if (eyeInnerShape === 'rounded') {
        ctx.roundRect(innerX, innerY, innerSize, innerSize, innerSize * 0.35);
        ctx.fill();
      } else {
        ctx.fillRect(innerX, innerY, innerSize, innerSize);
      }
      ctx.restore();
    };

    drawEye(0, 0); // Top-Left
    drawEye(0, moduleCount - 7); // Top-Right
    drawEye(moduleCount - 7, 0); // Bottom-Left

    // 6. Draw Center Logo / Icon if active
    if (logoMode !== 'none') {
      const centerPx = startX + (moduleCount * cellSize) / 2;
      const logoDiameter = targetSize * (logoSizePercent / 100);
      const logoX = centerPx - logoDiameter / 2;
      const logoY = startY + (moduleCount * cellSize) / 2 - logoDiameter / 2;

      ctx.save();
      // Draw background pad for logo to keep scannability high
      if (logoBgPad) {
        ctx.fillStyle = logoBgColor;
        ctx.shadowColor = 'rgba(0,0,0,0.12)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        ctx.roundRect(logoX - 6, logoY - 6, logoDiameter + 12, logoDiameter + 12, (logoDiameter + 12) * 0.28);
        ctx.fill();

        ctx.strokeStyle = logoBorderColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw Logo Image or Vector Preset
      if (logoMode === 'upload' && uploadedLogo) {
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, logoX, logoY, logoDiameter, logoDiameter);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = uploadedLogo;
        });
      } else if (logoMode === 'preset') {
        const preset = PRESET_ICONS.find(p => p.id === selectedPresetIcon) || PRESET_ICONS[0];
        const svgBlob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="${encodeURIComponent(fgColor)}">${preset.svg}</svg>`], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, logoX + 2, logoY + 2, logoDiameter - 4, logoDiameter - 4);
            URL.revokeObjectURL(svgUrl);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(svgUrl);
            resolve();
          };
          img.src = svgUrl;
        });
      }
      ctx.restore();
    }

    // 7. Draw Frame Text / Badge / Call-To-Action ("SCAN ME")
    if (frameStyle !== 'none' && frameText.trim()) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = frameStyle === 'polaroid' ? '#1e293b' : frameTextColor;

      const fontSize = Math.max(16, Math.round(targetSize * 0.045));
      ctx.font = `800 ${fontSize}px "Outfit", "Inter", sans-serif`;

      if (hasBottomBanner) {
        const textY = canvasHeight - (frameBottomPad / 2);
        ctx.fillText(frameText.toUpperCase(), canvasWidth / 2, textY);
      } else if (hasTopBanner) {
        const textY = frameTopPad / 2;
        ctx.fillText(frameText.toUpperCase(), canvasWidth / 2, textY);
      } else if (isPillBadge) {
        // Draw pill container for text
        const pillW = canvasWidth * 0.7;
        const pillH = frameBottomPad * 0.7;
        const pillX = (canvasWidth - pillW) / 2;
        const pillY = canvasHeight - frameBottomPad + 8;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
        ctx.fill();

        ctx.fillStyle = frameColor;
        ctx.fillText(frameText.toUpperCase(), canvasWidth / 2, pillY + pillH / 2);
      } else if (isPhoneCard) {
        const textY = canvasHeight - (frameBottomPad / 2);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(frameText.toUpperCase(), canvasWidth / 2, textY);
      }
      ctx.restore();
    }
  }, [
    computedPayload,
    errorCorrection,
    marginModules,
    frameStyle,
    frameText,
    frameColor,
    frameTextColor,
    transparentBg,
    bgColor,
    fgColor,
    colorMode,
    gradType,
    gradAngle,
    gradStart,
    gradEnd,
    moduleShape,
    eyeOuterShape,
    eyeInnerShape,
    customEyeColor,
    eyeOuterColor,
    eyeInnerColor,
    logoMode,
    uploadedLogo,
    selectedPresetIcon,
    logoSizePercent,
    logoBgPad,
    logoBgColor,
    logoBorderColor
  ]);

  // Live Canvas Render Debounce
  useEffect(() => {
    setGenerating(true);
    const timer = setTimeout(async () => {
      if (canvasRef.current) {
        await renderQrToCanvas(canvasRef.current, 512);
      }
      setGenerating(false);
    }, 120);
    return () => clearTimeout(timer);
  }, [renderQrToCanvas]);

  // ============ EXPORT FUNCTIONS ============

  // 1. Export High-Res PNG
  const handleDownloadPng = async () => {
    // If exporting 2K or 4K Ultra, check login
    if (exportResolution >= 2048 && !requireAuthForCustomization('export in Ultra 4K resolution')) {
      return;
    }
    const offscreen = document.createElement('canvas');
    await renderQrToCanvas(offscreen, exportResolution);
    offscreen.toBlob((blob) => {
      if (blob) {
        saveBlob(blob, `pikfinder-qr-${dataType}-${exportResolution}px.png`);
        toast(`Downloaded high-res ${exportResolution}px PNG!`, 'success');
      }
    }, 'image/png');
  };

  // 2. Export Vector SVG
  const handleDownloadSvg = async () => {
    if (!requireAuthForCustomization('export scalable Vector SVG')) return;
    try {
      const QRCode = (await import('qrcode')).default;
      const opts = {
        width: 1024,
        margin: marginModules,
        color: { dark: fgColor, light: transparentBg ? '#00000000' : bgColor },
        errorCorrectionLevel: errorCorrection,
        type: 'svg'
      };
      const svgString = await QRCode.toString(computedPayload, opts);
      saveBlob(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }), `pikfinder-qr-${dataType}.svg`);
      toast('Vector SVG exported successfully!', 'success');
    } catch {
      toast('Failed to generate SVG vector file', 'error');
    }
  };

  // 3. Export Print-Ready PDF
  const handleDownloadPdf = async () => {
    if (!requireAuthForCustomization('export Print-Ready PDF with crop guides')) return;
    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size

      const offscreen = document.createElement('canvas');
      await renderQrToCanvas(offscreen, 2048);
      const pngDataUrl = offscreen.toDataURL('image/png');
      const pngImage = await pdfDoc.embedPng(pngDataUrl);

      const qrWidth = 320;
      const qrHeight = (offscreen.height / offscreen.width) * qrWidth;
      const x = (595.28 - qrWidth) / 2;
      const y = (841.89 - qrHeight) / 2;

      page.drawImage(pngImage, { x, y, width: qrWidth, height: qrHeight });

      // Title & Footer text on PDF
      page.drawText('PikFinder QR Code Studio', { x: 50, y: 780, size: 14, color: rgb(0.2, 0.2, 0.25) });
      page.drawText(`Content: ${computedPayload.slice(0, 60)}${computedPayload.length > 60 ? '...' : ''}`, { x: 50, y: 760, size: 9, color: rgb(0.4, 0.4, 0.45) });
      page.drawText('Generated with PikFinder (pikfinder.com) - 100% Free & High Precision', { x: 120, y: 50, size: 8, color: rgb(0.5, 0.5, 0.55) });

      const pdfBytes = await pdfDoc.save();
      saveBlob(new Blob([pdfBytes], { type: 'application/pdf' }), `pikfinder-qr-${dataType}.pdf`);
      toast('Print-ready PDF exported!', 'success');
    } catch {
      toast('Could not generate PDF document', 'error');
    }
  };

  // 4. Copy to Clipboard
  const handleCopyToClipboard = async () => {
    try {
      const offscreen = document.createElement('canvas');
      await renderQrToCanvas(offscreen, 1024);
      offscreen.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopiedStatus(true);
          toast('QR Code copied to clipboard! Paste directly into Figma, Canva, or Photoshop.', 'success');
          setTimeout(() => setCopiedStatus(false), 2500);
        }
      });
    } catch {
      toast('Direct clipboard image copy not supported in this browser.', 'info');
    }
  };

  return (
    <div className="tool-engine qr-studio-wrapper">
      {/* Top Banner if not logged in */}
      {!isLoggedIn && (
        <div className="qr-auth-gate-banner">
          <div className="qr-auth-gate-info">
            <div className="qr-auth-icon-badge">
              <Sparkle weight="fill" size={20} />
            </div>
            <div>
              <strong>Design &amp; Customization Locked</strong>
              <p>Sign up free to unlock custom brand colors, gradients, logos, eye shapes, frame badges, and 4K exports.</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary btn-signup-qr"
            onClick={() => toggleAuthModal('signup')}
          >
            <span>Sign Up Free to Customize</span>
          </button>
        </div>
      )}

      <div className="qr-studio-grid">
        {/* ============ LEFT COLUMN: CONFIGURATION ============ */}
        <div className="qr-controls-card">
          {/* Main Top Selector: Content Type vs Customise Tabs */}
          <div className="qr-section-header">
            <h3>1. Select QR Data Type</h3>
            <span className="qr-badge-count">12 Types</span>
          </div>

          {/* Data Type Grid */}
          <div className="qr-type-chips-grid">
            {[
              { id: 'url', label: 'URL / Link', icon: LinkIcon },
              { id: 'text', label: 'Plain Text', icon: TextT },
              { id: 'wifi', label: 'Wi-Fi Network', icon: WifiHigh },
              { id: 'vcard', label: 'Contact (vCard)', icon: User },
              { id: 'email', label: 'Email Address', icon: EnvelopeSimple },
              { id: 'phone', label: 'Phone Call', icon: Phone },
              { id: 'sms', label: 'SMS Message', icon: ChatDots },
              { id: 'whatsapp', label: 'WhatsApp', icon: WhatsappLogo },
              { id: 'location', label: 'Map Location', icon: MapPin },
              { id: 'event', label: 'Event / Calendar', icon: CalendarBlank },
              { id: 'crypto', label: 'UPI / Crypto', icon: CreditCard },
              { id: 'social', label: 'Social Profile', icon: ShareNetwork },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`qr-type-chip ${dataType === id ? 'active' : ''}`}
                onClick={() => setDataType(id)}
              >
                <Icon size={16} weight={dataType === id ? 'fill' : 'bold'} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Dynamic Content Form according to Data Type */}
          <div className="qr-data-form-box">
            {/* 1. URL */}
            {dataType === 'url' && (
              <div className="qr-form-stack">
                <label className="tool-control">
                  <span>Target Website URL</span>
                  <div className="qr-input-group">
                    <select
                      value={urlData.protocol}
                      onChange={(e) => setUrlData({ ...urlData, protocol: e.target.value })}
                      className="qr-protocol-select"
                    >
                      <option value="https://">https://</option>
                      <option value="http://">http://</option>
                    </select>
                    <input
                      type="text"
                      value={urlData.url}
                      onChange={(e) => setUrlData({ ...urlData, url: e.target.value })}
                      placeholder="pikfinder.com or your portfolio link..."
                      className="qr-flex-input"
                    />
                  </div>
                </label>
                <div className="qr-utm-accordion">
                  <span className="qr-sub-label">UTM Tracking Parameters (Optional)</span>
                  <div className="qr-row-3">
                    <input
                      type="text"
                      placeholder="Source (e.g. flyer)"
                      value={urlData.utmSource}
                      onChange={(e) => setUrlData({ ...urlData, utmSource: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Medium (e.g. qr_code)"
                      value={urlData.utmMedium}
                      onChange={(e) => setUrlData({ ...urlData, utmMedium: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Campaign (e.g. launch)"
                      value={urlData.utmCampaign}
                      onChange={(e) => setUrlData({ ...urlData, utmCampaign: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Plain Text */}
            {dataType === 'text' && (
              <label className="tool-control">
                <span>Text or Raw Notes</span>
                <textarea
                  rows={4}
                  value={textData}
                  onChange={(e) => setTextData(e.target.value)}
                  placeholder="Type or paste any notes, secret messages, or serial keys..."
                />
              </label>
            )}

            {/* 3. Wi-Fi */}
            {dataType === 'wifi' && (
              <div className="qr-form-stack">
                <div className="qr-row-2">
                  <label className="tool-control">
                    <span>Network Name (SSID)</span>
                    <input
                      type="text"
                      placeholder="e.g. CoffeeShop_Guest"
                      value={wifiData.ssid}
                      onChange={(e) => setWifiData({ ...wifiData, ssid: e.target.value })}
                    />
                  </label>
                  <label className="tool-control">
                    <span>Security Type</span>
                    <select
                      value={wifiData.encryption}
                      onChange={(e) => setWifiData({ ...wifiData, encryption: e.target.value })}
                    >
                      <option value="WPA">WPA / WPA2 / WPA3 (Standard)</option>
                      <option value="WEP">WEP (Older)</option>
                      <option value="nopass">None (Open Network)</option>
                    </select>
                  </label>
                </div>
                <div className="qr-row-2">
                  <label className="tool-control">
                    <span>Wi-Fi Password</span>
                    <input
                      type="text"
                      placeholder="Leave blank if open"
                      value={wifiData.password}
                      onChange={(e) => setWifiData({ ...wifiData, password: e.target.value })}
                    />
                  </label>
                  <label className="tool-checkbox" style={{ marginTop: '26px' }}>
                    <input
                      type="checkbox"
                      checked={wifiData.hidden}
                      onChange={(e) => setWifiData({ ...wifiData, hidden: e.target.checked })}
                    />
                    <span>Hidden SSID Network</span>
                  </label>
                </div>
              </div>
            )}

            {/* 4. vCard Contact */}
            {dataType === 'vcard' && (
              <div className="qr-form-stack">
                <div className="qr-row-2">
                  <label className="tool-control">
                    <span>First Name</span>
                    <input
                      type="text"
                      value={vcardData.firstName}
                      onChange={(e) => setVcardData({ ...vcardData, firstName: e.target.value })}
                    />
                  </label>
                  <label className="tool-control">
                    <span>Last Name</span>
                    <input
                      type="text"
                      value={vcardData.lastName}
                      onChange={(e) => setVcardData({ ...vcardData, lastName: e.target.value })}
                    />
                  </label>
                </div>
                <div className="qr-row-2">
                  <label className="tool-control">
                    <span>Phone Number</span>
                    <input
                      type="tel"
                      value={vcardData.phone}
                      onChange={(e) => setVcardData({ ...vcardData, phone: e.target.value })}
                    />
                  </label>
                  <label className="tool-control">
                    <span>Email Address</span>
                    <input
                      type="email"
                      value={vcardData.email}
                      onChange={(e) => setVcardData({ ...vcardData, email: e.target.value })}
                    />
                  </label>
                </div>
                <div className="qr-row-2">
                  <label className="tool-control">
                    <span>Company / Organization</span>
                    <input
                      type="text"
                      value={vcardData.company}
                      onChange={(e) => setVcardData({ ...vcardData, company: e.target.value })}
                    />
                  </label>
                  <label className="tool-control">
                    <span>Job Title</span>
                    <input
                      type="text"
                      value={vcardData.jobTitle}
                      onChange={(e) => setVcardData({ ...vcardData, jobTitle: e.target.value })}
                    />
                  </label>
                </div>
                <div className="qr-row-2">
                  <label className="tool-control">
                    <span>Website</span>
                    <input
                      type="url"
                      value={vcardData.website}
                      onChange={(e) => setVcardData({ ...vcardData, website: e.target.value })}
                    />
                  </label>
                  <label className="tool-control">
                    <span>City, Country</span>
                    <input
                      type="text"
                      value={vcardData.city}
                      onChange={(e) => setVcardData({ ...vcardData, city: e.target.value })}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 5. Email */}
            {dataType === 'email' && (
              <div className="qr-form-stack">
                <label className="tool-control">
                  <span>Recipient Email</span>
                  <input
                    type="email"
                    value={emailData.to}
                    onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </label>
                <label className="tool-control">
                  <span>Subject Line</span>
                  <input
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    placeholder="Inquiry regarding design services"
                  />
                </label>
                <label className="tool-control">
                  <span>Pre-filled Body</span>
                  <textarea
                    rows={3}
                    value={emailData.body}
                    onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                  />
                </label>
              </div>
            )}

            {/* 6. Phone */}
            {dataType === 'phone' && (
              <label className="tool-control">
                <span>Phone Number with Country Code</span>
                <input
                  type="tel"
                  value={phoneData}
                  onChange={(e) => setPhoneData(e.target.value)}
                  placeholder="+1 555 019 2834"
                />
              </label>
            )}

            {/* 7. SMS */}
            {dataType === 'sms' && (
              <div className="qr-form-stack">
                <label className="tool-control">
                  <span>Recipient Mobile Number</span>
                  <input
                    type="tel"
                    value={smsData.phone}
                    onChange={(e) => setSmsData({ ...smsData, phone: e.target.value })}
                  />
                </label>
                <label className="tool-control">
                  <span>Pre-filled SMS Message</span>
                  <textarea
                    rows={3}
                    value={smsData.message}
                    onChange={(e) => setSmsData({ ...smsData, message: e.target.value })}
                  />
                </label>
              </div>
            )}

            {/* 8. WhatsApp */}
            {dataType === 'whatsapp' && (
              <div className="qr-form-stack">
                <div className="qr-row-2">
                  <label className="tool-control">
                    <span>Country Code</span>
                    <input
                      type="text"
                      placeholder="1 (USA), 44 (UK), 91 (IND)"
                      value={waData.countryCode}
                      onChange={(e) => setWaData({ ...waData, countryCode: e.target.value })}
                    />
                  </label>
                  <label className="tool-control">
                    <span>WhatsApp Number</span>
                    <input
                      type="tel"
                      placeholder="5550192834"
                      value={waData.phone}
                      onChange={(e) => setWaData({ ...waData, phone: e.target.value })}
                    />
                  </label>
                </div>
                <label className="tool-control">
                  <span>Pre-filled WhatsApp Message</span>
                  <textarea
                    rows={3}
                    value={waData.message}
                    onChange={(e) => setWaData({ ...waData, message: e.target.value })}
                  />
                </label>
              </div>
            )}

            {/* 9. Location */}
            {dataType === 'location' && (
              <div className="qr-form-stack">
                <div className="qr-row-2">
                  <button
                    type="button"
                    className={`btn-outline ${locData.mode === 'search' ? 'active-pill' : ''}`}
                    onClick={() => setLocData({ ...locData, mode: 'search' })}
                  >
                    Search Landmark / City
                  </button>
                  <button
                    type="button"
                    className={`btn-outline ${locData.mode === 'coords' ? 'active-pill' : ''}`}
                    onClick={() => setLocData({ ...locData, mode: 'coords' })}
                  >
                    GPS Coordinates
                  </button>
                </div>
                {locData.mode === 'search' ? (
                  <label className="tool-control">
                    <span>Place / Landmark Search</span>
                    <input
                      type="text"
                      placeholder="e.g. Central Park, New York"
                      value={locData.query}
                      onChange={(e) => setLocData({ ...locData, query: e.target.value })}
                    />
                  </label>
                ) : (
                  <div className="qr-row-2">
                    <label className="tool-control">
                      <span>Latitude</span>
                      <input
                        type="text"
                        value={locData.lat}
                        onChange={(e) => setLocData({ ...locData, lat: e.target.value })}
                      />
                    </label>
                    <label className="tool-control">
                      <span>Longitude</span>
                      <input
                        type="text"
                        value={locData.lng}
                        onChange={(e) => setLocData({ ...locData, lng: e.target.value })}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* 10. Calendar Event */}
            {dataType === 'event' && (
              <div className="qr-form-stack">
                <label className="tool-control">
                  <span>Event Title</span>
                  <input
                    type="text"
                    value={eventData.title}
                    onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                  />
                </label>
                <div className="qr-row-2">
                  <label className="tool-control">
                    <span>Start Date &amp; Time</span>
                    <input
                      type="datetime-local"
                      value={eventData.startDate}
                      onChange={(e) => setEventData({ ...eventData, startDate: e.target.value })}
                    />
                  </label>
                  <label className="tool-control">
                    <span>End Date &amp; Time</span>
                    <input
                      type="datetime-local"
                      value={eventData.endDate}
                      onChange={(e) => setEventData({ ...eventData, endDate: e.target.value })}
                    />
                  </label>
                </div>
                <label className="tool-control">
                  <span>Location or Venue</span>
                  <input
                    type="text"
                    value={eventData.location}
                    onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                  />
                </label>
              </div>
            )}

            {/* 11. UPI / Crypto */}
            {dataType === 'crypto' && (
              <div className="qr-form-stack">
                <div className="qr-row-2">
                  <label className="tool-control">
                    <span>Payment Standard</span>
                    <select
                      value={cryptoData.type}
                      onChange={(e) => setCryptoData({ ...cryptoData, type: e.target.value })}
                    >
                      <option value="upi">UPI (GPay / PhonePe / Paytm / BHIM)</option>
                      <option value="bitcoin">Bitcoin (BTC Address)</option>
                    </select>
                  </label>
                  <label className="tool-control">
                    <span>{cryptoData.type === 'upi' ? 'UPI ID (VPA)' : 'BTC Wallet Address'}</span>
                    <input
                      type="text"
                      placeholder={cryptoData.type === 'upi' ? 'name@okhdfcbank' : '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'}
                      value={cryptoData.upiId}
                      onChange={(e) => setCryptoData({ ...cryptoData, upiId: e.target.value })}
                    />
                  </label>
                </div>
                {cryptoData.type === 'upi' && (
                  <div className="qr-row-2">
                    <label className="tool-control">
                      <span>Payee Name</span>
                      <input
                        type="text"
                        value={cryptoData.payeeName}
                        onChange={(e) => setCryptoData({ ...cryptoData, payeeName: e.target.value })}
                      />
                    </label>
                    <label className="tool-control">
                      <span>Amount (Optional)</span>
                      <input
                        type="number"
                        placeholder="Leave blank for any amount"
                        value={cryptoData.amount}
                        onChange={(e) => setCryptoData({ ...cryptoData, amount: e.target.value })}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* 12. Social Profile */}
            {dataType === 'social' && (
              <div className="qr-form-stack">
                <div className="qr-row-2">
                  <label className="tool-control">
                    <span>Social Platform</span>
                    <select
                      value={socialData.platform}
                      onChange={(e) => setSocialData({ ...socialData, platform: e.target.value })}
                    >
                      <option value="instagram">Instagram</option>
                      <option value="twitter">X / Twitter</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                      <option value="github">GitHub</option>
                      <option value="telegram">Telegram</option>
                    </select>
                  </label>
                  <label className="tool-control">
                    <span>Username or Handle</span>
                    <input
                      type="text"
                      placeholder="e.g. pikfinder"
                      value={socialData.username}
                      onChange={(e) => setSocialData({ ...socialData, username: e.target.value })}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ============ STEP 2: CUSTOMIZE STUDIO TABS ============ */}
          <div className="qr-section-header" style={{ marginTop: '28px' }}>
            <div className="qr-section-title-wrap">
              <h3>2. Customise QR Design</h3>
              {!isLoggedIn ? (
                <span className="qr-lock-chip" onClick={() => toggleAuthModal('signup')}>
                  <LockKey size={13} weight="fill" /> Free Signup Required
                </span>
              ) : (
                <span className="qr-unlocked-chip">
                  <Sparkle size={13} weight="fill" /> Studio Pro Unlocked
                </span>
              )}
            </div>
          </div>

          {/* Customization Navigation Tabs */}
          <div className="qr-custom-tabs">
            {[
              { id: 'colors', label: 'Colors & Gradients', icon: PaintBrush },
              { id: 'pattern', label: 'Pattern & Eyes', icon: Shapes },
              { id: 'logo', label: 'Logo & Icon', icon: ImageIcon },
              { id: 'frames', label: 'Frames & CTA', icon: FrameCorners },
              { id: 'settings', label: 'Quality & Output', icon: SlidersHorizontal },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`qr-tab-btn ${activeCustomTab === id ? 'active' : ''}`}
                onClick={() => {
                  if (!isLoggedIn) {
                    requireAuthForCustomization(`customize ${label}`);
                  }
                  setActiveCustomTab(id);
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
                {!isLoggedIn && <LockKey size={12} className="tab-lock-icon" />}
              </button>
            ))}
          </div>

          {/* Customization Content Container */}
          <div className={`qr-custom-panel ${!isLoggedIn ? 'is-locked' : ''}`}>
            {/* Overlay if not logged in */}
            {!isLoggedIn && (
              <div className="qr-custom-locked-overlay" onClick={() => requireAuthForCustomization('unlock all customization controls')}>
                <div className="qr-lock-card">
                  <LockKey size={32} weight="duotone" className="qr-lock-hero" />
                  <h4>Unlock QR Code Customization</h4>
                  <p>Create an account to customize colors, add your brand logo, choose unique eye styles, and download 4K vector files.</p>
                  <button type="button" className="btn-primary" onClick={(e) => { e.stopPropagation(); toggleAuthModal('signup'); }}>
                    Sign Up Free (Instant Access)
                  </button>
                </div>
              </div>
            )}

            {/* TAB 1: COLORS & GRADIENTS */}
            {activeCustomTab === 'colors' && (
              <div className="qr-tab-content">
                <div className="qr-presets-bar">
                  <span className="qr-sub-label">Instant Designer Themes</span>
                  <div className="qr-preset-swatches">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="qr-preset-btn"
                        title={p.name}
                        onClick={() => applyPreset(p)}
                        style={{
                          background: p.type === 'solid' ? p.dark : `linear-gradient(${p.angle || 45}deg, ${p.start}, ${p.end})`
                        }}
                      >
                        <span className="sr-only">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="qr-row-2">
                  <label className="tool-control">
                    <span>Fill Color Mode</span>
                    <select
                      value={colorMode}
                      onChange={(e) => setColorMode(e.target.value)}
                    >
                      <option value="solid">Solid Color</option>
                      <option value="gradient">Multi-Stop Gradient</option>
                    </select>
                  </label>
                  <label className="tool-checkbox" style={{ marginTop: '26px' }}>
                    <input
                      type="checkbox"
                      checked={transparentBg}
                      onChange={(e) => setTransparentBg(e.target.checked)}
                    />
                    <span>Transparent Background</span>
                  </label>
                </div>

                {colorMode === 'solid' ? (
                  <div className="qr-row-2">
                    <label className="tool-control">
                      <span>Foreground Color</span>
                      <div className="tool-inline-input">
                        <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} />
                        <input type="text" value={fgColor} onChange={(e) => setFgColor(e.target.value)} style={{ width: '100px' }} />
                      </div>
                    </label>
                    {!transparentBg && (
                      <label className="tool-control">
                        <span>Background Color</span>
                        <div className="tool-inline-input">
                          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
                          <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ width: '100px' }} />
                        </div>
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="qr-gradient-controls">
                    <div className="qr-row-3">
                      <label className="tool-control">
                        <span>Gradient Start</span>
                        <div className="tool-inline-input">
                          <input type="color" value={gradStart} onChange={(e) => setGradStart(e.target.value)} />
                          <input type="text" value={gradStart} onChange={(e) => setGradStart(e.target.value)} style={{ width: '85px' }} />
                        </div>
                      </label>
                      <label className="tool-control">
                        <span>Gradient End</span>
                        <div className="tool-inline-input">
                          <input type="color" value={gradEnd} onChange={(e) => setGradEnd(e.target.value)} />
                          <input type="text" value={gradEnd} onChange={(e) => setGradEnd(e.target.value)} style={{ width: '85px' }} />
                        </div>
                      </label>
                      <label className="tool-control">
                        <span>Type</span>
                        <select value={gradType} onChange={(e) => setGradType(e.target.value)}>
                          <option value="linear">Linear</option>
                          <option value="radial">Radial</option>
                        </select>
                      </label>
                    </div>
                    {gradType === 'linear' && (
                      <label className="tool-control" style={{ marginTop: '12px' }}>
                        <span>Gradient Angle: {gradAngle}&deg;</span>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="15"
                          value={gradAngle}
                          onChange={(e) => setGradAngle(Number(e.target.value))}
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PATTERNS & EYES */}
            {activeCustomTab === 'pattern' && (
              <div className="qr-tab-content">
                <span className="qr-sub-label">Body Module Shape</span>
                <div className="qr-shape-chips-row">
                  {[
                    { id: 'square', label: 'Square' },
                    { id: 'dots', label: 'Circles' },
                    { id: 'rounded', label: 'Rounded' },
                    { id: 'smooth', label: 'Smooth Pill' },
                    { id: 'diamond', label: 'Diamond' },
                    { id: 'star', label: 'Star / Spark' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      className={`qr-shape-btn ${moduleShape === id ? 'active' : ''}`}
                      onClick={() => setModuleShape(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="qr-row-2" style={{ marginTop: '18px' }}>
                  <label className="tool-control">
                    <span>Corner Eye Outer Frame</span>
                    <select
                      value={eyeOuterShape}
                      onChange={(e) => setEyeOuterShape(e.target.value)}
                    >
                      <option value="square">Classic Square</option>
                      <option value="rounded">Rounded Square</option>
                      <option value="circle">Concentric Circle</option>
                      <option value="leaf">Leaf / Teardrop</option>
                    </select>
                  </label>
                  <label className="tool-control">
                    <span>Corner Eye Center Dot</span>
                    <select
                      value={eyeInnerShape}
                      onChange={(e) => setEyeInnerShape(e.target.value)}
                    >
                      <option value="square">Square</option>
                      <option value="circle">Circle Dot</option>
                      <option value="diamond">Diamond</option>
                      <option value="rounded">Rounded</option>
                    </select>
                  </label>
                </div>

                <label className="tool-checkbox" style={{ marginTop: '16px' }}>
                  <input
                    type="checkbox"
                    checked={customEyeColor}
                    onChange={(e) => setCustomEyeColor(e.target.checked)}
                  />
                  <span>Custom Accent Colors for Corner Eyes</span>
                </label>

                {customEyeColor && (
                  <div className="qr-row-2" style={{ marginTop: '12px' }}>
                    <label className="tool-control">
                      <span>Eye Frame Color</span>
                      <div className="tool-inline-input">
                        <input type="color" value={eyeOuterColor} onChange={(e) => setEyeOuterColor(e.target.value)} />
                        <input type="text" value={eyeOuterColor} onChange={(e) => setEyeOuterColor(e.target.value)} style={{ width: '90px' }} />
                      </div>
                    </label>
                    <label className="tool-control">
                      <span>Eye Center Color</span>
                      <div className="tool-inline-input">
                        <input type="color" value={eyeInnerColor} onChange={(e) => setEyeInnerColor(e.target.value)} />
                        <input type="text" value={eyeInnerColor} onChange={(e) => setEyeInnerColor(e.target.value)} style={{ width: '90px' }} />
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: LOGO & BRANDING */}
            {activeCustomTab === 'logo' && (
              <div className="qr-tab-content">
                <span className="qr-sub-label">Center Brand Logo</span>
                <div className="qr-logo-mode-buttons">
                  <button
                    type="button"
                    className={`btn-outline ${logoMode === 'none' ? 'active-pill' : ''}`}
                    onClick={() => setLogoMode('none')}
                  >
                    No Logo
                  </button>
                  <button
                    type="button"
                    className={`btn-outline ${logoMode === 'preset' ? 'active-pill' : ''}`}
                    onClick={() => setLogoMode('preset')}
                  >
                    Preset Icons
                  </button>
                  <button
                    type="button"
                    className={`btn-outline ${logoMode === 'upload' ? 'active-pill' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadSimple size={14} /> Upload Custom Logo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    style={{ display: 'none' }}
                    onChange={handleLogoUpload}
                  />
                </div>

                {logoMode === 'preset' && (
                  <div className="qr-preset-icons-grid" style={{ marginTop: '14px' }}>
                    {PRESET_ICONS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`qr-icon-card ${selectedPresetIcon === p.id ? 'active' : ''}`}
                        onClick={() => setSelectedPresetIcon(p.id)}
                      >
                        <div
                          className="qr-icon-preview"
                          dangerouslySetInnerHTML={{ __html: p.svg }}
                        />
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {logoMode === 'upload' && uploadedLogo && (
                  <div className="qr-uploaded-preview-box" style={{ marginTop: '14px' }}>
                    <img src={uploadedLogo} alt="Uploaded logo" className="qr-custom-logo-thumb" />
                    <div className="qr-upload-info">
                      <strong>Custom Logo Attached</strong>
                      <span>High error correction level automatically enabled for safe scanning.</span>
                    </div>
                    <button
                      type="button"
                      className="btn-text-danger"
                      onClick={() => {
                        setUploadedLogo(null);
                        setLogoMode('none');
                      }}
                    >
                      <Trash size={16} /> Remove
                    </button>
                  </div>
                )}

                {logoMode !== 'none' && (
                  <div className="qr-logo-settings" style={{ marginTop: '18px' }}>
                    <div className="qr-row-2">
                      <label className="tool-control">
                        <span>Logo Size ({logoSizePercent}%)</span>
                        <input
                          type="range"
                          min="14"
                          max="30"
                          step="2"
                          value={logoSizePercent}
                          onChange={(e) => setLogoSizePercent(Number(e.target.value))}
                        />
                      </label>
                      <label className="tool-checkbox" style={{ marginTop: '26px' }}>
                        <input
                          type="checkbox"
                          checked={logoBgPad}
                          onChange={(e) => setLogoBgPad(e.target.checked)}
                        />
                        <span>White Background Badge Padding</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: FRAMES & CTA BADGES */}
            {activeCustomTab === 'frames' && (
              <div className="qr-tab-content">
                <span className="qr-sub-label">Call-To-Action Frame Style</span>
                <div className="qr-shape-chips-row">
                  {[
                    { id: 'none', label: 'None' },
                    { id: 'bottom-banner', label: 'Bottom Banner' },
                    { id: 'top-banner', label: 'Top Banner' },
                    { id: 'pill-badge', label: 'Pill Badge' },
                    { id: 'phone-card', label: 'Phone Device' },
                    { id: 'polaroid', label: 'Polaroid Card' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      className={`qr-shape-btn ${frameStyle === id ? 'active' : ''}`}
                      onClick={() => setFrameStyle(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {frameStyle !== 'none' && (
                  <div className="qr-frame-custom-fields" style={{ marginTop: '16px' }}>
                    <label className="tool-control">
                      <span>Frame Call-To-Action Text</span>
                      <input
                        type="text"
                        value={frameText}
                        onChange={(e) => setFrameText(e.target.value)}
                        placeholder="SCAN ME / CONNECT TO WIFI / VISIT WEBSITE"
                      />
                    </label>

                    {frameStyle !== 'polaroid' && frameStyle !== 'phone-card' && (
                      <div className="qr-row-2" style={{ marginTop: '12px' }}>
                        <label className="tool-control">
                          <span>Frame Background</span>
                          <div className="tool-inline-input">
                            <input type="color" value={frameColor} onChange={(e) => setFrameColor(e.target.value)} />
                            <input type="text" value={frameColor} onChange={(e) => setFrameColor(e.target.value)} style={{ width: '90px' }} />
                          </div>
                        </label>
                        <label className="tool-control">
                          <span>Frame Text Color</span>
                          <div className="tool-inline-input">
                            <input type="color" value={frameTextColor} onChange={(e) => setFrameTextColor(e.target.value)} />
                            <input type="text" value={frameTextColor} onChange={(e) => setFrameTextColor(e.target.value)} style={{ width: '90px' }} />
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: QUALITY & PRECISION */}
            {activeCustomTab === 'settings' && (
              <div className="qr-tab-content">
                <div className="qr-row-2">
                  <label className="tool-control">
                    <span>Error Correction Level</span>
                    <select
                      value={errorCorrection}
                      onChange={(e) => setErrorCorrection(e.target.value)}
                    >
                      <option value="L">L - Low (~7% recovery, smaller code)</option>
                      <option value="M">M - Medium (~15% recovery, default)</option>
                      <option value="Q">Q - Quartile (~25% recovery)</option>
                      <option value="H">H - High (~30% recovery, best with logo)</option>
                    </select>
                  </label>
                  <label className="tool-control">
                    <span>Quiet Zone Margin ({marginModules} modules)</span>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      step="1"
                      value={marginModules}
                      onChange={(e) => setMarginModules(Number(e.target.value))}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============ RIGHT COLUMN: LIVE PREVIEW & EXPORTS ============ */}
        <div className="qr-preview-card">
          <div className="qr-preview-header">
            <h4>Live Scan Preview</h4>
            <span className="qr-scan-badge">
              <Check size={13} weight="bold" /> 100% Scannable
            </span>
          </div>

          <div className="qr-canvas-container">
            {generating && (
              <div className="qr-canvas-spinner">
                <ArrowsClockwise className="spin" size={24} />
              </div>
            )}
            <canvas ref={canvasRef} className="qr-live-canvas" />
          </div>

          {/* Quick Stats & Payload Preview */}
          <div className="qr-payload-readout">
            <div className="payload-meta">
              <span className="payload-type-tag">{dataType.toUpperCase()}</span>
              <span className="payload-char-count">{computedPayload.length} chars</span>
            </div>
            <p className="payload-preview-string" title={computedPayload}>
              {computedPayload}
            </p>
          </div>

          {/* Resolution Selector */}
          <div className="qr-resolution-row">
            <span className="qr-res-label">Export Resolution:</span>
            <div className="qr-res-pills">
              {[
                { size: 512, label: '512px' },
                { size: 1024, label: '1024px (HD)' },
                { size: 2048, label: '2048px (2K)' },
                { size: 4096, label: '4096px (4K Pro)' },
              ].map(({ size, label }) => (
                <button
                  key={size}
                  type="button"
                  className={`qr-res-btn ${exportResolution === size ? 'active' : ''}`}
                  onClick={() => {
                    if (size >= 2048 && !isLoggedIn) {
                      requireAuthForCustomization('unlock 2K and 4K Ultra Print Resolutions');
                      return;
                    }
                    setExportResolution(size);
                  }}
                >
                  {label}
                  {size >= 2048 && !isLoggedIn && <LockKey size={10} className="res-lock" />}
                </button>
              ))}
            </div>
          </div>

          {/* Main Download Action Buttons */}
          <div className="qr-export-buttons">
            <button
              type="button"
              className="btn-primary btn-download-main"
              onClick={handleDownloadPng}
            >
              <DownloadSimple weight="bold" size={18} />
              <span>Download PNG ({exportResolution}px)</span>
            </button>

            <div className="qr-secondary-actions">
              <button
                type="button"
                className="btn-outline qr-action-btn"
                onClick={handleDownloadSvg}
                title="Download Scalable Vector SVG"
              >
                <Shapes size={16} />
                <span>Vector SVG</span>
                {!isLoggedIn && <LockKey size={12} />}
              </button>

              <button
                type="button"
                className="btn-outline qr-action-btn"
                onClick={handleDownloadPdf}
                title="Download Print PDF"
              >
                <FilePdf size={16} />
                <span>Print PDF</span>
                {!isLoggedIn && <LockKey size={12} />}
              </button>

              <button
                type="button"
                className="btn-outline qr-action-btn"
                onClick={handleCopyToClipboard}
                title="Copy Image to Clipboard"
              >
                {copiedStatus ? <Check size={16} weight="bold" /> : <Copy size={16} />}
                <span>{copiedStatus ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
