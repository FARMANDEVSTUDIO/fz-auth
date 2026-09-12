'use client';

import { useRef } from 'react';

export default function ColorPickerSync({
  defaultColor,
}: {
  defaultColor: string;
}) {
  const textRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      <input
        ref={pickerRef}
        type="color"
        defaultValue={defaultColor || '#8b5cf6'}
        className="w-10 h-10 rounded-lg border border-edge cursor-pointer bg-transparent p-0.5"
        onChange={(e) => {
          if (textRef.current) {
            textRef.current.value = e.target.value;
            // Trigger input event for BrandingPreview
            textRef.current.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }}
      />
      <input
        ref={textRef}
        type="text"
        name="accent_color"
        defaultValue={defaultColor || ''}
        placeholder="#8b5cf6"
        pattern="^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"
        maxLength={7}
        className="flex-1 bg-bg border border-edge rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-accent transition-colors"
        onChange={(e) => {
          if (pickerRef.current && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(e.target.value)) {
            pickerRef.current.value = e.target.value;
          }
        }}
      />
    </div>
  );
}
