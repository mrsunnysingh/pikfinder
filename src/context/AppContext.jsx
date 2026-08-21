import React, { createContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc, runTransaction } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db, googleProvider, isFirebaseConfigured } from '../firebase';
import { useToast } from '../components/Toast';

const NO_FIREBASE = () => {
  throw new Error(
    'Auth is unavailable — Firebase is not configured. Add your VITE_FIREBASE_* keys to .env and restart the dev server.'
  );
};

// The owner's Firebase uid (set VITE_ADMIN_UID in Vercel). Used to auto-unlock
// every premium feature for the site owner.
const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || '';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const [theme, setTheme] = useState(() => {
    if (typeof localStorage !== 'undefined') return localStorage.getItem('pf-theme') || 'system';
    return 'system';
  });

  // Apply + persist theme.
  useEffect(() => {
    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    try { localStorage.setItem('pf-theme', theme); } catch { /* ignore */ }

    // Listen for system changes if system mode is active
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => {
      if (t === 'dark') return 'light';
      if (t === 'light') return 'system';
      return 'dark';
    });
  };

  // Creates the user's Firestore profile doc if it doesn't already exist.
  // Wrapped so a Firestore hiccup can never block login itself.
  const ensureUserDoc = async (fbUser) => {
    try {
      const ref = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          name: fbUser.displayName || 'User',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || '',
          favorites: [],
          searchHistory: [],
          downloadHistory: [],
          createdAt: serverTimestamp(),
        });
        return { favorites: [], searchHistory: [], downloadHistory: [] };
      }
      return snap.data();
    } catch (err) {
      // Firestore not enabled / rules blocking / offline — log in anyway.
      console.warn('Could not load Firestore profile (login still succeeds):', err?.message || err);
      return null;
    }
  };

  // Listen to Auth State
  useEffect(() => {
    // No Firebase config? Skip auth entirely so the rest of the app still
    // renders. Users see the logged-out UI; any auth action shows a toast.
    if (!isFirebaseConfigured) {
      setIsLoggedIn(false);
      setAuthReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Enforce email verification for password sign-ups. Google/other
        // providers set emailVerified=true, so they're unaffected.
        const isPasswordUser = currentUser.providerData?.some(p => p.providerId === 'password');
        if (isPasswordUser && !currentUser.emailVerified) {
          setIsLoggedIn(false);
          setUser(null);
          setFavorites([]); setSearchHistory([]); setDownloadHistory([]);
          setAuthReady(true);
          return;
        }
        setIsLoggedIn(true);
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          name: currentUser.displayName || 'User',
          photoURL: currentUser.photoURL || '',
          username: '',
          newsletter: false,
          providers: currentUser.providerData?.map(p => p.providerId) || [],
        });
        const data = await ensureUserDoc(currentUser);
        // If Auth profile hasn't propagated yet, use the Firestore values.
        if (data) {
          // Premium is active only if the flag is set AND the paid period hasn't
          // lapsed. This enforces the subscription expiry stored at payment time,
          // so a monthly plan doesn't grant Pro forever.
          const periodEnd = data.subscription?.currentPeriodEnd;
          const notExpired = !periodEnd || new Date(periodEnd).getTime() > Date.now();
          // The site owner (ADMIN_UID) always has every premium feature unlocked,
          // no purchase or expiry required.
          const isOwner = !!ADMIN_UID && currentUser.uid === ADMIN_UID;
          const premiumActive = isOwner || (!!data.isPremium && notExpired);
          setUser(prev => ({
            ...prev,
            name: currentUser.displayName || data.name || prev.name,
            photoURL: currentUser.photoURL || data.photoURL || prev.photoURL,
            username: data.username || `user${currentUser.uid.slice(0, 8)}`,
            newsletter: !!data.newsletter,
            isAdmin: isOwner,
            isPremium: premiumActive,
            stripeCustomerId: data.stripeCustomerId || null,
            subscription: data.subscription || null,
          }));
        }
        setFavorites(data?.favorites || []);
        setSearchHistory(data?.searchHistory || []);
        setDownloadHistory(data?.downloadHistory || []);
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setFavorites([]);
        setSearchHistory([]);
        setDownloadHistory([]);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const toggleAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(!isAuthModalOpen);
  };

  const loginUser = async (email, password) => {
    if (!isFirebaseConfigured) { toast('Auth is disabled — add Firebase keys to .env', 'error'); NO_FIREBASE(); }
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (!cred.user.emailVerified) {
      await signOut(auth);
      const err = new Error('Please verify your email first.');
      err.code = 'auth/email-not-verified';
      throw err;
    }
    setIsAuthModalOpen(false);
    toast('Logged in successfully');
  };

  const signupUser = async (name, email, password) => {
    if (!isFirebaseConfigured) { toast('Auth is disabled — add Firebase keys to .env', 'error'); NO_FIREBASE(); }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    // Seed the Firestore profile so the dashboard has data immediately.
    await ensureUserDoc({ ...userCredential.user, displayName: name });
    // Send a verification email, then sign out so access requires verification.
    await sendEmailVerification(userCredential.user);
    await signOut(auth);
    toast('Account created — check your email to verify', 'info');
    return { needsVerification: true };
  };

  // Re-authenticate briefly to resend a verification email, then sign out again.
  const resendVerification = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);
    await signOut(auth);
  };

  const googleLogin = async () => {
    if (!isFirebaseConfigured) { toast('Auth is disabled — add Firebase keys to .env', 'error'); NO_FIREBASE(); }
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserDoc(result.user);
    setIsAuthModalOpen(false);
    toast('Signed in with Google');
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logoutUser = async () => {
    // Clear sensitive in-memory state immediately (defense-in-depth), so it's
    // gone even before the auth listener fires — matters on shared devices.
    setFavorites([]); setSearchHistory([]); setDownloadHistory([]);
    try {
      if (isFirebaseConfigured) await signOut(auth);
      else { setIsLoggedIn(false); setUser(null); }
      toast('You have been logged out', 'info');
    } finally {
      // Navigate instantly within React to avoid 404 flashes on logout
      navigate('/', { replace: true });
    }
  };

  // Persist a partial patch to the user's Firestore doc (best-effort).
  const persist = async (patch) => {
    if (!user?.uid) return;
    try {
      await setDoc(doc(db, 'users', user.uid), patch, { merge: true });
    } catch (err) {
      console.warn('Sync to Firestore failed:', err?.message || err);
    }
  };

  // Update display name and/or avatar (Firebase Auth + Firestore + local state).
  const updateUserProfile = async ({ name, photoURL }) => {
    if (!auth.currentUser) return;
    const authUpdates = {};
    if (name !== undefined) authUpdates.displayName = name;
    if (photoURL !== undefined) authUpdates.photoURL = photoURL;
    await updateProfile(auth.currentUser, authUpdates);
    setUser(prev => ({
      ...prev,
      name: name !== undefined ? name : prev.name,
      photoURL: photoURL !== undefined ? photoURL : prev.photoURL,
    }));
    const patch = {};
    if (name !== undefined) patch.name = name;
    if (photoURL !== undefined) patch.photoURL = photoURL;
    await persist(patch);
    toast('Profile updated');
  };

  // Save extra profile fields (newsletter preference) to Firestore.
  // NOTE: username is handled by claimUsername() so it stays globally unique.
  const saveExtras = async ({ username, newsletter }) => {
    const patch = {};
    if (username !== undefined) patch.username = username;
    if (newsletter !== undefined) patch.newsletter = newsletter;
    setUser(prev => ({ ...prev, ...patch }));
    await persist(patch);
  };

  // Claim a globally-unique username. Uses a `usernames/{name}` reservation doc
  // (id = the lowercased handle) inside a transaction so two people can't grab
  // the same handle. Throws with err.code 'username/taken' | 'username/too-short'
  // | 'username/invalid'. Returns the normalized handle on success.
  const claimUsername = async (raw) => {
    const uid = auth.currentUser?.uid;
    if (!uid) { const e = new Error('not signed in'); e.code = 'username/not-signed-in'; throw e; }
    const name = String(raw || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!name) { const e = new Error('empty'); e.code = 'username/invalid'; throw e; }
    if (name.length < 3) { const e = new Error('too short'); e.code = 'username/too-short'; throw e; }
    const prev = String(user?.username || '').toLowerCase();
    if (name === prev) return name; // no change

    await runTransaction(db, async (tx) => {
      const ref = doc(db, 'usernames', name);
      const snap = await tx.get(ref);
      if (snap.exists() && snap.data().uid !== uid) {
        const e = new Error('taken'); e.code = 'username/taken'; throw e;
      }
      tx.set(ref, { uid });                                      // reserve the new handle
      tx.set(doc(db, 'users', uid), { username: name }, { merge: true });
      if (prev && prev !== name) tx.delete(doc(db, 'usernames', prev)); // release the old one
    });
    setUser(prev2 => ({ ...prev2, username: name }));
    return name;
  };

  // Permanently delete the account (Firestore doc + Auth user).
  const deleteAccount = async () => {
    const current = auth.currentUser;
    if (!current) return;
    try {
      await deleteDoc(doc(db, 'users', current.uid));
    } catch { /* doc may not exist */ }
    await deleteUser(current); // may throw auth/requires-recent-login
    toast('Your account has been deleted', 'info');
  };

  const toggleFavorite = async (photo) => {
    if (!isLoggedIn) {
      toggleAuthModal('signup');
      return;
    }
    const exists = favorites.find(p => p.id === photo.id);
    const newFavorites = exists
      ? favorites.filter(p => p.id !== photo.id)
      : [...favorites, photo];
    setFavorites(newFavorites);
    persist({ favorites: newFavorites });
    toast(exists ? 'Removed from favorites' : 'Added to favorites', 'info');
  };

  const isFavorite = (id) => favorites.some(p => p.id === id);

  // Records a search term in the user's history (most recent first, de-duped).
  const logSearch = (term) => {
    const t = (term || '').trim();
    if (!t || !isLoggedIn) return;
    const newHistory = [t, ...searchHistory.filter(s => s.toLowerCase() !== t.toLowerCase())].slice(0, 20);
    setSearchHistory(newHistory);
    persist({ searchHistory: newHistory });
  };

  // Records a downloaded image in the user's history.
  const logDownload = (photo) => {
    if (!photo || !isLoggedIn) return;
    const entry = { id: photo.id, url: photo.urls?.regular || photo.urls?.full, alt: photo.alt_description || '', at: Date.now() };
    const newHistory = [entry, ...downloadHistory.filter(d => d.id !== photo.id)].slice(0, 30);
    setDownloadHistory(newHistory);
    persist({ downloadHistory: newHistory });
  };

  return (
    <AppContext.Provider value={{
      isLoggedIn, authReady, user,
      loginUser, signupUser, googleLogin, resetPassword, resendVerification, logoutUser,
      favorites, toggleFavorite, isFavorite,
      searchHistory, logSearch,
      downloadHistory, logDownload,
      isAuthModalOpen, setIsAuthModalOpen, toggleAuthModal,
      authMode, setAuthMode,
      theme, toggleTheme, updateUserProfile, saveExtras, claimUsername, deleteAccount
    }}>
      {children}
    </AppContext.Provider>
  );
};
