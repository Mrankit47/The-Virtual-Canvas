'use client';

import { useState } from 'react';
import { 
  Search, ChevronDown, ChevronUp, Mail, Phone, MapPin, 
  Calendar, DollarSign, Clock, CheckCircle2, ShoppingBag, 
  X, Download, ExternalLink, FileText, User, Shield
} from 'lucide-react';

interface AdminUserManagementProps {
  initialUsers: any[];
  initialOrders: any[];
}

export default function AdminUserManagement({ initialUsers, initialOrders }: AdminUserManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Filter users by search query
  const filteredUsers = initialUsers.filter(user => {
    const query = searchQuery.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(query);
    const emailMatch = user.email?.toLowerCase().includes(query);
    return nameMatch || emailMatch;
  });

  // Get orders associated with a user
  const getUserOrders = (userEmail: string) => {
    if (!userEmail) return [];
    return initialOrders.filter(order => 
      order.userEmail?.toLowerCase() === userEmail.toLowerCase() || 
      order.email?.toLowerCase() === userEmail.toLowerCase()
    );
  };

  const handleToggleUser = (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(userId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-5 rounded-3xl border border-ink/5 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
          <input 
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-ink/5 rounded-2xl text-sm text-ink placeholder-ink/30 focus:outline-none focus:border-ink/20 focus:ring-1 focus:ring-ink/20 transition-all font-medium"
          />
        </div>
        <div className="text-xs text-ink/40 font-mono uppercase tracking-wider shrink-0">
          Showing {filteredUsers.length} of {initialUsers.length} Users
        </div>
      </div>

      {/* Main User List */}
      <div className="bg-white rounded-[32px] border border-ink/5 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-ink/5">
          <h2 className="text-xl font-black font-serif text-ink tracking-tight">Active User Base</h2>
          <p className="text-xs text-ink/40 mt-1">Click on a user profile to manage their orders and inspect transactions</p>
        </div>

        <div className="divide-y divide-ink/5">
          {filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-ink/20 text-xs uppercase tracking-widest font-black">
              No users found matching your search
            </div>
          ) : filteredUsers.map((user) => {
            const userOrders = getUserOrders(user.email);
            const isExpanded = expandedUserId === user._id;

            return (
              <div key={user._id} className="transition-all duration-300">
                {/* User Row (Clickable) */}
                <div 
                  onClick={() => handleToggleUser(user._id)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                    isExpanded ? 'bg-gray-50/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-ink/5 text-ink flex items-center justify-center transition-all shadow-sm overflow-hidden border border-ink/5 shrink-0">
                      {user.image ? (
                        <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-ink leading-tight flex items-center gap-2">
                        {user.name || 'Unnamed User'}
                        {user.role === 'admin' && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[8px] font-black uppercase tracking-wider border border-purple-100">
                            Admin
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-ink/30 font-black mt-1 uppercase tracking-widest truncate">
                        <Mail size={10} />
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] uppercase font-black tracking-widest border transition-all ${
                      userOrders.length > 0 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-gray-50 text-ink/30 border-ink/5'
                    }`}>
                      {userOrders.length} {userOrders.length === 1 ? 'Order' : 'Orders'}
                    </span>
                    <div className="text-ink/30">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Dropdown Container (Orders List) */}
                {isExpanded && (
                  <div className="bg-gray-50/20 px-6 sm:px-12 py-4 border-t border-b border-ink/5 space-y-3 transition-all duration-300">
                    <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-ink/30 mb-2">Placed Orders Directory</h4>
                    
                    {userOrders.length === 0 ? (
                      <div className="py-6 text-center text-ink/20 text-[10px] uppercase tracking-widest font-black bg-white rounded-2xl border border-ink/5">
                        No orders placed by this account yet
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userOrders.map((order) => {
                          const orderAmount = order.orderType === 'cart' ? (order.totalAmount || order.price) : order.price;
                          
                          return (
                            <div 
                              key={order._id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                              }}
                              className="bg-white border border-ink/5 p-4 rounded-2xl hover:shadow-md hover:border-ink/10 transition-all cursor-pointer flex justify-between items-center group relative overflow-hidden"
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-ink/5 group-hover:bg-ink transition-all" />
                              <div className="min-w-0 pl-2">
                                <p className="text-[9px] font-mono text-ink/30 uppercase tracking-wider mb-1">#{order.orderId}</p>
                                <h5 className="text-xs font-black text-ink leading-tight truncate">
                                  {order.orderType === 'cart' ? 'Cart Purchase' : order.orderType === 'direct' ? 'Direct Buy' : 'Commissioned Sketch/Art'}
                                </h5>
                                <p className="text-[9px] font-medium text-ink/40 mt-1 uppercase tracking-widest">
                                  {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-serif font-black text-ink">₹{(orderAmount || 0).toLocaleString()}</p>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold ${
                                  order.orderStatus === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                  order.orderStatus === 'progress' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {order.orderStatus}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Complete Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto transition-all animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-[32px] border border-ink/5 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col my-8">
            
            {/* Modal Header */}
            <div className="p-6 sm:p-8 border-b border-ink/5 flex justify-between items-start shrink-0">
              <div>
                <p className="text-[10px] font-mono text-ink/30 uppercase tracking-widest mb-1.5">Order Detail Overview</p>
                <h3 className="text-xl font-serif font-black text-ink">ID: #{selectedOrder.orderId}</h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl hover:bg-gray-100 text-ink/40 hover:text-ink transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
              
              {/* Top Status & Pricing Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 border border-ink/5 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[9px] uppercase tracking-widest font-black text-ink/30 mb-2 flex items-center gap-1.5">
                    <Clock size={10} /> Fulfillment Status
                  </span>
                  <span className={`text-xs uppercase tracking-widest font-black inline-block px-2.5 py-1 rounded-lg ${
                    selectedOrder.orderStatus === 'completed' ? 'bg-emerald-500 text-white' :
                    selectedOrder.orderStatus === 'progress' ? 'bg-sky-500 text-white' : 'bg-amber-400 text-white'
                  }`}>
                    {selectedOrder.orderStatus}
                  </span>
                </div>
                <div className="bg-gray-50 border border-ink/5 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[9px] uppercase tracking-widest font-black text-ink/30 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={10} /> Payment Status
                  </span>
                  <span className={`text-xs uppercase tracking-widest font-black inline-block px-2.5 py-1 rounded-lg border ${
                    selectedOrder.paymentStatus === 'paid' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-inner' 
                      : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
                <div className="bg-gray-50 border border-ink/5 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[9px] uppercase tracking-widest font-black text-ink/30 mb-2 flex items-center gap-1.5">
                    <DollarSign size={10} /> Total Value
                  </span>
                  <span className="text-lg font-serif font-black text-ink">
                    ₹{((selectedOrder.orderType === 'cart' ? (selectedOrder.totalAmount || selectedOrder.price) : selectedOrder.price) || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Order Content Info */}
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-ink/30 border-b border-ink/5 pb-2">Purchase Parameters</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest mb-1">Order Category</p>
                    <p className="font-semibold text-ink uppercase tracking-wide text-xs">{selectedOrder.orderType || 'commission'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest mb-1">Commission Art Type</p>
                    <p className="font-semibold text-ink uppercase tracking-wide text-xs">{selectedOrder.artworkType || 'N/A'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest mb-1">Custom Request Requirements</p>
                    <p className="text-ink text-xs font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl border border-ink/5 whitespace-pre-line">
                      {selectedOrder.description || 'No custom requirements specified.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cart Items (If applicable) */}
              {selectedOrder.orderType === 'cart' && selectedOrder.cartItems && selectedOrder.cartItems.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-ink/30 border-b border-ink/5 pb-2">Cart Artworks Purchased</h4>
                  <div className="space-y-3">
                    {selectedOrder.cartItems.map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-ink/5">
                        <div className="w-12 h-12 rounded-xl bg-ink/5 overflow-hidden border border-ink/5 shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-ink/20"><ShoppingBag size={18} /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-black text-ink leading-tight truncate">{item.title}</h5>
                          <p className="text-[9px] text-ink/30 uppercase tracking-widest mt-0.5">ID: {item.artworkId?.slice(-6)}</p>
                        </div>
                        <div className="font-bold text-xs text-ink shrink-0">₹{item.price?.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Contact & Address Details */}
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-ink/30 border-b border-ink/5 pb-2">Fulfillment Contact Info</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><User size={10} /> Customer Name</p>
                    <p className="font-bold text-ink text-xs">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Phone size={10} /> Phone Number</p>
                    <p className="font-bold text-ink text-xs">{selectedOrder.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Mail size={10} /> Email ID</p>
                    <p className="font-bold text-ink text-xs select-all truncate">{selectedOrder.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Calendar size={10} /> Submitted Date</p>
                    <p className="font-bold text-ink text-xs">
                      {new Date(selectedOrder.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })} at {new Date(selectedOrder.createdAt).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><MapPin size={10} /> Shipping Address</p>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-ink/5 text-xs font-semibold text-ink leading-relaxed">
                      <p>{selectedOrder.address}</p>
                      <p className="text-[10px] text-ink/40 font-mono mt-1.5 uppercase tracking-wider">PINCODE: {selectedOrder.pincode}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reference Image Details & Download */}
              {selectedOrder.referenceImage && (
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-ink/30 border-b border-ink/5 pb-2">Reference Sample Image</h4>
                  <div className="flex flex-col sm:flex-row items-center gap-5 bg-gray-50 p-5 rounded-3xl border border-ink/5">
                    <div className="w-32 h-32 rounded-2xl bg-ink/5 overflow-hidden border border-ink/5 shadow-sm relative group shrink-0">
                      <img src={selectedOrder.referenceImage} alt="Reference sample upload" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-3 w-full sm:w-auto">
                      <h5 className="text-xs font-black text-ink leading-tight flex items-center gap-1.5">
                        <FileText size={14} className="text-ink/40" /> reference_upload_{selectedOrder.orderId?.slice(-5)}.jpg
                      </h5>
                      <p className="text-[10px] text-ink/40 font-medium">Customer uploaded sample image for reference or custom reproduction.</p>
                      
                      <div className="flex flex-wrap gap-3 pt-1">
                        <a 
                          href={selectedOrder.referenceImage}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black text-ink/60 hover:text-ink border border-ink/10 hover:border-ink/20 bg-white rounded-xl transition-all"
                        >
                          <ExternalLink size={12} /> Open URL
                        </a>
                        <a 
                          href={selectedOrder.referenceImage}
                          download={`reference_${selectedOrder.orderId}.jpg`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black text-white bg-ink hover:bg-ink/90 rounded-xl transition-all shadow-md shadow-ink/10"
                        >
                          <Download size={12} /> Download Image
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-ink/5 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 bg-ink text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-ink/90 transition-all shadow-md shadow-ink/10 active:scale-95"
              >
                Close details view
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
