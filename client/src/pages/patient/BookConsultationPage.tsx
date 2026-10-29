import { useState, useEffect } from 'react'
import { apiClient } from '@/services/api-client'
import toast from 'react-hot-toast'
import { Search, Filter, Loader, AlertCircle, Star, MapPin, DollarSign, Calendar, Clock } from 'lucide-react'

interface Doctor {
  id: string
  userId: string
  firstName: string
  lastName: string
  specialization: string[]
  qualification: string
  experienceYears: number
  consultationFee: number
  rating: number
  totalConsultations: number
  bio?: string
  isAvailable: boolean
}

interface AvailabilitySlot {
  id: string
  doctorId: string
  slotDate: string
  startTime: string
  endTime: string
  status: 'available' | 'booked' | 'blocked'
}

export function BookConsultationPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [bookingType, setBookingType] = useState<'video' | 'audio' | 'chat'>('video')
  const [notes, setNotes] = useState('')
  const [isBooking, setIsBooking] = useState(false)

  useEffect(() => {
    fetchDoctors()
  }, [])

  useEffect(() => {
    filterDoctors()
  }, [doctors, searchTerm, selectedSpecialization])

  const fetchDoctors = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<any>('/doctors?isAvailable=true')
      const doctorsList = response.data.data || []
      setDoctors(doctorsList)
      setFilteredDoctors(doctorsList)
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Failed to load doctors'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const filterDoctors = () => {
    let filtered = doctors

    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.bio?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedSpecialization) {
      filtered = filtered.filter((d) =>
        d.specialization.includes(selectedSpecialization)
      )
    }

    setFilteredDoctors(filtered)
  }

  const fetchAvailableSlots = async (doctorId: string) => {
    try {
      const response = await apiClient.get<any>(`/doctors/${doctorId}/availability`)
      const slots = response.data.data || []
      const available = slots.filter((s: any) => s.status === 'available')
      setAvailableSlots(available)
    } catch (err: any) {
      toast.error('Failed to load available slots')
    }
  }

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setSelectedSlot(null)
    fetchAvailableSlots(doctor.id)
  }

  const handleBookConsultation = async () => {
    if (!selectedDoctor || !selectedSlot) {
      toast.error('Please select a doctor and time slot')
      return
    }

    setIsBooking(true)
    try {
      await apiClient.post('/consultations', {
        doctorId: selectedDoctor.id,
        slotId: selectedSlot.id,
        consultationType: bookingType,
        chiefComplaint: notes,
      })

      toast.success('Consultation booked successfully!')
      setSelectedDoctor(null)
      setSelectedSlot(null)
      setNotes('')
      setBookingType('video')
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Failed to book consultation'
      toast.error(message)
    } finally {
      setIsBooking(false)
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
        <h1 className="text-3xl font-bold text-secondary-900">Book a Consultation</h1>
        <p className="text-secondary-600 mt-2">Find and book a consultation with our experienced doctors</p>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctors List */}
        <div className="lg:col-span-2">
          {/* Search and Filter */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Search doctors by name or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-base pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-secondary-600" />
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="input-base flex-1"
              >
                <option value="">All Specializations</option>
                <option value="Cardiology">Cardiology</option>
                <option value="General Practice">General Practice</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Psychiatry">Psychiatry</option>
              </select>
            </div>
          </div>

          {/* Doctors Grid */}
          <div className="space-y-4">
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  onClick={() => handleSelectDoctor(doctor)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    selectedDoctor?.id === doctor.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-secondary-200 bg-white hover:border-primary-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </h3>
                      <p className="text-sm text-secondary-600">
                        {doctor.specialization.join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-warning-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-semibold">{doctor.rating}</span>
                      </div>
                      <p className="text-xs text-secondary-500">
                        {doctor.totalConsultations} consultations
                      </p>
                    </div>
                  </div>

                  {doctor.bio && (
                    <p className="text-sm text-secondary-600 mb-3">{doctor.bio}</p>
                  )}

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-secondary-700">
                      <Clock className="w-4 h-4" />
                      {doctor.experienceYears}y exp
                    </div>
                    <div className="flex items-center gap-2 text-secondary-700">
                      <DollarSign className="w-4 h-4" />
                      ${doctor.consultationFee}
                    </div>
                    <div className="flex items-center gap-2">
                      {doctor.isAvailable ? (
                        <span className="text-success-600 font-medium">Available</span>
                      ) : (
                        <span className="text-secondary-500">Unavailable</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-secondary-600">No doctors found</p>
              </div>
            )}
          </div>
        </div>

        {/* Booking Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md border border-secondary-200 p-6 sticky top-6">
            <h2 className="text-xl font-bold text-secondary-900 mb-6">Booking Details</h2>

            {selectedDoctor ? (
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-secondary-600 mb-2">Selected Doctor</p>
                  <p className="font-semibold text-secondary-900">
                    Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                  </p>
                  <p className="text-sm text-secondary-600">
                    ${selectedDoctor.consultationFee}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Consultation Type
                  </label>
                  <select
                    value={bookingType}
                    onChange={(e) => setBookingType(e.target.value as any)}
                    className="input-base"
                  >
                    <option value="video">Video Call</option>
                    <option value="audio">Audio Call</option>
                    <option value="chat">Text Chat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Time Slot
                  </label>
                  {availableSlots.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full p-2 text-sm rounded border-2 transition ${
                            selectedSlot?.id === slot.id
                              ? 'border-primary-600 bg-primary-50 text-primary-900'
                              : 'border-secondary-200 hover:border-primary-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(slot.slotDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-secondary-600 mt-1">
                            {slot.startTime} - {slot.endTime}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-secondary-600">No available slots</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Chief Complaint (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe your symptoms or reason for consultation..."
                    className="input-base resize-none"
                    rows={4}
                  />
                </div>

                <button
                  onClick={handleBookConsultation}
                  disabled={!selectedSlot || isBooking}
                  className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isBooking ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Book Consultation'
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-secondary-600">Select a doctor to proceed</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
