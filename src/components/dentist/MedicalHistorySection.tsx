'use client';
import React, { useState, useEffect } from 'react';
import { Heart, Activity, AlertCircle, FileText, Save, Loader2 } from 'lucide-react';
import { upsertMedicalHistory } from '@/application/use-cases/patient-actions';
import { cn } from '@/utils/cn';

interface MedicalHistorySectionProps {
  patientId: string;
  initialHistory: any;
  onUpdate: () => void;
}

export default function MedicalHistorySection({ patientId, initialHistory, onUpdate }: MedicalHistorySectionProps) {
  const [history, setHistory] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setHistory(initialHistory || {
      has_heart_problems: false,
      has_diabetes: false,
      has_hepatitis: false,
      has_hemorrhagic_history: false,
      has_high_blood_pressure: true, // "Presión Sanguínea Normal" logic
      has_chronic_disease: false,
      has_asthma: false,
      has_allergic_history: false,
      has_anemia: false,
      has_epilepsy: false,
      is_pregnant: false,
      allergies_text: '',
      medications_text: '',
      general_comments: ''
    });
  }, [initialHistory]);

  const handleToggle = (field: string) => {
    setHistory((prev: any) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await upsertMedicalHistory(patientId, history);
      onUpdate();
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const Switch = ({ label, checked, onChange, reverseLabel = false }: any) => (
    <div className="flex items-center justify-between group cursor-pointer" onClick={onChange}>
      <span className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-primary">{label}</span>
      <div className={cn(
        "w-10 h-5 rounded-full relative transition-all duration-300 shadow-inner",
        checked ? "bg-primary" : "bg-slate-200"
      )}>
        <div className={cn(
          "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 shadow-sm",
          checked ? "translate-x-5" : "translate-x-0"
        )} />
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-serif text-slate-900 flex items-center gap-2">
          <Heart className="text-rose-500" size={20} /> Antecedentes Médicos (Anamnesis)
        </h2>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar Cambios
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          <Switch label="Problemas Cardíacos" checked={history.has_heart_problems} onChange={() => handleToggle('has_heart_problems')} />
          <Switch label="Diabetes" checked={history.has_diabetes} onChange={() => handleToggle('has_diabetes')} />
          <Switch label="Hepatitis" checked={history.has_hepatitis} onChange={() => handleToggle('has_hepatitis')} />
          <Switch label="Antec. Hemorrágicos" checked={history.has_hemorrhagic_history} onChange={() => handleToggle('has_hemorrhagic_history')} />
          <Switch label="Presión Sanguínea Normal" checked={history.has_high_blood_pressure} onChange={() => handleToggle('has_high_blood_pressure')} />
          <Switch label="Enf. Crónica Sistemática" checked={history.has_chronic_disease} onChange={() => handleToggle('has_chronic_disease')} />
          <Switch label="Asma" checked={history.has_asthma} onChange={() => handleToggle('has_asthma')} />
          <Switch label="Antecedentes Alérgicos" checked={history.has_allergic_history} onChange={() => handleToggle('has_allergic_history')} />
          <Switch label="Anemia" checked={history.has_anemia} onChange={() => handleToggle('has_anemia')} />
          <Switch label="Epilepsia" checked={history.has_epilepsy} onChange={() => handleToggle('has_epilepsy')} />
          <Switch label="Embarazo?" checked={history.is_pregnant} onChange={() => handleToggle('is_pregnant')} />
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-50">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Alergias Conocidas</label>
            <textarea 
              value={history.allergies_text}
              onChange={(e) => setHistory({...history, allergies_text: e.target.value})}
              placeholder="Explique alergias aquí..."
              className="w-full text-sm p-3 bg-slate-50 border-none rounded-xl focus:ring-1 focus:ring-primary min-h-[60px]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">¿Está tomando algún medicamento?</label>
            <textarea 
              value={history.medications_text}
              onChange={(e) => setHistory({...history, medications_text: e.target.value})}
              placeholder="Listado de medicamentos..."
              className="w-full text-sm p-3 bg-slate-50 border-none rounded-xl focus:ring-1 focus:ring-primary min-h-[60px]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Comentarios Médicos Adicionales</label>
            <textarea 
              value={history.general_comments}
              onChange={(e) => setHistory({...history, general_comments: e.target.value})}
              placeholder="Observaciones importantes..."
              className="w-full text-sm p-3 bg-slate-50 border-none rounded-xl focus:ring-1 focus:ring-primary min-h-[80px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
