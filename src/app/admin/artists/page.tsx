import { createClient } from 'next-sanity';
import { env } from '@/config/env';
import { User, Mail, ShieldCheck, BadgeCheck } from 'lucide-react';

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
});

export default async function AdminArtistsPage() {
  const artists = await client.fetch(`*[_type == "userProfile" && role == "artist"]{_id, name, email}`);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-playfair text-ink">Manage Artists Studio</h1>
          <p className="text-sm text-ink/40 mt-1 uppercase tracking-widest font-medium">Coordinate and oversee your platform creators</p>
        </div>
        <div className="px-5 py-2 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200 flex items-center gap-2">
            <BadgeCheck size={14} />
            {artists.length} Verified Artists
        </div>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-3xl border border-ink/5 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-ink/5 flex justify-between items-center">
            <h2 className="text-lg font-bold font-playfair text-ink underline decoration-ink/10 underline-offset-8 decoration-4">Studio Roster</h2>
            <button className="text-xs font-bold font-mono text-ink/30 hover:text-ink transition-colors uppercase tracking-widest">+ Add New Entry</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-ink/40 font-mono text-[10px] uppercase">
                <tr>
                  <th className="px-8 py-4">Artist Profile</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Active Jobs</th>
                  <th className="px-8 py-4">Account ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {artists.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-ink/20 text-xs uppercase tracking-widest font-bold">
                      No artists found — promote profiles in Sanity Studio
                    </td>
                  </tr>
                ) : (
                  artists.map((artist: any) => (
                    <tr key={artist._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-ink/5 text-ink/40">
                                <User size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-ink leading-tight">{artist.name}</h3>
                                <div className="flex items-center gap-2 text-[10px] text-ink/40">
                                    <Mail size={10} />
                                    {artist.email}
                                </div>
                            </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] uppercase font-bold tracking-tighter">Verified</span>
                      </td>
                      <td className="px-8 py-4 font-mono text-xs text-ink/40 uppercase tracking-widest">—</td>
                      <td className="px-8 py-4 font-mono text-[10px] text-ink/20">{artist._id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
