'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { usePWA } from './PWAProvider';

export function InstallPWAButton() {
  const { canInstall, install } = usePWA();

  if (!canInstall) return null;

  return (
    <button
      onClick={install}
      className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-200/50 rounded-xl transition-all w-full text-left"
    >
      <Download size={20} />
      <span>Instalar App de Gestión</span>
    </button>
  );
}
