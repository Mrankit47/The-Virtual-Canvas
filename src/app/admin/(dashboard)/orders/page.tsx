import { client } from '@/lib/sanity';
import AdminOrderTable from "@/components/dashboard/AdminOrderTable";

export const dynamic = 'force-dynamic';

const uncachedClient = client.withConfig({ useCdn: false });

export default async function AdminOrdersManagementPage() {
  const [orders, artists] = await Promise.all([
    uncachedClient.fetch(`*[_type == "order"] | order(createdAt desc) {
      _id, 
      orderId, 
      customerName, 
      email, 
      userEmail, 
      price, 
      totalAmount, 
      discountAmount, 
      couponCode,
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
      orderStatus,
      assignedArtist->{_id, name, email},
      artworkId->{_id, title, price, isArtistUpload, artist->{_id, name, email, role}},
      "cartItemDetails": *[_type == "artwork" && _id in ^.cartItems[].artworkId] { _id, title, price, isArtistUpload, artist->{_id, name, email, role} }
    }`),
    uncachedClient.fetch(`*[_type == "userProfile" && role == "artist"]{_id, name, email}`),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black font-serif text-ink tracking-tight">Global Order Management</h1>
          <p className="text-[10px] sm:text-xs text-ink/30 mt-1 uppercase tracking-[0.2em] font-black leading-none">
            Manage all platform commissions, sales channels, and logistic parameters
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-ink/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <AdminOrderTable initialOrders={orders} artists={artists} />
        </div>
      </div>
    </div>
  );
}
