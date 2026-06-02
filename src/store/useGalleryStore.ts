import { create } from 'zustand';

interface GalleryState {
  selectedCategory: string;
  selectedSubcategory: string;
  searchQuery: string;
  lightboxIsOpen: boolean;
  activeArtwork: any | null; 
  artworksContext: any[]; 
  likesMap: Record<string, string[]>;
  commentsMap: Record<string, any[]>;
  setCategory: (category: string) => void;
  setSubcategory: (subcategory: string) => void;
  setSearchQuery: (query: string) => void;
  openLightbox: (artwork: any, contextArray: any[]) => void;
  closeLightbox: () => void;
  nextArtwork: () => void;
  prevArtwork: () => void;
  setLikesForItem: (itemId: string, likes: string[]) => void;
  setCommentsForItem: (itemId: string, comments: any[]) => void;
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  selectedCategory: 'All',
  selectedSubcategory: 'All',
  searchQuery: '',
  lightboxIsOpen: false,
  activeArtwork: null,
  artworksContext: [],
  likesMap: {},
  commentsMap: {},
  
  setCategory: (category) => set({ selectedCategory: category, selectedSubcategory: 'All' }),
  setSubcategory: (subcategory) => set({ selectedSubcategory: subcategory }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  openLightbox: (artwork, contextArray) => set({ lightboxIsOpen: true, activeArtwork: artwork, artworksContext: contextArray }),
  closeLightbox: () => set({ lightboxIsOpen: false, activeArtwork: null, artworksContext: [] }),
  
  nextArtwork: () => {
    const { activeArtwork, artworksContext } = get();
    if (!activeArtwork || artworksContext.length === 0) return;
    const currentIndex = artworksContext.findIndex(a => a._id === activeArtwork._id);
    if (currentIndex !== -1 && currentIndex < artworksContext.length - 1) {
      set({ activeArtwork: artworksContext[currentIndex + 1] });
    } else {
      set({ activeArtwork: artworksContext[0] }); 
    }
  },
  
  prevArtwork: () => {
    const { activeArtwork, artworksContext } = get();
    if (!activeArtwork || artworksContext.length === 0) return;
    const currentIndex = artworksContext.findIndex(a => a._id === activeArtwork._id);
    if (currentIndex !== -1 && currentIndex > 0) {
      set({ activeArtwork: artworksContext[currentIndex - 1] });
    } else {
      set({ activeArtwork: artworksContext[artworksContext.length - 1] }); 
    }
  },

  setLikesForItem: (itemId, likes) => set((state) => ({
    likesMap: { ...state.likesMap, [itemId]: likes }
  })),

  setCommentsForItem: (itemId, comments) => set((state) => ({
    commentsMap: { ...state.commentsMap, [itemId]: comments }
  }))
}));
