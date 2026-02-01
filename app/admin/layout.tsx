import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Admin Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Admin pages will render here */}
        {children}
      </main>
    </div>
  );
}
