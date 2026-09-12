'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function PaymentToast() {
  const params = useSearchParams();

  useEffect(() => {
    const payment = params.get('payment');
    if (payment === 'success') {
      toast.success('Payment successful! Your plan has been activated.');
      window.history.replaceState({}, '', '/shop');
    } else if (payment === 'failed') {
      toast.error('Payment failed. Please try again or use a different method.');
      window.history.replaceState({}, '', '/shop');
    } else if (payment === 'cancelled') {
      toast.info('Payment cancelled.');
      window.history.replaceState({}, '', '/shop');
    }
  }, [params]);

  return null;
}
