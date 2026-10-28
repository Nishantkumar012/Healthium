import { Menu, LogOut, User } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <button
        onClick={onMenuClick}
        className="p-2 hover:bg-secondary-100 rounded-lg transition"
      >
        <Menu size={24} className="text-secondary-700" />
      </button>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-2 hover:bg-secondary-100 rounded-lg transition"
          >
            <User size={20} className="text-secondary-600" />
            <span className="text-sm font-medium text-secondary-900">{user?.email}</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-secondary-200 rounded-lg shadow-lg z-50">
              <button
                onClick={() => {
                  navigate('/profile')
                  setDropdownOpen(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-secondary-100 flex items-center gap-2"
              >
                <User size={16} />
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-danger-50 flex items-center gap-2 text-danger-600"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
