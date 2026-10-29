import { useState, useEffect } from 'react'
import { apiClient } from '@/services/api-client'
import toast from 'react-hot-toast'
import { Loader, AlertCircle, Calendar, FileText, Pill, Download, User, Clock } from 'lucide-react'

interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

interface Prescription {
  id: string
  prescriptionNumber: string
  consultationId: string
  patientId: string
  doctorId: string
  doctorName: string
  medications: Medication[]
  instructions?: string
  validUntil?: string
  isDispensed: boolean
  pdfUrl?: string
  createdAt: string
  updatedAt: string
}

export function PrescriptionsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchPrescriptions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<any>('/consultations/prescriptions')
      const prescriptionsList = response.data.data || []
      setPrescriptions(prescriptionsList)
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Failed to load prescriptions'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPrescription = async (prescription: Prescription) => {
    if (prescription.pdfUrl) {
      window.open(prescription.pdfUrl, '_blank')
    } else {
      toast.error('PDF not available for this prescription')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">My Prescriptions</h1>
        <p className="text-secondary-600 mt-2">View and manage your prescription history</p>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger-700">{error}</p>
        </div>
      )}

      {prescriptions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prescriptions List */}
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <div
                key={prescription.id}
                onClick={() => setSelectedPrescription(prescription)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                  selectedPrescription?.id === prescription.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-secondary-200 bg-white hover:border-primary-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-secondary-900">
                      {prescription.prescriptionNumber}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-secondary-600 mt-1">
                      <User className="w-4 h-4" />
                      Dr. {prescription.doctorName}
                    </div>
                  </div>
                  <div>
                    {prescription.isDispensed ? (
                      <span className="inline-block px-3 py-1 bg-success-100 text-success-800 text-xs font-medium rounded-full">
                        Dispensed
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-warning-100 text-warning-800 text-xs font-medium rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-secondary-600 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(prescription.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Pill className="w-4 h-4" />
                    {prescription.medications.length} medication(s)
                  </div>
                </div>

                {prescription.validUntil && (
                  <div className="flex items-center gap-2 text-xs text-secondary-500">
                    <Clock className="w-3 h-3" />
                    Valid until: {new Date(prescription.validUntil).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Prescription Details */}
          <div className="sticky top-6">
            {selectedPrescription ? (
              <div className="bg-white rounded-lg shadow-md border border-secondary-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-secondary-900">Prescription Details</h2>
                  {selectedPrescription.pdfUrl && (
                    <button
                      onClick={() => handleDownloadPrescription(selectedPrescription)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                  )}
                </div>

                {/* Prescription Info */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-secondary-600">Prescription #</p>
                      <p className="font-medium text-secondary-900">
                        {selectedPrescription.prescriptionNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-600">Date</p>
                      <p className="font-medium text-secondary-900">
                        {new Date(selectedPrescription.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-600">Prescribed by</p>
                      <p className="font-medium text-secondary-900">
                        Dr. {selectedPrescription.doctorName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-600">Status</p>
                      <p className={`font-medium ${selectedPrescription.isDispensed ? 'text-success-600' : 'text-warning-600'}`}>
                        {selectedPrescription.isDispensed ? 'Dispensed' : 'Pending'}
                      </p>
                    </div>
                  </div>

                  {selectedPrescription.validUntil && (
                    <div className="p-3 bg-warning-50 rounded border border-warning-200">
                      <p className="text-sm text-warning-900">
                        <strong>Valid Until:</strong> {new Date(selectedPrescription.validUntil).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Medications */}
                <div className="border-t border-secondary-200 pt-6">
                  <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                    <Pill className="w-5 h-5" />
                    Medications
                  </h3>
                  <div className="space-y-4">
                    {selectedPrescription.medications.map((medication, index) => (
                      <div
                        key={index}
                        className="p-4 bg-secondary-50 rounded-lg border border-secondary-200"
                      >
                        <h4 className="font-semibold text-secondary-900 mb-2">
                          {medication.name}
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                          <div>
                            <span className="text-secondary-600">Dosage:</span>{' '}
                            <span className="font-medium text-secondary-900">{medication.dosage}</span>
                          </div>
                          <div>
                            <span className="text-secondary-600">Frequency:</span>{' '}
                            <span className="font-medium text-secondary-900">{medication.frequency}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-secondary-600">Duration:</span>{' '}
                            <span className="font-medium text-secondary-900">{medication.duration}</span>
                          </div>
                        </div>
                        {medication.instructions && (
                          <p className="text-sm text-secondary-700 mt-2 p-2 bg-white rounded border border-secondary-200">
                            <strong>Instructions:</strong> {medication.instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* General Instructions */}
                {selectedPrescription.instructions && (
                  <div className="border-t border-secondary-200 pt-6 mt-6">
                    <h3 className="font-semibold text-secondary-900 mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      General Instructions
                    </h3>
                    <p className="text-sm text-secondary-700 p-3 bg-primary-50 rounded border border-primary-200">
                      {selectedPrescription.instructions}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md border border-secondary-200 p-12 text-center">
                <FileText className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                <p className="text-secondary-600">Select a prescription to view details</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow-md border border-secondary-200">
          <FileText className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-secondary-900 mb-2">No Prescriptions Found</h3>
          <p className="text-secondary-600 mb-6">
            You don't have any prescriptions yet. Prescriptions will appear here after your consultations.
          </p>
        </div>
      )}
    </div>
  )
}
