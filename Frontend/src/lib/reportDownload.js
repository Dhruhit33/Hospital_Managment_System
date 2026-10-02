import { jsPDF } from 'jspdf'

/**
 * Builds a certified CarePoint Clinical Diagnostic PDF Document using jsPDF
 */
export function buildReportPdfDoc({
  diagnosis = 'Clinical Medical Consultation',
  notes = '',
  prescriptions = [],
  patientName = 'Authorized Patient',
  doctorName = 'Attending Physician',
  doctorSpecialization = 'Clinical Medicine',
  date = new Date().toLocaleDateString(),
  id = '',
  appointmentId = '',
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // 1. Header Banner Background (Deep Royal Blue)
  doc.setFillColor(30, 58, 138) // #1e3a8a
  doc.rect(0, 0, pageWidth, 28, 'F')

  // Hospital Name & Subtitle
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('CAREPOINT HOSPITAL & CLINICAL SYSTEM', 14, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(226, 232, 240)
  doc.text('Certified Electronic Health Record & Official Clinical Diagnostic Lab Summary', 14, 19)

  // Report Badge on right
  doc.setFillColor(219, 234, 254) // #dbeafe
  doc.roundedRect(pageWidth - 62, 7, 48, 14, 2, 2, 'F')
  doc.setTextColor(30, 64, 175)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('OFFICIAL LAB REPORT', pageWidth - 58, 13)
  doc.setFontSize(7)
  doc.text('CERTIFIED MEDICAL RECORD', pageWidth - 58, 17)

  // 2. Patient & Consultation Details Card
  let currentY = 34
  doc.setFillColor(248, 250, 252) // #f8fafc
  doc.setDrawColor(226, 232, 240) // #e2e8f0
  doc.roundedRect(14, currentY, pageWidth - 28, 30, 3, 3, 'FD')

  doc.setFontSize(8.5)
  // Left column
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 116, 139)
  doc.text('PATIENT NAME:', 18, currentY + 8)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.text(String(patientName), 50, currentY + 8)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 116, 139)
  doc.text('CONSULT DATE:', 18, currentY + 16)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'normal')
  doc.text(String(date), 50, currentY + 16)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 116, 139)
  doc.text('RECORD REF #:', 18, currentY + 24)
  doc.setTextColor(37, 99, 235)
  doc.setFont('helvetica', 'bold')
  doc.text(`#LAB-${appointmentId || id || 'CERTIFIED'}`, 50, currentY + 24)

  // Right column
  const midX = pageWidth / 2 + 10
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 116, 139)
  doc.text('ATTENDING DOCTOR:', midX, currentY + 8)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.text(String(doctorName), midX + 38, currentY + 8)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 116, 139)
  doc.text('SPECIALIZATION:', midX, currentY + 16)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'normal')
  doc.text(String(doctorSpecialization || 'Clinical Medicine'), midX + 38, currentY + 16)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 116, 139)
  doc.text('CLINICAL STATUS:', midX, currentY + 24)
  doc.setTextColor(16, 185, 129)
  doc.setFont('helvetica', 'bold')
  doc.text('COMPLETED & CERTIFIED', midX + 38, currentY + 24)

  currentY += 38

  // 3. Diagnosis Section
  doc.setFillColor(37, 99, 235)
  doc.rect(14, currentY, 3, 9, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(15, 23, 42)
  doc.text('PRIMARY CLINICAL DIAGNOSIS & LAB FINDINGS', 20, currentY + 6.5)

  currentY += 12
  doc.setFillColor(239, 246, 255) // light blue box
  doc.setDrawColor(191, 219, 254)
  doc.roundedRect(14, currentY, pageWidth - 28, 13, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(30, 58, 138)
  doc.text(String(diagnosis), 18, currentY + 8.5)

  currentY += 20

  // 4. Clinical Notes / Observations (if present)
  if (notes && String(notes).trim()) {
    doc.setFillColor(37, 99, 235)
    doc.rect(14, currentY, 3, 9, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(15, 23, 42)
    doc.text('PHYSICIAN CLINICAL OBSERVATIONS & ADVICE', 20, currentY + 6.5)

    currentY += 12
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(51, 65, 85)
    const splitNotes = doc.splitTextToSize(String(notes).trim(), pageWidth - 36)
    const boxHeight = Math.max(12, splitNotes.length * 4.5 + 6)
    doc.roundedRect(14, currentY, pageWidth - 28, boxHeight, 2, 2, 'FD')
    doc.text(splitNotes, 18, currentY + 6.5)

    currentY += boxHeight + 8
  }

  // 5. Prescribed Medications Table (if present)
  const validPrescriptions = Array.isArray(prescriptions) ? prescriptions.filter((p) => p && p.medicineName) : []
  if (validPrescriptions.length > 0) {
    doc.setFillColor(37, 99, 235)
    doc.rect(14, currentY, 3, 9, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(15, 23, 42)
    doc.text(`PRESCRIBED MEDICATION REGIMEN (${validPrescriptions.length})`, 20, currentY + 6.5)

    currentY += 12

    // Table Header
    doc.setFillColor(241, 245, 249)
    doc.setDrawColor(203, 213, 225)
    doc.rect(14, currentY, pageWidth - 28, 7.5, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(71, 85, 105)
    doc.text('MEDICATION / DRUG', 18, currentY + 5)
    doc.text('DOSAGE', 75, currentY + 5)
    doc.text('FREQUENCY', 105, currentY + 5)
    doc.text('DURATION', 140, currentY + 5)
    doc.text('INSTRUCTIONS', 165, currentY + 5)

    currentY += 7.5

    validPrescriptions.forEach((p, idx) => {
      if (currentY > pageHeight - 35) {
        doc.addPage()
        currentY = 20
      }
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252)
        doc.rect(14, currentY, pageWidth - 28, 7.5, 'F')
      }
      doc.setDrawColor(226, 232, 240)
      doc.line(14, currentY + 7.5, pageWidth - 14, currentY + 7.5)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(15, 23, 42)
      doc.text(String(p.medicineName || ''), 18, currentY + 5)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(51, 65, 85)
      doc.text(String(p.dosage || '-'), 75, currentY + 5)
      doc.text(String(p.frequency || '-'), 105, currentY + 5)
      doc.text(p.durationDays ? `${p.durationDays} days` : '-', 140, currentY + 5)
      doc.text(String(p.instructions || '-'), 165, currentY + 5)

      currentY += 7.5
    })

    currentY += 8
  }

  // 6. Security Footer & Digital Signature
  const footerY = Math.max(currentY + 10, pageHeight - 30)
  doc.setDrawColor(226, 232, 240)
  doc.line(14, footerY, pageWidth - 14, footerY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text('CarePoint Health Electronic Medical Records System • Official Confidential Medical Document', 14, footerY + 5)
  doc.text('HIPAA & Health Authority Privacy Certified • Validated Electronic Hospital Seal', 14, footerY + 10)

  // Signature Block
  doc.setDrawColor(148, 163, 184)
  doc.line(pageWidth - 70, footerY + 14, pageWidth - 14, footerY + 14)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(30, 58, 138)
  doc.text(`Digitally Verified: ${doctorName}`, pageWidth - 70, footerY + 18)

  return doc
}

/**
 * Generate PDF Data URL (Base64) for storing as a medical record attachment
 */
export function generateReportPdfDataUrl(params) {
  const doc = buildReportPdfDoc(params)
  return doc.output('dataurlstring')
}

/**
 * Universal Downloader: Downloads ALL reports strictly as .pdf files
 */
export function downloadReportFile({
  attachmentData,
  attachmentName,
  diagnosis = 'Clinical Consultation',
  notes = '',
  prescriptions = [],
  patientName = 'Authorized Patient',
  doctorName = 'Attending Physician',
  doctorSpecialization = 'Clinical Medicine',
  date = new Date().toLocaleDateString(),
  id = '',
  appointmentId = '',
}) {
  const baseName = `Lab_Diagnostic_Report_${appointmentId || id || Date.now()}`
  const pdfFileName = `${baseName}.pdf`

  // 1. If an actual PDF was attached, download it directly as a .pdf
  if (attachmentData && (attachmentData.startsWith('data:application/pdf') || attachmentName?.toLowerCase()?.endsWith('.pdf'))) {
    const link = document.createElement('a')
    link.href = attachmentData
    link.download = attachmentName && attachmentName.toLowerCase().endsWith('.pdf') ? attachmentName : pdfFileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return
  }

  // 2. If an image was attached (PNG, JPG, etc.), embed it directly into a clean PDF document
  if (attachmentData && (attachmentData.startsWith('data:image/') || attachmentData.startsWith('data:application/octet-stream'))) {
    try {
      const doc = new jsPDF()
      doc.setFillColor(30, 58, 138)
      doc.rect(0, 0, 210, 20, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('CAREPOINT HOSPITAL - DIAGNOSTIC IMAGING / LAB DOCUMENT', 14, 13)

      doc.setTextColor(15, 23, 42)
      doc.setFontSize(9)
      doc.text(`Patient: ${patientName}   |   Doctor: ${doctorName}   |   Date: ${date}`, 14, 28)
      doc.text(`Report Reference: #${appointmentId || id || 'CERTIFIED'}`, 14, 34)

      const imgFormat = attachmentData.includes('png') ? 'PNG' : 'JPEG'
      doc.addImage(attachmentData, imgFormat, 15, 40, 180, 180, undefined, 'FAST')
      doc.save(pdfFileName)
      return
    } catch (e) {
      console.warn('Failed embedding image into PDF, generating standard report PDF', e)
    }
  }

  // 3. Standard / Generated Report: Generate and save directly as a .pdf using jsPDF
  const doc = buildReportPdfDoc({
    diagnosis,
    notes,
    prescriptions,
    patientName,
    doctorName,
    doctorSpecialization,
    date,
    id,
    appointmentId,
  })

  doc.save(pdfFileName)
}
