import { create } from 'zustand';

interface OrderState {
  // Existing Form State
  currentStep: number;
  isSubmitting: boolean;
  orderId: string | null;
  formData: any; 
  
  // New Dashboard Data State
  orders: any[];
  isLoading: boolean;
  error: string | null;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setOrderId: (id: string) => void;
  updateFormData: (data: Partial<any>) => void;
  resetOrder: () => void;

  // New Actions
  fetchOrders: () => Promise<void>;
  optimisticUpdateStatus: (orderId: string, status: string) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  currentStep: 1,
  isSubmitting: false,
  orderId: null,
  formData: {},
  orders: [],
  isLoading: false,
  error: null,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setOrderId: (orderId) => set({ orderId }),
  updateFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
  resetOrder: () => set({ currentStep: 1, isSubmitting: false, orderId: null, formData: {} }),

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      set({ orders: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  optimisticUpdateStatus: (orderId, status) => {
    set((state) => ({
      orders: state.orders.map(o => o._id === orderId ? { ...o, orderStatus: status } : o)
    }));
  },
}));
