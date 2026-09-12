'use client';

import { useRef, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { fireConfetti } from '@/lib/confetti';

type ActionResult = { ok: boolean; message: string } | void;

/**
 * Form wrapper that shows toast notifications based on the server action result.
 * If the action returns { ok, message }, shows success/error toast accordingly.
 */
export default function ActionForm({
  action,
  className,
  children,
  resetOnSuccess = false,
  celebrate = false,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  className?: string;
  children: React.ReactNode;
  resetOnSuccess?: boolean;
  celebrate?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className={`${className || ''} ${pending ? 'opacity-60 pointer-events-none' : ''}`}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            const res = await action(fd);
            if (res) {
              if (res.ok) {
                toast.success(res.message);
                if (celebrate) fireConfetti();
                if (resetOnSuccess) formRef.current?.reset();
              } else {
                toast.error(res.message);
              }
            }
          } catch {
            toast.error('Something went wrong. Please try again.');
          }
        });
      }}
    >
      {children}
      {pending && (
        <span className="inline-flex items-center ms-2">
          <Loader2 className="w-4 h-4 text-accent animate-spin" />
        </span>
      )}
    </form>
  );
}
