'use client';
import React, { useState, useEffect } from 'react';
import { User, Shield, CreditCard, MapPin, Calendar, Smartphone, Briefcase, Users, Save, X, Edit2 } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { updatePatientProfile } from '@/application/use-cases/patient-actions';
import { cn } from '@/utils/cn';

interface PatientRecordHeaderProps {
  patient: any;
  onUpdate: () => void;
}

export default function PatientRecordHeader({ patient, onUpdate }: PatientRecordHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        full_name: patient.full_name || '',
        dni: patient.dni || '',
        phone: patient.phone || '',
        email: patient.email || '',
        insurance_name: patient.insurance_name || '',
        plan_details: patient.plan_details || '',
        affiliation_number: patient.affiliation_number || '',
        address: patient.address || '',
        birth_date: patient.birth_date || '',
        work_location: patient.work_location || '',
        is_titular: patient.is_titular ?? true,
        titular_relationship: patient.titular_relationship || '',
      });
    }
  }, [patient]);

  const age = patient?.birth_date ? differenceInYears(new Date(), new Date(patient.birth_date)) : null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePatientProfile(patient.id, formData);
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      alert("Error al guardar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const Field = ({ label, value, icon: Icon, name, type = "text" }: any) => (
    <div className="flex flex-col gap-1 border-b border-dashed border-slate-200 py-3 last:border-0">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-slate-400">
        <Icon size={12} className="text-primary/60" />
        {label}
      </div>
      {isEditing ? (
        type === "checkbox" ? (
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="radio" 
                checked={formData[name] === true} 
                onChange={() => setFormData({...formData, [name]: true})}
              /> Titular
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="radio" 
                checked={formData[name] === false} 
                onChange={() => setFormData({...formData, [name]: false})}
              /> Familiar
            </label>
          </div>
        ) : (
          <input
            type={type}
            value={formData[name]}
            onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
            className="text-sm font-semibold text-slate-800 bg-slate-50 border-none rounded p-1 focus:ring-1 focus:ring-primary w-full"
          />
        )
      ) : (
        <p className="text-sm font-bold text-slate-800">
          {value || <span className="text-slate-300 italic font-normal">No registrado</span>}
          {label === "Fecha de Nacimiento" && age !== null && (
            <span className="ml-2 text-xs font-medium text-slate-500">(Edad: {age} años)</span>
          )}
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
      {/* Marcador Estilo Documento */}
      <div className="absolute top-0 right-0 p-6">
        <div className="text-xs font-mono text-slate-300 rotate-12 select-none">ID: {patient.id.slice(0, 8)}</div>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-serif text-slate-900 mb-1 flex items-center gap-3">
            {isEditing ? (
              <input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-slate-50 border-none rounded p-1 focus:ring-1 focus:ring-primary"
              />
            ) : (
              patient.full_name
            )}
          </h1>
          <p className="text-sm font-medium text-slate-400 font-sans tracking-wide">Ficha Clínica Odontológica Integral</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button 
                onClick={handleSave} 
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all hover:scale-105"
                disabled={isSaving}
              >
                {isSaving ? "Guardando..." : <Save size={16} />} 
              </button>
              <button onClick={() => setIsEditing(false)} className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200">
                <X size={16} />
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="text-primary bg-primary/10 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/20 transition-all">
              <Edit2 size={16} /> Editar Datos
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-2">
        <Field label="D.N.I. Nº" value={patient.dni} icon={User} name="dni" />
        <Field label="Teléfono" value={patient.phone} icon={Smartphone} name="phone" />
        <Field label="Obra Social" value={patient.insurance_name} icon={Shield} name="insurance_name" />
        <Field label="Plan" value={patient.plan_details} icon={CreditCard} name="plan_details" />
        <Field label="Afiliado Nº" value={patient.affiliation_number} icon={CreditCard} name="affiliation_number" />
        <Field label="Domicilio" value={patient.address} icon={MapPin} name="address" />
        <Field label="Fecha de Nacimiento" value={patient.birth_date ? format(new Date(patient.birth_date), 'd MMM yyyy', { locale: es }) : null} icon={Calendar} name="birth_date" type="date" />
        <Field label="Lugar de Trabajo" value={patient.work_location} icon={Briefcase} name="work_location" />
        <Field label="Condición Titular" value={patient.is_titular ? "Titular" : "Cónyuge/Hijo"} icon={Users} name="is_titular" type="checkbox" />
        {!patient.is_titular && <Field label="Parentesco" value={patient.titular_relationship} icon={Users} name="titular_relationship" />}
      </div>
    </div>
  );
}
