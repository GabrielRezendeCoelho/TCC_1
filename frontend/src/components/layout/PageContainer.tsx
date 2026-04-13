import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

/**
 * Layout principal com sidebar + área de conteúdo.
 */
export function PageContainer() {
  return (
    <div className="page-container" id="page-container">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
