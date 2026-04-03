import { createClient } from 'next-sanity';
import { env } from '@/config/env';
import AdminOrderTable from "@/components/dashboard/AdminOrderTable";

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
});

export default async function AdminOrdersManagementPage() {
  const [orders, artists] = await Promise.all([
    client.fetch(`*[_type == "order"] | order(createdAt desc) {
      _id, orderId, customerName, userEmail, assignedArtist->{_id, name, email},
      orderStatus, paymentStatus, price, totalAmount,
      orderType, cartItems, createdAt
    }`),
    client.fetch(`*[_type == "userProfile" && role == "artist"]{_id, name, email}`),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-playfair text-ink">Global Order Management</h1>
          <p className="text-sm text-ink/40 mt-1 uppercase tracking-widest font-medium">Manage all platform commissions and status</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-ink/5 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-ink/5">
          <h2 className="text-lg font-bold font-playfair text-ink underline decoration-ink/10 underline-offset-8 decoration-4">All Active & Past Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <AdminOrderTable initialOrders={orders} artists={artists} />
        </div>
      </div>
    </div>
  );
}
