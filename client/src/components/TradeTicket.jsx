import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { tradeService } from '../services';
import { getErrorMessage } from '../lib/api';
import { tradeSchema } from '../lib/schemas';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/formatCurrency';
import { Modal } from './ui/Overlay';
import Field from './ui/Field';
import { Spinner } from './ui/States';

/**
 * Order ticket. The estimate uses the quote on screen, but the SERVER fetches
 * the live price at execution, so the final fill can differ slightly.
 */
export default function TradeTicket({ quote, heldQuantity = 0, onExecuted }) {
  const setBalance = useAuthStore((s) => s.setBalance);
  const cash = useAuthStore((s) => s.user?.balance);
  const [review, setReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(tradeSchema), defaultValues: { side: 'BUY', quantity: 1 } });

  const side = watch('side');
  const quantity = Number(watch('quantity')) || 0;
  const estimate = quantity * quote.price;
  const isUsd = quote.currency !== 'INR';

  const onReview = (values) => {
    if (values.side === 'SELL' && values.quantity > heldQuantity) {
      setError('quantity', { message: `You hold ${heldQuantity} share${heldQuantity === 1 ? '' : 's'}` });
      return;
    }
    if (values.side === 'BUY' && !isUsd && typeof cash === 'number' && values.quantity * quote.price > cash) {
      setError('quantity', { message: `This costs about ${formatCurrency(values.quantity * quote.price, 'INR')}, but you have ${formatCurrency(cash, 'INR')}` });
      return;
    }
    setReview(values);
  };

  const execute = async () => {
    setSubmitting(true);
    try {
      const result = await tradeService.place(quote.symbol, review.side, review.quantity);
      const t = result.trade;
      setBalance(t.balanceAfter);
      toast.success(
        `${t.side === 'BUY' ? 'Bought' : 'Sold'} ${t.quantity} ${t.symbol} @ ${formatCurrency(t.price, t.currency)} · ${formatCurrency(t.amountInr, 'INR')}`
      );
      setReview(null);
      reset({ side: review.side, quantity: 1 });
      onExecuted?.(result);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Trade failed'));
      setReview(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title mb-4">Place a paper trade</h2>
      <form onSubmit={handleSubmit(onReview)} className="space-y-4" noValidate>
        <div className="tab-list w-full" role="radiogroup" aria-label="Order side">
          {['BUY', 'SELL'].map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={side === s}
              onClick={() => setValue('side', s, { shouldValidate: true })}
              className={`tab flex-1 ${side === s ? 'tab-active' : ''}`}
            >
              {s === 'BUY' ? 'Buy' : 'Sell'}
            </button>
          ))}
        </div>
        <input type="hidden" {...register('side')} />

        <Field
          label="Quantity (shares)"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          error={errors.quantity?.message}
          hint={side === 'SELL' ? `You hold ${heldQuantity}` : undefined}
          {...register('quantity')}
        />

        <dl className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
          <div className="flex justify-between"><dt className="muted">Market price</dt><dd className="tabular">{formatCurrency(quote.price, quote.currency)}</dd></div>
          <div className="flex justify-between font-semibold"><dt>Estimated {side === 'BUY' ? 'cost' : 'proceeds'}</dt><dd className="tabular">{formatCurrency(estimate, quote.currency)}</dd></div>
          {isUsd && <p className="muted text-xs">Settled in ₹ at the live USD/INR rate when the order executes.</p>}
          <div className="flex justify-between"><dt className="muted">Cash available</dt><dd className="tabular">{formatCurrency(cash, 'INR')}</dd></div>
        </dl>

        <button type="submit" className={`${side === 'BUY' ? 'btn-buy' : 'btn-sell'} w-full`}>
          Review {side === 'BUY' ? 'buy' : 'sell'} order
        </button>
      </form>

      <Modal open={Boolean(review)} onClose={() => !submitting && setReview(null)} title="Confirm order" size="max-w-sm">
        {review && (
          <div className="space-y-4">
            <p className="text-sm">
              {review.side === 'BUY' ? 'Buy' : 'Sell'} <strong>{review.quantity}</strong> share{review.quantity === 1 ? '' : 's'} of{' '}
              <strong>{quote.symbol}</strong> at the live market price (about {formatCurrency(review.quantity * quote.price, quote.currency)}).
            </p>
            <p className="muted text-xs">The server fetches the price at execution; the final amount may differ slightly. Virtual money only.</p>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setReview(null)} disabled={submitting}>Cancel</button>
              <button type="button" className={`${review.side === 'BUY' ? 'btn-buy' : 'btn-sell'} flex-1`} onClick={execute} disabled={submitting}>
                {submitting && <Spinner size={14} />} Confirm
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
