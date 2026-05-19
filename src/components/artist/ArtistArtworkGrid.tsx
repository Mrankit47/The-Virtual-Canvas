'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Eye, Search, Filter, Camera, Palette, Grid, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import { useUIStore } from '@/store/useUIStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/lib/imageResolver';
import { optimizedUrl } from '@/lib/utils';


interface ArtistArtworkGridProps {
  initialArtworks: any[];
  categories: any[];
}

export function ArtistArtworkGrid({ initialArtworks, categories }: ArtistArtworkGridProps) {
  const { data: session } = useSession();
  const { addToCart, isInCart } = useCart();
  const { addToast } = useUIStore();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'all' | 'gallery' | 'marketplace' | 'photography'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArtist, setSelectedArtist] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isManagement = session?.user?.role === 'admin' || session?.user?.role === 'artist';

  // Derived list of unique artists
  const artists = useMemo(() => {
    const uniqueArtists = new Set(initialArtworks.map(art => art.artistName).filter(Boolean));
    return Array.from(uniqueArtists).sort();
  }, [initialArtworks]);

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
        activeTab === 'all' ? !art.isPhotography :
        activeTab === 'gallery' ? art.postType === 'gallery' :
        activeTab === 'marketplace' ? art.postType === 'marketplace' :
        activeTab === 'photography' ? art.isPhotography === true : true;
      
      const matchesCategory = selectedCategory === 'All' ? true : art.category === selectedCategory;
      const matchesArtist = selectedArtist === 'All' ? true : art.artistName === selectedArtist;
      const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            art.artistName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesTab && matchesCategory && matchesArtist && matchesSearch;
    });
  }, [initialArtworks, activeTab, selectedCategory, selectedArtist, searchQuery]);

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
            
            <div className="flex gap-4">
                {/* Artist Filter */}
                <div className="relative group">
                    <Palette className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-ink/60" />
                    <select 
                        value={selectedArtist}
                        onChange={(e) => setSelectedArtist(e.target.value)}
                        className="w-full sm:w-48 h-12 bg-white border border-ink/10 rounded-2xl pl-12 pr-10 text-xs font-bold focus:outline-none focus:border-ink appearance-none shadow-sm cursor-pointer"
                    >
                        <option value="All">All Artists</option>
                        {artists.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                </div>

                {/* Category Filter */}
                <div className="relative group">
                    <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-ink/60" />
                    <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full sm:w-48 h-12 bg-white border border-ink/10 rounded-2xl pl-12 pr-10 text-xs font-bold focus:outline-none focus:border-ink appearance-none shadow-sm cursor-pointer"
                    >
                        <option value="All">All Categories</option>
                        {categories.map(c => <option key={c._id} value={c.title}>{c.title}</option>)}
                    </select>
                </div>
            </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-10">
        <AnimatePresence mode="popLayout">
          {filteredArtworks.map((art, idx) => (
            <motion.div
              layout
              key={art._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.04, duration: 0.45 }}
              className="group relative flex flex-col gap-6 cursor-pointer"
              onClick={() => {
                if (art.slug) {
                  router.push(`/artworks/${art.slug}`);
                } else {
                  setSelectedImage(getImageUrl(art));
                }

              }}
            >
              <div className="relative w-full aspect-[4/5] overflow-hidden rounded-md shadow-md bg-ink/5 border border-ink/10">
                {/* Blurred background fill */}
                <img 
                    src={optimizedUrl(getImageUrl(art))} 
                    alt="" 
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-80" 
                />
                {/* Main image — full, no cropping */}
                <img 
                    src={optimizedUrl(getImageUrl(art))} 
                    alt={art.title} 
                    className={`relative w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-105 ${art.isOutOfStock ? 'opacity-40 scale-95 blur-[1px]' : ''}`} 
                />
                
                {/* Labels */}
                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 max-w-[calc(100%-20px)]">
                    {art.isOutOfStock ? (
                      <span className="px-2 py-0.5 bg-red-650 bg-red-600 text-white rounded-md text-[6px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm border border-white/10 font-bold shadow-md shadow-red-950/20 select-none">
                        Acquired
                      </span>
                    ) : (
                      <>
                        <span className={`px-2 py-0.5 rounded-md text-[6px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm border border-white/10 ${
                            art.postType === 'marketplace' ? 'bg-green-500/90 text-white' : 'bg-white/90 text-ink'
                        }`}>
                            {art.postType === 'marketplace' ? 'For Sale' : 'Gallery'}
                        </span>
                        {art.isPhotography && (
                             <span className="px-2 py-0.5 bg-blue-500/90 text-white rounded-md text-[6px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm border border-white/10">
                                Photography
                            </span>
                        )}
                      </>
                    )}
                </div>
              </div>
              <div className="flex flex-col gap-4 px-2">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1 min-w-0">
                        <h3 className="font-serif text-xl md:text-2xl tracking-tight text-ink leading-tight truncate">{art.title}</h3>
                        <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-ink/30 italic">By {art.artistName}</p>
                        <span className="font-sans text-[10px] md:text-xs uppercase tracking-[0.2em] text-ink/35">
                            {art.category || 'Uncategorized'}
                        </span>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {art.postType === 'marketplace' && (
                            <p className="text-sm font-bold text-ink/80 tracking-tight">
                              {art.isOutOfStock ? (
                                <span className="text-red-500 text-[10px] font-black uppercase tracking-wider">Acquired</span>
                              ) : (
                                `₹${art.price}`
                              )}
                            </p>
                        )}
                        <div className="w-4 h-[1px] bg-ink/30 group-hover:bg-ink group-hover:w-8 transition-all duration-500" />
                    </div>
                </div>

                {/* ACTION BUTTONS FOR USERS */}
                {art.postType === 'marketplace' && !isManagement && (
                    <div className="flex gap-2">
                      {art.isOutOfStock ? (
                        <button 
                            disabled
                            className="flex-1 py-3 bg-ink/10 text-ink/30 text-[8px] font-black uppercase tracking-[0.2em] rounded-xl cursor-not-allowed border border-ink/5 flex items-center justify-center"
                        >
                            Out of Stock
                        </button>
                      ) : (
                        <>
                          <button 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  if (!session) {
                                      addToast('Please sign in to buy this artwork.', 'info');
                                      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
                                      return;
                                  }
                                  addToCart({
                                      artworkId: art._id,
                                      title: art.title,
                                      price: art.price,
                                      imageUrl: getImageUrl(art),
                                      artistId: art.artistId
                                  });
                                  router.push('/checkout');
                              }}
                              className="flex-1 py-3 bg-ink text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-xl hover:shadow-xl active:scale-95 transition-all flex items-center justify-center"
                          >
                              Buy Now
                          </button>
                          <button 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  if (isInCart(art._id)) {
                                      router.push('/cart');
                                      return;
                                  }
                                  addToCart({
                                      artworkId: art._id,
                                      title: art.title,
                                      price: art.price,
                                      imageUrl: getImageUrl(art),
                                      artistId: art.artistId
                                  });
                                  addToast(`${art.title} added to cart`, 'success');
                              }}
                              className={`w-12 h-11 rounded-xl flex items-center justify-center transition-all border ${
                                  isInCart(art._id) 
                                      ? 'bg-green-500 border-green-500 text-white' 
                                      : 'bg-white border-ink/10 text-ink hover:bg-ink hover:text-white'
                              }`}
                          >
                              <ShoppingCart size={16} />
                          </button>
                        </>
                      )}
                    </div>
                )}
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
