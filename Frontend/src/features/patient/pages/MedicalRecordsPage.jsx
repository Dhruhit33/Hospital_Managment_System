import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  Pill,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Paperclip,
  Download,
  Eye,
  HeartPulse,
} from 'lucide-react'
import { recordsApi } from '@/api/records'
import { patientApi } from '@/api/patient'
import { downloadReportFile } from '@/lib/reportDownload'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useAuthStore } from '@/store/authStore'

export function MedicalRecordsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [previewDoc, setPreviewDoc] = useState(null)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [alert, setAlert] = useState({ type: '', text: '' })

  // Fetch patient profile to resolve exact student/patient ID, name and email
  const { data: profile } = useQuery({
    queryKey: ['patient-profile-records'],
    queryFn: () => patientApi.getProfile().catch(() => null),
  })

  // Fetch patient records (merges backend + client stored records)
  const { data: recordsData, isLoading, isFetching } = useQuery({
    queryKey: ['patient-records', profile?.id, profile?.email, user?.id, user?.email],
    queryFn: () => recordsApi.getPatientRecords({ page: 0, size: 50 }, profile),
  })

  const records = recordsData?.content || []

  // Delete Record Mutation (removes from patient view)
  const deleteMutation = useMutation({
    mutationFn: (id) => recordsApi.deletePatientRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-records'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-patient-records'] })
      queryClient.invalidateQueries({ queryKey: ['patient-records-preview'] })
      setRecordToDelete(null)
      setAlert({
        type: 'success',
        text: 'Medical record removed from your view successfully.',
      })
    },
    onError: (err) => {
      setRecordToDelete(null)
      setAlert({
        type: 'error',
        text: err.response?.data?.message || err?.message || 'Failed to remove record.',
      })
    },
  })

  const handleDownloadAttachment = (rec) => {
    downloadReportFile({
      attachmentData: rec.attachmentData,
      attachmentName: rec.attachmentName,
      diagnosis: rec.diagnosis || 'Clinical Medical Record',
      notes: rec.notes || '',
      prescriptions: rec.prescriptions || [],
      patientName: rec.patientName || profile?.name || user?.name || 'Patient',
      doctorName: rec.doctorName || 'Attending Physician',
      doctorSpecialization: rec.doctorSpecialization || 'Clinical Medicine',
      date: rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
      id: rec.id,
      appointmentId: rec.appointmentId,
    })
    setAlert({ type: 'success', text: `Downloaded certified PDF: ${rec.diagnosis || 'Report'}` })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Electronic Medical Records & Diagnostic Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Official clinical diagnoses, lab diagnostic reports, and electronic prescriptions issued by your attending physicians.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {alert.type === 'debug' && (<div className="bg-yellow-100 p-4">{alert.text}</div>)}
      {alert.text && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between font-medium ${
            alert.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-destructive/10 border border-destructive/20 text-destructive'
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{alert.text}</span>
          </div>
          <button
            onClick={() => setAlert({ type: '', text: '' })}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Records List View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Electronic Medical Records ({records.length})
          </h3>
          {isFetching && !isLoading && (
            <span className="text-xs text-primary animate-pulse">Refreshing records...</span>
          )}
        </div>

        {isLoading ? (
          <div className="py-16 flex justify-center"><LoadingSpinner /></div>
        ) : records.length === 0 ? (
          <Card className="border-border/80 shadow-2xs">
            <CardContent className="py-14 text-center space-y-3">
              <HeartPulse className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-800">
                No clinical records filed yet
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Clinical diagnoses, laboratory diagnostic reports, and electronic prescriptions issued by your attending physicians will appear here once officially filed.
              </p>
            </CardContent>
          </Card>
        ) : (
          records.map((rec) => (
            <Card key={rec.id} className="border-border/80 shadow-2xs">
              <CardContent className="p-5 space-y-3.5">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900">{rec.diagnosis}</h4>
                      {rec.recordType && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {rec.recordType}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Recorded on {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : 'Recent'} • {rec.doctorName || (rec.doctorId ? `Consulting Doctor #${rec.doctorId}` : 'Attending Physician')}
                      {rec.doctorSpecialization && ` (${rec.doctorSpecialization})`}
                    </p>
                  </div>
                  {rec.followUpDate && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md shrink-0">
                      Follow-up: {rec.followUpDate}
                    </span>
                  )}
                </div>

                {rec.notes && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs text-slate-700">
                    <strong>Physician Notes:</strong> {rec.notes}
                  </div>
                )}

                {rec.attachmentName && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-lg w-fit">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Attached Document: <strong>{rec.attachmentName}</strong> {rec.attachmentSize ? `(${rec.attachmentSize})` : ''}</span>
                  </div>
                )}

                {rec.prescriptions?.length > 0 && (
                  <div className="pt-2 border-t border-border/60 space-y-1.5">
                    <h5 className="text-[11px] font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-primary" />
                      Prescriptions ({rec.prescriptions.length})
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {rec.prescriptions.map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className="p-2.5 rounded-lg border border-border/80 bg-slate-50/60 text-xs"
                        >
                          <div className="font-semibold text-slate-900">{p.medicineName}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {p.dosage} • {p.frequency} • {p.durationDays ? `${p.durationDays} days` : ''}
                          </div>
                          {p.instructions && (
                            <div className="text-[10px] text-slate-600 mt-1 italic">
                              "{p.instructions}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadAttachment(rec)}
                      className="text-xs h-8 gap-1.5 text-emerald-700 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/80 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Lab Report & EHR (PDF)
                    </Button>
                    {rec.attachmentData && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewDoc(rec)}
                        className="text-xs h-8 gap-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview Document
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRecordToDelete(rec)}
                    disabled={deleteMutation.isPending}
                    className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Record
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Medical Record</h3>
                <p className="text-xs text-muted-foreground">Record #{recordToDelete.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this clinical record (<strong>{recordToDelete.diagnosis}</strong>) from your view?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRecordToDelete(null)}
                className="text-xs"
              >
                Keep Record
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteMutation.mutate(recordToDelete.id)}
                disabled={deleteMutation.isPending}
                className="text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                  {previewDoc.attachmentName || 'Diagnostic Report Document'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleDownloadAttachment(previewDoc)}
                  className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-white h-8"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/50 min-h-[400px]">
              {previewDoc.attachmentType?.startsWith('image/') || previewDoc.attachmentData?.startsWith('data:image/') ? (
                <img
                  src={previewDoc.attachmentData}
                  alt={previewDoc.attachmentName}
                  className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-xs border"
                />
              ) : previewDoc.attachmentType?.includes('pdf') || previewDoc.attachmentData?.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewDoc.attachmentData}
                  title={previewDoc.attachmentName}
                  className="w-full h-[75vh] rounded-lg border shadow-xs"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="w-12 h-12 text-primary/60 mx-auto" />
                  <p className="text-xs text-slate-700 font-medium">
                    {previewDoc.attachmentName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Direct browser preview unavailable for this format. Please download the file to view.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleDownloadAttachment(previewDoc)}
                    className="text-xs gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
