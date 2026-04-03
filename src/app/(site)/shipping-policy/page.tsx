import React from 'react';

export default function ShippingPolicyPage() {
  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-6 bg-canvas">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-semibold mb-2 text-ink">Shipping & Delivery Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: 2026</p>
        
        <div className="space-y-6">
          <p className="text-gray-600 leading-relaxed">
            Orders are processed within 3–5 business days depending on customization requirements.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Delivery timelines vary based on location and courier services.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Tracking details will be shared once the order is dispatched.
          </p>
        </div>
      </div>
    </section>
  );
}
