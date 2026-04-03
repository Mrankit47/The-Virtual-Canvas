import React from 'react';

export default function RefundPolicyPage() {
  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-6 bg-canvas">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-semibold mb-2 text-ink">Refund & Cancellation Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: 2026</p>
        
        <div className="space-y-6">
          <p className="text-gray-600 leading-relaxed">
            Due to the custom nature of artwork, orders cannot be canceled once production has started.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Refunds are only applicable if the order is not processed or if there is damage or defect in delivery.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Requests must be raised within 48 hours of delivery for consideration.
          </p>
        </div>
      </div>
    </section>
  );
}
