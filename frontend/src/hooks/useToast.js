import { useState, useCallback } from 'react';

let toastId = 0;

export const useToast = () => {
  // We'll use a global event emitter pattern to avoid prop drilling
  // But for simplicity, we implement via context in ToastContainer
  // This hook just returns a function to dispatch events
  const showToast = useCallback((message, type = 'info') => {
    window.dispatchEvent(new CustomEvent('toast', { 
      detail: { id: ++toastId, message, type } 
    }));
  }, []);

  return { showToast };
};