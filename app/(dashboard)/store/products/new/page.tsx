'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getOwnerStore, createProduct, uploadProductImage, type ProductFormData } from '@/lib/marketplace/service'
import { PRODUCT_CATEGORIES } from '@/lib/auth/types'
import { supabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function NewProductPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [category, setCategory] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 4)
    setImageFiles(files)
    setImagePreviews(files.map((f) => URL.createObjectURL(f)))
  }

  const removeImage = (i: number) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== i))
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setSaving(true)
    try {
      const store = await getOwnerStore(user.id, supabaseClient)
      if (!store) {
        toast.error('You need to create a store first')
        return
      }

      const formData: ProductFormData = {
        name,
        description: description || null,
        price: parseFloat(price),
        stock: parseInt(stock),
        category: category as ProductFormData['category'] || null,
        is_active: isActive,
      }

      const { product, error } = await createProduct(formData, store.id)
      if (error || !product) {
        toast.error(error ?? 'Failed to create product')
        return
      }

      // Upload images in parallel
      if (imageFiles.length > 0) {
        const results = await Promise.all(imageFiles.map((f) => uploadProductImage(f, product.id)))
        const urls = results.map((r) => r.url).filter(Boolean) as string[]
        if (urls.length > 0) {
          await supabaseClient.from('products').update({ images: urls }).eq('id', product.id)
        }
      }

      toast.success('Product created!')
      router.push('/store')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/store" className="p-1.5 text-muted-foreground hover:text-foreground boty-transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-foreground">New Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 boty-shadow space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Product Name <span className="text-destructive">*</span></label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Premium Dog Food"
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe your product…"
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Price + Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Price (INR) <span className="text-destructive">*</span></label>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="24.99"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Stock <span className="text-destructive">*</span></label>
            <input
              required
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="50"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Product Images <span className="text-muted-foreground text-xs">(up to 4)</span>
          </label>
          {imagePreviews.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-background/80 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-primary/50 boty-transition text-sm text-muted-foreground">
            <Upload className="w-4 h-4" />
            Upload images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Published toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Published</p>
            <p className="text-xs text-muted-foreground">Visible to customers on the marketplace</p>
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
          {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating…</> : 'Create Product'}
        </Button>
      </form>
    </div>
  )
}
