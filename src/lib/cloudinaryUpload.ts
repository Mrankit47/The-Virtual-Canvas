export const uploadToCloudinary = async (file: File | Blob, folder?: string) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Missing Cloudinary environment variables");
  }

  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", uploadPreset);
  if (folder) {
    data.append("folder", folder);
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, // auto detects image vs video
    {
      method: "POST",
      body: data,
    }
  );

  if (!res.ok) {
    const errorDetails = await res.json();
    throw new Error(`Cloudinary Upload Failed: ${errorDetails.error?.message || 'Unknown error'}`);
  }

  const result = await res.json();
  return result.secure_url;
};
