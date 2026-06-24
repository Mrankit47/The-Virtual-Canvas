import React from 'react';
import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description: 'Refund and cancellation guidelines for custom artwork orders and purchased gallery pieces on The Virtual Canvas.',
};


const refundSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://thevirtualcanvas.com/refund-policy#webpage",
      "url": "https://thevirtualcanvas.com/refund-policy",
      "name": "Refund & Cancellation Policy | The Virtual Canvas",
      "description": "Refund and cancellation guidelines for custom artwork orders and purchased gallery pieces on The Virtual Canvas.",
      "isPartOf": {
        "@id": "https://thevirtualcanvas.com/#website"
      },
      "breadcrumb": {
        "@id": "https://thevirtualcanvas.com/refund-policy/#breadcrumb"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://thevirtualcanvas.com/refund-policy/#breadcrumb",
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
          "name": "Refund Protocol",
          "item": "https://thevirtualcanvas.com/refund-policy"
        }
      ]
    }
  ]
};

export default function RefundPolicyPage() {
  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-6 bg-canvas">
      <JsonLd schema={refundSchema} />
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
