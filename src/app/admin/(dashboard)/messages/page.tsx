import { MessageSquare, Mail, Bell, Shield } from 'lucide-react';

export default function AdminMessagesPage() {
  return (
    <div className="space-y-8 sm:space-y-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-[32px] border border-ink/5 shadow-sm">
        <div>
          <h1 className="text-3xl font-black font-serif text-ink tracking-tight">Communications</h1>
          <p className="text-[10px] sm:text-xs text-ink/30 mt-1 uppercase tracking-[0.2em] font-black leading-none">Global Interaction Archive & Logs</p>
        </div>
        <div className="px-6 py-4 border border-ink/5 bg-gray-50/50 rounded-2xl shadow-sm flex items-center gap-4 group hover:bg-white transition-all">
          <MessageSquare size={24} className="text-ink/20 group-hover:text-ink transition-colors" />
          <div className="text-right min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-ink/20 font-black">System Status</p>
            <p className="text-xl font-serif font-black text-ink">Active Activity</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-ink/5 shadow-sm p-12 sm:p-20 flex flex-col items-center text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
          <Bell className="text-ink/10" size={32} />
        </div>
        <h3 className="text-xl font-black text-ink mb-2 tracking-tight">No recent notifications</h3>
        <p className="text-xs sm:text-sm text-ink/40 max-w-xs uppercase font-extrabold tracking-widest leading-relaxed">
          When customers or artists perform actions, their detailed activity logs will appear here.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <div className="px-5 py-2.5 bg-gray-50 rounded-xl text-[10px] font-black text-ink/20 uppercase tracking-[0.2em] border border-ink/5 line-through">
                User Queries
            </div>
            <div className="px-5 py-2.5 bg-gray-50 rounded-xl text-[10px] font-black text-ink/20 uppercase tracking-[0.2em] border border-ink/5 line-through">
                Artist Logs
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div className="bg-white p-6 sm:p-10 rounded-[40px] border border-ink/5 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-ink/5 pb-6">
                <h2 className="text-xl font-black font-serif text-ink tracking-tight">Recent Inquiries</h2>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-ink/20 uppercase tracking-[0.3em] font-black text-center py-16">No pending queries in database</p>
        </div>
        <div className="bg-white p-6 sm:p-10 rounded-[40px] border border-ink/5 shadow-sm space-y-8 opacity-40 mix-blend-multiply grayscale pointer-events-none transition-opacity hover:opacity-100">
            <h2 className="text-xl font-black font-serif text-ink border-b border-ink/5 pb-6 flex items-center gap-3">
                <Shield size={20} className="text-ink" />
                Global Controls
            </h2>
            <div className="space-y-5">
                <div className="h-5 w-full bg-gray-50 rounded-xl" />
                <div className="h-5 w-2/3 bg-gray-50 rounded-xl" />
                <div className="h-5 w-5/6 bg-gray-50 rounded-xl" />
            </div>
        </div>
      </div>
    </div>
  );
}
