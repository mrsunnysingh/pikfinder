import React from 'react';

// Catches unexpected runtime errors anywhere in the app and shows a calm,
// on-brand recovery screen instead of a blank white page.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surface for debugging; wire to an error tracker here if you add one.
    console.error('[PikFinder] Unhandled error:', error, info);

    // Auto-recover from stale-deploy chunk errors. After a redeploy, an old
    // cached page can reference JS chunks whose hashes changed, so a lazy route
    // fails to load and lands here. A single hard reload fetches fresh HTML +
    // chunks and fixes it. Guarded so we never loop.
    const msg = String((error && (error.message || error.name)) || '');
    const isChunkError = /ChunkLoadError|Loading chunk|dynamically imported module|Importing a module script failed|Failed to fetch dynamically imported/i.test(msg);
    try {
      if (isChunkError && !sessionStorage.getItem('pf-chunk-reloaded')) {
        sessionStorage.setItem('pf-chunk-reloaded', '1');
        window.location.reload();
      }
    } catch { /* sessionStorage unavailable — show the recovery screen */ }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error">
          <div className="app-error-card">
            <div className="app-error-glow" aria-hidden="true" />
            <div className="app-error-badge">!</div>
            <h1>Something went wrong</h1>
            <p>An unexpected error interrupted PikFinder. Reloading usually fixes it — your work isn’t lost.</p>
            <div className="app-error-actions">
              <button className="btn-primary" onClick={() => window.location.reload()}>Reload page</button>
              <a className="btn-outline" href="/">Go to homepage</a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
