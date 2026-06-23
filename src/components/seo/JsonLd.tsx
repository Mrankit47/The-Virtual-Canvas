import React from 'react';

interface JsonLdProps {
  schema: Record<string, any> | Array<Record<string, any>>;
}

export default function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}
