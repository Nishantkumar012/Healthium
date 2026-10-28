import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  BarChart3,
  Settings,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const getMenuItems = () => {
    if (!user) return []

    const commonItems = [
      { icon: LayoutDashboard, label: 'Dashboard', href: `/${user.role}/dashboard` },
      { icon: Settings, label: 'Profile', href: '/profile' },
    ]

    const roleItems: Record<string, typeof commonItems> = {
      patient: [
        ...commonItems,
        { icon: Calendar, label: 'Book Consultation', href: '/patient/book' },
        { icon: FileText, label: 'My Consultations', href: '/patient/consultations' },
        { icon: FileText, label: 'Prescriptions', href: '/patient/prescriptions' },
      ],
      doctor: [
        ...commonItems,
        { icon: Calendar, label: 'Manage Availability', href: '/doctor/availability' },
        { icon: FileText, label: 'Consultations', href: '/doctor/consultations' },
      ],
      admin: [
        ...commonItems,
        { icon: Users, label: 'Users', href: '/admin/users' },
        { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
      ],
    }

    return roleItems[user.role] || commonItems
  }

  const menuItems = getMenuItems()
  const isActive = (href: string) => location.pathname === href

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white border-r border-secondary-200 transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-600">Healthum</h1>
          <button onClick={onToggle} className="lg:hidden p-2 hover:bg-secondary-100 rounded">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <button
                key={item.href}
                onClick={() => {
                  navigate(item.href)
                  onToggle()
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium',
                  active
                    ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-600'
                    : 'text-secondary-600 hover:bg-secondary-50'
                )}
              >
                <Icon size={20} />
                <span className="flex-1 text-left">{item.label}</span>
                {active && <ChevronRight size={20} />}
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
