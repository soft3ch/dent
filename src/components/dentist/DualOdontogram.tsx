 'use client';
 import React, { useState } from 'react';
 import VisualOdontogram from './VisualOdontogram';
 import GeometricOdontogram from './GeometricOdontogram';
 import { cn } from '@/utils/cn';
 
 export default function DualOdontogram({
   patientId,
   initialEntries,
   onUpdate
 }: {
   patientId: string;
   initialEntries: any[];
   onUpdate: () => void;
 }) {
   const [view, setView] = useState<'anatomica' | 'geometrica'>('geometrica');
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div className="bg-white rounded-2xl p-1 border border-slate-200 inline-flex">
           <button
             className={cn(
               "px-4 py-2 rounded-xl text-sm font-bold",
               view === 'anatomica' ? "bg-primary text-white" : "text-slate-600"
             )}
             onClick={() => setView('anatomica')}
           >
             Vista Anatómica
           </button>
           <button
             className={cn(
               "px-4 py-2 rounded-xl text-sm font-bold",
               view === 'geometrica' ? "bg-primary text-white" : "text-slate-600"
             )}
             onClick={() => setView('geometrica')}
           >
             Vista Geométrica
           </button>
         </div>
       </div>
 
       {view === 'anatomica' ? (
         <VisualOdontogram patientId={patientId} initialEntries={initialEntries} onUpdate={onUpdate} />
       ) : (
         <GeometricOdontogram patientId={patientId} initialEntries={initialEntries} onUpdate={onUpdate} />
       )}
     </div>
   );
 }
