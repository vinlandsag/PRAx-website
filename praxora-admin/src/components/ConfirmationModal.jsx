import React, { useEffect, useRef } from 'react';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08090D]/85 backdrop-blur-sm animate-fade-in"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        className="relative w-full max-w-md bg-[#0D1017] border border-[#252C3A] rounded-2xl shadow-2xl p-6 text-[#F3F5FA] overflow-hidden"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isDestructive
                ? 'bg-[#FF6B78]/15 text-[#FF6B78] border border-[#FF6B78]/30'
                : 'bg-[#F2BD69]/15 text-[#F2BD69] border border-[#F2BD69]/30'
            }`}
          >
            {isDestructive ? (
              <AlertCircle className="w-6 h-6" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            )}
          </div>

          <div className="flex-1">
            <h3 id="modal-title" className="text-lg font-semibold tracking-tight text-[#F3F5FA] font-display">
              {title}
            </h3>
            <p id="modal-description" className="mt-2 text-sm text-[#A0A8B8] leading-relaxed">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Close dialog"
            className="p-2 text-[#737E91] hover:text-[#F3F5FA] rounded-lg hover:bg-[#131722] transition-colors a11y-focus min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium border border-[#252C3A] bg-[#131722] hover:bg-[#191F2B] text-[#A0A8B8] hover:text-[#F3F5FA] transition-colors a11y-focus min-h-[44px] flex items-center justify-center"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold transition-all a11y-focus min-h-[44px] flex items-center justify-center ${
              isDestructive
                ? 'bg-[#FF6B78] hover:bg-[#ff828d] text-[#08090D] shadow-lg shadow-[#FF6B78]/20 font-bold'
                : 'bg-[#8B7CFF] hover:bg-[#9c90ff] text-white shadow-lg shadow-[#8B7CFF]/20'
            } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
