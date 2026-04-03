import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { createClient } from 'next-sanity';
import { env } from '@/config/env';
import AdminOrderTable from "@/components/dashboard/AdminOrderTable";
import StatsCard from "@/components/dashboard/StatsCard";
import { ShoppingBag, DollarSign, BarChart3, CheckCircle2, Clock, Ticket } from "lucide-react";

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
});

export default async function AdminDashboard() {
  const session: any = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const [orders, coupons, artists] = await Promise.all([
    client.fetch(`*[_type == "order"] | order(createdAt desc) {
      _id, orderId, customerName, userEmail, assignedArtist->{_id, name, email},
      orderStatus, paymentStatus, price, totalAmount,
      orderType, couponCode, discountAmount,
      cartItems, createdAt
    }`),
    client.fetch(`*[_type == "coupon"] | order(usedCount desc) {
      code, discount, type, isActive, usedCount, usageLimit, expiry
    }`),
    client.fetch(`*[_type == "userProfile" && role == "artist"]{_id, name, email}`),
  ]);

  const totalOrders = orders.length;
  const paidOrders = orders.filter((o: any) => o.paymentStatus === "paid");
  const completedOrders = orders.filter((o: any) => o.orderStatus === "completed").length;

  // Revenue from both single orders (price) and cart orders (totalAmount)
  const totalRevenue = paidOrders.reduce((acc: number, o: any) => {
    const amount = o.orderType === 'cart' ? (o.totalAmount || 0) : (o.price || 0);
    return acc + amount;
  }, 0);

  const avgOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;
  const pendingPayments = orders.filter((o: any) => o.paymentStatus === "pending").length;

  const totalCouponUses = coupons.reduce((acc: number, c: any) => acc + (c.usedCount || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <h1 className="text-3xl font-bold font-playfair">Admin Analytics</h1>
        <div className="text-sm text-ink/40">Real-time Insights</div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        <StatsCard title="Total Orders" value={totalOrders} icon={<ShoppingBag size={20} className="text-ink" />} color="bg-ink" />
        <StatsCard title="Revenue (₹)" value={`₹${totalRevenue.toLocaleString()}`} icon={<DollarSign size={20} className="text-green-600" />} color="bg-green-500" />
        <StatsCard title="Avg Order (₹)" value={`₹${avgOrderValue.toLocaleString()}`} icon={<BarChart3 size={20} className="text-purple-600" />} color="bg-purple-500" />
        <StatsCard title="Completed" value={completedOrders} icon={<CheckCircle2 size={20} className="text-green-700" />} color="bg-green-600" />
        <StatsCard title="Pending Payment" value={pendingPayments} icon={<Clock size={20} className="text-yellow-700" />} color="bg-yellow-600" />
        <StatsCard title="Coupon Uses" value={totalCouponUses} icon={<Ticket size={20} className="text-blue-700" />} color="bg-blue-600" />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-ink/5 overflow-hidden mb-12">
        <div className="p-6 border-b border-ink/5 flex justify-between items-center">
          <h2 className="font-medium">Recent Orders</h2>
          <span className="text-xs text-ink/40">Latest {Math.min(orders.length, 20)}</span>
        </div>
        <div className="overflow-x-auto">
          <AdminOrderTable initialOrders={orders} artists={artists} />
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-ink/5 overflow-hidden">
        <div className="p-6 border-b border-ink/5">
          <h2 className="font-medium">Active Coupons</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-ink/40 font-mono text-[10px] uppercase">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Discount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Used / Limit</th>
                <th className="px-6 py-3">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-ink/30 text-xs uppercase tracking-widest">
                    No coupons created yet — add them in Sanity Studio
                  </td>
                </tr>
              ) : coupons.map((coupon: any) => (
                <tr key={coupon.code} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-xs">{coupon.code}</td>
                  <td className="px-6 py-4 text-sm">
                    {coupon.type === 'percentage' ? `${coupon.discount}%` : `₹${coupon.discount}`}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {coupon.usedCount || 0} / {coupon.usageLimit || '∞'}
                  </td>
                  <td className="px-6 py-4 text-xs text-ink/50">
                    {coupon.expiry ? new Date(coupon.expiry).toLocaleDateString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



