import type { PropsWithChildren, ReactNode } from 'react';
import { useEffect } from 'react';

interface ModalProps extends PropsWithChildren {
  title: string;
  open: boolean;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  bodyUseBaseClass?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  onClose: () => void;
}

export function Modal({
  title,
  open,
  footer,
  className,
  bodyClassName,
  bodyUseBaseClass = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  onClose,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleEscape(event: KeyboardEvent) {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeOnEscape, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-root" role="presentation">
      <button
        aria-label="Close modal"
        className="modal-backdrop"
        type="button"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <section aria-modal="true" className={`modal-card${className ? ` ${className}` : ''}`} role="dialog">
        <header className="modal-card__header">
          <h2>{title}</h2>
        </header>
        <div className={`${bodyUseBaseClass ? 'modal-card__body' : ''}${bodyClassName ? `${bodyUseBaseClass ? ' ' : ''}${bodyClassName}` : ''}`}>{children}</div>
        {footer ? <footer className="modal-card__footer">{footer}</footer> : null}
      </section>
    </div>
  );
}
