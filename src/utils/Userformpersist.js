// Hook pentru salvarea progresului in sessionStorage
// Foloseste: const [formData, setFormData] = useFormPersist('cheie_unica', valoriInitiale)

import { useState, useEffect } from 'react';

export function useFormPersist(key, initialValues) {
  const [formData, setFormDataState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge cu initialValues ca sa adaugi campuri noi fara sa pierzi datele salvate
        return { ...initialValues, ...parsed };
      }
    } catch (e) {
      console.warn('useFormPersist: nu s-a putut citi din sessionStorage', e);
    }
    return initialValues;
  });

  const setFormData = (updater) => {
    setFormDataState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      try {
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch (e) {
        console.warn('useFormPersist: nu s-a putut salva in sessionStorage', e);
      }
      return next;
    });
  };

  const clearPersist = () => {
    try { sessionStorage.removeItem(key); } catch (e) {}
    setFormDataState(initialValues);
  };

  return [formData, setFormData, clearPersist];
}