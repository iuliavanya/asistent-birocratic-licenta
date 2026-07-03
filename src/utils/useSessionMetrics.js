import { useRef, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'asistent_birocratic_metrics';

function generateSessionId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function loadMetrics() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMetrics(metrics) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  } catch {}
}

export function useSessionMetrics(formName) {
  const sessionRef = useRef(null);
  const savedOnceRef = useRef(false);

  const ACTIVE_SESSION_KEY = `active_session_${formName}`;

  const saveActiveSession = useCallback(() => {
    if (!sessionRef.current) return;

    try {
      sessionStorage.setItem(
        ACTIVE_SESSION_KEY,
        JSON.stringify(sessionRef.current)
      );
    } catch {}
  }, [ACTIVE_SESSION_KEY]);

  const startSession = useCallback(() => {
    if (sessionRef.current) return;

    try {
      const existing = sessionStorage.getItem(ACTIVE_SESSION_KEY);

      if (existing) {
        sessionRef.current = JSON.parse(existing);
        return;
      }
    } catch {}

    const newSession = {
      sessionId: generateSessionId(),
      form: formName,
      startedAt: new Date().toISOString(),
      startTimestamp: Date.now(),
      validationErrors: 0,
      usedAIScan: false,
      completed: false,
    };

    sessionRef.current = newSession;

    try {
      sessionStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(newSession));
    } catch {}
  }, [formName, ACTIVE_SESSION_KEY]);

  // Porneste automat sesiunea cand se deschide formularul
  useEffect(() => {
    startSession();
  }, [startSession]);

  const saveProgress = useCallback(() => {
    if (!sessionRef.current) return;

    const session = sessionRef.current;
    const durationSeconds = Math.round(
      (Date.now() - session.startTimestamp) / 1000
    );

    const record = {
      sessionId: session.sessionId,
      form: session.form,
      startedAt: session.startedAt,
      durationSeconds,
      validationErrors: session.validationErrors,
      usedAIScan: session.usedAIScan,
      completed: false,
    };

    const all = loadMetrics();
    const idx = all.findIndex(m => m.sessionId === session.sessionId);

    if (idx >= 0) {
      all[idx] = record;
    } else {
      all.push(record);
    }

    saveMetrics(all);
    savedOnceRef.current = true;
  }, []);

  const trackFirstInput = useCallback(() => {
    startSession();
    saveActiveSession();
  }, [startSession, saveActiveSession]);

  const recordAIScan = useCallback(() => {
    if (!sessionRef.current) startSession();

    sessionRef.current.usedAIScan = true;
    saveActiveSession();
  }, [startSession, saveActiveSession]);

  const recordValidationError = useCallback(() => {
    if (!sessionRef.current) startSession();

    sessionRef.current.validationErrors += 1;
    saveActiveSession();
  }, [startSession, saveActiveSession]);

  // Salveaza ca nefinalizata doar la inchiderea paginii,
  // nu la navigare interna intre paginile aplicatiei.
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!sessionRef.current) return;
      if (sessionRef.current.completed) return;

      saveProgress();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveProgress]);

  const completeSession = useCallback(() => {
    if (!sessionRef.current) return;

    const session = sessionRef.current;
    session.completed = true;

    const durationSeconds = Math.round(
      (Date.now() - session.startTimestamp) / 1000
    );

    const record = {
      sessionId: session.sessionId,
      form: session.form,
      startedAt: session.startedAt,
      durationSeconds,
      validationErrors: session.validationErrors,
      usedAIScan: session.usedAIScan,
      completed: true,
    };

    const all = loadMetrics();
    const idx = all.findIndex(m => m.sessionId === session.sessionId);

    if (idx >= 0) {
      all[idx] = record;
    } else {
      all.push(record);
    }

    saveMetrics(all);

    try {
      sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch {}

    sessionRef.current = null;
    savedOnceRef.current = false;
  }, [ACTIVE_SESSION_KEY]);

  return {
    startSession,
    saveProgress,
    trackFirstInput,
    recordValidationError,
    recordAIScan,
    completeSession,
  };
}