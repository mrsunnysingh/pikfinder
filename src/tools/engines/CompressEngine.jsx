import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  UploadSimple,
  DownloadSimple,
  SlidersHorizontal,
  ArrowsClockwise,
  CheckCircle,
  Warning,
  Sparkle,
  Image as ImageIcon,
  Faders,
  ArrowsIn,
  ArrowsOut
} from '@phosphor-icons/react';
import { Dropzone, formatBytes, saveBlob, loadImageFromFile } from '../ToolShell';
import { drawToCanvas, canvasToBlob, compressToTarget, baseName, scaleImageHQ } from './canvas-utils';

const MAX_CANVAS_DIMENSION = 4096;

const PRESET_SIZES = [
  { label: '20 KB', kb: 20 },
  { label: '50 KB', kb: 50 },
  { label: '100 KB', kb: 100 },
  { label: '200 KB', kb: 200 },
  { label: '500 KB', kb: 500 },
  { label: '1 MB (1024 KB)', kb: 1024 },
  { label: '2 MB', kb: 2048 },
];

export default function CompressEngine({ targetKB = null }) {
  const [file, setFile] = useState(null);
  const [sourceImg, setSourceImg] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null); // { blob, url, width, height, qualityUsed }

  // Control states
  const defaultTarget = targetKB || 1024; // Default to 1MB (1024 KB) if not specified
  const [mode, setMode] = useState(targetKB ? 'target' : 'interactive'); // 'target' or 'interactive'
  const [targetSizeKB, setTargetSizeKB] = useState(defaultTarget);
  const [quality, setQuality] = useState(78); // 1-100%
  const [format, setFormat] = useState('image/jpeg'); // 'image/jpeg' | 'image/webp' | 'image/png'
  const [scalePercent, setScalePercent] = useState(100); // 25-100%
  
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' | 'preview-only'

  const debounceTimerRef = useRef(null);
  const processingRef = useRef(false);

  // Load and cache the source image upon upload
  const onFiles = async ([f]) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    setBusy(true);

    try {
      const { img, url } = await loadImageFromFile(f);
      setSourceImg(img);
      setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setPreviewUrl(url);

      // Perform initial compression
      await runCompression(img, f, mode, targetSizeKB, quality, format, scalePercent);
    } catch (err) {
      setError(err.message || 'Could not load the selected image.');
    } finally {
      setBusy(false);
    }
  };

  // Core compression routine
  const runCompression = useCallback(
    async (img, rawFile, currentMode, targetKBVal, currentQuality, currentFormat, currentScale) => {
      if (!img) return;

      try {
        let baseW = img.naturalWidth;
        let baseH = img.naturalHeight;

        // Apply scale factor
        if (currentScale < 100) {
          baseW = Math.max(16, Math.round((baseW * currentScale) / 100));
          baseH = Math.max(16, Math.round((baseH * currentScale) / 100));
        }

        // Cap max dimensions to prevent memory overflow
        if (Math.max(baseW, baseH) > MAX_CANVAS_DIMENSION) {
          const capScale = MAX_CANVAS_DIMENSION / Math.max(baseW, baseH);
          baseW = Math.round(baseW * capScale);
          baseH = Math.round(baseH * capScale);
        }

        const canvas = drawToCanvas(img, baseW, baseH);
        let outBlob;
        let qualityUsed = currentQuality;

        if (currentMode === 'target' && targetKBVal) {
          // Exact target KB compression with auto-stepping
          const res = await compressToTarget(canvas, targetKBVal, currentFormat);
          outBlob = res.blob;
          baseW = res.width;
          baseH = res.height;
        } else {
          // Manual slider compression
          if (currentFormat === 'image/png') {
            outBlob = await canvasToBlob(canvas, 'image/png');
          } else {
            const q = Math.max(0.01, Math.min(0.99, currentQuality / 100));
            outBlob = await canvasToBlob(canvas, currentFormat, q);
          }
        }

        if (result?.url) {
          URL.revokeObjectURL(result.url);
        }

        setResult({
          blob: outBlob,
          url: URL.createObjectURL(outBlob),
          width: baseW,
          height: baseH,
          qualityUsed,
        });
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to compress image.');
      }
    },
    [result]
  );

  // Reactive scroller / slider effect with fast 60ms debounce for silky performance
  useEffect(() => {
    if (!sourceImg || !file) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (processingRef.current) return;
      processingRef.current = true;
      setBusy(true);
      await runCompression(sourceImg, file, mode, targetSizeKB, quality, format, scalePercent);
      setBusy(false);
      processingRef.current = false;
    }, 60);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [mode, targetSizeKB, quality, format, scalePercent, sourceImg, file, runCompression]);

  // Derived statistics for display
  const stats = useMemo(() => {
    if (!file || !result?.blob) return null;

    const originalBytes = file.size;
    const compressedBytes = result.blob.size;
    const diffBytes = originalBytes - compressedBytes;
    const savingsPercent = originalBytes > 0
      ? Math.max(-999, Math.round(((originalBytes - compressedBytes) / originalBytes) * 1000) / 10)
      : 0;

    const targetBytes = (targetSizeKB || 1024) * 1024;
    const targetUsagePercent = Math.min(200, Math.round((compressedBytes / targetBytes) * 100));
    const isUnderTarget = compressedBytes <= targetBytes;
    const targetFormatted = targetSizeKB >= 1024
      ? `${(targetSizeKB / 1024).toFixed(targetSizeKB % 1024 === 0 ? 0 : 2)} MB`
      : `${targetSizeKB} KB`;

    return {
      originalBytes,
      compressedBytes,
      diffBytes,
      savingsPercent,
      targetUsagePercent,
      isUnderTarget,
      targetFormatted,
      targetBytes,
    };
  }, [file, result, targetSizeKB]);

  const handleDownload = () => {
    if (!result?.blob || !file) return;
    const ext = format === 'image/webp' ? 'webp' : format === 'image/png' ? 'png' : 'jpg';
    const targetTag = mode === 'target' ? `-${targetSizeKB}kb` : `-compressed`;
    const fileName = `${baseName(file.name)}${targetTag}.${ext}`;
    saveBlob(result.blob, fileName);
  };

  const resetAll = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setSourceImg(null);
    setResult(null);
    setPreviewUrl(null);
    setError(null);
  };

  return (
    <div className="tool-engine compress-modern-engine">
      {!file && (
        <div className="compress-drop-wrapper">
          <Dropzone
            onFiles={onFiles}
            accept="image/jpeg,image/png,image/webp,image/avif,image/heic"
            label="Drop any photo here to compress under 1 MB or custom size"
            hint="Supports JPG, PNG, WebP — Live slider & percentage calculation directly in your browser"
          />
          <div className="compress-quick-badges">
            <span>✨ 100% In-Browser Privacy</span>
            <span>⚡ Instant Live Slider</span>
            <span>📊 Exact Percentage & MB Readout</span>
          </div>
        </div>
      )}

      {file && (
        <div className="compress-workspace">
          {/* Top Control Bar */}
          <div className="compress-toolbar-card">
            {/* Mode Selector & Presets */}
            <div className="compress-toolbar-header">
              <div className="compress-mode-pills">
                <button
                  type="button"
                  className={`compress-pill-btn ${mode === 'target' ? 'active' : ''}`}
                  onClick={() => setMode('target')}
                >
                  <Sparkle weight="bold" size={16} /> Target Size Limit (MB / KB)
                </button>
                <button
                  type="button"
                  className={`compress-pill-btn ${mode === 'interactive' ? 'active' : ''}`}
                  onClick={() => setMode('interactive')}
                >
                  <SlidersHorizontal weight="bold" size={16} /> Live Quality Slider
                </button>
              </div>

              <button type="button" className="btn-ghost compress-reset-btn" onClick={resetAll}>
                <ArrowsClockwise size={14} /> Change Image
              </button>
            </div>

            {/* Target Size Presets & Scroller */}
            {mode === 'target' && (
              <div className="compress-control-group">
                <div className="compress-presets-row">
                  <span className="compress-control-label">Quick Limits:</span>
                  <div className="compress-preset-chips">
                    {PRESET_SIZES.map((p) => (
                      <button
                        key={p.kb}
                        type="button"
                        className={`compress-chip ${targetSizeKB === p.kb ? 'active' : ''}`}
                        onClick={() => setTargetSizeKB(p.kb)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="compress-slider-block">
                  <div className="compress-slider-header">
                    <label htmlFor="target-slider">
                      <strong>Target Size Scroller:</strong>{' '}
                      <span className="compress-slider-badge">
                        {targetSizeKB >= 1024
                          ? `${(targetSizeKB / 1024).toFixed(2)} MB (${targetSizeKB} KB)`
                          : `${targetSizeKB} KB`}
                      </span>
                    </label>
                    <span className="compress-slider-hint">Drag scroller to set exact file threshold</span>
                  </div>
                  <input
                    id="target-slider"
                    type="range"
                    min="10"
                    max="5120"
                    step="10"
                    value={targetSizeKB}
                    onChange={(e) => setTargetSizeKB(Number(e.target.value))}
                    className="compress-range-slider"
                  />
                  <div className="compress-range-ticks">
                    <span>20 KB</span>
                    <span>500 KB</span>
                    <span>1 MB (1024 KB)</span>
                    <span>2.5 MB</span>
                    <span>5 MB</span>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Quality Scroller */}
            {mode === 'interactive' && (
              <div className="compress-control-group">
                <div className="compress-slider-block">
                  <div className="compress-slider-header">
                    <label htmlFor="quality-slider">
                      <strong>Compression Quality Scroller:</strong>{' '}
                      <span className="compress-slider-badge">{quality}%</span>
                    </label>
                    <span className="compress-slider-hint">
                      {quality > 85 ? '🌟 Ultra High Quality' : quality > 60 ? '👌 Sweet Spot Balance' : '⚡ Max Compression'}
                    </span>
                  </div>
                  <input
                    id="quality-slider"
                    type="range"
                    min="5"
                    max="98"
                    step="1"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="compress-range-slider"
                  />
                  <div className="compress-range-ticks">
                    <span>5% (Smallest)</span>
                    <span>50% (Balanced)</span>
                    <span>80% (Recommended)</span>
                    <span>98% (Lossless-like)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Secondary Controls: Format & Scale */}
            <div className="compress-secondary-controls">
              <div className="compress-sub-control">
                <span className="compress-sub-label">Output Format:</span>
                <div className="compress-format-options">
                  <button
                    type="button"
                    className={`compress-format-btn ${format === 'image/jpeg' ? 'active' : ''}`}
                    onClick={() => setFormat('image/jpeg')}
                  >
                    JPG / JPEG
                  </button>
                  <button
                    type="button"
                    className={`compress-format-btn ${format === 'image/webp' ? 'active' : ''}`}
                    onClick={() => setFormat('image/webp')}
                  >
                    WebP (Extra -30%)
                  </button>
                  <button
                    type="button"
                    className={`compress-format-btn ${format === 'image/png' ? 'active' : ''}`}
                    onClick={() => setFormat('image/png')}
                  >
                    PNG
                  </button>
                </div>
              </div>

              <div className="compress-sub-control">
                <span className="compress-sub-label">Image Resolution:</span>
                <select
                  value={scalePercent}
                  onChange={(e) => setScalePercent(Number(e.target.value))}
                  className="compress-scale-select"
                >
                  <option value={100}>100% (Original Resolution)</option>
                  <option value={80}>80% Scale (Slightly Smaller)</option>
                  <option value={60}>60% Scale (Email & Web)</option>
                  <option value={50}>50% Scale (Half Size)</option>
                  <option value={30}>30% Scale (Thumbnail)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Real-time Status Gauge & Stats Dashboard */}
          {stats && (
            <div className="compress-dashboard">
              {/* Target Status Meter Bar */}
              <div
                className={`compress-meter-card ${
                  stats.isUnderTarget ? 'status-pass' : 'status-warn'
                }`}
              >
                <div className="compress-meter-header">
                  <div className="compress-meter-title">
                    {stats.isUnderTarget ? (
                      <span className="compress-status-pill pass">
                        <CheckCircle size={18} weight="fill" /> Fits Under {stats.targetFormatted} Limit
                      </span>
                    ) : (
                      <span className="compress-status-pill warn">
                        <Warning size={18} weight="fill" /> Exceeds {stats.targetFormatted} Limit
                      </span>
                    )}
                  </div>
                  <div className="compress-meter-val">
                    <strong>{formatBytes(stats.compressedBytes)}</strong> of{' '}
                    <span>{stats.targetFormatted}</span>
                  </div>
                </div>

                <div className="compress-meter-track">
                  <div
                    className="compress-meter-fill"
                    style={{
                      width: `${Math.min(100, stats.targetUsagePercent)}%`,
                      backgroundColor: stats.isUnderTarget ? 'var(--success, #10b981)' : 'var(--warning, #f59e0b)',
                    }}
                  />
                </div>
                <div className="compress-meter-footer">
                  <span>
                    Using <strong>{stats.targetUsagePercent}%</strong> of target limit
                  </span>
                  <span>
                    {stats.isUnderTarget
                      ? `Remaining headroom: ${formatBytes(Math.max(0, stats.targetBytes - stats.compressedBytes))}`
                      : `Needs reduction of: ${formatBytes(stats.compressedBytes - stats.targetBytes)}`}
                  </span>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="compress-stat-grid">
                <div className="compress-stat-box">
                  <span className="compress-stat-label">Original File Size</span>
                  <strong className="compress-stat-value">{formatBytes(stats.originalBytes)}</strong>
                  <span className="compress-stat-sub">
                    {originalDimensions.width} × {originalDimensions.height} px
                  </span>
                </div>

                <div className="compress-stat-box highlight">
                  <span className="compress-stat-label">New Compressed Size</span>
                  <strong className="compress-stat-value success">{formatBytes(stats.compressedBytes)}</strong>
                  <span className="compress-stat-sub">
                    {result ? `${result.width} × ${result.height} px` : 'Processing...'}
                  </span>
                </div>

                <div className="compress-stat-box">
                  <span className="compress-stat-label">Size Reduction</span>
                  <strong
                    className={`compress-stat-value ${
                      stats.savingsPercent > 0 ? 'success' : 'neutral'
                    }`}
                  >
                    {stats.savingsPercent > 0 ? `-${stats.savingsPercent}%` : `${stats.savingsPercent}%`}
                  </strong>
                  <span className="compress-stat-sub">
                    {stats.diffBytes > 0 ? `Saved ${formatBytes(stats.diffBytes)}` : 'Same size'}
                  </span>
                </div>

                <div className="compress-stat-box">
                  <span className="compress-stat-label">Target Compliance</span>
                  <strong
                    className={`compress-stat-value ${
                      stats.isUnderTarget ? 'success' : 'warn'
                    }`}
                  >
                    {stats.isUnderTarget ? 'PASSED ✅' : 'OVER LIMIT ⚠️'}
                  </strong>
                  <span className="compress-stat-sub">
                    Under {stats.targetFormatted}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Loader or Error */}
          {busy && (
            <div className="compress-inline-loader">
              <ArrowsClockwise size={20} className="spin" />
              <span>Optimizing image in real-time...</span>
            </div>
          )}
          {error && <div className="tool-error">{error}</div>}

          {/* Side-by-Side Visual Comparison */}
          {result && !busy && (
            <div className="compress-preview-container">
              <div className="compress-preview-header">
                <h3>Live Comparison</h3>
                <div className="compress-view-toggle">
                  <button
                    type="button"
                    className={`compress-view-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
                    onClick={() => setViewMode('side-by-side')}
                  >
                    <ArrowsOut size={14} /> Side by Side
                  </button>
                  <button
                    type="button"
                    className={`compress-view-btn ${viewMode === 'preview-only' ? 'active' : ''}`}
                    onClick={() => setViewMode('preview-only')}
                  >
                    <ArrowsIn size={14} /> Compressed Only
                  </button>
                </div>
              </div>

              <div className={`compress-preview-grid ${viewMode}`}>
                {viewMode === 'side-by-side' && (
                  <figure className="compress-figure original">
                    <div className="compress-figure-tag">Original Image</div>
                    <img src={previewUrl} alt="Original uploaded image" />
                    <figcaption>
                      <span>Size: <strong>{formatBytes(file.size)}</strong></span>
                      <span>{originalDimensions.width} × {originalDimensions.height} px</span>
                    </figcaption>
                  </figure>
                )}

                <figure className="compress-figure compressed">
                  <div className="compress-figure-tag success">
                    Compressed Image {stats?.savingsPercent > 0 ? `(-${stats.savingsPercent}%)` : ''}
                  </div>
                  <img src={result.url} alt="Compressed image output" />
                  <figcaption>
                    <span>Size: <strong className="text-success">{formatBytes(result.blob.size)}</strong></span>
                    <span>{result.width} × {result.height} px</span>
                  </figcaption>
                </figure>
              </div>

              {/* Download Action Bar */}
              <div className="compress-download-bar">
                <div className="compress-download-info">
                  <CheckCircle size={22} weight="fill" className="text-success" />
                  <div>
                    <strong>Ready to Download</strong>
                    <p>
                      Optimized to <strong>{formatBytes(result.blob.size)}</strong> ({stats?.savingsPercent}% space saved)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary compress-download-btn"
                  onClick={handleDownload}
                  disabled={busy}
                >
                  <DownloadSimple size={20} weight="bold" />
                  <span>
                    Download {format === 'image/webp' ? 'WebP' : format === 'image/png' ? 'PNG' : 'JPG'} ({formatBytes(result.blob.size)})
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
