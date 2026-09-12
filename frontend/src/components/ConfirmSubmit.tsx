'use client';

import { useState, useRef } from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmSubmit({
  message,
  className,
  children,
  confirmText,
  destructive = true,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
  confirmText?: string;
  destructive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [typed, setTyped] = useState('');

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const form = (e.target as HTMLElement).closest('form');
    formRef.current = form;
    setOpen(true);
    setTyped('');
  };

  const handleConfirm = () => {
    setOpen(false);
    if (formRef.current) formRef.current.requestSubmit();
  };

  const canConfirm = confirmText ? typed === confirmText : true;

  return (
    <>
      <button type="button" className={className} onClick={handleClick}>
        {children}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={confirmText ? 'Confirm Deletion' : 'Confirm Action'}>
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-sm text-gray-300 leading-relaxed pt-2">{message}</p>
        </div>

        {confirmText && (
          <div className="mb-5">
            <p className="text-xs text-gray-400 mb-2">
              Type <span className="text-red-400 font-bold">{confirmText}</span> to confirm:
            </p>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Enter name to confirm"
              className="w-full bg-bg border border-edge rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors"
              autoFocus
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm text-gray-400 border border-edge rounded-xl hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all ${
              canConfirm
                ? destructive
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'btn-gradient text-white'
                : 'bg-red-500/20 text-red-300/40 cursor-not-allowed blur-[1px] pointer-events-none'
            }`}
          >
            {confirmText ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </Modal>
    </>
  );
}
