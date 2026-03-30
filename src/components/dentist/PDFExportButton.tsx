'use client';
import React, { useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export default function PDFExportButton({
  patient,
  medicalHistory,
  pastAppointments,
  odontogramEntries
}: {
  patient: any,
  medicalHistory?: any,
  pastAppointments: any[],
  odontogramEntries?: any[]
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

      // (Se elimina el bloque de Anamnesis resumido antes del odontograma; solo se imprime la sección completa al final)

      // Odontograma Geométrico
      const CONDITIONS = [
        { id: 'Sano', color: '#e2e8f0' },
        { id: 'Caries', color: '#ef4444' },
        { id: 'Obturado', color: '#10b981' },
        { id: 'Conducto', color: '#3b82f6' },
        { id: 'Corona', color: '#f59e0b' },
        { id: 'Ausente', color: '#94a3b8' },
      ];
      const colorFor = (cond: string) => {
        const c = CONDITIONS.find(x => x.id === cond);
        return c ? c.color : '#e2e8f0';
      };
      const hexToRgb = (hex: string) => {
        const h = hex.replace('#', '');
        const bigint = parseInt(h, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return { r, g, b };
      };
      const buildFaceState = (entries: any[]) => {
        const byTooth: Record<number, { top: string; right: string; bottom: string; left: string; center: string }> = {};
        const sorted = [...entries].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        sorted.forEach(e => {
          const t = e.tooth_number as number;
          const desc: string = e.description || '';
          const m = desc.match(/surface=(top|right|bottom|left|center)/);
          const face = m ? m[1] as 'top' | 'right' | 'bottom' | 'left' | 'center' : null;
          if (!byTooth[t]) byTooth[t] = { top: 'Sano', right: 'Sano', bottom: 'Sano', left: 'Sano', center: 'Sano' };
          if (face) {
            byTooth[t][face] = e.condition;
          } else {
            byTooth[t] = { top: e.condition, right: e.condition, bottom: e.condition, left: e.condition, center: e.condition };
          }
        });
        return byTooth;
      };
      doc.setFont("helvetica", "bold");
      doc.text("ODONTOGRAMA GEOMÉTRICO", 14, 112);
      const faces = buildFaceState(odontogramEntries || []);
      const topRow: number[] = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
      const bottomRow: number[] = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
      const topMilkLeft: number[] = [55,54,53,52,51];
      const topMilkRight: number[] = [61,62,63,64,65];
      const bottomMilkLeft: number[] = [85,84,83,82,81];
      const bottomMilkRight: number[] = [71,72,73,74,75];
      const pageLeft = 14;
      const pageRight = 196;
      const startY = 118;
      const availWidth = pageRight - pageLeft;
      const cell = 8.0;
      const step = (availWidth - cell) / 15; // dynamic so 16 piezas ocupan el ancho exacto
      const gap = step - cell;
      const drawTooth = (x: number, y: number, t: number) => {
        const cx = x + cell / 2;
        const cy = y + cell / 2;
        const cSize = 4.5;
        const fillTriangle = (aX: number, aY: number, bX: number, bY: number, cX: number, cY: number, cond: string) => {
          const { r, g, b } = hexToRgb(colorFor(cond));
          doc.setFillColor(r, g, b);
          // jsPDF triangle fill (supported en v4)
          // @ts-ignore
          doc.triangle(aX, aY, bX, bY, cX, cY, 'F');
        };
        fillTriangle(x, y, x + cell, y, cx, cy, faces[t]?.top || 'Sano');
        fillTriangle(x + cell, y, x + cell, y + cell, cx, cy, faces[t]?.right || 'Sano');
        fillTriangle(x, y + cell, x + cell, y + cell, cx, cy, faces[t]?.bottom || 'Sano');
        fillTriangle(x, y, x, y + cell, cx, cy, faces[t]?.left || 'Sano');
        doc.setDrawColor(180);
        doc.rect(x, y, cell, cell);
        doc.setDrawColor(180);
        doc.line(x, y, cx, cy);
        doc.line(x + cell, y, cx, cy);
        doc.line(x, y + cell, cx, cy);
        doc.line(x + cell, y + cell, cx, cy);
        const cColor = hexToRgb(colorFor(faces[t]?.center || 'Sano'));
        doc.setFillColor(cColor.r, cColor.g, cColor.b);
        doc.setDrawColor(150);
        doc.setLineWidth(0.2);
        doc.rect(cx - cSize / 2, cy - cSize / 2, cSize, cSize, 'FD');
        doc.setFontSize(7);
        doc.setTextColor(90);
        doc.text(String(t), x + cell / 2, y + cell + 3, { align: 'center' });
      };
      topRow.forEach((t, idx) => {
        const x = pageLeft + idx * step;
        const y = startY;
        drawTooth(x, y, t);
      });
      bottomRow.forEach((t, idx) => {
        const x = pageLeft + idx * step;
        const y = startY + cell + 10;
        drawTooth(x, y, t);
      });
      const cellS = 6.0;
      const gapS = 3.5;
      const stepS = cellS + gapS;
      const groupWidth = 5 * stepS;
      const halfWidth = availWidth / 2;
      const leftGroupStartX = pageLeft + (halfWidth - groupWidth) / 2;
      const rightGroupStartX = pageLeft + halfWidth + (halfWidth - groupWidth) / 2;
      const milkStartY = startY + (cell + 10) * 2 + 6;
      topMilkLeft.forEach((t, idx) => {
        const x = leftGroupStartX + idx * stepS;
        const y = milkStartY;
        drawTooth(x, y, t);
      });
      topMilkRight.forEach((t, idx) => {
        const x = rightGroupStartX + idx * stepS;
        const y = milkStartY;
        drawTooth(x, y, t);
      });
      const milkStartY2 = milkStartY + cell + 8;
      bottomMilkLeft.forEach((t, idx) => {
        const x = leftGroupStartX + idx * stepS;
        const y = milkStartY2;
        drawTooth(x, y, t);
      });
      bottomMilkRight.forEach((t, idx) => {
        const x = rightGroupStartX + idx * stepS;
        const y = milkStartY2;
        drawTooth(x, y, t);
      });
      const odontogramEndY = milkStartY2 + cell + 10;

      // Antecedentes Médicos (formato SI/NO)
      doc.setFont("helvetica", "bold");
      doc.text("ANTECEDENTES MÉDICOS", 14, odontogramEndY);
      doc.setFont("helvetica", "normal");
      const fields = [
        { label: "Problemas Cardíacos", val: medicalHistory?.has_heart_problems },
        { label: "Diabetes", val: medicalHistory?.has_diabetes },
        { label: "Hepatitis", val: medicalHistory?.has_hepatitis },
        { label: "Antecedentes Hemorrágicos", val: medicalHistory?.has_hemorrhagic_history },
        { label: "Presión Sanguínea Normal", val: medicalHistory?.has_high_blood_pressure ? false : true },
        { label: "Enfermedad Crónica Sistémica", val: medicalHistory?.has_chronic_disease },
        { label: "Asma", val: medicalHistory?.has_asthma },
        { label: "Antecedentes Alérgicos", val: medicalHistory?.has_allergic_history },
        { label: "Anemia", val: medicalHistory?.has_anemia },
        { label: "Epilepsia", val: medicalHistory?.has_epilepsy },
        { label: "Embarazo", val: medicalHistory?.is_pregnant },
      ];
      const takesMedication = !!(medicalHistory?.medications_text && medicalHistory.medications_text.trim());
      const fieldsWithMedication = [
        ...fields,
        { label: "¿Está tomando algún medicamento?", val: takesMedication }
      ];
      const startYCols = odontogramEndY + 8;
      const colLeftX = 14;
      const colRightX = 110;
      const valOffset = 76;
      const lineH = 6;
      const perCol = Math.ceil(fieldsWithMedication.length / 2);
      for (let i = 0; i < fieldsWithMedication.length; i++) {
        const col = i < perCol ? 0 : 1;
        const row = col === 0 ? i : i - perCol;
        const x = col === 0 ? colLeftX : colRightX;
        const y = startYCols + row * lineH;
        const f = fieldsWithMedication[i];
        doc.text(f.label, x, y);
        doc.text(f.val ? "SI" : "NO", x + valOffset, y);
      }
      let y = startYCols + perCol * lineH + 6;
      if (medicalHistory?.allergies_text) {
        doc.text(`Detalle Alergias: ${medicalHistory.allergies_text}`, 14, y, { maxWidth: 180 });
        y += 8;
      }
      if (medicalHistory?.medications_text) {
        doc.text(`Medicación: ${medicalHistory.medications_text}`, 14, y, { maxWidth: 180 });
        y += 8;
      }
      if (medicalHistory?.general_comments) {
        doc.text(`Comentarios: ${medicalHistory.general_comments}`, 14, y, { maxWidth: 180 });
        y += 8;
      } else {
        doc.text("Comentarios:", 14, y);
        doc.line(40, y + 1, 196, y + 1);
        y += 10;
      }
      doc.text("Firma Profesional:", 14, y);
      doc.line(55, y + 1, 120, y + 1);
      doc.text("Firma Paciente:", 130, y);
      doc.line(165, y + 1, 196, y + 1);

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
