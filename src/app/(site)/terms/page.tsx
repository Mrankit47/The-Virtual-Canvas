import React from 'react';
import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions of The Virtual Canvas. Rules, guidelines, and intellectual property terms for users and artists.',
};


const termsSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://thevirtualcanvas.com/terms#webpage",
      "url": "https://thevirtualcanvas.com/terms",
      "name": "Terms & Conditions | The Virtual Canvas",
      "description": "Terms and conditions of The Virtual Canvas. Rules, guidelines, and intellectual property terms for users and artists.",
      "isPartOf": {
        "@id": "https://thevirtualcanvas.com/#website"
      },
      "breadcrumb": {
        "@id": "https://thevirtualcanvas.com/terms/#breadcrumb"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://thevirtualcanvas.com/terms/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://thevirtualcanvas.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Terms & Conditions",
          "item": "https://thevirtualcanvas.com/terms"
        }
      ]
    }
  ]
};

export default function TermsPage() {
  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-6 bg-canvas">
      <JsonLd schema={termsSchema} />
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
