'use client';
import React, { useState, useTransition, useMemo } from 'react';
import { 
  Sparkles, 
  Activity, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CalendarDays,
  Clock,
  Loader2
} from 'lucide-react';
import { bookAppointment } from '@/application/use-cases/booking-actions';
import { useMonthAvailability } from '@/application/use-cases/useMonthAvailability';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, addMinutes, parse, isBefore, isAfter, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BookingFlow({
  preloadedPatientId,
  preloadedFullName,
  preloadedPhone
}: {
  preloadedPatientId?: string;
  preloadedFullName?: string;
  preloadedPhone?: string;
} = {}) {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonthDate, setCurrentMonthDate] = useState(startOfMonth(new Date()));
  
  const [formData, setFormData] = useState({ 
    fullName: preloadedFullName || '', 
    phone: preloadedPhone || '', 
    reason: '' 
  });
  const [paymentMethod, setPaymentMethod] = useState<'particular' | 'obra_social'>('particular');
  const [insuranceName, setInsuranceName] = useState('');
  const [isBooking, startBooking] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookedDetails, setBookedDetails] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Optimized Data Fetching: Fetch all availability for the active month using React Query cache
  const currentYear = currentMonthDate.getFullYear();
  const currentMonthIdx = currentMonthDate.getMonth();
  const { data: monthData, isLoading: isLoadingMonth } = useMonthAvailability(currentYear, currentMonthIdx);

  // 2. Client-side slot calculation
  const availableSlots = useMemo(() => {
    if (!selectedDate || !monthData) return [];
    
    const dayOfWeek = selectedDate.getDay();
    const scheduleItems = monthData.schedule.filter((s: any) => s.day_of_week === dayOfWeek);
    
    if (scheduleItems.length === 0) return [];
    
    const duration = 30; // Defaulting to 30 mins
    
    const busyRanges = [
      ...monthData.appointments.map((a: any) => ({
        start: new Date(a.start_time),
        end: a.end_time ? new Date(a.end_time) : addMinutes(new Date(a.start_time), duration)
      })),
      ...monthData.blocks.map((b: any) => ({
        start: new Date(b.start_time),
        end: new Date(b.end_time)
      }))
    ];
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const slots: string[] = [];
    const now = new Date();
    
    for (const period of scheduleItems) {
      const timeFmt = period.start_time.length === 5 ? 'HH:mm' : 'HH:mm:ss';
      let currentSlot = parse(`${dateStr} ${period.start_time}`, `yyyy-MM-dd ${timeFmt}`, new Date());
      const endFmt = period.end_time.length === 5 ? 'HH:mm' : 'HH:mm:ss';
      const periodEnd = parse(`${dateStr} ${period.end_time}`, `yyyy-MM-dd ${endFmt}`, new Date());
      
      while (isBefore(currentSlot, periodEnd)) {
        const slotEnd = addMinutes(currentSlot, duration);
        if (isAfter(slotEnd, periodEnd)) break;
        
        const isPast = isBefore(currentSlot, now);
        
        const isOverlapping = busyRanges.some(range => {
          return isBefore(currentSlot, range.end) && isAfter(slotEnd, range.start);
        });
        
        if (!isOverlapping && !isPast) {
          slots.push(format(currentSlot, 'HH:mm'));
        }
        
        currentSlot = addMinutes(currentSlot, 30);
      }
    }
    
    return Array.from(new Set(slots)).sort();
  }, [selectedDate, monthData]);

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime || !formData.fullName || !formData.phone) {
      setErrorMsg('Por favor, completa todos los campos requeridos (Nombre, Teléfono, Fecha y Hora).');
      return;
    }
    if (paymentMethod === 'obra_social' && !insuranceName.trim()) {
      setErrorMsg('Por favor, ingresa el nombre de tu Obra Social.');
      return;
    }
    setErrorMsg('');
    
    startBooking(async () => {
      try {
        const result = await bookAppointment({
          fullName: formData.fullName,
          phone: formData.phone,
          reason: formData.reason,
          treatmentId: null, 
          dateStr: format(selectedDate, 'yyyy-MM-dd'),
          timeStr: selectedTime,
          paymentMethod,
          insuranceName: paymentMethod === 'obra_social' ? insuranceName.trim() : null
        });
        setBookedDetails(result);
        setIsSuccess(true);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al confirmar la cita.');
      }
    });
  };

  const nextMonth = () => {
    setCurrentMonthDate(addMonths(currentMonthDate, 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };
  const prevMonth = () => {
    setCurrentMonthDate(subMonths(currentMonthDate, 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  if (isSuccess && bookedDetails) {
    return (
      <div className="bg-surface-container-lowest p-12 rounded-[2rem] shadow-xl text-center max-w-2xl mx-auto border border-outline-variant/10">
        <CheckCircle2 size={80} className="text-primary mx-auto mb-6 opacity-90" />
        <h2 className="text-3xl font-bold font-headline mb-2 text-on-surface">¡Cita Confirmada!</h2>
        <p className="text-on-surface-variant mb-8 text-lg">Hemos registrado tu cita correctamente.</p>
        <div className="bg-surface-container-low p-6 rounded-xl text-left space-y-4">
          <div className="flex items-center gap-4 text-on-surface">
            <div className="bg-white p-2 rounded-lg text-primary shadow-sm"><CalendarDays size={20} /></div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Fecha</p>
              <p className="font-semibold capitalize">{format(new Date(bookedDetails.start_time), 'PPP', { locale: es })}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-on-surface">
            <div className="bg-white p-2 rounded-lg text-primary shadow-sm"><Clock size={20} /></div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Hora</p>
              <p className="font-semibold text-lg">{format(new Date(bookedDetails.start_time), 'HH:mm')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-on-surface">
            <div className="bg-white p-2 rounded-lg text-primary shadow-sm"><Activity size={20} /></div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Cobertura</p>
              <p className="font-semibold capitalize">
                {bookedDetails.payment_method === 'obra_social' 
                  ? `Obra Social (${bookedDetails.insurance_name})` 
                  : 'Particular'}
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-8 text-white bg-primary font-bold hover:bg-primary-container px-6 py-3 rounded-xl transition-colors"
        >
          Hacer otra reserva
        </button>
      </div>
    );
  }

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonthDate),
    end: endOfMonth(currentMonthDate)
  });
  const startDayPadding = getDay(startOfMonth(currentMonthDate)); 
  const paddingArray = Array.from({ length: startDayPadding });
  const weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

  // Identify working days from schedule
  const workingDaysOfWeek = monthData ? new Set(monthData.schedule.map((s: any) => s.day_of_week)) : new Set();
  const pastMidnight = startOfDay(new Date());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Specialty & Details */}
      <div className="lg:col-span-7 space-y-8">
        <div className="bg-surface-container-low p-8 rounded-xl">
          <h3 className="text-xl font-bold mb-6 text-on-surface">1. Selecciona Especialidad</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => setSelectedSpecialty('limpieza')}
              className={`group flex flex-col p-4 rounded-xl text-left transition-all duration-300 shadow-sm border-2 ${selectedSpecialty === 'limpieza' ? 'border-primary bg-primary/5' : 'border-transparent bg-surface-container-lowest hover:translate-x-1 hover:border-primary/30'}`}
            >
              <div className="w-12 h-12 bg-secondary-container rounded-lg flex items-center justify-center mb-4 text-on-secondary-container">
                <Sparkles size={24} />
              </div>
              <span className="font-bold text-on-surface block mb-1">Limpieza</span>
              <span className="text-xs text-on-surface-variant uppercase tracking-wider">Mantenimiento</span>
            </button>
            <button 
              onClick={() => setSelectedSpecialty('ortodoncia')}
              className={`group flex flex-col p-4 rounded-xl text-left transition-all duration-300 shadow-sm border-2 ${selectedSpecialty === 'ortodoncia' ? 'border-primary bg-primary/5' : 'border-transparent bg-surface-container-lowest hover:translate-x-1 hover:border-primary/30'}`}
            >
              <div className="w-12 h-12 bg-primary-fixed rounded-lg flex items-center justify-center mb-4 text-on-primary-fixed-variant">
                <Activity size={24} />
              </div>
              <span className="font-bold text-on-surface block mb-1">Ortodoncia</span>
              <span className="text-xs text-on-surface-variant uppercase tracking-wider">Alineación</span>
            </button>
            <button 
              onClick={() => setSelectedSpecialty('urgencia')}
              className={`group flex flex-col p-4 rounded-xl text-left transition-all duration-300 shadow-sm border-2 ${selectedSpecialty === 'urgencia' ? 'border-primary bg-primary/5' : 'border-transparent bg-surface-container-lowest hover:translate-x-1 hover:border-primary/30'}`}
            >
              <div className="w-12 h-12 bg-error-container rounded-lg flex items-center justify-center mb-4 text-on-error-container">
                <AlertTriangle size={24} />
              </div>
              <span className="font-bold text-on-surface block mb-1">Urgencia</span>
              <span className="text-xs text-on-surface-variant uppercase tracking-wider">Atención Inmediata</span>
            </button>
          </div>
        </div>

        <div className="bg-surface-container-low p-8 rounded-xl">
          <h3 className="text-xl font-bold mb-6 text-on-surface">2. Datos de Contacto</h3>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant ml-1">Nombre Completo *</label>
              <input 
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                readOnly={!!preloadedPatientId}
                type="text" 
                className={`w-full h-12 px-4 rounded-lg bg-surface-container-lowest border-none focus:ring-2 focus:ring-primary/40 text-on-surface ${preloadedPatientId ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`} 
                placeholder="Ej. Juan Pérez" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant ml-1">Teléfono *</label>
              <input 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                readOnly={!!preloadedPatientId}
                type="tel" 
                className={`w-full h-12 px-4 rounded-lg bg-surface-container-lowest border-none focus:ring-2 focus:ring-primary/40 text-on-surface ${preloadedPatientId ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`} 
                placeholder="+34 000 000 000" 
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant ml-1">Motivo de la consulta</label>
              <textarea 
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
                className="w-full p-4 rounded-lg bg-surface-container-lowest border-none focus:ring-2 focus:ring-primary/40 text-on-surface" 
                placeholder="Describe brevemente tu necesidad..." 
                rows={3}
              />
            </div>
            
            <div className="md:col-span-2 space-y-4 mt-2">
              <label className="text-sm font-semibold text-on-surface-variant ml-1">Cobertura Médica *</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('particular')}
                  className={`flex items-center justify-center py-3 px-4 rounded-xl border-2 transition-all font-semibold ${
                    paymentMethod === 'particular'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-transparent bg-surface-container-lowest text-on-surface hover:border-primary/30'
                  }`}
                >
                  Particular
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('obra_social')}
                  className={`flex items-center justify-center py-3 px-4 rounded-xl border-2 transition-all font-semibold ${
                    paymentMethod === 'obra_social'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-transparent bg-surface-container-lowest text-on-surface hover:border-primary/30'
                  }`}
                >
                  Obra Social
                </button>
              </div>
            </div>

            {paymentMethod === 'obra_social' && (
              <div className="md:col-span-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-semibold text-on-surface-variant ml-1">Nombre de la Obra Social *</label>
                <input 
                  value={insuranceName}
                  onChange={e => setInsuranceName(e.target.value)}
                  type="text" 
                  className="w-full h-12 px-4 rounded-lg bg-surface-container-lowest border-none focus:ring-2 focus:ring-primary/40 text-on-surface" 
                  placeholder="Ej. OSDE, Swiss Medical..." 
                />
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Right Column: Calendar Widget & Action */}
      <div className="lg:col-span-5 space-y-8">
        
        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_20px_40px_-10px_rgba(25,28,30,0.06)] border border-outline-variant/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-on-surface">3. Elige Fecha</h3>
            {isLoadingMonth && <Loader2 size={16} className="text-primary animate-spin" />}
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-center font-bold text-on-surface capitalize mb-6 text-lg">
              {format(currentMonthDate, 'MMMM yyyy', { locale: es })}
            </div>
            
            <div className="grid grid-cols-7 gap-y-4 text-center">
              {weekDays.map(day => (
                <div key={day} className="text-[11px] font-extrabold text-outline-variant uppercase tracking-tighter">{day}</div>
              ))}
              
              {paddingArray.map((_, i) => (
                <div key={`pad-${i}`} className="p-2"></div>
              ))}
              
              {daysInMonth.map((day, idx) => {
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isPast = isBefore(day, pastMidnight);
                const isWorking = workingDaysOfWeek.has(getDay(day));
                const isDisabled = isPast || !isWorking || isLoadingMonth;
                
                return (
                  <button 
                    key={idx} 
                    onClick={() => {
                      setSelectedDate(day);
                      setSelectedTime(null);
                    }}
                    disabled={isDisabled}
                    className={`
                      w-10 h-10 mx-auto rounded-full text-sm font-semibold transition-all
                      ${isSelected ? 'bg-primary text-white shadow-md' : ''}
                      ${!isSelected && !isDisabled ? 'hover:bg-primary-fixed hover:text-primary text-on-surface' : ''}
                      ${isDisabled && !isSelected ? 'text-outline-variant/50 cursor-not-allowed bg-transparent' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-surface-container-high transition-opacity duration-300">
            {selectedDate && (
              <div className="text-sm font-semibold text-on-surface-variant mb-4 flex justify-between items-center">
                <span>Horarios el {format(selectedDate, 'd MMM', { locale: es })}</span>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              {!selectedDate && (
                <p className="text-sm text-outline w-full text-center py-4 bg-surface-container/30 rounded-lg">Selecciona un día en el calendario</p>
              )}
              {selectedDate && availableSlots.length === 0 && (
                <p className="text-sm text-on-surface-variant w-full text-center py-4 bg-surface-container/30 rounded-lg">No hay turnos disponibles.</p>
              )}
              {selectedDate && availableSlots.map(time => (
                <button 
                  key={time} 
                  onClick={() => setSelectedTime(time)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all
                    ${selectedTime === time ? 'bg-primary text-white shadow-md' : 'bg-surface-container hover:bg-primary-fixed hover:text-primary text-on-surface'}
                  `}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Final Confirmation */}
        <div className="space-y-4">
          {errorMsg && <p className="text-sm text-error bg-error-container/50 p-3 rounded-lg font-medium">{errorMsg}</p>}
          
          <button 
            onClick={handleConfirm}
            disabled={isBooking || !selectedTime}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 
              ${isBooking || !selectedTime 
                ? 'bg-surface-container text-outline cursor-not-allowed opacity-70' 
                : 'bg-gradient-to-br from-primary to-primary-container text-white hover:shadow-xl transform active:scale-[0.98]'
              }`}
          >
            {isBooking ? <><Loader2 className="animate-spin" size={20} /> Confirmando...</> : 'Confirmar Cita'}
          </button>
          
          <p className="text-xs text-center text-on-surface-variant px-4">
            Al confirmar, aceptas nuestra política de privacidad y los términos de cancelación.
          </p>
        </div>
      </div>
    </div>
  );
}
