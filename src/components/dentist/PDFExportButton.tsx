'use client';
import React, { useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export default function PDFExportButton({ 
  selectedPatient, 
  patientDetails, 
  pastAppointments 
}: { 
  selectedPatient: any, 
  patientDetails: any, 
  pastAppointments: any[] 
}) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleGeneratePDF = async () => {
    if (!selectedPatient || !patientDetails) return;
    setIsGeneratingPdf(true);
    
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(14, 165, 233); // Sky-500
      doc.text("Serenity Dental", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Ficha Clínica del Paciente", 14, 26);
      doc.text(`Fecha de Emisión: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 32);

      // Patient Info Card
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(14, 40, 182, 35, 3, 3, 'FD');
      
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("helvetica", "bold");
      doc.text(patientDetails.patient.full_name, 20, 50);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`DNI: ${patientDetails.patient.dni || 'No registrado'}`, 20, 58);
      doc.text(`Email: ${patientDetails.patient.email || 'No registrado'}`, 20, 64);
      doc.text(`Teléfono: ${patientDetails.patient.phone}`, 100, 58);
      
      const coverage = selectedPatient.recent_payment_method || 'Particular';
      doc.text(`Cobertura: ${coverage}`, 100, 64);

      // History Table
      const tableData = pastAppointments.map((app: any) => {
        const date = format(new Date(app.start_time), 'dd/MM/yy HH:mm');
        const treatment = app.treatment?.name || 'Consulta General';
        const cost = app.price_charged ? `$${app.price_charged}` : '-';
        const notes = app.clinical_notes && app.clinical_notes.length > 0 
          ? app.clinical_notes[0].content 
          : 'Sin notas';
        return [date, treatment, notes, cost];
      });

      autoTable(doc, {
        startY: 85,
        head: [['Fecha', 'Tratamiento', 'Evolución', 'Costo']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [14, 165, 233], // Sky-500 equivalent
          textColor: 255, 
          halign: 'center' 
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 40 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 20, halign: 'center' },
        },
        showHead: 'firstPage',
        margin: { top: 20 },
      });

      const safeName = patientDetails.patient.full_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `Ficha_Medica_${safeName}_${format(new Date(), 'dd-MM-yy')}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <button 
      onClick={handleGeneratePDF}
      disabled={isGeneratingPdf}
      className="bg-white text-slate-700 px-4 py-3 border border-slate-200 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
    >
      {isGeneratingPdf ? <Loader2 size={18} className="animate-spin text-primary" /> : <Printer size={18} className="text-primary" />}
      {isGeneratingPdf ? 'Generando...' : 'Exportar Ficha'}
    </button>
  );
}
