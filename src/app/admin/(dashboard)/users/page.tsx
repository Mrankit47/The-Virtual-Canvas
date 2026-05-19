import { client } from '@/lib/sanity';
import AdminUserManagement from '@/components/dashboard/AdminUserManagement';

export const revalidate = 0; // Force dynamic fetching to see new registrations and new orders immediately

export default async function AdminUsersPage() {
  const [users, orders] = await Promise.all([
    // 1. Fetch all users
    client.fetch(
      `*[_type == "userProfile" && (role == "user" || role == "admin")] | order(name asc) {_id, name, email, role, image}`
    ),
    // 2. Fetch all orders with full details
    client.fetch(
      `*[_type == "order"] | order(createdAt desc) {
        _id, 
        orderId, 
        customerName, 
        email, 
        userEmail, 
        price, 
        totalAmount, 
        orderType, 
        cartItems, 
        createdAt, 
        address, 
        pincode, 
        phone, 
        artworkType, 
        description, 
        referenceImage, 
        paymentStatus, 
        orderStatus
      }`
    ),
  ]);

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black font-serif text-ink tracking-tight">User Administration</h1>
        <p className="text-[10px] sm:text-xs text-ink/30 mt-1 uppercase tracking-[0.2em] font-black leading-none">
          Manage Users, Inspect Orders & Transaction Parameters
        </p>
      </div>

      {/* Render the interactive Client Component */}
      <AdminUserManagement initialUsers={users} initialOrders={orders} />
    </div>
  );
}
