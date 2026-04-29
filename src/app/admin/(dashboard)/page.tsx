import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { redirect } from "next/navigation";
import { client } from '@/lib/sanity';
import { env } from '@/config/env';
import AdminOrderTable from "@/components/dashboard/AdminOrderTable";
import StatsCard from "@/components/dashboard/StatsCard";
import { ShoppingBag, DollarSign, BarChart3, CheckCircle2, Clock, Ticket } from "lucide-react";



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
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white p-6 sm:p-8 rounded-[32px] border border-ink/5 shadow-sm">
        <div>
          <h1 className="text-3xl font-black font-serif text-ink tracking-tight">Admin Analytics</h1>
          <p className="text-[10px] sm:text-xs text-ink/30 mt-1 uppercase tracking-[0.2em] font-black leading-none">Global Control & Intelligence</p>
        </div>
        <div className="px-5 py-2.5 bg-ink/5 text-ink/40 rounded-2xl text-[10px] font-black border border-ink/5 uppercase tracking-[0.2em]">Real-time Insights</div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard title="Total Orders" value={totalOrders} icon={<ShoppingBag size={20} className="text-ink" />} color="bg-ink" />
        <StatsCard title="Revenue (₹)" value={`₹${totalRevenue.toLocaleString()}`} icon={<DollarSign size={20} className="text-emerald-600" />} color="bg-emerald-500" />
        <StatsCard title="Avg Order (₹)" value={`₹${avgOrderValue.toLocaleString()}`} icon={<BarChart3 size={20} className="text-sky-600" />} color="bg-sky-500" />
        <StatsCard title="Completed" value={completedOrders} icon={<CheckCircle2 size={20} className="text-emerald-700" />} color="bg-emerald-600" />
        <StatsCard title="Pending Payment" value={pendingPayments} icon={<Clock size={20} className="text-amber-700" />} color="bg-amber-600" />
        <StatsCard title="Coupon Uses" value={totalCouponUses} icon={<Ticket size={20} className="text-sky-700" />} color="bg-sky-600" />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-ink/5 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-ink/5 flex justify-between items-center">
          <h2 className="font-black font-serif text-xl tracking-tight text-ink">Recent Orders</h2>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/20">Sync: Latest {Math.min(orders.length, 20)}</span>
        </div>
        <div className="overflow-x-auto lg:overflow-visible p-4 sm:p-8">
          <AdminOrderTable initialOrders={orders} artists={artists} />
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-ink/5 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-ink/5">
          <h2 className="font-black font-serif text-xl tracking-tight text-ink">Active Market Coupons</h2>
        </div>
        
        {/* Mobile View for Coupons */}
        <div className="lg:hidden p-4 sm:p-6 space-y-4">
          {coupons.length === 0 ? (
            <div className="py-12 text-center text-ink/20 text-[10px] uppercase tracking-[0.3em] font-black">
              No coupons created yet
            </div>
          ) : coupons.map((coupon: any) => (
            <div key={coupon.code} className="bg-gray-50/50 border border-ink/5 p-5 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="px-3 py-1.5 bg-ink text-white rounded-xl font-mono text-xs font-black shadow-lg shadow-ink/10">{coupon.code}</span>
                <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest border ${coupon.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                  {coupon.isActive ? 'Active' : 'Expired'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-black opacity-20 mb-1">Benefit</p>
                  <p className="text-sm font-black text-ink">{coupon.type === 'percentage' ? `${coupon.discount}%` : `₹${coupon.discount}`}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-black opacity-20 mb-1">Usage</p>
                  <p className="text-sm font-black text-ink">{coupon.usedCount || 0} / {coupon.usageLimit || '∞'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View for Coupons */}
        <div className="hidden lg:block overflow-x-auto px-8 pb-8">
          <table className="w-full text-left text-sm">
            <thead className="text-ink/20 font-black text-[10px] uppercase tracking-[0.2em] border-b border-ink/5">
              <tr>
                <th className="px-6 py-5">Security Code</th>
                <th className="px-6 py-5">Benefit Factor</th>
                <th className="px-6 py-5">Current Status</th>
                <th className="px-6 py-5">Usage Velocity</th>
                <th className="px-6 py-5">Life Cycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {coupons.map((coupon: any) => (
                <tr key={coupon.code} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="px-3 py-1.5 bg-ink/5 text-ink rounded-lg font-mono text-xs font-black group-hover:bg-ink group-hover:text-white transition-all shadow-sm">{coupon.code}</span>
                  </td>
                  <td className="px-6 py-5 font-black text-ink">
                    {coupon.type === 'percentage' ? `${coupon.discount}%` : `₹${coupon.discount}`}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${coupon.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-mono text-xs text-ink/40">
                    {coupon.usedCount || 0} / {coupon.usageLimit || '∞'}
                  </td>
                  <td className="px-6 py-5 text-xs text-ink/30 font-black uppercase tracking-widest">
                    {coupon.expiry ? new Date(coupon.expiry).toLocaleDateString('en-IN') : 'Forever'}
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



