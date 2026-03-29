'use client';
import React, { useState, useEffect, useTransition } from 'react';
import {
  Building2, Users, Search, ChevronLeft, Calendar,
  Clock, FileText, Loader2, Save, Plus, ArrowLeft, Phone, Mail, Activity, Edit3, X, CheckSquare, Printer
} from 'lucide-react';
import {
  getPatientsList, getPatientDetails, saveClinicalNote,
  updatePatientProfile, getTreatmentsList, assignPatientTreatment
} from '@/application/use-cases/patient-actions';
import { format, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import BookingFlow from '@/components/patient/BookingFlow';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const PDFExportButton = dynamic(() => import('./PDFExportButton'), { ssr: false });

export default function PatientManagement() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [activeTab, setActiveTab] = useState<'historial' | 'contacto'>('historial');
  const [isPending, startTransition] = useTransition();

  const [noteContent, setNoteContent] = useState<{ [appId: string]: string }>({});
  const [savingNoteFor, setSavingNoteFor] = useState<string | null>(null);

  // Profile Edit
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ dni: '', phone: '', email: '' });

  // Treatment Assignment
  const [treatmentsList, setTreatmentsList] = useState<any[]>([]);
  const [selectedTreatmentToAssign, setSelectedTreatmentToAssign] = useState('');

  // Booking Modal & PDF
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Load patient list
  useEffect(() => {
    const fetchList = async () => {
      setIsLoadingList(true);
      try {
        const data = await getPatientsList(search);
        setPatients(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingList(false);
      }
    };
    const timer = setTimeout(fetchList, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load Master Treatments
  useEffect(() => {
    getTreatmentsList().then(setTreatmentsList).catch(console.error);
  }, []);

  // Load patient details when selected
  const fetchDetails = async (id: string) => {
    setIsLoadingDetails(true);
    try {
      const data = await getPatientDetails(id);
      setPatientDetails(data);
      setProfileData({
        dni: data.patient.dni || '',
        phone: data.patient.phone || '',
        email: data.patient.email || ''
      });
      setActiveTab('historial');
      setIsEditingProfile(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (selectedPatient) {
      fetchDetails(selectedPatient.id);
    }
  }, [selectedPatient]);

  const handleSaveNote = async (appointmentId: string) => {
    const content = noteContent[appointmentId];
    if (!content || !content.trim() || !selectedPatient) return;

    setSavingNoteFor(appointmentId);
    try {
      await saveClinicalNote({
        patientId: selectedPatient.id,
        appointmentId,
        content: content.trim()
      });
      await fetchDetails(selectedPatient.id);
      setNoteContent(prev => ({ ...prev, [appointmentId]: '' }));
    } catch (err: any) {
      alert("Error al guardar la nota: " + err.message);
    } finally {
      setSavingNoteFor(null);
    }
  };

  const handleUpdateProfile = async () => {
    if (!selectedPatient) return;
    startTransition(async () => {
      try {
        await updatePatientProfile(selectedPatient.id, profileData);
        await fetchDetails(selectedPatient.id);
        setIsEditingProfile(false);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleAssignTreatment = async () => {
    if (!selectedTreatmentToAssign || !selectedPatient) return;
    startTransition(async () => {
      try {
        await assignPatientTreatment(selectedPatient.id, selectedTreatmentToAssign);
        await fetchDetails(selectedPatient.id);
        setSelectedTreatmentToAssign('');
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const now = new Date();
  const pastAppointments = patientDetails?.appointments?.filter((a: any) => !isAfter(new Date(a.start_time), now)) || [];
  const futureAppointments = patientDetails?.appointments?.filter((a: any) => isAfter(new Date(a.start_time), now)) || [];

  return (
    <div className="flex h-screen bg-surface font-body overflow-hidden">
      {/* SideNavBar */}
      <aside className="w-64 fixed left-0 top-0 h-full hidden lg:flex flex-col bg-slate-50 dark:bg-slate-950 p-4 gap-2 z-40 border-r border-transparent">
        <div className="flex items-center gap-3 px-3 py-6">
          <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center shadow-sm">
            <Building2 className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-blue-700 dark:text-blue-400 leading-tight">Dra. Flavia Gisela Toledo</h1>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Premium Oral Care</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 mt-4">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-200/50 rounded-xl transition-all">
            <Calendar size={20} /><span>Agenda</span>
          </Link>
          <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold rounded-xl shadow-sm">
            <Users size={20} /><span>Pacientes</span>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 flex-1 h-screen overflow-y-auto w-full relative">
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl h-16 flex justify-between items-center px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 font-headline">Pacientes</h2>
          </div>
        </header>

        <div className="pt-8 px-8 pb-12 h-full">
          {!selectedPatient ? (
            /* LIS VIEW */
            <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold font-headline">Directorio de Pacientes</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o DNI..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 w-72 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                {isLoadingList ? (
                  <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-surface-container-high">
                        <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase">Nombre Completo</th>
                        <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase">DNI</th>
                        <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase">Teléfono</th>
                        <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase">Cobertura Habitual</th>
                        <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high/50">
                      {patients.map(p => (
                        <tr
                          key={p.id}
                          className="hover:bg-surface-container/30 transition-colors group cursor-pointer"
                          onClick={() => router.push(`/admin/patients/${p.id}`)}
                        >
                          <td className="py-4 px-4 font-semibold text-slate-900">{p.full_name}</td>
                          <td className="py-4 px-4 text-sm text-slate-500">{p.dni || '-'}</td>
                          <td className="py-4 px-4 text-sm text-slate-500">{p.phone}</td>
                          <td className="py-4 px-4">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${p.recent_payment_method === 'Obra Social' ? 'bg-sky-100 text-sky-700' :
                                p.recent_payment_method === 'Particular' ? 'bg-emerald-50 text-emerald-600' :
                                  'bg-slate-100 text-slate-500'
                              }`}>
                              {p.recent_payment_method}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button className="text-primary font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">Ver Ficha</button>
                          </td>
                        </tr>
                      ))}
                      {patients.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-500 italic">No se encontraron pacientes.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            /* DETAIL VIEW (FICHA CLÍNICA) */
            <div className="flex flex-col h-full bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-sm relative">
              {/* Header */}
              <div className="bg-primary/5 p-8 border-b border-primary/10">
                <button onClick={() => setSelectedPatient(null)} className="flex items-center gap-2 text-primary font-bold text-sm mb-4 hover:underline">
                  <ArrowLeft size={16} /> Volver al listado
                </button>
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-extrabold font-headline text-slate-900">{selectedPatient.full_name}</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">DNI: {patientDetails?.patient?.dni || 'No registrado'} • Paciente desde {format(new Date(selectedPatient.created_at), 'MMM yyyy', { locale: es })}</p>
                  </div>
                  <div className="flex gap-3">
                    <PDFExportButton
                      selectedPatient={selectedPatient}
                      patientDetails={patientDetails}
                      pastAppointments={pastAppointments}
                    />
                    <button onClick={() => setIsBookingModalOpen(true)} className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
                      <Plus size={18} /> Asignar Turno
                    </button>
                  </div>
                </div>
              </div>

              {isLoadingDetails ? (
                <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
              ) : (
                <div className="flex-1 flex flex-col p-8 bg-surface-container-lowest overflow-hidden">

                  {/* Custom Shadcn-like Tabs */}
                  <div className="flex bg-slate-100 p-1 rounded-lg w-fit mb-8 shrink-0">
                    <button
                      onClick={() => setActiveTab('historial')}
                      className={`px-6 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'historial' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Historial Clínico
                    </button>
                    <button
                      onClick={() => setActiveTab('contacto')}
                      className={`px-6 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'contacto' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Datos de Contacto
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto">
                    {/* TAB CONTENT: Historial */}
                    {activeTab === 'historial' && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pb-12">
                        <div className="col-span-2 space-y-8">

                          {/* Tratamientos Generales del Paciente */}
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 font-headline mb-4 flex items-center gap-2">
                              <CheckSquare className="text-primary" size={24} /> Tratamientos Activos
                            </h3>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                              <div className="flex gap-4 mb-4">
                                <select
                                  value={selectedTreatmentToAssign}
                                  onChange={(e) => setSelectedTreatmentToAssign(e.target.value)}
                                  className="flex-1 text-sm bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/30 py-3 px-4"
                                >
                                  <option value="" disabled>Seleccionar un tratamiento nuevo...</option>
                                  {treatmentsList.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={handleAssignTreatment}
                                  disabled={!selectedTreatmentToAssign || isPending}
                                  className="bg-slate-900 text-white px-6 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-slate-800 transition-colors"
                                >
                                  Asignar
                                </button>
                              </div>

                              <ul className="space-y-2">
                                {patientDetails?.patientTreatments?.length === 0 ? (
                                  <p className="text-sm text-slate-500 italic">No hay tratamientos registrados para este paciente.</p>
                                ) : (
                                  patientDetails?.patientTreatments.map((pt: any) => (
                                    <li key={pt.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                      <span className="font-semibold text-slate-700 text-sm">{pt.treatment?.name}</span>
                                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${pt.status === 'en_proceso' ? 'bg-amber-100 text-amber-700' :
                                          pt.status === 'completado' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                        {pt.status.replace('_', ' ')}
                                      </span>
                                    </li>
                                  ))
                                )}
                              </ul>
                            </div>
                          </div>

                          {/* Timeline de Consultas */}
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 font-headline mb-6 flex items-center gap-2">
                              <Activity className="text-primary" size={24} /> Timeline de Consultas
                            </h3>

                            {pastAppointments.length === 0 ? (
                              <p className="text-slate-500 italic bg-slate-50 p-6 rounded-xl border border-slate-100">Este paciente no tiene consultas previas registradas.</p>
                            ) : (
                              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent pr-4">
                                {pastAppointments.map((app: any) => {
                                  const hasNote = app.clinical_notes && app.clinical_notes.length > 0;
                                  const localNoteState = noteContent[app.id] || '';
                                  return (
                                    <div key={app.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-white bg-primary text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10"></div>
                                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                        <div className="flex justify-between items-start mb-2">
                                          <div>
                                            <h4 className="font-bold text-slate-800">{app.treatment?.name || 'Consulta General'}</h4>
                                            {app.price_charged && (
                                              <p className="text-xs text-emerald-600 font-semibold mt-0.5">Cobrado: ${app.price_charged}</p>
                                            )}
                                          </div>
                                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                                            {format(new Date(app.start_time), 'd MMM yyyy', { locale: es })}
                                          </span>
                                        </div>

                                        {hasNote ? (
                                          <div className="mt-4 p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl">
                                            <p className="text-[10px] font-bold text-yellow-800 uppercase mb-1 flex items-center gap-1"><FileText size={12} /> Evolución Clínica</p>
                                            <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{app.clinical_notes[0].content}</p>
                                          </div>
                                        ) : (
                                          <div className="mt-4 pt-4 border-t border-slate-100">
                                            <textarea
                                              value={localNoteState}
                                              onChange={(e) => setNoteContent({ ...noteContent, [app.id]: e.target.value })}
                                              placeholder="Escribir evolución para este turno..."
                                              className="w-full text-sm p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/30 min-h-[80px]"
                                            />
                                            <button
                                              onClick={() => handleSaveNote(app.id)}
                                              disabled={!localNoteState.trim() || savingNoteFor === app.id}
                                              className="mt-2 text-[11px] font-bold bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
                                            >
                                              {savingNoteFor === app.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                              Guardar Evolución
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Column: Upcoming Appointments */}
                        <div>
                          <div className="bg-primary/5 p-6 rounded-[1.5rem] border border-primary/10 sticky top-0">
                            <h3 className="text-lg font-bold text-slate-900 font-headline mb-4 flex items-center gap-2">
                              <Clock className="text-primary" size={20} /> Próximas Citas
                            </h3>
                            {futureAppointments.length === 0 ? (
                              <p className="text-sm text-slate-500 italic">No hay citas futuras agendadas.</p>
                            ) : (
                              <div className="space-y-3">
                                {futureAppointments.map((app: any) => (
                                  <div key={app.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                    <p className="font-bold text-sm text-slate-900">{app.treatment?.name || 'Turno'}</p>
                                    <p className="text-xs text-slate-500 mt-1 capitalize">{format(new Date(app.start_time), 'EEEE d MMM - HH:mm', { locale: es })}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB CONTENT: Contacto */}
                    {activeTab === 'contacto' && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
                        <div className="max-w-xl bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                          <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900 font-headline">Información Personal</h3>
                            {!isEditingProfile ? (
                              <button onClick={() => setIsEditingProfile(true)} className="text-primary flex items-center gap-2 text-sm font-bold hover:underline">
                                <Edit3 size={16} /> Editar Perfil
                              </button>
                            ) : (
                              <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 flex items-center gap-2 text-sm font-bold hover:underline">
                                <X size={16} /> Cancelar
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nombre Completo</p>
                              <p className="font-semibold text-slate-800">{patientDetails.patient.full_name}</p>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">DNI</p>
                              {isEditingProfile ? (
                                <input
                                  type="text"
                                  value={profileData.dni}
                                  onChange={e => setProfileData({ ...profileData, dni: e.target.value })}
                                  className="w-full text-sm bg-slate-50 border-none rounded-lg p-2 focus:ring-2 focus:ring-primary/40"
                                />
                              ) : (
                                <p className="font-semibold text-slate-800">{patientDetails.patient.dni || 'No registrado'}</p>
                              )}
                            </div>

                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Phone size={12} /> Teléfono</p>
                              {isEditingProfile ? (
                                <input
                                  type="text"
                                  value={profileData.phone}
                                  onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                                  className="w-full text-sm bg-slate-50 border-none rounded-lg p-2 focus:ring-2 focus:ring-primary/40"
                                />
                              ) : (
                                <p className="font-semibold text-slate-800">{patientDetails.patient.phone}</p>
                              )}
                            </div>

                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Mail size={12} /> Correo Electrónico</p>
                              {isEditingProfile ? (
                                <input
                                  type="email"
                                  value={profileData.email}
                                  onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                  className="w-full text-sm bg-slate-50 border-none rounded-lg p-2 focus:ring-2 focus:ring-primary/40"
                                />
                              ) : (
                                <p className="font-semibold text-slate-800">{patientDetails.patient.email || 'No registrado'}</p>
                              )}
                            </div>
                          </div>

                          {isEditingProfile && (
                            <div className="pt-6 border-t border-slate-100 flex justify-end">
                              <button
                                onClick={handleUpdateProfile}
                                disabled={isPending}
                                className="bg-primary text-white font-bold py-2 px-6 rounded-xl hover:bg-primary/90 flex items-center gap-2"
                              >
                                {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Guardar Cambios
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL PARA BOOKING FLOW */}
        {isBookingModalOpen && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 lg:p-12 overflow-y-auto">
            <div className="relative w-full max-w-6xl h-[90vh] bg-surface rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-surface-container-high/40">
                <div>
                  <h3 className="text-xl font-bold font-headline text-slate-900">Agenda de Turno para {selectedPatient.full_name}</h3>
                  <p className="text-xs text-slate-500">Módulo de Asignación Administrativa</p>
                </div>
                <button
                  onClick={() => setIsBookingModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <BookingFlow
                  preloadedPatientId={selectedPatient.id}
                  preloadedFullName={selectedPatient.full_name}
                  preloadedPhone={selectedPatient.phone}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
