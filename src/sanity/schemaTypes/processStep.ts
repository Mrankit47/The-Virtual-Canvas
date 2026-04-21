export default {
  name: "processStep",
  type: "document",
  title: "Process Step",
  fields: [
    { name: "stepNumber", type: "number", title: "Step Number" },
    { name: "title", type: "string", title: "Title" },
    { name: "subtitle", type: "string", title: "Subtitle" },

    {
      name: "layout",
      type: "string",
      title: "Layout Mode",
      options: {
        list: [
          { title: "Left Text / Center Image", value: "left" },
          { title: "Right Text / Center Image", value: "right" }
        ],
        layout: "radio"
      },
      initialValue: "left"
    },

    {
      name: "mediaType",
      type: "string",
      title: "Media Type",
      options: {
        list: [
          { title: "Standard Image", value: "image" },
          { title: "Video", value: "video" },
          { title: "Before/After Comparison", value: "comparison" }
        ],
        layout: "radio"
      },
      initialValue: "image"
    },

    {
      name: 'imageSource',
      title: 'Image Source',
      type: 'string',
      options: {
        list: [
          { title: 'Sanity Upload', value: 'sanity' },
          { title: 'Cloudinary URL', value: 'cloudinary' },
        ],
        layout: 'radio',
      },
      initialValue: 'sanity',
      hidden: ({ parent }: any) => parent?.mediaType !== 'image' && parent?.mediaType !== 'comparison'
    },

    {
      name: "image",
      type: "image",
      title: "Main Image (Sanity)",
      options: { hotspot: true },
      hidden: ({ parent }: any) => parent?.mediaType !== "image" || parent?.imageSource === 'cloudinary'
    },

    {
      name: 'imageUrl',
      title: 'Cloudinary Image URL',
      type: 'url',
      description: 'Paste Cloudinary image URL (https://...)',
      hidden: ({ parent }: any) => parent?.mediaType !== "image" || (parent?.imageSource !== 'cloudinary' && parent?.imageSource !== 'url'),
    },

    {
      name: "videoFile",
      type: "file",
      title: "Video File",
      options: { accept: "video/*" },
      hidden: ({ parent }: any) => parent?.mediaType !== "video"
    },

    {
      name: "beforeImage",
      type: "image",
      title: "Before Image",
      options: { hotspot: true },
      hidden: ({ parent }: any) => parent?.mediaType !== "comparison"
    },
    {
      name: "afterImage",
      type: "image",
      title: "After Image",
      options: { hotspot: true },
      hidden: ({ parent }: any) => parent?.mediaType !== "comparison"
    },

    {
      name: "aiCaption",
      type: "text",
      title: "AI Caption / Insight",
      rows: 2,
      description: "Auto-generated artist insight (or custom override)"
    },

    {
      name: "leftText",
      type: "text",
      title: "Left Detail Text",
      rows: 3,
      description: "Will appear on the left if 'Left Text' layout is selected"
    },
    {
      name: "rightText",
      type: "text",
      title: "Right Detail Text",
      rows: 3,
      description: "Will appear on the right if 'Right Text' layout is selected"
    },

    {
      name: "alt",
      type: "string",
      title: "Alt Text",
      description: "SEO and accessibility text for the media"
    },

    { 
      name: "order", 
      type: "number", 
      title: "Display Order" 
    }
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "subtitle",
      media: "image"
    },
    prepare(selection: any) {
      return {
        title: selection.title || "Untitled Step",
        subtitle: selection.subtitle,
        media: selection.media || false
      };
    }
  }
};
