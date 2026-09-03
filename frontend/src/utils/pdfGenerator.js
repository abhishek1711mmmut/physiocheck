import jsPDF from 'jspdf';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function generatePDF(assessment) {
  const doc = new jsPDF();
  let y = 20;
  const pageHeight = 280;
  const margin = 20;
  const rightCol = 110;

  const checkPageBreak = (needed = 10) => {
    if (y + needed > pageHeight) {
      doc.addPage();
      y = 20;
    }
  };

  const addTitle = (text) => {
    checkPageBreak(12);
    y += 3;
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text(text, margin, y);
    y += 2;
    doc.setDrawColor(180);
    doc.line(margin, y, 190, y);
    y += 5;
  };

  const addSubTitle = (text) => {
    checkPageBreak(10);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(text, margin + 2, y);
    y += 5;
  };

  const addRow = (label, value, x = margin + 4) => {
    checkPageBreak(6);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(`${label}: `, x, y);
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.setFont(undefined, 'normal');
    doc.text(String(value), x + labelWidth, y);
    y += 4.5;
  };

  const addRowAt = (label, value, x, rowY) => {
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(`${label}: `, x, rowY);
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.setFont(undefined, 'normal');
    doc.text(String(value), x + labelWidth, rowY);
  };

  // Header
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('PhysioCheck Assessment Report', margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(80);
  doc.text(`${assessment.specialtyName} Assessment`, margin, y);
  doc.text(`Date: ${formatDate(assessment.date)}`, rightCol, y);
  doc.setTextColor(0);
  y += 3;
  doc.setDrawColor(50);
  doc.setLineWidth(0.5);
  doc.line(margin, y, 190, y);
  doc.setLineWidth(0.2);
  y += 6;

  // Patient Information — two-column layout
  const cf = assessment.commonFields || {};
  addTitle('Patient Information');

  const startY = y;
  addRowAt('Name', cf.patientName || 'N/A', margin + 4, startY);
  addRowAt('Age', cf.age || 'N/A', rightCol, startY);
  y = startY + 4.5;

  addRowAt('Gender', cf.gender || 'N/A', margin + 4, y);
  addRowAt('Diagnosis', cf.diagnosis || 'N/A', rightCol, y);
  y += 4.5;

  addRowAt('VAS', cf.vas != null ? `${cf.vas}/10` : 'N/A', margin + 4, y);
  addRowAt('NPRS', cf.nprs != null ? `${cf.nprs}/10` : 'N/A', rightCol, y);
  y += 7;

  // Findings
  const filledFindings = Object.entries(assessment.findings || {}).filter(([, v]) => v && v !== false);
  if (filledFindings.length > 0) {
    addTitle('Assessment Findings');
    let currentSection = '';
    filledFindings.forEach(([key, value]) => {
      const parts = key.split('|');
      const section = parts[0];
      const label = parts[parts.length - 1];
      if (section !== currentSection) {
        currentSection = section;
        addSubTitle(section);
      }
      addRow(label, value === true ? 'Present' : value);
    });
    y += 2;
  }

  // Special Tests
  const filledTests = Object.entries(assessment.specialTestResults || {}).filter(([, v]) => v);
  if (filledTests.length > 0) {
    addTitle('Special Test Results');
    filledTests.forEach(([name, result]) => addRow(name, result));
    y += 2;
  }

  // Outcome Scores
  const filledScores = Object.entries(assessment.outcomeScores || {}).filter(([, v]) => v);
  if (filledScores.length > 0) {
    addTitle('Outcome Measure Scores');
    filledScores.forEach(([name, score]) => addRow(name, score));
    y += 2;
  }

  // Problem List
  if (assessment.problemList?.length > 0) {
    addTitle('Problem List');
    assessment.problemList.forEach((p, i) => {
      checkPageBreak(6);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`${i + 1}. ${p}`, margin + 4, y);
      y += 4.5;
    });
    y += 2;
  }

  // Goals
  if (assessment.goals?.shortTerm?.length > 0 || assessment.goals?.longTerm?.length > 0) {
    addTitle('Treatment Goals');
    if (assessment.goals.shortTerm?.length > 0) {
      addSubTitle('Short-term Goals');
      assessment.goals.shortTerm.forEach((g, i) => {
        checkPageBreak(6);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`${i + 1}. ${g}`, margin + 6, y);
        y += 4.5;
      });
      y += 1;
    }
    if (assessment.goals.longTerm?.length > 0) {
      addSubTitle('Long-term Goals');
      assessment.goals.longTerm.forEach((g, i) => {
        checkPageBreak(6);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`${i + 1}. ${g}`, margin + 6, y);
        y += 4.5;
      });
    }
    y += 2;
  }

  // Notes
  if (assessment.notes) {
    addTitle('Therapist Notes');
    checkPageBreak(10);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const lines = doc.splitTextToSize(assessment.notes, 166);
    lines.forEach(line => {
      checkPageBreak(5);
      doc.text(line, margin + 4, y);
      y += 4.5;
    });
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150);
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Generated by PhysioCheck | Page ${i} of ${pageCount}`, margin, 290);
  }

  const patientName = (cf.patientName || 'patient').replace(/\s+/g, '_');
  doc.save(`PhysioCheck_${patientName}_${assessment.specialtyName}_${new Date(assessment.date).toISOString().split('T')[0]}.pdf`);
}
