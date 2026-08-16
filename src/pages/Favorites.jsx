import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, TrashSimple } from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';
import ImageModal from '../components/ImageModal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } },
};

export default function Favorites() {
  const { isLoggedIn, favorites, toggleFavorite, toggleAuthModal } = useContext(AppContext);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!isLoggedIn) {
    return (
      <>
        <header className="page-header">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Heart size={56} weight="duotone" color="var(--accent)" style={{ marginBottom: '16px' }} />
            <h1>Your Favorites</h1>
            <p>Sign in to save and access your favorite images across devices.</p>
            <button
              className="btn-primary"
              style={{ marginTop: '24px' }}
              onClick={() => toggleAuthModal('login')}
            >
              Log In to View Favorites
            </button>
          </motion.div>
        </header>
      </>
    );
  }

  return (
    <>
      <header className="page-header">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Your Favorites
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {favorites.length === 0
            ? 'You haven\'t saved any images yet. Start exploring!'
            : `${favorites.length} curated image${favorites.length !== 1 ? 's' : ''} saved.`}
        </motion.p>
      </header>

      {favorites.length > 0 ? (
        <motion.div
          className="favorites-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {favorites.map((photo) => (
              <motion.div
                key={photo.id}
                className="img-card fav-card"
                variants={cardVariants}
                exit="exit"
                layout
                onClick={() => setSelectedPhoto(photo)}
              >
                <img src={photo.urls.regular} alt={photo.alt_description} loading="lazy" />
                <div className="img-overlay">
                  <div className="img-actions">
                    <button
                      className="icon-btn fav-btn active"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(photo);
                      }}
                      title="Remove from Favorites"
                    >
                      <TrashSimple weight="bold" />
                    </button>
                  </div>
                  <div className="img-info">
                    <img src={photo.user.profile_image.medium} alt={photo.user.name} />
                    <p>{photo.user.name.substring(0, 20)}{photo.user.name.length > 20 ? '...' : ''}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          style={{ textAlign: 'center', padding: '40px 5% 80px', color: 'var(--text-muted)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Heart size={80} weight="thin" style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p>Browse images on the Discover page and click the ♥ button to save them here.</p>
        </motion.div>
      )}

      {selectedPhoto && (
        <ImageModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </>
  );
}
