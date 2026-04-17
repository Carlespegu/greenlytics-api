import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

interface DropdownRenderProps {
  isOpen: boolean;
}

interface DropdownContentRenderProps extends DropdownRenderProps {
  close: () => void;
}

interface DropdownProps {
  align?: 'left' | 'right';
  className?: string;
  open?: boolean;
  onOpenChange?: (nextOpen: boolean) => void;
  panelClassName?: string;
  triggerClassName?: string;
  trigger: ReactNode | ((props: DropdownRenderProps) => ReactNode);
  children: ReactNode | ((props: DropdownContentRenderProps) => ReactNode);
}

export function Dropdown({
  align = 'left',
  className,
  open,
  onOpenChange,
  panelClassName,
  triggerClassName,
  trigger,
  children,
}: DropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const isOpen = open ?? uncontrolledOpen;

  function setIsOpen(nextOpen: boolean | ((current: boolean) => boolean)) {
    const resolvedOpen = typeof nextOpen === 'function' ? nextOpen(isOpen) : nextOpen;

    if (open === undefined) {
      setUncontrolledOpen(resolvedOpen);
    }

    onOpenChange?.(resolvedOpen);
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function close() {
    setIsOpen(false);
  }

  const renderedTrigger = typeof trigger === 'function' ? trigger({ isOpen }) : trigger;
  const renderedChildren = typeof children === 'function' ? children({ isOpen, close }) : children;

  return (
    <div className={`dropdown dropdown--${align}${className ? ` ${className}` : ''}`} ref={rootRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`dropdown__trigger${triggerClassName ? ` ${triggerClassName}` : ''}`}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        {renderedTrigger}
      </button>

      {isOpen ? <div className={`dropdown__panel${panelClassName ? ` ${panelClassName}` : ''}`}>{renderedChildren}</div> : null}
    </div>
  );
}
