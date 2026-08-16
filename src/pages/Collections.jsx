import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Plus, FolderSimple, Trash, X, Check, SignIn } from '@phosphor-icons/react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AppContext } from '../context/AppContext';
import { useSeo } from '../hooks/useSeo';
import { SITE_URL } from '../tools/registry';

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const card = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const COLLECTIONS = [
  { title: 'SaaS Hero Images', query: 'saas startup dashboard', img: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=800&auto=format&fit=crop', span: 'wide' },
  { title: 'Startup Team Photos', query: 'business team office', img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop' },
  { title: 'Modern Office', query: 'modern office interior', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop' },
  { title: 'Healthcare', query: 'healthcare medical', img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop' },
  { title: 'Product Mockups', query: 'product mockup device', img: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?q=80&w=800&auto=format&fit=crop', span: 'wide' },
  { title: 'Construction Assets', query: 'construction site building', img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop' },
  { title: 'Travel Marketing', query: 'travel destination landscape', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop' },
  { title: 'Education', query: 'education classroom learning', img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop' },
  { title: 'Abstract Textures', query: 'abstract gradient background', img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop' },
];

export default function Collections() {
  const navigate = useNavigate();
  const { user, toggleAuthModal } = useContext(AppContext);
  const [params, setParams] = useSearchParams();
  const [mine, setMine] = useState([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Live-sync the signed-in user's collections from Firestore (server-saved).
  useEffect(() => {
    if (!user || !db) { setMine([]); return; }
    const q = query(collection(db, 'users', user.uid, 'collections'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => setMine(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setMine([]));
    return unsub;
  }, [user]);

  // The header/dashboard "Create a collection" action deep-links here with ?create=1.
  useEffect(() => {
    if (params.get('create') !== '1') return;
    if (user) setCreating(true); else toggleAuthModal('login');
    params.delete('create'); setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const createCollection = async () => {
    const n = name.trim();
    if (!n) return;
    if (!user || !db) { toggleAuthModal('login'); return; }
    setBusy(true); setErr('');
    try {
      await addDoc(collection(db, 'users', user.uid, 'collections'), { name: n, items: [], createdAt: serverTimestamp() });
      setName(''); setCreating(false);
    } catch (e) {
      console.error(e);
      setErr(e?.code === 'permission-denied'
        ? 'Couldn’t save — the database permissions need updating. Please try again shortly.'
        : 'Couldn’t save your collection. Please check your connection and try again.');
    } finally { setBusy(false); }
  };
  const deleteCollection = async (id) => {
    if (!user || !db) return;
    try { await deleteDoc(doc(db, 'users', user.uid, 'collections', id)); } catch (e) { console.error(e); }
  };

  useSeo({
    title: 'Curated Collections — Free Design Asset Sets | PikFinder',
    description: 'Hand-picked collections of free-to-use images with clear licensing for SaaS, business, healthcare, travel, education and more. Click a collection to browse matching assets.',
    canonical: `${SITE_URL}/collections`,
  });

  // Both logged-in (dashboard) and logged-out visitors have a /search route.
  const open = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <header className="page-header" style={{ paddingBottom: '40px' }}>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          Curated Collections
        </motion.h1>
        <p>Hand-picked, ready-to-use asset sets for every kind of project.</p>
      </header>

      {/* Your collections */}
      <section className="my-collections">
        <div className="my-collections-head">
          <h2>Your collections</h2>
          {!creating && <button className="btn-primary" onClick={() => (user ? setCreating(true) : toggleAuthModal('login'))} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, fontSize: 14 }}><Plus weight="bold" /> New collection</button>}
        </div>

        {creating && user && (
          <div className="my-collections-create">
            <input
              autoFocus type="text" value={name} maxLength={60}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createCollection(); if (e.key === 'Escape') { setCreating(false); setName(''); } }}
              placeholder="Collection name…"
            />
            <button className="btn-primary" onClick={createCollection} disabled={!name.trim() || busy} aria-label="Create"><Check weight="bold" /></button>
            <button className="btn-outline" onClick={() => { setCreating(false); setName(''); setErr(''); }} aria-label="Cancel"><X /></button>
          </div>
        )}
        {err && <p className="my-collections-error" role="alert">{err}</p>}

        {!user ? (
          <div className="my-collections-signin">
            <FolderSimple size={30} weight="duotone" />
            <p>Sign in to create collections and save them to your account.</p>
            <button className="btn-primary" onClick={() => toggleAuthModal('login')}><SignIn size={16} /> Sign in</button>
          </div>
        ) : mine.length > 0 ? (
          <div className="my-collections-grid">
            {mine.map((c) => (
              <div key={c.id} className="my-collection-card">
                <button className="my-collection-open" onClick={() => navigate('/favorites')} title="Open collection">
                  <FolderSimple size={26} weight="duotone" />
                  <span className="my-collection-name">{c.name}</span>
                  <span className="my-collection-count">{(c.items || []).length} items</span>
                </button>
                <button className="my-collection-del" onClick={() => deleteCollection(c.id)} title="Delete collection" aria-label="Delete"><Trash size={15} /></button>
              </div>
            ))}
          </div>
        ) : (
          !creating && <p className="my-collections-empty">You haven’t created any collections yet. Create one to organize your saved media.</p>
        )}
      </section>

      <motion.div className="collections-grid" variants={container} initial="hidden" animate="visible" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px', padding: '0 5% 100px', maxWidth: '1600px', margin: '0 auto' }}>
        {COLLECTIONS.map((c) => (
          <motion.button
            key={c.title}
            className={`collection-card ${c.span === 'wide' ? 'span-wide' : ''}`}
            variants={card}
            whileHover={{ y: -6 }}
            onClick={() => open(c.query)}
            style={{ 
              backgroundImage: `url(${c.img})`,
              position: 'relative', borderRadius: '24px', overflow: 'hidden', height: '300px',
              backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer',
              gridColumn: c.span === 'wide' ? 'span 2' : 'span 1'
            }}
          >
            <div className="collection-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(5,5,16,0.4) 0%, rgba(139,92,246,0.3) 100%)', transition: 'all 0.3s' }} />
            <div className="collection-content" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 700, textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>{c.title}</h3>
              <span className="collection-cta" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '1rem', fontWeight: 600, background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '50px', backdropFilter: 'blur(8px)' }}>Explore <ArrowRight weight="bold" /></span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </>
  );
}
