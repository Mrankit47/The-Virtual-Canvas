import { client } from '@/lib/sanity';
import { env } from '@/config/env';
import { User, Mail, ShieldCheck, BadgeCheck } from 'lucide-react';



export const revalidate = 0; // Force dynamic fetching to see new registrations immediately

export default async function AdminArtistsPage() {
  const artists = await client.fetch(`*[_type == "userProfile" && role == "artist"]{_id, name, email, image}`);

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-[32px] border border-ink/5 shadow-sm">
        <div>
          <h1 className="text-3xl font-black font-serif text-ink tracking-tight">Artists Studio</h1>
          <p className="text-[10px] sm:text-xs text-ink/30 mt-1 uppercase tracking-[0.2em] font-black leading-none">Global Creator Network Oversight</p>
        </div>
        <div className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black border border-emerald-100 flex items-center gap-3 shadow-inner uppercase tracking-widest">
            <BadgeCheck size={16} />
            {artists.length} Verified Master Artists
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-ink/5 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-ink/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-black font-serif text-ink tracking-tight">Studio Roster</h2>
          <button className="w-full sm:w-auto px-6 py-2.5 text-[10px] font-black text-ink/40 border border-ink/5 rounded-xl hover:bg-ink hover:text-white transition-all uppercase tracking-[0.2em]">+ Add New Master Artist</button>
        </div>

        {/* Mobile View for Artists */}
        <div className="lg:hidden p-4 sm:p-6 space-y-4">
          {artists.length === 0 ? (
            <div className="py-12 text-center text-ink/20 text-[10px] uppercase tracking-[0.3em] font-black">
              No artists found in database
            </div>
          ) : artists.map((artist: any) => (
            <div key={artist._id} className="bg-gray-50/50 border border-ink/5 p-5 rounded-3xl space-y-5 group transition-all hover:shadow-lg">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-ink/5 text-ink flex items-center justify-center shadow-lg shadow-ink/10 group-hover:scale-105 transition-transform overflow-hidden border border-ink/5">
                      {artist.image ? (
                        <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} />
                      )}
                  </div>
                  <div className="min-w-0">
                      <h3 className="text-sm font-black text-ink leading-tight truncate">{artist.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-ink/30 font-black mt-1 truncate uppercase tracking-widest">
                          <Mail size={10} />
                          {artist.email}
                      </div>
                  </div>
              </div>
              <div className="flex justify-between items-center pt-5 border-t border-ink/5">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] uppercase font-black tracking-widest border border-emerald-100">Verified</span>
                <p className="text-[10px] font-mono text-ink/10 uppercase tracking-widest">ID: {artist._id?.slice(-6)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View for Artists */}
        <div className="hidden lg:block overflow-x-auto px-8 pb-8">
          <table className="w-full text-left text-sm">
            <thead className="text-ink/20 font-black text-[10px] uppercase tracking-[0.2em] border-b border-ink/5">
              <tr>
                <th className="px-8 py-5">Master Artist Profile</th>
                <th className="px-8 py-5">Integrity Status</th>
                <th className="px-8 py-5">Studio Queue</th>
                <th className="px-8 py-5">Master Key ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {artists.map((artist: any) => (
                <tr key={artist._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-ink/5 text-ink/30 flex items-center justify-center transition-all shadow-sm overflow-hidden border border-ink/5 shrink-0">
                            {artist.image ? (
                              <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                            ) : (
                              <User size={18} />
                            )}
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-ink leading-tight">{artist.name}</h3>
                            <div className="flex items-center gap-2 text-[10px] text-ink/30 font-black uppercase tracking-widest mt-1">
                                <Mail size={10} />
                                {artist.email}
                            </div>
                        </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] uppercase font-black tracking-widest border border-emerald-100 shadow-sm">Verified</span>
                  </td>
                  <td className="px-8 py-5 font-mono text-xs text-ink/20 uppercase tracking-[0.3em]">No Active Tasks</td>
                  <td className="px-8 py-5 font-mono text-[10px] text-ink/10">{artist._id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
