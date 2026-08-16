import React, { useContext, useState } from 'react';
import { Heart, DownloadSimple } from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';
import { useToast } from './Toast';

export default function ImageCard({ photo, onClick }) {
  const { isFavorite, toggleFavorite } = useContext(AppContext);
  const toast = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDownloading(true);
    
    const downloadUrl = photo.urls.full;
    const safeName = (photo.alt_description || 'pikfinder-image').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `pikfinder-${safeName}.jpg`;

    const saveBlob = (blob) => {
      const localObjUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = localObjUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(localObjUrl);
      a.remove();
    };

    try {
      // Strategy 1: Direct fetch (works for Wikimedia CORS-enabled URLs)
      const res = await fetch(downloadUrl, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        saveBlob(blob);
        toast('Downloaded successfully');
        return;
      }
      throw new Error('Direct fetch failed');
    } catch {
      try {
        // Strategy 2: CORS proxy
        const proxyRes = await fetch(`https://corsproxy.io/?${encodeURIComponent(downloadUrl)}`);
        if (proxyRes.ok) {
          const blob = await proxyRes.blob();
          saveBlob(blob);
          toast('Downloaded successfully');
          return;
        }
        throw new Error('Proxy fetch failed');
      } catch {
        // Strategy 3: Open in new tab (user can right-click → Save As)
        window.open(downloadUrl, '_blank');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(photo);
  };

  if (imageError) {
    return null; // Gracefully hide broken images
  }

  return (
    <div className="img-card" onClick={() => onClick(photo)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick(photo)}>
      <img 
        src={photo.urls.regular} 
        alt={photo.alt_description || 'Pikfinder Image'} 
        loading="lazy" 
        onError={() => setImageError(true)}
      />
      <div className="img-overlay">
        <div className="img-actions">
          <button 
            className={`icon-btn fav-btn ${isFavorite(photo.id) ? 'active' : ''}`} 
            onClick={handleFavoriteClick}
            title="Favorite"
            aria-label="Favorite image"
          >
            <Heart weight={isFavorite(photo.id) ? 'fill' : 'regular'} />
          </button>
          <button 
            className="icon-btn" 
            onClick={handleDownload}
            title="Direct Download"
            aria-label="Download image"
            style={{ pointerEvents: isDownloading ? 'none' : 'auto' }}
          >
            {isDownloading ? (
              <div className="spinner" style={{width: '20px', height: '20px', borderWidth: '2px', margin: 0}}></div>
            ) : (
              <DownloadSimple />
            )}
          </button>
        </div>
        <div className="img-info" onClick={(e) => e.stopPropagation()}>
          <img 
            src={photo.user.profile_image.medium} 
            alt={photo.user.name} 
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
          <p>{photo.user.name.substring(0,20)}{photo.user.name.length > 20 ? '...' : ''}</p>
          {photo.license && (
            <span className="license-badge" title={photo.license.shortName}>
              {photo.license.id}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
