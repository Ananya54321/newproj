'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getProductById, getOwnerStore, updateProduct, uploadProductImage, type ProductFormData } from '@/lib/marketplace/service'
import { PRODUCT_CATEGORIES } from '@/lib/auth/types'
import { supabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Product } from '@/lib/auth/types'

export default function EditProductPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [category, setCategory] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])

  useEffect(() => {
    if (!user?.id || !id) return
    const fetch = async () => {
      const [p, store] = await Promise.all([
        getProductById(id, supabaseClient),
        getOwnerStore(user.id, supabaseClient),
      ])
      if (p && store && p.store_id === store.id) {
        setProduct(p)
        setName(p.name)
        setDescription(p.description ?? '')
        setPrice(String(p.price))
        setStock(String(p.stock))
        setCategory(p.category ?? '')
        setIsActive(p.is_active)
        setExistingImages(p.images ?? [])
      }
      setLoading(false)
    }
    fetch()
  }, [user?.id, id])

  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 4 - existingImages.length)
    setNewImageFiles(files)
    setNewImagePreviews(files.map((f) => URL.createObjectURL(f)))
  }

  const removeExisting = (i: number) => setExistingImages((prev) => prev.filter((_, idx) => idx !== i))
  const removeNew = (i: number) => {
    setNewImageFiles((prev) => prev.filter((_, idx) => idx !== i))
    setNewImagePreviews((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      let images = [...existingImages]

      if (newImageFiles.length > 0) {
        const results = await Promise.all(newImageFiles.map((f) => uploadProductImage(f, id)))
        const newUrls = results.map((r) => r.url).filter(Boolean) as string[]
        images = [...images, ...newUrls]
      }

      const data: Partial<ProductFormData> = {
        name,
        description: description || null,
        price: parseFloat(price),
        stock: parseInt(stock),
        category: category as ProductFormData['category'] || null,
        is_active: isActive,
        images,
      }

      const { error } = await updateProduct(id, data)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Product updated')
        router.push('/store')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    )
  }

  if (!product) {
    return <div className="py-20 text-center text-muted-foreground">Product not found.</div>
  }

  return (
    <div className="max-w-xl mx-auto pt-16 pb-8 sm:py-8 px-4 sm:px-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/store" className="p-1.5 text-muted-foreground hover:text-foreground boty-transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 boty-shadow space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Product Name <span className="text-destructive">*</span></label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Price (INR) <span className="text-destructive">*</span></label>
            <input
              required type="number" min="0.01" step="0.01"
              value={price} onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Stock <span className="text-destructive">*</span></label>
            <input
              required type="number" min="0"
              value={stock} onChange={(e) => setStock(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
          <select
            value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Select a category…</option>
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Product Images <span className="text-muted-foreground text-xs">(up to 4)</span>
          </label>
          <div className="flex gap-2 flex-wrap mb-2">
            {existingImages.map((src, i) => (
              <div key={`e-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeExisting(i)} className="absolute top-1 right-1 w-5 h-5 bg-background/80 rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {newImagePreviews.map((src, i) => (
              <div key={`n-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeNew(i)} className="absolute top-1 right-1 w-5 h-5 bg-background/80 rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          {existingImages.length + newImagePreviews.length < 4 && (
            <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-primary/50 boty-transition text-sm text-muted-foreground">
              <Upload className="w-4 h-4" /> Add more images
              <input type="file" accept="image/*" multiple onChange={handleNewImages} className="hidden" />
            </label>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Published</p>
            <p className="text-xs text-muted-foreground">Visible on the marketplace</p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative w-11 h-6 rounded-full boty-transition ${isActive ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm boty-transition ${isActive ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : 'Save Changes'}
        </Button>
      </form>
    </div>
  )
}
