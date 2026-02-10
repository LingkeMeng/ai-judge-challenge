import { Outlet, Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/upload', label: 'Upload' },
  { to: '/judges', label: 'Judges' },
  { to: '/queues', label: 'Queues' },
  { to: '/results', label: 'Results' },
]

export function Layout() {
  const location = useLocation()

  return (
    <div className="layout">
      <header className="app-header">
        <Link to="/" className="app-brand">AI Judge</Link>
        <nav className="app-nav">
          {navItems.map(({ to, label }) => {
            const isActive = location.pathname === to || (to === '/queues' && location.pathname.startsWith('/queues/'))
            return (
              <Link key={to} to={to} className={isActive ? 'active' : ''}>
                {label}
              </Link>
            )
          })}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
