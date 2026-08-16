import React, { useState } from 'react';
import { Copy, Check, DownloadSimple } from '@phosphor-icons/react';
import { Dropzone, saveBlob } from '../ToolShell';

const LANGUAGES = [
  { id: 'eng', label: 'English' },
  { id: 'spa', label: 'Spanish' },
  { id: 'fra', label: 'French' },
  { id: 'deu', label: 'German' },
  { id: 'por', label: 'Portuguese' },
  { id: 'ita', label: 'Italian' },
  { id: 'nld', label: 'Dutch' },
  { id: 'hin', label: 'Hindi' },
  { id: 'ara', label: 'Arabic' },
  { id: 'chi_sim', label: 'Chinese (Simplified)' },
  { id: 'jpn', label: 'Japanese' },
  { id: 'kor', label: 'Korean' },
];

export default function OcrEngine() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [lang, setLang] = useState('eng');
  const [text, setText] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const run = async (f, language) => {
    setError(null);
    setText(null);
    setProgress('Loading OCR engine...');
    try {
      const Tesseract = await import('tesseract.js');
      const result = await Tesseract.recognize(f, language, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(`Reading text... ${Math.round(m.progress * 100)}%`);
          } else if (m.status) {
            setProgress(`${m.status.charAt(0).toUpperCase()}${m.status.slice(1)}...`);
          }
        },
      });
      setText(result.data.text.trim() || '');
    } catch (e) {
      console.error('[v0] OCR failed:', e);
      setError('Text recognition failed. Try a clearer image or a different language.');
    } finally {
      setProgress(null);
    }
  };

  const onFiles = ([f]) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    run(f, lang);
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="tool-engine">
      <div className="tool-controls">
        <label className="tool-control">
          <span>Language</span>
          <select value={lang} onChange={(e) => { setLang(e.target.value); if (file) run(file, e.target.value); }}>
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </label>
      </div>

      {!file && (
        <Dropzone
          onFiles={onFiles}
          label="Drop a photo, screenshot, or scan here"
          hint="Clear, high-contrast text works best. First run downloads a language model (~15MB)."
        />
      )}

      {progress && <div className="loader"><div className="spinner"></div><p>{progress}</p></div>}
      {error && <p className="tool-error">{error}</p>}

      {file && text !== null && (
        <>
          <div className="tool-compare">
            <figure>
              <img src={previewUrl} alt="OCR source" />
              <figcaption>{file.name}</figcaption>
            </figure>
            <div className="tool-ocr-output">
              {text ? (
                <textarea readOnly value={text} rows={12} aria-label="Extracted text" />
              ) : (
                <p className="tool-note">No text detected. Try a clearer image or check the language setting.</p>
              )}
            </div>
          </div>

          {text && (
            <div className="tool-controls">
              <button className="btn-primary" onClick={copyText}>
                {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy text'}
              </button>
              <button className="btn-secondary" onClick={() => saveBlob(new Blob([text], { type: 'text/plain' }), 'extracted-text.txt')}>
                <DownloadSimple /> Download .txt
              </button>
              <button className="btn-ghost" onClick={() => { setFile(null); setText(null); }}>
                Choose a different image
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
