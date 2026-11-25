import { forwardRef, useId } from 'react';

/**
 * Labelled input with an inline, screen-reader-linked error message.
 * Works with react-hook-form's register() via forwardRef.
 */
const Field = forwardRef(function Field({ label, error, hint, className = '', ...props }, ref) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}</label>
      <input
        id={id}
        ref={ref}
        className={`input ${error ? 'input-error' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={[error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      {hint && !error && <p id={hintId} className="muted mt-1 text-xs">{hint}</p>}
      {error && <p id={errorId} className="field-error" role="alert">{error}</p>}
    </div>
  );
});

export default Field;
