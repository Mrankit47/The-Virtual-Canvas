import React from 'react';
import JsonLd from '@/components/seo/JsonLd';

const privacySchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://thevirtualcanvas.com/privacy-policy#webpage",
      "url": "https://thevirtualcanvas.com/privacy-policy",
      "name": "Privacy Policy | The Virtual Canvas",
      "description": "Privacy policy of The Virtual Canvas. Learn how we handle your personal data and order information securely.",
      "isPartOf": {
        "@id": "https://thevirtualcanvas.com/#website"
      },
      "breadcrumb": {
        "@id": "https://thevirtualcanvas.com/privacy-policy/#breadcrumb"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://thevirtualcanvas.com/privacy-policy/#breadcrumb",
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
          "name": "Privacy Policy",
          "item": "https://thevirtualcanvas.com/privacy-policy"
        }
      ]
    }
  ]
};

export default function PrivacyPolicyPage() {
  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-6 bg-canvas">
      <JsonLd schema={privacySchema} />
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
