import { Outlet, Link } from 'react-router-dom'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <div className="layout">
      <header>
        <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 600, marginRight: '1rem' }}>AI Judge</Link>
        <Navbar />
      </header>
      <main>
        <Outlet />
      </main>
      <footer>{/* 页脚 */}</footer>
    </div>
  )
}
