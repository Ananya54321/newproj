/**
 * Cloudinary upload utility - unsigned preset approach.
 *
 * Required env vars (set in .env.local):
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME     - your cloud name
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET  - an unsigned upload preset
 *
 * Create an unsigned preset in Cloudinary Dashboard →
 *   Settings → Upload → Upload presets → Add unsigned preset
 */
export async function uploadToCloudinary(
  file: File,
  folder: string
): Promise<{ url: string | null; publicId: string | null; error: string | null }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    console.warn(
      '[Cloudinary] Missing env vars - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and/or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET not set.'
    )
    return {
      url: null,
      publicId: null,
      error:
        'Cloudinary not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local.',
    }
  }

  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', uploadPreset)
  fd.append('folder', `furever/${folder}`)

  // Use raw/upload for non-image files (PDFs, docs, etc.) so the original
  // file is preserved and opens correctly in the browser.
  const isImage = file.type.startsWith('image/')
  const resourceType = isImage ? 'image' : 'raw'

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: 'POST', body: fd }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return {
        url: null,
        publicId: null,
        error: (err as { error?: { message?: string } })?.error?.message ?? `Upload failed (HTTP ${res.status})`,
      }
    }

    const data = await res.json() as { secure_url: string; public_id: string }
    return { url: data.secure_url, publicId: data.public_id, error: null }
  } catch (err) {
    return {
      url: null,
      publicId: null,
      error: err instanceof Error ? err.message : 'Upload failed',
    }
  }
}
