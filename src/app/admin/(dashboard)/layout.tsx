import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout userRole="admin">
      {children}
    </DashboardLayout>
  );
}
