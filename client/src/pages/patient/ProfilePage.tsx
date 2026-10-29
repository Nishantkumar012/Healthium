import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/services/api-client'
import toast from 'react-hot-toast'
import { Edit2, Mail, Phone, MapPin, Calendar, Loader, AlertCircle } from 'lucide-react'

interface PatientProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
  avatarUrl?: string
  isEmailVerified: boolean
  isPhoneVerified: boolean
}

export function ProfilePage() {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
    },
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<any>('/users/profile')
      const profileData = response.data.data
      setProfile(profileData)

      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        phone: profileData.phone || '',
        dateOfBirth: profileData.dateOfBirth || '',
        gender: profileData.gender || '',
        address: profileData.address || {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: '',
        },
      })
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Failed to load profile'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name.startsWith('address.')) {
      const addressField = name.replace('address.', '')
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      await apiClient.put('/users/profile', formData)
      toast.success('Profile updated successfully')
      setIsEditing(false)
      fetchProfile()
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Failed to update profile'
      toast.error(message)
    } finally {
      setIsSaving(false)
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-secondary-900">My Profile</h1>
        <button
          onClick={() => {
            if (isEditing) {
              fetchProfile()
            }
            setIsEditing(!isEditing)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
        >
          <Edit2 className="w-4 h-4" />
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger-700">{error}</p>
        </div>
      )}

      {/* Profile Card */}
      {profile && (
        <div className="bg-white rounded-lg shadow-md border border-secondary-200 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6 border-b border-secondary-200">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 bg-primary-200 rounded-full flex items-center justify-center text-3xl">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  '👤'
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary-900">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-primary-700">{profile.email}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="input-base disabled:bg-secondary-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="input-base disabled:bg-secondary-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="input-base bg-secondary-100 cursor-not-allowed"
                />
                {profile.isEmailVerified && (
                  <p className="text-xs text-success-600 mt-1">✓ Verified</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="+1 (555) 000-0000"
                  className="input-base disabled:bg-secondary-100 disabled:cursor-not-allowed"
                />
                {profile.isPhoneVerified && (
                  <p className="text-xs text-success-600 mt-1">✓ Verified</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="input-base disabled:bg-secondary-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="input-base disabled:bg-secondary-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Address Information */}
            <div className="border-t border-secondary-200 pt-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Street
                  </label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="input-base disabled:bg-secondary-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="input-base disabled:bg-secondary-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="input-base disabled:bg-secondary-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="input-base disabled:bg-secondary-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="input-base disabled:bg-secondary-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="flex gap-3 pt-6 border-t border-secondary-200">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
