import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-6 bg-canvas">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-semibold mb-2 text-ink">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: 2026</p>
        
        <div className="space-y-6">
          <p className="text-gray-600 leading-relaxed">
            The Virtual Canvas respects your privacy. We collect basic user information such as name, email, and order details solely to process artwork requests and improve user experience.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We do not sell or share your personal data with third parties except where required for payment processing or legal obligations.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Your data is stored securely and used only for communication, order fulfillment, and service improvements.
          </p>
        </div>
      </div>
    </section>
  );
}
