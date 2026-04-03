import { MessageSquare, Mail, Bell, Shield } from 'lucide-react';

export default function AdminMessagesPage() {
  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-playfair text-ink leading-tight">All Communications</h1>
          <p className="text-sm text-ink/40 mt-1 uppercase tracking-widest font-medium">History of customer requests and artist notifications</p>
        </div>
        <div className="px-6 py-4 border border-ink/5 bg-white rounded-3xl shadow-sm flex items-center gap-4">
          <MessageSquare size={24} className="text-ink/40" />
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-ink/20">System Wide</p>
            <p className="text-xl font-bold text-ink">Logs & Activity</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-ink/5 shadow-sm p-20 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
          <Bell className="text-ink/20" size={32} />
        </div>
        <h3 className="text-lg font-bold text-ink">No recent notifications</h3>
        <p className="text-sm text-ink/40 max-w-xs mt-2">
          When customers or artists perform actions, their detailed activity logs will appear here.
        </p>
        <div className="flex gap-4 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-bold text-ink/40 uppercase tracking-widest border border-ink/5 line-through">
                User Queries
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-bold text-ink/40 uppercase tracking-widest border border-ink/5 line-through">
                Artist Logs
            </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-ink/5 shadow-sm space-y-6">
            <h2 className="text-lg font-bold font-playfair text-ink border-b border-ink/5 pb-4">Recent Inquiries</h2>
            <p className="text-xs text-ink/20 uppercase tracking-widest font-bold text-center py-10">No pending queries</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-ink/5 shadow-sm space-y-6 opacity-50 grayscale pointer-events-none">
            <h2 className="text-lg font-bold font-playfair text-ink border-b border-ink/5 pb-4 flex items-center gap-2">
                <Shield size={16} />
                Global Controls
            </h2>
            <div className="space-y-4">
                <div className="h-4 w-full bg-gray-50 rounded" />
                <div className="h-4 w-2/3 bg-gray-50 rounded" />
                <div className="h-4 w-full bg-gray-50 rounded" />
            </div>
        </div>
      </div>
    </div>
  );
}
