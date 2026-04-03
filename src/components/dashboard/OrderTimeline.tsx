'use client';

import { CheckCircle2, Circle, Clock, CreditCard, User, Box, Send } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import Image from "next/image";

interface OrderUpdate {
  _id: string;
  note: string;
  progress: number;
  createdAt: string;
  artist?: { name: string };
  artworkUrl?: string;
}

interface OrderTimelineProps {
  updates: OrderUpdate[];
  currentStatus: string;
  referenceImage?: string;
  onImageClick?: (src: string) => void;
}

export default function OrderTimeline({ updates, currentStatus, referenceImage, onImageClick }: OrderTimelineProps) {
  const sortedUpdates = [...updates].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getStatusIcon = (status: string, isCompleted: boolean) => {
    if (isCompleted) return <CheckCircle2 className="text-green-500" size={18} />;
    
    switch (status) {
      case 'paid': return <CreditCard className="text-blue-500" size={18} />;
      case 'assigned': return <User className="text-purple-500" size={18} />;
      case 'progress': return <Clock className="text-yellow-500" size={18} />;
      case 'completed': return <Box className="text-green-600" size={18} />;
      default: return <Circle className="text-ink/20" size={18} />;
    }
  };

  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[9px] before:w-0.5 before:bg-ink/5 before:h-full">
      {sortedUpdates.length === 0 && (
        <div className="relative pl-10">
            <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-white border-2 border-ink/10 z-10 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-ink/20" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink/20">Awaiting Status Update...</p>
        </div>
      )}

      {sortedUpdates.map((update, index) => (
        <motion.div 
            key={update._id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative pl-10"
        >
          {/* Connector Dot */}
          <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-white border-2 border-ink/10 z-10 flex items-center justify-center shadow-sm">
             <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-ink animate-pulse' : 'bg-ink/20'}`} />
          </div>

          <div className="bg-canvas border border-ink/5 rounded-2xl p-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
                    {format(new Date(update.createdAt), "MMM d, yyyy • h:mm a")}
                </span>
                {update.progress > 0 && (
                    <span className="text-[10px] bg-ink/5 px-2 py-0.5 rounded-full font-bold text-ink/60">
                        {update.progress}% Complete
                    </span>
                )}
            </div>
            <p className="text-xs font-medium text-ink leading-relaxed">{update.note}</p>
            
            {update.artworkUrl && (
                <div 
                    onClick={() => onImageClick?.(update.artworkUrl!)}
                    className="mt-4 relative aspect-video w-full rounded-xl overflow-hidden border border-ink/5 shadow-sm group/image cursor-zoom-in"
                >
                    <Image 
                        src={update.artworkUrl} 
                        alt="Work in progress" 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover/image:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors" />
                </div>
            )}

            {update.artist && (
                <div className="mt-3 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-ink/5 flex items-center justify-center">
                        <User size={10} className="text-ink/40" />
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-ink/30 font-bold">
                        Update from {update.artist.name}
                    </span>
                </div>
            )}
          </div>
        </motion.div>
      ))}

      {/* Starting Point: Reference Image */}
      {referenceImage && (
        <div className="relative pl-10">
          <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-white border-2 border-ink/10 z-10 flex items-center justify-center">
             <div className="w-1.5 h-1.5 rounded-full bg-ink/40" />
          </div>
          <div className="bg-canvas border border-ink/5 rounded-2xl p-4">
             <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Initial Reference Material</span>
                <span className="text-[9px] bg-ink/5 px-2 py-0.5 rounded-full font-bold text-ink/40">CUSTOMER PROVIDED</span>
             </div>
             <div 
                onClick={() => onImageClick?.(referenceImage)}
                className="relative aspect-video w-full rounded-xl overflow-hidden border border-ink/5 shadow-sm group/ref cursor-zoom-in"
             >
                <Image 
                    src={referenceImage} 
                    alt="Customer reference" 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover/ref:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/ref:bg-black/10 transition-colors" />
             </div>
             <p className="text-[10px] text-ink/30 italic mt-3 text-center uppercase tracking-widest">Base vision for the masterpiece</p>
          </div>
        </div>
      )}
    </div>
  );
}
