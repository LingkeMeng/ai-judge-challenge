import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/upload', label: 'Upload' },
  { to: '/judges', label: 'Judges' },
  { to: '/queues', label: 'Queues' },
  { to: '/results', label: 'Results' },
] as const

export function Navbar() {
  const location = useLocation()

  return (
    <nav
      style={{
        display: 'flex',
        gap: '1.5rem',
        padding: '1rem 0',
        borderBottom: '1px solid #444',
      }}
    >
      {navItems.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          style={{
            color: location.pathname === to || (to === '/queues' && location.pathname.startsWith('/queues/')) ? '#646cff' : 'inherit',
            textDecoration: location.pathname === to || (to === '/queues' && location.pathname.startsWith('/queues/')) ? 'underline' : 'none',
          }}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
