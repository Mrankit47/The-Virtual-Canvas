'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Trash2, Loader2, Image as ImageIcon, CheckCircle2, X, Pencil, Eye } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';
import { getImageUrl } from '@/lib/imageResolver';

export default function AdminGalleryPage() {
  const { data: session } = useSession();
  const { addToast } = useUIStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({ title: '', categoryRef: '', image: null as File | null });

  useEffect(() => {
    if (selectedImage) { document.body.style.overflow = 'hidden'; } else { document.body.style.overflow = 'unset'; }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedImage]);

  useEffect(() => { fetchItems(); fetchCategories(); }, []);

  const fetchItems = async () => {
    try { const res = await fetch('/api/admin/gallery'); const data = await res.json(); if (!res.ok) throw new Error(data.error); setItems(data); }
    catch (err: any) { addToast(err.message, 'error'); } finally { setLoading(false); }
  };
  const fetchCategories = async () => {
    try { const res = await fetch('/api/categories'); if (res.ok) setCategories(await res.json()); } catch {}
  };
  const closeModal = () => { setShowModal(false); setEditingId(null); setFormData({ title: '', categoryRef: '', image: null }); };

  const handleUpload = async () => {
    if (!formData.title.trim()) { addToast("Please enter a title", "error"); return; }
    if (!editingId && !formData.image) { addToast("Please upload an image", "error"); return; }
    try {
      setUploading(true);
      let imageUrl = '';
      if (formData.image) {
        addToast("Uploading image...", "info");
        const catName = (categories.find(c => c._id === formData.categoryRef)?.title || 'Uncategorized').trim();
        imageUrl = await uploadToCloudinary(formData.image, `TVC Assets/Admin Artworks/Gallery/${catName}`);
        addToast("Image uploaded!", "info");
      }
      const res = await fetch('/api/admin/gallery', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, title: formData.title, categoryRef: formData.categoryRef, imageUrl: imageUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast(editingId ? "Updated!" : "Published!", "success");
      closeModal(); fetchItems();
    } catch (err: any) { addToast(err.message, "error"); } finally { setUploading(false); }
  };

  const openEdit = (item: any) => {
    setEditingId(item._id);
    setFormData({ title: item.title || '', categoryRef: item.category?._ref || '', image: null });
    setShowModal(true);
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this gallery item?")) return;
    try { const res = await fetch('/api/admin/gallery', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); if (!res.ok) throw new Error("Failed"); addToast("Deleted", "success"); fetchItems(); }
    catch (err: any) { addToast(err.message, "error"); }
  };
  const getImg = (item: any) => getImageUrl(item);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[32px] border border-ink/5 shadow-sm">
        <div>
          <h1 className="text-3xl font-black font-serif text-ink tracking-tight">Gallery</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] font-black text-ink/30 mt-2">Manage landing page gallery content</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-3 px-8 py-4 bg-ink text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-ink/20">
          <Plus size={18} /> Add Gallery Item
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-10">
          {[1,2,3,4].map(i => <div key={i} className="aspect-[4/5] bg-ink/5 rounded-md animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-dashed border-ink/10 p-20 flex flex-col items-center text-center">
          <ImageIcon className="text-ink/10 mb-8" size={32} />
          <h3 className="text-xl font-black text-ink mb-2">No gallery items yet</h3>
          <p className="text-xs uppercase font-bold tracking-widest text-ink/40">Upload images to your gallery.</p>
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
              </div>
              <div className="flex justify-between items-start px-2">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <h3 className="font-serif text-xl md:text-2xl tracking-tight text-ink leading-tight truncate">{item.title}</h3>
                  <span className="font-sans text-[10px] md:text-xs uppercase tracking-[0.2em] text-ink/35">{typeof item.category === 'string' ? item.category : (item.category?.title || 'Uncategorized')}</span>
                </div>
                <div className="w-4 h-[1px] bg-ink/30 group-hover:bg-ink group-hover:w-8 transition-all duration-500 mt-3" />
              </div>
            </div>
          ); })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => !uploading && closeModal()} />
          <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden">
            <div className="p-8 sm:p-10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black font-serif text-ink">{editingId ? 'Edit Gallery Item' : 'Add Gallery Item'}</h3>
                <button onClick={closeModal} className="p-2 hover:bg-ink/5 rounded-full"><X size={24} /></button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Title</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20" placeholder="Artwork Title" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Category</label>
                  <select value={formData.categoryRef} onChange={e => setFormData({...formData, categoryRef: e.target.value})}
                    className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-ink/20 appearance-none">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-2 font-black">Image</label>
                  <div className="relative group cursor-pointer">
                    <input type="file" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files?.[0] || null})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="h-36 border-2 border-dashed border-ink/10 rounded-[32px] flex flex-col items-center justify-center gap-4 group-hover:border-ink/20 bg-gray-50/50">
                      {formData.image ? <div className="flex items-center gap-3 text-green-600 font-bold"><CheckCircle2 size={24} /><span>{formData.image.name}</span></div>
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
