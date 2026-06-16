'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Trash2, Loader2, Image as ImageIcon, CheckCircle2, X, Pencil, Eye, Star, MapPin, Sparkles } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';
import { getImageUrl } from '@/lib/imageResolver';

export default function AdminPhotographyPage() {
  const { data: session } = useSession();
  const { addToast } = useUIStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({ 
    title: '', categoryRef: '', location: '', capturedAt: '', tags: '', isFeatured: false, alt: '',
    createdAt: new Date().toISOString().slice(0, 16),
    image: null as File | null 
  });

  useEffect(() => {
    if (selectedImage) { document.body.style.overflow = 'hidden'; } else { document.body.style.overflow = 'unset'; }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedImage]);

  useEffect(() => { fetchItems(); fetchCategories(); }, []);

  const fetchItems = async () => {
    try { const res = await fetch('/api/admin/photography'); const data = await res.json(); if (!res.ok) throw new Error(data.error); setItems(data); }
    catch (err: any) { addToast(err.message, 'error'); } finally { setLoading(false); }
  };
  const fetchCategories = async () => {
    try { const res = await fetch('/api/categories?type=photography'); if (res.ok) setCategories(await res.json()); } catch {}
  };
  const closeModal = () => { 
    setShowModal(false); 
    setEditingId(null); 
    setFormData({ title: '', categoryRef: '', location: '', capturedAt: '', tags: '', isFeatured: false, alt: '', createdAt: new Date().toISOString().slice(0, 16), image: null }); 
  };

  const handleUpload = async () => {
    if (!formData.title.trim()) { addToast("Please enter a title", "error"); return; }
    if (!editingId && !formData.image) { addToast("Please upload an image", "error"); return; }
    try {
      setUploading(true);
      let imageUrl = '';
      if (formData.image) {
        addToast("Uploading image...", "info");
        const catName = (categories.find(c => c._id === formData.categoryRef)?.title || 'Uncategorized').trim();
        imageUrl = await uploadToCloudinary(formData.image, `TVC Assets/Admin Artworks/Photography/${catName}`);
        addToast("Image uploaded!", "info");
      }
      const res = await fetch('/api/admin/photography', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: editingId, imageUrl: imageUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast(editingId ? "Updated!" : "Published!", "success");
      closeModal(); fetchItems();
    } catch (err: any) { addToast(err.message, "error"); } finally { setUploading(false); }
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
            tags: prev.tags || data.tags || '',
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

  const openEdit = (item: any) => {
    setEditingId(item._id);
    setFormData({ 
      title: item.title || '', 
      categoryRef: item.category?._ref || item.category?._id || '', 
      location: item.location || '',
      capturedAt: item.capturedAt || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
      isFeatured: !!item.isFeatured,
      alt: item.image?.alt || '',
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      image: null 
    });
    setShowModal(true);
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this photo?")) return;
    try { const res = await fetch('/api/admin/photography', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); if (!res.ok) throw new Error("Failed"); addToast("Deleted", "success"); fetchItems(); }
    catch (err: any) { addToast(err.message, "error"); }
  };
  const getImg = (item: any) => getImageUrl(item);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[32px] border border-ink/5 shadow-sm">
        <div>
          <h1 className="text-3xl font-black font-serif text-ink tracking-tight">Photography</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] font-black text-ink/30 mt-2">Manage landing page photography content</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-3 px-8 py-4 bg-ink text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-ink/20">
          <Plus size={18} /> Add Photo
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-10">
          {[1,2,3,4].map(i => <div key={i} className="aspect-[4/5] bg-ink/5 rounded-md animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-dashed border-ink/10 p-20 flex flex-col items-center text-center">
          <ImageIcon className="text-ink/10 mb-8" size={32} />
          <h3 className="text-xl font-black text-ink mb-2">No photography yet</h3>
          <p className="text-xs uppercase font-bold tracking-widest text-ink/40">Upload photos to your photography section.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-10">
          {items.map((item) => { const img = getImg(item); return (
            <div key={item._id} className="group relative flex flex-col gap-6 cursor-pointer">
              <div className="relative w-full aspect-[4/5] overflow-hidden rounded-md shadow-md bg-ink/5 border border-ink/10">
                <img src={img} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-80" />
                <img src={img} alt={item.title} className="relative w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out" />
                <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors duration-500 flex items-end p-4">
                  <div className="flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <button onClick={() => setSelectedImage(img)} className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-lg flex items-center justify-center hover:bg-ink transition-colors shadow-xl"><Eye size={16} /></button>
                    <button onClick={() => openEdit(item)} className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-lg flex items-center justify-center hover:bg-ink transition-colors shadow-xl"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(item._id)} className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors shadow-xl"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="absolute top-3 left-3 flex gap-2">
                  {item.isFeatured && <span className="px-3 py-1 bg-amber-500/90 text-white rounded-full text-[7px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg">★ Featured</span>}
                </div>
              </div>
              <div className="flex flex-col gap-3 px-2">
                <div className="flex flex-col gap-1 min-w-0">
                  <h3 className="font-serif text-xl md:text-2xl tracking-tight text-ink leading-tight truncate">{item.title}</h3>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-[10px] md:text-xs uppercase tracking-[0.2em] text-ink/35">
                      {typeof item.category === 'string' ? item.category : (item.category?.title || 'Uncategorized')}
                    </span>
                    <div className="w-4 h-[1px] bg-ink/30 group-hover:bg-ink group-hover:w-8 transition-all duration-500" />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-ink/5">
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] text-ink/60 inline-flex items-center gap-1">
                    {item.location ? <><MapPin size={10} /> {item.location}</> : 'Studio Shot'}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-ink/25 italic">
                    {item.capturedAt ? new Date(item.capturedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ); })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => !uploading && closeModal()} />
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden">
            <div className="p-8 sm:p-10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black font-serif text-ink">{editingId ? 'Edit Photo' : 'Add Photo'}</h3>
                <button onClick={closeModal} className="p-2 hover:bg-ink/5 rounded-full"><X size={24} /></button>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs uppercase tracking-[0.2em] font-black text-ink">Details</h4>
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
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Title</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20" placeholder="Photo Title" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Category</label>
                    <select value={formData.categoryRef} onChange={e => setFormData({...formData, categoryRef: e.target.value})}
                      className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20 appearance-none">
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Location Captured</label>
                    <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                      className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20" placeholder="e.g. Tokyo, Japan" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Captured At</label>
                    <input type="datetime-local" value={formData.capturedAt} onChange={e => setFormData({...formData, capturedAt: e.target.value})}
                      className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Tags</label>
                    <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})}
                      className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20" placeholder="nature, landscape, sunset" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Created At</label>
                    <input type="datetime-local" value={formData.createdAt} onChange={e => setFormData({...formData, createdAt: e.target.value})}
                      className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20" />
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-200/30">
                  <button type="button" onClick={() => setFormData({...formData, isFeatured: !formData.isFeatured})}
                    className={`w-12 h-7 rounded-full transition-all duration-300 relative ${formData.isFeatured ? 'bg-amber-500' : 'bg-ink/10'}`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${formData.isFeatured ? 'left-6' : 'left-1'}`} />
                  </button>
                  <div>
                    <p className="text-xs font-black text-ink flex items-center gap-2"><Star size={14} className="text-amber-500" /> Featured Photography</p>
                    <p className="text-[9px] text-ink/40 font-bold">Highlight on photography page</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Alternative Text (SEO)</label>
                  <input type="text" value={formData.alt} onChange={e => setFormData({...formData, alt: e.target.value})}
                    className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20" placeholder="Describe the image for accessibility" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Image</label>
                  <div className="relative group cursor-pointer">
                    <input type="file" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files?.[0] || null})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="h-36 border-2 border-dashed border-ink/10 rounded-[32px] flex flex-col items-center justify-center gap-4 group-hover:border-ink/20 bg-gray-50/50">
                      {formData.image ? <div className="flex items-center gap-3 text-green-600 font-bold bg-green-50 px-6 py-3 rounded-2xl"><CheckCircle2 size={24} /><span>{formData.image.name}</span></div>
                      : <><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-ink/20"><Plus size={24} /></div><p className="text-[10px] uppercase tracking-widest font-black text-ink/30">Click to upload</p></>}
                    </div>
                  </div>
                </div>
                <button type="button" onClick={handleUpload} disabled={uploading}
                  className="w-full h-16 bg-ink text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : (editingId ? "Update" : "Publish")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div onClick={() => setSelectedImage(null)} className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 backdrop-blur-3xl p-4 sm:p-12 cursor-zoom-out">
          <div className="relative" onClick={e => e.stopPropagation()}>
            <img src={selectedImage} alt="Preview" className="max-w-[95vw] max-h-[85vh] object-contain rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/10" />
            <button onClick={() => setSelectedImage(null)} className="absolute -top-12 sm:-top-8 right-0 sm:-right-8 w-10 h-10 bg-white/10 hover:bg-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-xl border border-white/10"><X size={20} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
