'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Trash2, Loader2, Image as ImageIcon, CheckCircle2, X, Pencil, Eye, Star, Sparkles, Camera } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';
import { getImageUrl } from '@/lib/imageResolver';
import { CameraCaptureModal } from '@/components/ui/CameraCaptureModal';

export default function AdminArtworksPage() {
  const { data: session } = useSession();
  const { addToast } = useUIStore();
  
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedImage) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = 'unset'; }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedImage]);

  const [formData, setFormData] = useState({
    title: '', description: '', price: '', postType: 'gallery',
    isPhotography: false, isFeatured: false, categoryRef: '',
    subcategory: '', medium: '', dimensions: '', tags: '',
    alt: '', artistRef: '', isArtistUpload: false,
    createdAt: new Date().toISOString().slice(0, 16),
    image: null as File | null
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [photoCategories, setPhotoCategories] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ 
      title: '', description: '', price: '', postType: 'gallery', 
      isPhotography: false, isFeatured: false, categoryRef: '', 
      subcategory: '', medium: '', dimensions: '', tags: '', 
      alt: '', artistRef: '', isArtistUpload: false,
      createdAt: new Date().toISOString().slice(0, 16),
      image: null 
    });
  };

  useEffect(() => { fetchArtworks(); fetchCategories(); fetchArtists(); }, []);

  const fetchArtworks = async () => {
    try {
      const res = await fetch('/api/admin/artwork');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setArtworks(data);
    } catch (err: any) { addToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const [catRes, photoRes] = await Promise.all([
        fetch('/api/categories'), fetch('/api/categories?type=photography')
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (photoRes.ok) setPhotoCategories(await photoRes.json());
    } catch (err) {}
  };

  const fetchArtists = async () => {
    try {
      const res = await fetch('/api/admin/artists');
      if (res.ok) setArtists(await res.json());
    } catch (err) {}
  };

  const activeCategories = (formData.isPhotography ? photoCategories : categories) || [];

  const handleUpload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!session) { addToast("You must be logged in", "error"); return; }
    if (!formData.title.trim()) { addToast("Please enter a title", "error"); return; }
    if (!formData.categoryRef) { addToast("Please select a category", "error"); return; }
    if (formData.postType === 'marketplace' && (!formData.price || Number(formData.price) <= 0)) {
      addToast("Please enter a valid price for marketplace", "error"); return;
    }
    if (!editingId && !formData.image) { addToast("Please upload an image", "error"); return; }

    try {
      setUploading(true);
      let imageUrl = '';

      if (formData.image) {
        addToast("Uploading image to secure storage...", "info");
        const currentActiveCats = formData.isPhotography ? (photoCategories || []) : (categories || []);
        const typeFolder = (formData.postType === 'marketplace' ? 'Marketplace' : (formData.isPhotography ? 'Photography' : 'Gallery')).trim();
        const categoryName = (currentActiveCats.find(c => c._id === formData.categoryRef)?.title || 'Uncategorized').trim();
        const folderPath = `TVC Assets/Admin Artworks/${typeFolder}/${categoryName}`.replace(/\s+\//g, '/').replace(/\/\s+/g, '/').trim();
        imageUrl = await uploadToCloudinary(formData.image, folderPath);
        addToast("Image uploaded! Saving details...", "info");
      } else {
        addToast("Updating artwork details...", "info");
      }

      const { image, ...apiData } = formData;
      const res = await fetch('/api/admin/artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...apiData, id: editingId, imageUrl: imageUrl || undefined }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error occurred");

      addToast(editingId ? "Artwork updated!" : "Artwork published!", "success");
      closeModal();
      fetchArtworks();
    } catch (err: any) {
      addToast(err.message || "Failed to process request", "error");
    } finally { setUploading(false); }
  };

  const handleAIFill = async () => {
    if (!formData.image) {
      addToast("Please upload an image first to use AI Auto-Fill", "error");
      return;
    }

    try {
      setIsAnalyzing(true);
      addToast("Analyzing image with AI...", "info");

      const reader = new FileReader();
      reader.readAsDataURL(formData.image);
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch('/api/admin/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              imageBase64: base64, 
              mimeType: formData.image?.type 
            }),
          });
          
          if (!res.ok) throw new Error("Failed to analyze image");
          
          const data = await res.json();
          
          setFormData(prev => ({
            ...prev,
            title: prev.title || data.title || '',
            description: prev.description || data.description || '',
            tags: prev.tags || data.tags || '',
            medium: prev.medium || data.medium || '',
            alt: prev.alt || data.alt || prev.title || data.title || ''
          }));
          
          addToast("Fields auto-filled successfully!", "success");
        } catch (error: any) {
          addToast(error.message, "error");
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.onerror = () => {
        addToast("Failed to read image file", "error");
        setIsAnalyzing(false);
      }
    } catch (err: any) {
      addToast(err.message, "error");
      setIsAnalyzing(false);
    }
  };

  const openEditModal = (art: any) => {
    setEditingId(art._id);
    setFormData({
      title: art.title || '', description: art.description || '', price: art.price?.toString() || '',
      postType: art.postType || 'gallery', isPhotography: !!art.isPhotography, isFeatured: !!art.isFeatured,
      categoryRef: art.category?._ref || art.category?._id || '', subcategory: art.subcategory || '',
      medium: art.medium || '', dimensions: art.dimensions || '',
      alt: art.image?.alt || '', 
      artistRef: art.artist?._ref || art.artist?._id || '',
      isArtistUpload: !!art.isArtistUpload,
      createdAt: art.createdAt ? new Date(art.createdAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      tags: Array.isArray(art.tags) ? art.tags.join(', ') : (art.tags || ''), image: null
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this artwork?")) return;
    try {
      const res = await fetch('/api/admin/artwork', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error("Failed to delete");
      addToast("Artwork deleted", "success");
      fetchArtworks();
    } catch (err: any) { addToast(err.message, "error"); }
  };

  const resolveImage = (art: any) => {
    return getImageUrl(art);
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[32px] border border-ink/5 shadow-sm">
        <div>
          <h1 className="text-3xl font-black font-serif text-ink tracking-tight">Manage Artworks</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] font-black text-ink/30 mt-2">Upload & Manage Gallery, Marketplace & Photography</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-3 px-8 py-4 bg-ink text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-ink/20">
          <Plus size={18} /> Upload Artwork
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-10">
          {[1,2,3,4].map(i => <div key={i} className="aspect-[4/5] bg-ink/5 rounded-md animate-pulse" />)}
        </div>
      ) : artworks.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-dashed border-ink/10 p-20 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-8">
            <ImageIcon className="text-ink/10" size={32} />
          </div>
          <h3 className="text-xl font-black text-ink mb-2">No artworks yet</h3>
          <p className="text-xs uppercase font-bold tracking-widest text-ink/40 max-w-xs">Start uploading artworks to your gallery and marketplace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-10">
          {artworks.map((art) => {
            const imgUrl = resolveImage(art);
            return (
              <div key={art._id} className="group relative flex flex-col gap-6 cursor-pointer">
                <div className="relative w-full aspect-[4/5] overflow-hidden rounded-md shadow-md bg-ink/5 border border-ink/10">
                  <img src={imgUrl} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-80" />
                  <img src={imgUrl} alt={art.title} className="relative w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out" />
                  <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors duration-500 flex items-end p-4 gap-3">
                    <div className="flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <button onClick={() => setSelectedImage(imgUrl)} className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-lg flex items-center justify-center hover:bg-ink transition-colors shadow-xl"><Eye size={16} /></button>
                      <button onClick={() => openEditModal(art)} className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-lg flex items-center justify-center hover:bg-ink transition-colors shadow-xl"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(art._id)} className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors shadow-xl"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 max-w-[calc(100%-20px)]">
                    <span className={`px-2 py-0.5 rounded-md text-[6px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm border border-white/10 ${art.postType === 'marketplace' ? 'bg-green-500/90 text-white' : 'bg-white/90 text-ink'}`}>
                      {art.postType === 'marketplace' ? 'For Sale' : 'Gallery'}
                    </span>
                    {art.isPhotography && <span className="px-2 py-0.5 bg-blue-500/90 text-white rounded-md text-[6px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm border border-white/10">Photo</span>}
                    {art.isFeatured && <span className="px-2 py-0.5 bg-amber-500/90 text-white rounded-md text-[6px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm border border-white/10">★ Featured</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-3 px-2">
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="font-serif text-xl md:text-2xl tracking-tight text-ink leading-tight truncate">{art.title}</h3>
                    <div className="flex justify-between items-center">
                      <span className="font-sans text-[10px] md:text-xs uppercase tracking-[0.2em] text-ink/35">
                        {typeof art.category === 'string' ? art.category : (art.category?.title || 'Uncategorized')}
                      </span>
                      <div className="w-4 h-[1px] bg-ink/30 group-hover:bg-ink group-hover:w-8 transition-all duration-500" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-ink/5">
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-ink">
                      {art.price ? `₹${art.price}` : 'Gallery Presentation'}
                    </p>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-ink/25 italic">{art.medium || 'Handmade'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => !uploading && closeModal()} />
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 sm:p-10 border-b border-ink/5 flex justify-between items-center bg-white z-10">
              <div>
                <h3 className="text-2xl font-black font-serif text-ink">{editingId ? 'Edit Artwork' : 'Upload New Artwork'}</h3>
                <p className="text-[10px] uppercase tracking-widest text-ink/30 mt-1 font-bold">Manage content with precision</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-ink/5 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-12 custom-scrollbar pb-20">
              {/* 1. Artwork Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-ink rounded-full" />
                  <h4 className="text-xs uppercase tracking-[0.2em] font-black text-ink">Artwork Details</h4>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Title</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Category</label>
                    <select value={formData.categoryRef} onChange={e => setFormData({...formData, categoryRef: e.target.value})}
                      className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20 appearance-none">
                      <option value="">Type to search...</option>
                      {activeCategories.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Subcategory</label>
                    <select value={formData.subcategory} onChange={e => setFormData({...formData, subcategory: e.target.value})}
                      className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20 appearance-none">
                      <option value="">Select style...</option>
                      <option value="portrait">Portrait</option>
                      <option value="realistic">Realistic</option>
                      <option value="abstract">Abstract</option>
                      <option value="pencil">Pencil/Charcoal</option>
                      <option value="digital">Digital</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full h-32 bg-ink/5 border border-ink/5 rounded-3xl p-6 text-sm font-medium focus:outline-none focus:border-ink/20 transition-all resize-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Medium</label>
                    <input type="text" value={formData.medium} onChange={e => setFormData({...formData, medium: e.target.value})}
                      className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20" placeholder="e.g., Pencil, Watercolor, Acrylic" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Dimensions</label>
                    <input type="text" value={formData.dimensions} onChange={e => setFormData({...formData, dimensions: e.target.value})}
                      className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20" placeholder="e.g., 24x36 inches" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Tags</label>
                    <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})}
                      className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20" placeholder="Enter tag and press ENTER..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Created At</label>
                    <input type="datetime-local" value={formData.createdAt} onChange={e => setFormData({...formData, createdAt: e.target.value})}
                      className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20" />
                  </div>
                </div>
              </div>

              {/* 2. Media & Asset */}
              <div className="space-y-6 pt-10 border-t border-ink/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-ink rounded-full" />
                    <h4 className="text-xs uppercase tracking-[0.2em] font-black text-ink">Media & Asset</h4>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAIFill}
                    disabled={isAnalyzing || !formData.image}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    AI Auto-Fill
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink/40 font-black">Image</label>
                    <button
                      type="button"
                      onClick={() => setShowCameraModal(true)}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-lg transition-colors"
                    >
                      <Camera size={13} />
                      Take Photo
                    </button>
                  </div>
                  <div className="relative group cursor-pointer">
                    <input type="file" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files?.[0] || null})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="h-40 border-2 border-dashed border-ink/10 rounded-[32px] flex flex-col items-center justify-center gap-3 group-hover:border-ink/20 bg-gray-50/50 transition-all">
                      {formData.image ? (
                        <div className="flex items-center gap-3 text-green-600 font-bold bg-green-50 px-6 py-3 rounded-2xl">
                          <CheckCircle2 size={24} />
                          <span className="truncate max-w-[200px]">{formData.image.name}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-ink/40"><Plus size={20} /></div>
                            <span className="text-xs font-bold text-ink/30">OR</span>
                            <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center shadow-sm text-purple-600"><Camera size={20} /></div>
                          </div>
                          <p className="text-[10px] uppercase tracking-widest font-black text-ink/30">Drag or click to upload, or use camera</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Alternative Text</label>
                  <p className="text-[9px] text-ink/30 ml-2 font-medium mb-1">Important for SEO and accessibility.</p>
                  <input type="text" value={formData.alt} onChange={e => setFormData({...formData, alt: e.target.value})}
                    className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20" />
                </div>
              </div>

              {/* 3. Commerce & Pricing */}
              <div className="space-y-6 pt-10 border-t border-ink/5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-ink rounded-full" />
                  <h4 className="text-xs uppercase tracking-[0.2em] font-black text-ink">Commerce & Pricing</h4>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Price (₹)</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20" />
                </div>

                <div className="flex items-center gap-4 p-5 bg-ink/5 rounded-2xl border border-ink/5">
                  <button type="button" onClick={() => setFormData({...formData, isFeatured: !formData.isFeatured})}
                    className={`w-12 h-7 rounded-full transition-all duration-300 relative ${formData.isFeatured ? 'bg-ink' : 'bg-ink/10'}`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${formData.isFeatured ? 'left-6' : 'left-1'}`} />
                  </button>
                  <span className="text-[10px] uppercase tracking-widest font-black text-ink">Featured (Top Art Showcase)</span>
                </div>
              </div>

              {/* 4. Artist Information */}
              <div className="space-y-6 pt-10 border-t border-ink/5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-ink rounded-full" />
                  <h4 className="text-xs uppercase tracking-[0.2em] font-black text-ink">Artist Information</h4>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Artist / Creator</label>
                  <select value={formData.artistRef} onChange={e => setFormData({...formData, artistRef: e.target.value})}
                    className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20 appearance-none">
                    <option value="">Type to search...</option>
                    {artists.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-4 p-5 bg-ink/5 rounded-2xl border border-ink/5">
                  <button type="button" onClick={() => setFormData({...formData, isArtistUpload: !formData.isArtistUpload})}
                    className={`w-12 h-7 rounded-full transition-all duration-300 relative ${formData.isArtistUpload ? 'bg-ink' : 'bg-ink/10'}`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${formData.isArtistUpload ? 'left-6' : 'left-1'}`} />
                  </button>
                  <span className="text-[10px] uppercase tracking-widest font-black text-ink">Is Artist Upload?</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Post Type</label>
                  <select value={formData.postType} onChange={e => setFormData({...formData, postType: e.target.value})}
                    className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20 appearance-none">
                    <option value="gallery">Gallery (Portfolio)</option>
                    <option value="marketplace">Marketplace (For Sale)</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 p-5 bg-ink/5 rounded-2xl border border-ink/5">
                  <button type="button" onClick={() => setFormData({...formData, isPhotography: !formData.isPhotography})}
                    className={`w-12 h-7 rounded-full transition-all duration-300 relative ${formData.isPhotography ? 'bg-ink' : 'bg-ink/10'}`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${formData.isPhotography ? 'left-6' : 'left-1'}`} />
                  </button>
                  <span className="text-[10px] uppercase tracking-widest font-black text-ink">Is Photography?</span>
                </div>
              </div>
            </div>

            <div className="p-8 sm:p-10 border-t border-ink/5 bg-white">
              <button type="button" onClick={handleUpload} disabled={uploading}
                className="w-full h-16 bg-ink text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-ink/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                {uploading ? <Loader2 size={18} className="animate-spin" /> : (editingId ? "Update Artwork" : "Publish Artwork")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        title="Capture Artwork Photo"
        onCapture={(file) => {
          setFormData((prev) => ({ ...prev, image: file }));
          addToast("Photo captured from camera!", "success");
        }}
      />

      {/* Lightbox */}
      {selectedImage && (
        <div onClick={() => setSelectedImage(null)} className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 backdrop-blur-3xl p-4 sm:p-12 cursor-zoom-out">
          <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Full size preview" className="max-w-[95vw] max-h-[85vh] object-contain rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/10" />
            <button onClick={() => setSelectedImage(null)} className="absolute -top-12 sm:-top-8 right-0 sm:-right-8 w-10 h-10 bg-white/10 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-xl border border-white/10"><X size={20} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
