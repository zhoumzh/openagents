'use client';

import * as React from 'react';

export async function copyTextToClipboard(value: string): Promise<boolean> {
  if (typeof window === 'undefined' || !value) {
    return false;
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to execCommand-based copy for browsers or contexts
      // where clipboard permissions are denied.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

export function useCopyToClipboard({
  timeout = 2000,
  onCopy,
}: {
  timeout?: number;
  onCopy?: () => void;
} = {}) {
  const [isCopied, setIsCopied] = React.useState(false);

  const copyToClipboard = async (value: string) => {
    const copied = await copyTextToClipboard(value);
    if (!copied) return false;

    setIsCopied(true);

    if (onCopy) {
      onCopy();
    }

    setTimeout(() => {
      setIsCopied(false);
    }, timeout);

    return true;
  };

  return { isCopied, copyToClipboard };
}
