'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Trash2, Loader2, Image as ImageIcon, Filter, CheckCircle2, X, Pencil, Eye } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';

export default function MyArtworksPage() {
  const { data: session } = useSession();
  const { addToast } = useUIStore();
  
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'artwork' | 'photography'>('all');

  // Prevent scrolling when lightbox is open
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedImage]);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    postType: 'gallery',
    isPhotography: false,
    categoryRef: '',
    subcategory: '',
    medium: '',
    dimensions: '',
    tags: '',
    image: null as File | null
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ 
        title: '', description: '', price: '', postType: 'gallery', 
        isPhotography: false, categoryRef: '', subcategory: '', 
        medium: '', dimensions: '', tags: '', image: null 
    });
  };

  const [categories, setCategories] = useState<any[]>([]);
  const [photoCategories, setPhotoCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchArtworks();
    fetchCategories();
  }, []);

  const fetchArtworks = async () => {
    try {
      const res = await fetch('/api/artist/artwork');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setArtworks(data);
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
        const [catRes, photoRes] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/categories?type=photography')
        ]);
        
        if (catRes.ok) setCategories(await catRes.json());
        if (photoRes.ok) setPhotoCategories(await photoRes.json());
    } catch (err) {}
  };

  // Get active categories based on photography toggle
  const activeCategories = (formData.isPhotography ? photoCategories : categories) || [];

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
        addToast("You must be logged in to post artwork", "error");
        return;
    }

    // Manual Validation
    if (!formData.title.trim()) {
        addToast("Please enter a title", "error");
        return;
    }
    if (!formData.categoryRef) {
        addToast("Please select a category", "error");
        return;
    }
    if (formData.postType === 'marketplace' && (!formData.price || Number(formData.price) <= 0)) {
        addToast("Please enter a valid price for marketplace", "error");
        return;
    }
    // Image is only required for new posts
    if (!editingId && !formData.image) {
        addToast("Please upload an image", "error");
        return;
    }

    try {
        setUploading(true);
        let imageUrl = '';

        if (formData.image) {
            addToast("Uploading image to secure storage...", "info");
            const artistName = (session?.user?.name || 'Unknown Artist').trim();
            const currentActiveCats = formData.isPhotography ? (photoCategories || []) : (categories || []);
            const typeFolder = (formData.postType === 'marketplace' ? 'Marketplace' : (formData.isPhotography ? 'Photography' : 'Gallery')).trim();
            const categoryName = (currentActiveCats.find(c => c._id === formData.categoryRef)?.title || 'Uncategorized').trim();
            const folderPath = `TVC assets/Artist uploaded Photos/${artistName}/${typeFolder}/${categoryName}`.replace(/\s+\//g, '/').replace(/\/\s+/g, '/').trim();
            
            imageUrl = await uploadToCloudinary(formData.image, folderPath);
            addToast("Image uploaded! Saving details...", "info");
        } else {
            addToast("Updating artwork details...", "info");
        }

        const { image, ...apiData } = formData;

        const res = await fetch('/api/artist/artwork', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...apiData,
                id: editingId,
                imageUrl: imageUrl || undefined
            }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Server error occurred");

        addToast(editingId ? "Artwork updated successfully!" : "Masterpiece published successfully!", "success");
        closeModal();
        fetchArtworks();
    } catch (err: any) {
        console.error("Upload Error:", err);
        const msg = err.message || "Failed to process request";
        addToast(msg, "error");
        window.alert("Error: " + msg);
    } finally {
        setUploading(false);
    }
  };

  const openEditModal = (art: any) => {
    setEditingId(art._id);
    setFormData({
        title: art.title,
        description: art.description || '',
        price: art.price?.toString() || '',
        postType: art.postType || 'gallery',
        isPhotography: !!art.isPhotography,
        categoryRef: art.category?._ref || '',
        subcategory: art.subcategory || '',
        medium: art.medium || '',
        dimensions: art.dimensions || '',
        tags: Array.isArray(art.tags) ? art.tags.join(', ') : (art.tags || ''),
        image: null
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this artwork?")) return;
    try {
        const res = await fetch('/api/artist/artwork', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error("Failed to delete");
        addToast("Artwork deleted", "success");
        fetchArtworks();
    } catch (err: any) {
        addToast(err.message, "error");
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[32px] border border-ink/5 shadow-sm">
        <div>
            <h1 className="text-3xl font-black font-serif text-ink tracking-tight">My Artworks</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-ink/30 mt-2">Manage your Portfolio & Marketplace</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-auto group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30 group-focus-within:text-ink/60" />
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full sm:w-auto pl-10 pr-10 py-4 bg-ink/5 border border-ink/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] focus:outline-none focus:border-ink/20 appearance-none cursor-pointer"
                >
                    <option value="all">All Uploads</option>
                    <option value="artwork">Artworks</option>
                    <option value="photography">Photography</option>
                </select>
            </div>
            <button 
                onClick={() => setShowModal(true)}
                className="w-full sm:w-auto flex justify-center items-center gap-3 px-8 py-4 bg-ink text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-ink/20"
            >
                <Plus size={18} />
                Post New Artwork
            </button>
        </div>
      </div>

      {(() => {
        const filteredArtworks = artworks.filter(art => {
            if (filterType === 'all') return true;
            if (filterType === 'photography') return art.isPhotography === true;
            if (filterType === 'artwork') return !art.isPhotography;
            return true;
        });

        return (
          <>
            {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="aspect-[4/5] bg-ink/5 rounded-[32px] animate-pulse" />)}
        </div>
      ) : artworks.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-dashed border-ink/10 p-20 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-8">
                <ImageIcon className="text-ink/10" size={32} />
            </div>
            <h3 className="text-xl font-black text-ink mb-2">No artworks yet</h3>
            <p className="text-xs uppercase font-bold tracking-widest text-ink/40 max-w-xs">Start building your portfolio by uploading your first masterpiece.</p>
        </div>
      ) : filteredArtworks.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-dashed border-ink/10 p-20 flex flex-col items-center text-center">
            <h3 className="text-xl font-black text-ink mb-2">No matching items found</h3>
            <p className="text-xs uppercase font-bold tracking-widest text-ink/40 max-w-xs">Try changing the filter type.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-10">
            {filteredArtworks.map((art, idx) => (
                <div key={art._id} className="group relative flex flex-col gap-6 cursor-pointer">
                    <div className="relative w-full aspect-[4/5] overflow-hidden rounded-md shadow-md bg-ink/5 border border-ink/10">
                        {/* Blurred background fill */}
                        <img 
                            src={art.imageUrl} 
                            alt="" 
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-80" 
                        />
                        {/* Main image — full, no cropping */}
                        <img src={art.imageUrl} alt={art.title} className="relative w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out" />
                        <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors duration-500 flex items-end p-4 gap-3">
                            <div className="flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                <button 
                                    onClick={() => setSelectedImage(art.imageUrl)}
                                    className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-lg flex items-center justify-center hover:bg-ink transition-colors shadow-xl"
                                >
                                    <Eye size={16} />
                                </button>
                                <button 
                                    onClick={() => openEditModal(art)}
                                    className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-lg flex items-center justify-center hover:bg-ink transition-colors shadow-xl"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(art._id)}
                                    className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors shadow-xl"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="absolute top-3 left-3 flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg ${art.postType === 'marketplace' ? 'bg-green-500/90 text-white' : 'bg-white/90 text-ink'}`}>
                                {art.postType === 'marketplace' ? 'For Sale' : 'Gallery'}
                            </span>
                            {art.isPhotography && (
                                <span className="px-3 py-1 bg-blue-500/90 text-white rounded-full text-[7px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg">
                                    Photo
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-start px-2">
                        <div className="flex flex-col gap-1.5 min-w-0">
                            <h3 className="font-serif text-xl md:text-2xl tracking-tight text-ink leading-tight truncate">{art.title}</h3>
                            <span className="font-sans text-[10px] md:text-xs uppercase tracking-[0.2em] text-ink/35">
                                {typeof art.category === 'string' ? art.category : (art.category?.title || 'Uncategorized')}
                            </span>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
                                {art.postType === 'marketplace' ? `₹${art.price}` : 'Gallery Only'}
                            </p>
                            <div className="w-4 h-[1px] bg-ink/30 group-hover:bg-ink group-hover:w-8 transition-all duration-500" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
          </>
        );
      })()}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => !uploading && setShowModal(false)} />
            <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden">
                <div className="p-8 sm:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-2xl font-black font-serif text-ink">{editingId ? 'Edit Artwork' : 'Post New Artwork & Photography'}</h3>
                            <p className="text-[10px] uppercase tracking-widest text-ink/30 mt-1 font-bold">Share your vision with the world</p>
                        </div>
                        <button onClick={() => setShowModal(false)} className="p-2 hover:bg-ink/5 rounded-full transition-colors"><X size={24} /></button>
                    </div>

                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Artwork Title</label>
                                <input 
                                    type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                                    className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20 transition-all"
                                    placeholder="e.g. Whispers of Silence"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Post Type</label>
                                <select 
                                    value={formData.postType} 
                                    onChange={e => {
                                        const val = e.target.value;
                                        setFormData({
                                            ...formData, 
                                            postType: val,
                                            isPhotography: val === 'marketplace' ? false : formData.isPhotography
                                        });
                                    }}
                                    className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20 appearance-none"
                                >
                                    <option value="gallery">Gallery (Portfolio Only)</option>
                                    <option value="marketplace">Marketplace (For Sale)</option>
                                </select>
                            </div>
                        </div>

                        {formData.postType === 'marketplace' && (
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Selling Price (₹)</label>
                                <input 
                                    type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                                    className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20"
                                    placeholder="e.g. 5000"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Description</label>
                            <textarea 
                                rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full bg-ink/5 border border-ink/5 rounded-2xl p-6 text-sm font-bold focus:outline-none focus:border-ink/20 resize-none"
                                placeholder="Tell the story behind this piece..."
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Category</label>
                                <select 
                                    value={formData.categoryRef} onChange={e => setFormData({...formData, categoryRef: e.target.value})}
                                    className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20 appearance-none"
                                >
                                    <option value="">Select Category</option>
                                    {(activeCategories || []).map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                                </select>
                            </div>
                            
                            {formData.postType === 'gallery' ? (
                                <div className="flex items-center gap-6 pt-6">
                                    <div 
                                        onClick={() => setFormData({...formData, isPhotography: false, categoryRef: ''})}
                                        className="flex items-center gap-2 cursor-pointer group"
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${!formData.isPhotography ? 'border-ink bg-ink' : 'border-ink/10 bg-transparent'}`}>
                                            {!formData.isPhotography && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        <span className={`text-[10px] uppercase tracking-widest font-black transition-colors ${!formData.isPhotography ? 'text-ink' : 'text-ink/30'}`}>Artwork</span>
                                    </div>

                                    <div 
                                        onClick={() => setFormData({...formData, isPhotography: true, categoryRef: ''})}
                                        className="flex items-center gap-2 cursor-pointer group"
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.isPhotography ? 'border-ink bg-ink' : 'border-ink/10 bg-transparent'}`}>
                                            {formData.isPhotography && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        <span className={`text-[10px] uppercase tracking-widest font-black transition-colors ${formData.isPhotography ? 'text-ink' : 'text-ink/30'}`}>Photography</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 pt-6">
                                     <div className="w-5 h-5 rounded-full border-2 border-ink bg-ink flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                     </div>
                                     <span className="text-[10px] uppercase tracking-widest font-black text-ink">Artwork Only</span>
                                </div>
                            )}
                        </div>

                        {/* Extra Fields Section - Only for Marketplace */}
                        {formData.postType === 'marketplace' && (
                            <>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {!formData.isPhotography && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Subcategory</label>
                                            <select 
                                                value={formData.subcategory} onChange={e => setFormData({...formData, subcategory: e.target.value})}
                                                className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20 appearance-none"
                                            >
                                                <option value="">Select Style</option>
                                                <option value="portrait">Portrait</option>
                                                <option value="realistic">Realistic</option>
                                                <option value="abstract">Abstract</option>
                                                <option value="pencil">Pencil/Charcoal</option>
                                                <option value="digital">Digital</option>
                                            </select>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Medium</label>
                                        <input 
                                            type="text" value={formData.medium} onChange={e => setFormData({...formData, medium: e.target.value})}
                                            className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20"
                                            placeholder="e.g. Acrylic on Canvas"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Dimensions</label>
                                        <input 
                                            type="text" value={formData.dimensions} onChange={e => setFormData({...formData, dimensions: e.target.value})}
                                            className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20"
                                            placeholder="e.g. 24x36 inches"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Tags</label>
                                        <input 
                                            type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})}
                                            className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20"
                                            placeholder="nature, modern, colorful"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Artwork Image</label>
                            <div className="relative group cursor-pointer">
                                <input 
                                    type="file" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files?.[0] || null})}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="h-40 border-2 border-dashed border-ink/10 rounded-[32px] flex flex-col items-center justify-center gap-4 group-hover:border-ink/20 transition-all bg-gray-50/50">
                                    {formData.image ? (
                                        <div className="flex items-center gap-3 text-green-600 font-bold">
                                            <CheckCircle2 size={24} />
                                            <span>{formData.image.name}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-ink/20 group-hover:text-ink/40 transition-colors">
                                                <Plus size={24} />
                                            </div>
                                            <p className="text-[10px] uppercase tracking-widest font-black text-ink/30">Click or drag to upload masterpiece</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button 
                            type="button"
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-full h-16 bg-ink text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-ink/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {uploading ? <Loader2 size={18} className="animate-spin" /> : (editingId ? "Update Artwork" : "Publish Artwork")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 backdrop-blur-3xl p-4 sm:p-12 cursor-zoom-out"
        >
          <div 
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
          </div>
        </div>
      )}
    </div>
  );
}
