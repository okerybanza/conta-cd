import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#FAFBFC' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen ml-56">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#FAFBFC' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
