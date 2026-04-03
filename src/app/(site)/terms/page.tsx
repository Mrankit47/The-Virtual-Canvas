import React from 'react';

export default function TermsPage() {
  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-6 bg-canvas">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-semibold mb-2 text-ink">Terms & Conditions</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: 2026</p>
        
        <div className="space-y-6">
          <p className="text-gray-600 leading-relaxed">
            By accessing The Virtual Canvas, you agree to use this platform for lawful purposes only.
          </p>
          <p className="text-gray-600 leading-relaxed">
            All artworks are original and protected by intellectual property rights. Unauthorized use, reproduction, or resale is strictly prohibited.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We reserve the right to cancel orders or deny service in case of misuse or fraudulent activity.
          </p>
        </div>
      </div>
    </section>
  );
}
