 'use client';
 import React, { useMemo, useState } from 'react';
 import { Save, Loader2, Info } from 'lucide-react';
 import { cn } from '@/utils/cn';
 import { saveMultipleOdontogramEntries } from '@/application/use-cases/patient-actions';
 
 interface GeometricOdontogramProps {
   patientId: string;
   initialEntries: any[];
   onUpdate: () => void;
 }
 
 type Face = 'top' | 'right' | 'bottom' | 'left' | 'center';
 
 const CONDITIONS = [
   { id: 'Sano', label: 'Sano', color: '#e2e8f0' },
   { id: 'Caries', label: 'Caries', color: '#ef4444' },
   { id: 'Obturado', label: 'Arreglo', color: '#10b981' },
   { id: 'Conducto', label: 'Conducto', color: '#3b82f6' },
   { id: 'Corona', label: 'Corona', color: '#f59e0b' },
   { id: 'Ausente', label: 'Ausente', color: '#94a3b8' },
 ];
 
const TOP_ROW: number[] = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const BOTTOM_ROW: number[] = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
const TOP_MILK_LEFT: number[] = [55,54,53,52,51];
const TOP_MILK_RIGHT: number[] = [61,62,63,64,65];
const BOTTOM_MILK_LEFT: number[] = [85,84,83,82,81];
const BOTTOM_MILK_RIGHT: number[] = [71,72,73,74,75];
 
 function buildFaceState(entries: any[]): Record<number, Record<Face, string>> {
   const byTooth: Record<number, Record<Face, string>> = {};
   // Order by created_at ascending so that later entries override earlier ones
   const sorted = [...entries].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
   
   sorted.forEach(e => {
     const t = e.tooth_number as number;
     const desc: string = e.description || '';
     const m = desc.match(/surface=(top|right|bottom|left|center)/);
     const face = (m ? (m[1] as Face) : null);
     
     if (!byTooth[t]) {
       byTooth[t] = { top: 'Sano', right: 'Sano', bottom: 'Sano', left: 'Sano', center: 'Sano' };
     }
     
     if (face) {
       byTooth[t][face] = e.condition;
     } else {
       // If no surface is specified, it applies to the whole tooth
       byTooth[t] = { 
         top: e.condition, 
         right: e.condition, 
         bottom: e.condition, 
         left: e.condition, 
         center: e.condition 
       };
     }
   });
   return byTooth;
 }
 
 export default function GeometricOdontogram({ patientId, initialEntries, onUpdate }: GeometricOdontogramProps) {
   const [currentMark, setCurrentMark] = useState<string>('Caries');
   const [isSaving, setIsSaving] = useState(false);
   const [pending, setPending] = useState<{ tooth: number; face: Face; condition: string }[]>([]);
 
   const faceState = useMemo(() => buildFaceState(initialEntries), [initialEntries]);
 
   const hasChanges = pending.length > 0;
 
   const setFace = (tooth: number, face: Face) => {
     const condition = currentMark;
     setPending(prev => {
       const i = prev.findIndex(p => p.tooth === tooth && p.face === face);
       const next = [...prev];
       if (i >= 0) next[i] = { tooth, face, condition };
       else next.push({ tooth, face, condition });
       return next;
     });
   };
 
   const getFill = (tooth: number, face: Face) => {
     const pendingHit = pending.find(p => p.tooth === tooth && p.face === face);
     const condition = pendingHit ? pendingHit.condition : (faceState[tooth]?.[face] || 'Sano');
     const color = CONDITIONS.find(c => c.id === condition)?.color || '#e2e8f0';
     return color;
   };
 
   const handleSave = async () => {
     if (pending.length === 0) return;
     setIsSaving(true);
     try {
       const entries = pending.map(p => ({
         patient_id: patientId,
         tooth_number: p.tooth,
         condition: p.condition,
         description: `surface=${p.face}`
       }));
       await saveMultipleOdontogramEntries(entries);
       setPending([]);
       onUpdate();
     } catch (e: any) {
       alert('Error al guardar: ' + e.message);
     } finally {
       setIsSaving(false);
     }
   };
 
  const ToothSVG = ({ tooth, size = 44 }: { tooth: number; size?: number }) => {
     const cx = size / 2;
     const cy = size / 2;
     const cSize = 18;
     return (
       <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="cursor-pointer select-none">
         <polygon
           points={`0,0 ${size},0 ${cx},${cy}`}
           fill={getFill(tooth, 'top')}
           stroke="#CBD5E1"
           onClick={() => setFace(tooth, 'top')}
         />
         <polygon
           points={`${size},0 ${size},${size} ${cx},${cy}`}
           fill={getFill(tooth, 'right')}
           stroke="#CBD5E1"
           onClick={() => setFace(tooth, 'right')}
         />
         <polygon
           points={`0,${size} ${size},${size} ${cx},${cy}`}
           fill={getFill(tooth, 'bottom')}
           stroke="#CBD5E1"
           onClick={() => setFace(tooth, 'bottom')}
         />
         <polygon
           points={`0,0 0,${size} ${cx},${cy}`}
           fill={getFill(tooth, 'left')}
           stroke="#CBD5E1"
           onClick={() => setFace(tooth, 'left')}
         />
         <rect
           x={cx - cSize / 2}
           y={cy - cSize / 2}
           width={cSize}
           height={cSize}
           fill={getFill(tooth, 'center')}
           stroke="#64748B"
           onClick={() => setFace(tooth, 'center')}
         />
       </svg>
     );
   };
 
  const renderRow = (teeth: number[], size = 44) => (
    <div className="flex items-center justify-center gap-3">
       {teeth.map(t => (
         <div key={t} className="flex flex-col items-center">
          <ToothSVG tooth={t} size={size} />
           <span className="text-[10px] text-slate-400 font-bold mt-1">{t}</span>
         </div>
       ))}
     </div>
   );
 
   return (
     <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center relative">
       <div className="w-full flex justify-between items-center mb-6">
         <h2 className="text-xl font-serif text-slate-900 flex items-center gap-2">
           <Info className="text-primary" size={20} /> Odontograma Geométrico
         </h2>
         <div className="flex items-center gap-3">
           <div className="flex gap-2">
             {CONDITIONS.map(c => (
               <button
                 key={c.id}
                 onClick={() => setCurrentMark(c.id)}
                 className={cn(
                   "px-3 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-2",
                   currentMark === c.id ? "bg-slate-50 border-slate-200" : "bg-white hover:bg-slate-50 border-slate-100"
                 )}
               >
                 <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                 {c.label}
               </button>
             ))}
           </div>
           {hasChanges && (
             <button
               onClick={handleSave}
               disabled={isSaving}
               className="bg-primary text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md"
             >
               {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
             </button>
           )}
         </div>
       </div>
 
      <div className="space-y-6 w-full">
        <div className="flex items-center justify-between px-8">
          <span className="text-[11px] font-semibold text-slate-500">Izquierda</span>
          <span className="text-[11px] font-semibold text-slate-500">Derecha</span>
        </div>
        {renderRow(TOP_ROW)}
        {renderRow(BOTTOM_ROW)}
        <div className="flex items-center justify-center gap-12">
          {renderRow(TOP_MILK_LEFT, 36)}
          {renderRow(TOP_MILK_RIGHT, 36)}
        </div>
        <div className="flex items-center justify-center gap-12">
          {renderRow(BOTTOM_MILK_LEFT, 36)}
          {renderRow(BOTTOM_MILK_RIGHT, 36)}
        </div>
      </div>
 
       <p className="text-xs text-slate-400 font-medium mt-6">
         Haz clic en las caras para marcar. Selecciona un estado y aplica en cada cara. 
       </p>
     </div>
   );
 }
