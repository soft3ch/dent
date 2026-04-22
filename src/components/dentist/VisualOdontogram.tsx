'use client';
import React, { useState, useEffect } from 'react';
import { Odontogram } from "react-odontogram";
import "react-odontogram/style.css";
import { saveMultipleOdontogramEntries } from '@/application/use-cases/patient-actions';
import { cn } from '@/utils/cn';
import { Save, Plus, AlertCircle, X, Info, Loader2 } from 'lucide-react';

interface VisualOdontogramProps {
  patientId: string;
  initialEntries: any[];
  onUpdate: () => void;
}

const CONDITIONS = [
  { id: 'Sano', label: 'Diente Sano', color: '#e2e8f0' },
  { id: 'Caries', label: 'Caries', color: '#ef4444' },
  { id: 'Ausente', label: 'Pieza Ausente', color: '#94a3b8' },
  { id: 'Conducto', label: 'Trat. Conducto', color: '#3b82f6' },
  { id: 'Corona', label: 'Corona / Prótesis', color: '#f59e0b' },
  { id: 'Obturado', label: 'Obturación / Arreglo', color: '#10b981' },
];

export default function VisualOdontogram({ patientId, initialEntries, onUpdate }: VisualOdontogramProps) {
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<{ [key: number]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Obtener el estado actual consolidado (solo el registro más reciente por diente)
  const currentTeethState = React.useMemo(() => {
    const state: { [key: number]: string } = {};
    
    // Al guardar borramos previos, pero por seguridad ordenamos de más viejo a más nuevo 
    // para que la última aplicación prevalezca al construir la vista inicial.
    const sortedEntries = [...initialEntries].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    sortedEntries.forEach(entry => {
      state[entry.tooth_number] = entry.condition;
    });

    // Combinar con cambios pendientes que aún no se han guardado
    return { ...state, ...pendingChanges };
  }, [initialEntries, pendingChanges]);

  // Listado completo de piezas dentales (FDI) para asegurar que todas se pinten por defecto
  const ALL_TEETH_FDI = [
    11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28,
    31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48
  ];

  // Formatear para el componente Odontogram
  const formattedConditions = React.useMemo(() => {
    return CONDITIONS.map(c => {
      let teeth: string[] = [];
      
      if (c.id === 'Sano') {
        // Para 'Sano', incluimos los que están registrados como tales + los que no tienen ningún estado
        teeth = ALL_TEETH_FDI
          .filter(toothNum => {
            const currentCondition = currentTeethState[toothNum];
            return !currentCondition || currentCondition === 'Sano';
          })
          .map(toothNum => `teeth-${toothNum}`);
      } else {
        // Para el resto, filtramos normalmente
        teeth = Object.entries(currentTeethState)
          .filter(([_, condition]) => condition === c.id)
          .map(([toothNum, _]) => `teeth-${toothNum}`);
      }
      
      return {
        key: c.id,
        label: c.label,
        condition: c.id,
        fillColor: c.color,
        outlineColor: c.color,
        teeth: teeth
      };
    });
  }, [currentTeethState]);

  const handleToothClick = (teeth: any) => {
    if (teeth && teeth.length > 0) {
      const tooth = teeth[teeth.length - 1]; 
      const fdi = tooth.notations?.fdi || (typeof tooth === 'string' ? tooth.split('-').pop() : tooth.id?.split('-').pop());
      
      if (fdi && !isNaN(parseInt(fdi))) {
        setTimeout(() => setSelectedTooth(fdi), 0);
      }
    }
  };

  const handleApplyCondition = (conditionId: string) => {
    if (!selectedTooth) return;
    const toothNum = parseInt(selectedTooth);
    if (isNaN(toothNum)) return;

    setPendingChanges(prev => ({
      ...prev,
      [toothNum]: conditionId
    }));
    setSelectedTooth(null);
  };

  const handleBatchSave = async () => {
    const entriesToSave = Object.entries(pendingChanges).map(([toothNum, condition]) => ({
      patient_id: patientId,
      tooth_number: parseInt(toothNum),
      condition: condition
    }));

    if (entriesToSave.length === 0) return;

    setIsSaving(true);
    try {
      await saveMultipleOdontogramEntries(entriesToSave);
      setPendingChanges({});
      onUpdate();
    } catch (err: any) {
      alert("Error al guardar cambios: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

  return (
    <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center relative">
      <div className="w-full flex justify-between items-center mb-8">
        <h2 className="text-xl font-serif text-slate-900 flex items-center gap-2">
          <Info className="text-primary" size={20} /> Odontograma Visual
        </h2>
        <div className="flex items-center gap-6">
          <div className="flex gap-4">
            {CONDITIONS.slice(1).map(c => (
              <div key={c.id} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: c.color }} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{c.label}</span>
              </div>
            ))}
          </div>
          
          {hasChanges && (
            <button 
              onClick={handleBatchSave}
              disabled={isSaving}
              className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md animate-in fade-in slide-in-from-right-2"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
              Guardar {Object.keys(pendingChanges).length} cambios
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-4xl overflow-x-auto py-8">
        <Odontogram 
          showTooltip={false}
          onChange={handleToothClick} 
          teethConditions={formattedConditions}
        />
      </div>

      <p className="text-xs text-slate-400 font-medium mt-4">
        {hasChanges 
          ? "Tienes cambios pendientes. Presiona 'Guardar' para aplicarlos a la ficha." 
          : "Haz clic en un diente para registrar o cambiar su estado actual."}
      </p>

      {/* Popover Simplificado */}
      {selectedTooth && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-[2px] rounded-3xl animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 w-64 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">Diente #{selectedTooth}</h3>
              <button onClick={() => setSelectedTooth(null)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
            </div>
            <div className="space-y-2">
              {CONDITIONS.map(c => {
                const currentVal = currentTeethState[parseInt(selectedTooth!)];
                const isCurrent = currentVal === c.id || (!currentVal && c.id === 'Sano');
                return (
                  <button
                    key={c.id}
                    onClick={() => handleApplyCondition(c.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-colors flex items-center justify-between border group",
                      isCurrent ? "bg-slate-50 border-slate-200" : "hover:bg-slate-50 border-transparent hover:border-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: c.color }} />
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-primary">{c.label}</span>
                    </div>
                    {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
