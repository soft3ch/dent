'use client';
import React, { useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export default function PDFExportButton({
  patient,
  medicalHistory,
  pastAppointments
}: {
  patient: any,
  medicalHistory?: any,
  pastAppointments: any[]
}) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleGeneratePDF = async () => {
    if (!patient) return;
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(22);
      doc.setTextColor(29, 78, 216); // blue-700
      doc.setFont("helvetica", "bold");
      doc.text("Dra. Flavia Gisela Toledo", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text("Ficha Odontológica Integral", 14, 26);
      doc.text(`Fecha de Emisión: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 32);

      // Bloque Datos Personales
      doc.setDrawColor(200);
      doc.line(14, 38, 196, 38);

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text("DATOS DEL PACIENTE", 14, 46);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Nombre: ${patient.full_name}`, 14, 54);
      doc.text(`DNI: ${patient.dni || '-'}`, 14, 60);
      doc.text(`Teléfono: ${patient.phone}`, 14, 66);
      doc.text(`Email: ${patient.email || '-'}`, 14, 72);

      doc.text(`Obra Social: ${patient.insurance_name || '-'}`, 100, 54);
      doc.text(`Plan: ${patient.plan_details || '-'}`, 100, 60);
      doc.text(`Afiliado Nº: ${patient.affiliation_number || '-'}`, 100, 66);
      doc.text(`Domicilio: ${patient.address || '-'}`, 100, 72);

      // Bloque Anamnesis
      if (medicalHistory) {
        doc.setFont("helvetica", "bold");
        doc.text("ANTECEDENTES MÉDICOS", 14, 84);
        doc.setFont("helvetica", "normal");

        const historyFields = [
          { label: "Corazón", val: medicalHistory.has_heart_problems },
          { label: "Diabetes", val: medicalHistory.has_diabetes },
          { label: "Hepatitis", val: medicalHistory.has_hepatitis },
          { label: "Hemorragias", val: medicalHistory.has_hemorrhagic_history },
          { label: "Presión Normal", val: medicalHistory.has_high_blood_pressure },
          { label: "Enf. Crónica", val: medicalHistory.has_chronic_disease },
          { label: "Asma", val: medicalHistory.has_asthma },
          { label: "Alergias", val: medicalHistory.has_allergic_history },
          { label: "Embarazo", val: medicalHistory.is_pregnant }
        ];

        const positives = historyFields.filter(f => f.val).map(f => f.label).join(", ");
        doc.text(`Condiciones: ${positives || 'Ninguna registrada'}`, 14, 90, { maxWidth: 180 });

        if (medicalHistory.allergies_text) {
          doc.text(`Detalle Alergias: ${medicalHistory.allergies_text}`, 14, 98, { maxWidth: 180 });
        }
      }

      // History Table
      const tableData = pastAppointments.map((app: any) => {
        const date = format(new Date(app.start_time), 'dd/MM/yy');
        const treatment = app.treatment?.name || 'Consulta';
        const notes = app.clinical_notes && app.clinical_notes.length > 0
          ? app.clinical_notes[0].content
          : '-';
        return [date, treatment, notes];
      });

      autoTable(doc, {
        startY: 110,
        head: [['Fecha', 'Tratamiento', 'Evolución Clínica']],
        body: tableData,
        headStyles: { fillColor: [29, 78, 216] },
        styles: { fontSize: 9 },
        margin: { top: 20 },
      });

      const safeName = patient.full_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      doc.save(`Ficha_${safeName}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Error al generar PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <button
      onClick={handleGeneratePDF}
      disabled={isGeneratingPdf}
      className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
    >
      {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
      {isGeneratingPdf ? 'Generando...' : 'Imprimir Ficha'}
    </button>
  );
}
