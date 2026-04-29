'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Eye, Search, Filter, Camera, Palette, Grid, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import { useUIStore } from '@/store/useUIStore';

interface ArtistArtworkGridProps {
  initialArtworks: any[];
  categories: any[];
}

export function ArtistArtworkGrid({ initialArtworks, categories }: ArtistArtworkGridProps) {
  const { data: session } = useSession();
  const { addToCart, isInCart } = useCart();
  const { addToast } = useUIStore();
  
  const [activeTab, setActiveTab] = useState<'all' | 'gallery' | 'marketplace' | 'photography'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Prevent scrolling when lightbox is open
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedImage]);

  const filteredArtworks = useMemo(() => {
    return initialArtworks.filter(art => {
      const matchesTab = 
        activeTab === 'all' ? true :
        activeTab === 'gallery' ? art.postType === 'gallery' :
        activeTab === 'marketplace' ? art.postType === 'marketplace' :
        activeTab === 'photography' ? art.isPhotography === true : true;
      
      const matchesCategory = selectedCategory === 'All' ? true : art.category === selectedCategory;
      const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            art.artistName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesTab && matchesCategory && matchesSearch;
    });
  }, [initialArtworks, activeTab, selectedCategory, searchQuery]);

  const tabs = [
    { id: 'all', label: 'All Works', icon: Grid },
    { id: 'gallery', label: 'Gallery', icon: Palette },
    { id: 'marketplace', label: 'Buy Art', icon: ShoppingCart },
    { id: 'photography', label: 'Photography', icon: Camera },
  ];

  return (
    <div className="space-y-12">
      {/* Search & Tabs */}
      <div className="flex flex-col lg:flex-row gap-8 justify-between items-center bg-white/50 backdrop-blur-md p-6 rounded-[40px] border border-ink/5 sticky top-32 z-40 shadow-xl shadow-ink/5">
        <div className="flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'bg-ink text-white shadow-lg shadow-ink/20 scale-105' 
                  : 'bg-ink/5 text-ink/40 hover:bg-ink/10 hover:text-ink'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative group flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-ink/60 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search artworks or artists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full lg:w-64 h-12 bg-white border border-ink/10 rounded-2xl pl-12 pr-6 text-xs font-bold focus:outline-none focus:border-ink transition-all shadow-sm"
                />
            </div>
            
            <div className="relative group">
                <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-ink/60" />
                <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full sm:w-48 h-12 bg-white border border-ink/10 rounded-2xl pl-12 pr-6 text-xs font-bold focus:outline-none focus:border-ink appearance-none shadow-sm"
                >
                    <option value="All">All Categories</option>
                    {categories.map(c => <option key={c._id} value={c.title}>{c.title}</option>)}
                </select>
            </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredArtworks.map((art) => (
            <motion.div
              layout
              key={art._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="group bg-white rounded-[32px] border border-ink/5 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-700"
            >
              <div className="aspect-[4/5] relative overflow-hidden">
                <img 
                    src={art.imageUrl} 
                    alt={art.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <div className="flex gap-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <button 
                            onClick={() => setSelectedImage(art.imageUrl)}
                            className="w-12 h-12 bg-white text-ink rounded-xl flex items-center justify-center hover:bg-ink hover:text-white transition-all shadow-xl"
                        >
                            <Eye size={20} />
                        </button>
                        {art.postType === 'marketplace' && session?.user?.role !== 'artist' && session?.user?.role !== 'admin' && (
                            <button 
                                onClick={() => {
                                    if (isInCart(art._id)) return;
                                    addToCart({
                                        artworkId: art._id,
                                        title: art.title,
                                        price: art.price,
                                        imageUrl: art.imageUrl,
                                        artistId: art.artistId
                                    });
                                    addToast(`${art.title} added to cart`, 'success');
                                }}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-xl ${
                                    isInCart(art._id) ? 'bg-green-500 text-white' : 'bg-white text-ink hover:bg-ink hover:text-white'
                                }`}
                            >
                                <ShoppingCart size={20} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg ${
                        art.postType === 'marketplace' ? 'bg-green-500/90 text-white' : 'bg-white/90 text-ink'
                    }`}>
                        {art.postType}
                    </span>
                    {art.isPhotography && (
                         <span className="px-3 py-1 bg-blue-500/90 text-white rounded-full text-[7px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg">
                            Photography
                        </span>
                    )}
                </div>
              </div>

              <div className="p-6 space-y-2">
                <div className="space-y-0.5">
                    <h3 className="text-base font-serif font-black text-ink leading-tight truncate">{art.title}</h3>
                    <p className="text-[9px] font-black uppercase tracking-widest text-ink/30 italic">By {art.artistName}</p>
                </div>
                
                <div className="pt-2 border-t border-ink/5 flex justify-between items-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-ink/40">
                        {art.category || 'Uncategorized'}
                    </p>
                    {art.postType === 'marketplace' && (
                        <p className="text-sm font-bold text-ink/80 tracking-tight">₹{art.price}</p>
                    )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredArtworks.length === 0 && (
        <div className="py-40 text-center space-y-4 bg-ink/5 rounded-[60px] border border-dashed border-ink/10">
          <p className="text-xl font-serif text-ink/20 italic">No masterpieces found matching your criteria</p>
          <button 
            onClick={() => { setActiveTab('all'); setSelectedCategory('All'); setSearchQuery(''); }}
            className="text-[10px] font-black uppercase tracking-[0.3em] text-ink hover:underline"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedImage(null)}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 backdrop-blur-3xl p-4 sm:p-12 cursor-zoom-out overflow-hidden"
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    className="relative max-w-full max-h-full flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    <img 
                        src={selectedImage} 
                        alt="Full size preview" 
                        className="max-w-[95vw] max-h-[85vh] object-contain rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/10"
                    />
                    <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-12 sm:-top-8 right-0 sm:-right-8 w-10 h-10 bg-white/10 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-xl border border-white/10"
                    >
                        <X size={20} />
                    </button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
