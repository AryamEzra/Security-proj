"use client";
import { useEffect, useState } from "react";


export default function ThemeToggle() {
  const [mode, setMode] = useState<'dark'|'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') setMode(stored);
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (mode === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', mode);
  }, [mode, mounted]);

  if (!mounted) return null;

  return (
    <button
      className="btn"
      onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')}
      title="Toggle theme"
    >
      {mode === 'dark' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
