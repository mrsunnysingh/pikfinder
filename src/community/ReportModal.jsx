// src/community/ReportModal.jsx
import React, { useState } from 'react';
import { X, WarningCircle, ShieldCheck } from '@phosphor-icons/react';
import { submitCommunityReport } from './communityService';
import { useToast } from '../components/Toast';

export default function ReportModal({ targetType = 'post', targetId, onClose }) {
  const toast = useToast();
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitCommunityReport({
        targetType,
        targetId,
        reason: `${reason}: ${details.trim()}`
      });
      toast('Thank you. Your report has been submitted to our moderation team.', 'success');
      onClose();
    } catch {
      toast('Failed to submit report. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pikcircle-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="pikcircle-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="pikcircle-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WarningCircle size={22} weight="fill" style={{ color: '#f59e0b' }} />
            <h3>Report Content</h3>
          </div>
          <button
            type="button"
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="pikcircle-form-group">
            <label className="pikcircle-form-label">Why are you reporting this {targetType}?</label>
            <select
              className="pikcircle-text-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="spam">Spam, advertising, or bot content</option>
              <option value="copyright">Copyright or unauthorized artwork repost</option>
              <option value="inappropriate">Inappropriate, explicit, or offensive imagery</option>
              <option value="harassment">Harassment or abusive behavior</option>
              <option value="misleading">Misleading or dangerous link</option>
              <option value="other">Other policy violation</option>
            </select>
          </div>

          <div className="pikcircle-form-group">
            <label className="pikcircle-form-label">Additional context (optional)</label>
            <textarea
              className="pikcircle-comment-textarea"
              style={{ minHeight: '90px' }}
              placeholder="Provide any details to help our moderators review this quickly..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn-outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
