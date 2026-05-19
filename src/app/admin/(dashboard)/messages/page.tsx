import { client } from '@/lib/sanity';
import { 
  MessageSquare, Bell, PlusCircle, CreditCard, UserCheck, 
  Activity, CheckCircle2, User, Calendar, Mail, FileText 
} from 'lucide-react';

export const revalidate = 0; // Force live data fetching to see logs instantly

export default async function AdminMessagesPage() {
  // Fetch all platform notification audit logs
  const notifications = await client.fetch(
    `*[_type == "notification"] | order(createdAt desc) [0...100] {
      _id, 
      message, 
      type, 
      orderId, 
      userEmail, 
      read, 
      createdAt
    }`
  );

  // Group counts for dashboard stats
  const totalLogs = notifications.length;
  const orderCreatedCount = notifications.filter((n: any) => n.type === 'order_created').length;
  const paymentSuccessCount = notifications.filter((n: any) => n.type === 'payment_success').length;
  const progressCount = notifications.filter((n: any) => n.type === 'progress' || n.type === 'assigned').length;

  // Helper to resolve icon, label and colors for log types
  const getLogTypeDetails = (type: string) => {
    switch (type) {
      case 'order_created':
        return {
          icon: PlusCircle,
          label: 'Order Placed',
          colorClass: 'text-blue-600 bg-blue-50 border-blue-100',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-100'
        };
      case 'payment_success':
        return {
          icon: CreditCard,
          label: 'Payment Verified',
          colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-100',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-100'
        };
      case 'assigned':
        return {
          icon: UserCheck,
          label: 'Artist Assigned',
          colorClass: 'text-purple-600 bg-purple-50 border-purple-100',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-100'
        };
      case 'progress':
        return {
          icon: Activity,
          label: 'Progress Update',
          colorClass: 'text-amber-600 bg-amber-50 border-amber-100',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-100'
        };
      case 'completed':
        return {
          icon: CheckCircle2,
          label: 'Order Completed',
          colorClass: 'text-teal-600 bg-teal-50 border-teal-100',
          badgeClass: 'bg-teal-50 text-teal-700 border-teal-100'
        };
      default:
        return {
          icon: Bell,
          label: 'System Log',
          colorClass: 'text-gray-600 bg-gray-50 border-gray-100',
          badgeClass: 'bg-gray-50 text-ink/60 border-ink/5'
        };
    }
  };

  return (
    <div className="space-y-10">
      {/* Overview Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-[32px] border border-ink/5 shadow-sm">
        <div>
          <h1 className="text-3xl font-black font-serif text-ink tracking-tight">Communications & Audit Logs</h1>
          <p className="text-[10px] sm:text-xs text-ink/30 mt-1 uppercase tracking-[0.2em] font-black leading-none">
            Global Interaction Archive & Platform Audit Trails
          </p>
        </div>
        <div className="px-6 py-4 border border-ink/5 bg-gray-50/50 rounded-2xl shadow-inner flex items-center gap-4">
          <MessageSquare size={24} className="text-ink/30" />
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-ink/30 font-black">Audit Status</p>
            <p className="text-lg font-serif font-black text-ink">Live Logging Active</p>
          </div>
        </div>
      </div>

      {/* Statistics Panels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-ink/5 p-5 rounded-2xl shadow-sm">
          <p className="text-[9px] uppercase tracking-widest text-ink/30 font-black mb-1">Total Active Logs</p>
          <p className="text-2xl font-serif font-black text-ink">{totalLogs}</p>
        </div>
        <div className="bg-white border border-ink/5 p-5 rounded-2xl shadow-sm">
          <p className="text-[9px] uppercase tracking-widest text-ink/30 font-black mb-1">Checkouts Logged</p>
          <p className="text-2xl font-serif font-black text-blue-600">{orderCreatedCount}</p>
        </div>
        <div className="bg-white border border-ink/5 p-5 rounded-2xl shadow-sm">
          <p className="text-[9px] uppercase tracking-widest text-ink/30 font-black mb-1">Successful Payments</p>
          <p className="text-2xl font-serif font-black text-emerald-600">{paymentSuccessCount}</p>
        </div>
        <div className="bg-white border border-ink/5 p-5 rounded-2xl shadow-sm">
          <p className="text-[9px] uppercase tracking-widest text-ink/30 font-black mb-1">Fulfillment Actions</p>
          <p className="text-2xl font-serif font-black text-purple-600">{progressCount}</p>
        </div>
      </div>

      {/* Main Audit Timeline Feed */}
      <div className="bg-white rounded-[32px] border border-ink/5 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-black font-serif text-ink tracking-tight">Timeline Feed</h2>
          <p className="text-xs text-ink/40 mt-1">Real-time chronicle of activities, communications and purchase parameters</p>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-gray-50/50 border border-ink/5 rounded-3xl p-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-ink/5">
              <Bell className="text-ink/10" size={28} />
            </div>
            <h3 className="text-sm font-black text-ink mb-1 tracking-tight">No events recorded</h3>
            <p className="text-[10px] text-ink/40 max-w-xs uppercase font-extrabold tracking-widest leading-relaxed">
              When customers or artists log actions on the platform, detailed events will populate here.
            </p>
          </div>
        ) : (
          <div className="relative border-l border-ink/10 pl-6 ml-4 space-y-8 py-2">
            {notifications.map((log: any) => {
              const { icon: Icon, label, colorClass, badgeClass } = getLogTypeDetails(log.type);
              
              return (
                <div key={log._id} className="relative group">
                  {/* Timeline bullet icon node */}
                  <div className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-lg flex items-center justify-center shadow-sm border ${colorClass} transition-transform group-hover:scale-110`}>
                    <Icon size={12} />
                  </div>

                  {/* Log Content Card */}
                  <div className="bg-gray-50/30 hover:bg-gray-50/70 border border-ink/5 p-5 rounded-2xl transition-all hover:shadow-md space-y-3 relative overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold border ${badgeClass}`}>
                          {label}
                        </span>
                        {log.orderId && (
                          <span className="text-[9px] font-mono font-black text-ink/30 flex items-center gap-1">
                            <FileText size={10} /> #{log.orderId}
                          </span>
                        )}
                      </div>
                      
                      <span className="text-[9px] font-medium text-ink/40 flex items-center gap-1.5">
                        <Calendar size={10} />
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-ink leading-relaxed">
                      {log.message}
                    </p>

                    <div className="flex items-center gap-1.5 text-[9px] text-ink/30 font-black uppercase tracking-widest pt-2 border-t border-ink/5/40">
                      <Mail size={9} />
                      <span className="select-all">{log.userEmail}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
