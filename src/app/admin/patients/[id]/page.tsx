'use client';
import React, { useState, useEffect, use } from 'react';
import { 
  getPatientDetails, getMedicalHistory, getOdontogramEntries 
} from '@/application/use-cases/patient-actions';
import PatientRecordHeader from '@/components/dentist/PatientRecordHeader';
import MedicalHistorySection from '@/components/dentist/MedicalHistorySection';
import VisualOdontogram from '@/components/dentist/VisualOdontogram';
import dynamic from 'next/dynamic';
import { 
  Loader2, ArrowLeft, FileText, CheckCircle2, Clock, Activity 
} from 'lucide-react';

const PDFExportButton = dynamic(() => import('@/components/dentist/PDFExportButton'), { ssr: false });
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/utils/cn';

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [odontogram, setOdontogram] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [details, medHistory, odonEntries] = await Promise.all([
        getPatientDetails(id),
        getMedicalHistory(id),
        getOdontogramEntries(id)
      ]);
      setData(details);
      setHistory(medHistory);
      setOdontogram(odonEntries);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando Expediente Clínico...</p>
      </div>
    );
  }

  if (!data?.patient) return <div>Paciente no encontrado</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      {/* Barra de Navegación Superior */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 h-16 shadow-sm">
        <Link href="/admin/patients" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Listado de Pacientes
        </Link>
        <div className="flex gap-4">
          <PDFExportButton 
            patient={data.patient} 
            medicalHistory={history} 
            pastAppointments={data.appointments} 
          />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto mt-8 px-8 space-y-8">
        {/* ENCABEZADO */}
        <PatientRecordHeader 
          patient={data.patient} 
          onUpdate={fetchData} 
        />

        {/* ODONTOGRAMA (SECCIÓN PRINCIPAL) */}
        <VisualOdontogram 
          patientId={id} 
          initialEntries={odontogram} 
          onUpdate={fetchData} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ANTECEDENTES (COLUMNA IZQUIERDA) */}
          <div className="lg:col-span-4 h-full">
            <MedicalHistorySection 
              patientId={id} 
              initialHistory={history} 
              onUpdate={fetchData} 
            />
          </div>

          {/* TIMELINE Y TRATAMIENTOS (COLUMNA DERECHA) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <h2 className="text-xl font-serif text-slate-900 mb-8 flex items-center gap-2">
                <Activity size={20} className="text-primary" /> Evolución y Tratamientos
              </h2>
              
              <div className="space-y-6">
                {data.appointments.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No hay registros de consultas previas.</p>
                ) : (
                  data.appointments.map((app: any) => (
                    <div key={app.id} className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100 last:before:hidden">
                      <div className="absolute left-[-4px] top-2 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/10 shadow-sm" />
                      <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                              {format(new Date(app.start_time), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                            </p>
                            <h4 className="font-bold text-slate-800 text-lg">{app.treatment?.name || 'Consulta'}</h4>
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded-lg uppercase",
                            app.status === 'completed' ? "bg-emerald-100 text-emerald-700" : 
                            app.status === 'pending' ? "bg-amber-100 text-amber-700" :
                            "bg-blue-100 text-blue-700"
                          )}>
                            {app.status === 'pending' ? 'Pendiente' : 
                             app.status === 'confirmed' ? 'Confirmado' : 
                             app.status === 'cancelled' ? 'Cancelado' : 
                             app.status === 'completed' ? 'Completado' : app.status}
                          </span>
                        </div>
                        {app.clinical_notes && app.clinical_notes.length > 0 ? (
                          <div className="text-sm text-slate-600 bg-white p-4 rounded-xl border border-slate-100/50 italic whitespace-pre-wrap">
                            {app.clinical_notes[0].content}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Sin notas de evolución registradas para este turno.</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
