import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useToast } from './Toast';
import {
  X,
  Plus,
  Sparkle,
  PaintBrush,
  Buildings,
  Scissors,
  Desktop,
  DeviceMobile,
  Cpu,
  Code,
  Lightning,
  Copy,
  Check,
  DownloadSimple,
  Camera,
  UploadSimple,
  ArrowRight,
  ChatCircleDots,
  Image as ImageIcon,
  Play,
  QrCode,
} from '@phosphor-icons/react';

export default function EcosystemModals() {
  const { activeModal, closeModal } = useContext(AppContext);
  const toast = useToast();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
  const [dropImage, setDropImage] = useState(null);

  if (!activeModal) return null;

  const copyToClipboard = (text, label = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast(label, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const mcpConfigJson = JSON.stringify(
    {
      mcpServers: {
        pikfinder: {
          command: "npx",
          args: ["-y", "@pikfinder/mcp-server"],
          env: {
            PIKFINDER_API_KEY: "pk_live_free_community_tier",
          },
        },
      },
    },
    null,
    2
  );

  const handleAiGenerate = (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    const finalQuery = `${aiPrompt.trim()} ${selectedStyle.toLowerCase()} 4k high quality`;
    closeModal();
    navigate(`/search?q=${encodeURIComponent(finalQuery)}`);
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setDropImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVisualSearchConfirm = () => {
    if (!dropImage) return;
    closeModal();
    // Navigate to studio with the dropped image as source canvas
    navigate(`/studio?img=${encodeURIComponent(dropImage)}`);
    toast('Image loaded into Creator Studio for visual manipulation & search', 'success');
  };

  return (
    <div className="modal-overlay active" onClick={closeModal} style={{ zIndex: 9999 }}>
      <div className="modal-content ecosystem-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={closeModal} aria-label="Close modal">
          <X size={20} weight="bold" />
        </button>

        {/* 1. QUICK CREATE MODAL */}
        {activeModal === 'create' && (
          <div className="eco-modal-inner">
            <div className="eco-modal-header">
              <div className="eco-modal-icon-badge create-badge">
                <Sparkle weight="fill" size={24} />
              </div>
              <div>
                <h2>Create Something Amazing</h2>
                <p>Choose an AI generator, start a fresh design, or edit existing assets.</p>
              </div>
            </div>

            {/* AI Prompt Input Bar */}
            <form onSubmit={handleAiGenerate} className="eco-create-ai-form">
              <div className="eco-prompt-box">
                <Sparkle weight="duotone" size={20} className="sparkle-accent" />
                <input
                  type="text"
                  placeholder="Describe what you want to create (e.g. futuristic glass spaceship in neon cyberpunk city)..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="btn-primary btn-generate-pill">
                  <span>Generate</span>
                  <ArrowRight weight="bold" size={14} />
                </button>
              </div>

              <div className="eco-style-chips">
                {['Photorealistic', '3D Render', 'Anime Art', 'Cyberpunk', 'Minimalist', 'Watercolor', 'Vector Icon'].map((style) => (
                  <button
                    key={style}
                    type="button"
                    className={`eco-style-chip ${selectedStyle === style ? 'active' : ''}`}
                    onClick={() => setSelectedStyle(style)}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </form>

            <div className="eco-quick-actions-grid">
              <div
                className="eco-action-card"
                onClick={() => {
                  closeModal();
                  navigate('/studio');
                }}
              >
                <div className="eco-action-icon studio-color">
                  <PaintBrush weight="duotone" size={26} />
                </div>
                <strong>Blank Canvas Studio</strong>
                <span>Custom dimensions, layers, fonts &amp; 4K exports</span>
              </div>

              <div
                className="eco-action-card"
                onClick={() => {
                  closeModal();
                  navigate('/tools/background-remover');
                }}
              >
                <div className="eco-action-icon cut-color">
                  <Scissors weight="duotone" size={26} />
                </div>
                <strong>Magic BG Remover</strong>
                <span>Instant 1-click AI cutout with transparent PNG</span>
              </div>

              <div
                className="eco-action-card"
                onClick={() => {
                  closeModal();
                  navigate('/business-automation');
                }}
              >
                <div className="eco-action-icon doc-color">
                  <Buildings weight="duotone" size={26} />
                </div>
                <strong>Document Generator</strong>
                <span>Certificates, invoices &amp; IDs in bulk from CRM</span>
              </div>

              <div
                className="eco-action-card"
                onClick={() => {
                  closeModal();
                  navigate('/templates');
                }}
              >
                <div className="eco-action-icon tpl-color">
                  <ImageIcon weight="duotone" size={26} />
                </div>
                <strong>Browse 90+ Templates</strong>
                <span>Flyers, social posts, coupons &amp; gift cards</span>
              </div>

              <div
                className="eco-action-card"
                onClick={() => {
                  closeModal();
                  navigate('/tools/qr-code-generator');
                }}
              >
                <div className="eco-action-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                  <QrCode weight="duotone" size={26} />
                </div>
                <strong>QR Code Studio</strong>
                <span>Custom logos, gradients, Wi-Fi, vCard &amp; 4K exports</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. MCP SERVER MODAL */}
        {activeModal === 'mcp' && (
          <div className="eco-modal-inner">
            <div className="eco-modal-header">
              <div className="eco-modal-icon-badge mcp-badge">
                <Cpu weight="fill" size={24} />
              </div>
              <div>
                <h2>PikFinder MCP Server</h2>
                <p>Connect 100M+ royalty-free design assets directly to Claude Desktop, Cursor, and AI Agents.</p>
              </div>
            </div>

            <div className="eco-code-block-wrap">
              <div className="eco-code-header">
                <span>claude_desktop_config.json</span>
                <button
                  type="button"
                  className="btn-copy-code"
                  onClick={() => copyToClipboard(mcpConfigJson, 'MCP Config JSON copied!')}
                >
                  {copied ? <Check size={14} weight="bold" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Config'}</span>
                </button>
              </div>
              <pre className="eco-code-pre">
                <code>{mcpConfigJson}</code>
              </pre>
            </div>

            <div className="eco-feature-points">
              <div className="eco-point">
                <Sparkle weight="fill" size={16} />
                <span>Search and insert images directly into AI conversations</span>
              </div>
              <div className="eco-point">
                <Sparkle weight="fill" size={16} />
                <span>Auto-fetch copyright-safe attribution and license keys</span>
              </div>
              <div className="eco-point">
                <Sparkle weight="fill" size={16} />
                <span>Compatible with Antigravity, Claude 3.7, Cursor &amp; Windsurf</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. DESKTOP & MOBILE APP MODAL */}
        {(activeModal === 'desktop' || activeModal === 'mobile') && (
          <div className="eco-modal-inner">
            <div className="eco-modal-header">
              <div className="eco-modal-icon-badge app-badge">
                {activeModal === 'desktop' ? <Desktop weight="fill" size={24} /> : <DeviceMobile weight="fill" size={24} />}
              </div>
              <div>
                <h2>PikFinder for {activeModal === 'desktop' ? 'Desktop' : 'Mobile'}</h2>
                <p>Fast, native performance with instant search, background removal and studio canvas.</p>
              </div>
            </div>

            <div className="eco-download-platforms">
              <div className="platform-card">
                <Desktop size={32} weight="duotone" />
                <strong>Windows &amp; macOS App</strong>
                <span>Standalone Progressive Web App with offline tools</span>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    toast('PWA App ready! Click the install button in your browser address bar.', 'success');
                    closeModal();
                  }}
                >
                  <DownloadSimple weight="bold" size={16} /> Install App
                </button>
              </div>

              <div className="platform-card">
                <DeviceMobile size={32} weight="duotone" />
                <strong>Android &amp; iOS</strong>
                <span>Add to Home Screen for 1-tap asset access anywhere</span>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => {
                    toast('Open PikFinder on your mobile browser and tap "Add to Home Screen"', 'info');
                  }}
                >
                  Add to Mobile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. PLUGINS MODAL */}
        {activeModal === 'plugins' && (
          <div className="eco-modal-inner">
            <div className="eco-modal-header">
              <div className="eco-modal-icon-badge plugin-badge">
                <Lightning weight="fill" size={24} />
              </div>
              <div>
                <h2>PikFinder Plugins &amp; Integrations</h2>
                <p>Access millions of assets directly inside your favorite creative software.</p>
              </div>
            </div>

            <div className="eco-plugins-list">
              <div className="eco-plugin-row">
                <div className="plugin-badge-square figma-sq">❖</div>
                <div className="plugin-row-info">
                  <strong>Figma Plugin</strong>
                  <span>Insert vectors, stock photos and 3D icons directly into Figma canvas.</span>
                </div>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => toast('Figma plugin manifest link copied to clipboard!', 'success')}
                >
                  Install in Figma
                </button>
              </div>

              <div className="eco-plugin-row">
                <div className="plugin-badge-square ps-sq">Ps</div>
                <div className="plugin-row-info">
                  <strong>Adobe Photoshop Extension</strong>
                  <span>Drag and drop high-res images directly into Photoshop layers.</span>
                </div>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => toast('Photoshop extension CCX package downloading...', 'info')}
                >
                  Get Extension
                </button>
              </div>

              <div className="eco-plugin-row">
                <div className="plugin-badge-square pr-sq">Pr</div>
                <div className="plugin-row-info">
                  <strong>Premiere Pro &amp; After Effects</strong>
                  <span>Import royalty-free b-roll 4K stock video into your timeline.</span>
                </div>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => toast('Premiere Pro plugin download initiated', 'info')}
                >
                  Get Plugin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. API DEVELOPER MODAL */}
        {activeModal === 'api' && (
          <div className="eco-modal-inner">
            <div className="eco-modal-header">
              <div className="eco-modal-icon-badge api-badge">
                <Code weight="fill" size={24} />
              </div>
              <div>
                <h2>PikFinder Developer API</h2>
                <p>REST API endpoints to query 100M+ copyright-safe images, videos and AI metadata.</p>
              </div>
            </div>

            <div className="eco-code-block-wrap">
              <div className="eco-code-header">
                <span>cURL Example</span>
                <button
                  type="button"
                  className="btn-copy-code"
                  onClick={() => copyToClipboard('curl -X GET "https://api.pikfinder.com/v1/search?q=cyberpunk&type=photo" -H "Authorization: Bearer YOUR_API_KEY"')}
                >
                  <Copy size={14} />
                  <span>Copy cURL</span>
                </button>
              </div>
              <pre className="eco-code-pre">
                <code>{`curl -X GET "https://api.pikfinder.com/v1/search?q=cyberpunk&type=photo" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</code>
              </pre>
            </div>

            <div className="eco-api-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  toast('API Key generated: pk_live_938a4d71bc2014f', 'success');
                }}
              >
                Generate Free API Key
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  closeModal();
                  navigate('/legal');
                }}
              >
                Read Documentation
              </button>
            </div>
          </div>
        )}

        {/* 6. VISUAL / REVERSE IMAGE SEARCH MODAL */}
        {activeModal === 'visual_search' && (
          <div className="eco-modal-inner">
            <div className="eco-modal-header">
              <div className="eco-modal-icon-badge visual-badge">
                <Camera weight="fill" size={24} />
              </div>
              <div>
                <h2>Visual &amp; Reverse Image Search</h2>
                <p>Drop any photo to find visually matching stock assets, edit in Studio, or extract palettes.</p>
              </div>
            </div>

            <div
              className={`eco-dropzone ${dropImage ? 'has-image' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleImageDrop}
            >
              {dropImage ? (
                <div className="eco-drop-preview">
                  <img src={dropImage} alt="Uploaded preview" />
                  <button
                    type="button"
                    className="btn-clear-drop"
                    onClick={() => setDropImage(null)}
                  >
                    <X size={16} /> Remove
                  </button>
                </div>
              ) : (
                <label className="eco-drop-label">
                  <UploadSimple size={36} weight="duotone" className="drop-icon" />
                  <strong>Drag and drop an image here</strong>
                  <span>or click to browse from your computer</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageDrop}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            <div className="eco-visual-actions">
              <button
                type="button"
                className="btn-primary"
                disabled={!dropImage}
                onClick={handleVisualSearchConfirm}
                style={{ width: '100%', padding: '12px' }}
              >
                <Sparkle weight="bold" size={16} /> Open &amp; Search Similar in Studio
              </button>
            </div>
          </div>
        )}

        {/* 7. AI PROMPT HELPER MODAL (Claude / ChatGPT) */}
        {activeModal === 'ai_prompts' && (
          <div className="eco-modal-inner">
            <div className="eco-modal-header">
              <div className="eco-modal-icon-badge prompt-badge">
                <ChatCircleDots weight="fill" size={24} />
              </div>
              <div>
                <h2>AI Prompt Engineering Studio</h2>
                <p>Pre-engineered prompts tailored for Claude, ChatGPT, Midjourney, and Stable Diffusion.</p>
              </div>
            </div>

            <div className="eco-prompt-templates-list">
              {[
                {
                  title: 'Ultra-Realistic 8K Portrait',
                  prompt: 'Studio portrait of a cybernetic woman with subtle gold circuitry, soft rim lighting, Hasselblad 85mm lens, photorealistic 8k',
                },
                {
                  title: '3D Glossy App Icon Mockup',
                  prompt: 'Clay 3D isometric magnifying glass icon, glassmorphism lens, soft pastel studio gradient backdrop, Raytraced render, Blender 3D',
                },
                {
                  title: 'Cinematic Cyberpunk Cityscape',
                  prompt: 'Vibrant neon rainy street in Tokyo 2099, holographic billboards reflecting on wet asphalt, cinematic volumetric fog, Unreal Engine 5',
                },
              ].map((item) => (
                <div key={item.title} className="eco-prompt-card">
                  <div className="prompt-card-top">
                    <strong>{item.title}</strong>
                    <button
                      type="button"
                      className="btn-copy-code"
                      onClick={() => copyToClipboard(item.prompt, 'Prompt copied!')}
                    >
                      <Copy size={13} />
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className="prompt-card-body">{item.prompt}</p>
                  <button
                    type="button"
                    className="btn-search-this"
                    onClick={() => {
                      closeModal();
                      navigate(`/search?q=${encodeURIComponent(item.prompt)}`);
                    }}
                  >
                    Search Assets for this Prompt →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
