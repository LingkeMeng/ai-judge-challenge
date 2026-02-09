import { Outlet, Link } from 'react-router-dom'

export function Layout() {
  return (
    <div className="layout">
      <header>
      <nav>
        <Link to="/">Home</Link> | <Link to="/upload">Upload</Link> | <Link to="/judges">Judges</Link> | <Link to="/queue">Queue</Link>
      </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>{/* 页脚 */}</footer>
    </div>
  )
}
