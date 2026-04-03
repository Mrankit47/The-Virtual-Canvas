'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface ArtistOrderUpdateFormProps {
  orderId: string;
  currentStatus: string;
  onSuccess: () => void;
}

export default function ArtistOrderUpdateForm({ orderId, currentStatus, onSuccess }: ArtistOrderUpdateFormProps) {
  const [status, setStatus] = useState(currentStatus);
  const [progress, setProgress] = useState(30);
  const [note, setNote] = useState('');
  const [artworkUrl, setArtworkUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status,
          progress,
          note: note || `Progress updated to ${progress}%`,
          artworkUrl,
        }),
      });

      if (res.ok) {
        setNote('');
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update order');
      }
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-ink/5 rounded-2xl p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Selection */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-ink/40 font-bold ml-1">Current Phase</label>
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full h-12 bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-ink/5 transition-all"
          >
            <option value="assigned">Assigned / Starting</option>
            <option value="progress">In Progress / Sketching</option>
            <option value="review">Client Review</option>
            <option value="completed">Final Completion</option>
          </select>
        </div>

        {/* Progress Slider */}
        <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] uppercase tracking-widest text-ink/40 font-bold">Progress (%)</label>
                <span className="text-[11px] font-bold text-ink">{progress}%</span>
            </div>
            <input 
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => setProgress(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-ink"
            />
        </div>
      </div>

      {/* Note Input */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-ink/40 font-bold ml-1">Artist Note / Message to Client</label>
        <textarea 
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Finished the base sketch, moving to coloring phase..."
          className="w-full bg-gray-50 border-none rounded-xl p-4 text-xs min-h-[100px] focus:ring-2 focus:ring-ink/5 transition-all"
        />
      </div>

      {/* Artwork URL (Optional) */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-ink/40 font-bold ml-1">Artwork URL (Manual Entry)</label>
        <div className="relative">
            <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={16} />
            <input 
                type="text"
                value={artworkUrl}
                onChange={(e) => setArtworkUrl(e.target.value)}
                placeholder="https://cloudinary.com/..."
                className="w-full h-12 bg-gray-50 border-none rounded-xl pl-12 pr-4 text-xs focus:ring-2 focus:ring-ink/5 transition-all"
            />
        </div>
      </div>

      <button 
        type="submit"
        disabled={isSubmitting}
        className="w-full h-14 bg-ink text-white rounded-2xl flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest hover:shadow-xl hover:shadow-ink/20 transition-all disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        Publish Update to Client
      </button>
    </form>
  );
}
