'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Package, Pencil, Trash2, Store as StoreIcon, ExternalLink, Loader2, AlertTriangle, RotateCcw, Heart } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import {
  getOwnerStoreWithProducts,
  archiveProduct,
  restoreProduct,
  createStore,
  type StoreFormData,
} from '@/lib/marketplace/service'
import { getStoreCollaborations, getProductCollaborationAny } from '@/lib/collaboration/service'
import { supabaseClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/marketplace/service'
import type { Store, Product, NgoProductCollaborationWithRelations } from '@/lib/auth/types'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CollaborateModal } from '@/components/collaboration/collaborate-modal'

export default function StoreDashboardPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingStore, setCreatingStore] = useState(false)
  const [activeTab, setActiveTab] = useState<'products' | 'archived' | 'collaborations'>('products')

  // Collaboration state
  const [collaborateProduct, setCollaborateProduct] = useState<Product | null>(null)
  const [collaborateModalOpen, setCollaborateModalOpen] = useState(false)
  const [productCollaborations, setProductCollaborations] = useState<Record<string, NgoProductCollaborationWithRelations>>({})
  const [collabsLoading, setCollabsLoading] = useState(false)
  const [allCollaborations, setAllCollaborations] = useState<NgoProductCollaborationWithRelations[]>([])

  // Create store form state
  const [newStoreName, setNewStoreName] = useState('')
  const [newStoreSlug, setNewStoreSlug] = useState('')
  const [newStoreDesc, setNewStoreDesc] = useState('')

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const result = await getOwnerStoreWithProducts(user.id, supabaseClient)
      if (result) {
        const { products: p, ...s } = result
        setStore(s)
        setProducts(p)
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const loadCollaborations = useCallback(async (storeId: string) => {
    setCollabsLoading(true)
    try {
      const collabs = await getStoreCollaborations(storeId)
      setAllCollaborations(collabs)
      const map: Record<string, NgoProductCollaborationWithRelations> = {}
      for (const c of collabs) { map[c.product_id] = c }
      setProductCollaborations(map)
    } catch {
      // non-fatal
    } finally {
      setCollabsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (store?.id) loadCollaborations(store.id) }, [store?.id, loadCollaborations])

  // Redirect non store_owners
  useEffect(() => {
    if (!loading && profile && profile.role !== 'store_owner') {
      router.replace('/dashboard')
    }
  }, [loading, profile, router])

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setCreatingStore(true)
    const data: StoreFormData = {
      name: newStoreName,
      slug: newStoreSlug,
      description: newStoreDesc || null,
    }
    const { store: created, error } = await createStore(data, user.id)
    setCreatingStore(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Store created!')
      setStore(created)
      await load()
    }
  }

  const handleArchiveProduct = async (productId: string) => {
    const { error } = await archiveProduct(productId)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Product archived')
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, is_archived: true } : p))
    }
  }

  const handleRestoreProduct = async (productId: string) => {
    const { error } = await restoreProduct(productId)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Product restored')
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, is_archived: false } : p))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    )
  }

  // No store yet — show creation form
  if (!store) {
    return (
      <div className="min-h-screen">
        <div className="bg-card border-b border-border/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-8 sm:py-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <StoreIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-foreground mb-1.5">Set Up Your Store</h1>
                <p className="text-muted-foreground text-sm max-w-lg">Create your store to start listing pet products for sale.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="max-w-xl">

        <form onSubmit={handleCreateStore} className="bg-card rounded-2xl p-6 boty-shadow space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Store Name <span className="text-destructive">*</span></label>
            <input
              required
              type="text"
              value={newStoreName}
              onChange={(e) => {
                setNewStoreName(e.target.value)
                if (!newStoreSlug || newStoreSlug === newStoreName.toLowerCase().replace(/\s+/g, '-')) {
                  setNewStoreSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                }
              }}
              placeholder="Paws & Claws"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Store URL Slug <span className="text-destructive">*</span></label>
            <div className="flex items-center rounded-xl bg-background border border-border/60 overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
              <span className="px-3 py-2.5 text-sm text-muted-foreground border-r border-border/60 bg-muted/30">pawhaven.com/marketplace/</span>
              <input
                required
                type="text"
                value={newStoreSlug}
                onChange={(e) => setNewStoreSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                placeholder="paws-and-claws"
                className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
            <textarea
              value={newStoreDesc}
              onChange={(e) => setNewStoreDesc(e.target.value)}
              rows={3}
              placeholder="What makes your store special?"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <Button type="submit" disabled={creatingStore} className="w-full">
            {creatingStore ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating…</> : 'Create Store'}
          </Button>
        </form>
        </div>
        </div>
      </div>
    )
  }

  const visibleProducts = products.filter((p) => !p.is_archived)
  const archivedProducts = products.filter((p) => p.is_archived)
  const activeProducts = visibleProducts.filter((p) => p.is_active)
  const draftProducts = visibleProducts.filter((p) => !p.is_active)

  const tabProducts = activeTab === 'products' ? visibleProducts : activeTab === 'archived' ? archivedProducts : []

  return (
    <div className="min-h-screen">
      {/* Collaborate modal */}
      {collaborateProduct && store && (
        <CollaborateModal
          open={collaborateModalOpen}
          onOpenChange={setCollaborateModalOpen}
          product={collaborateProduct}
          storeId={store.id}
          existingCollaboration={productCollaborations[collaborateProduct.id] ?? null}
          onCollaborationChanged={() => loadCollaborations(store.id)}
        />
      )}

      {/* Hero */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-8 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <StoreIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-3xl font-bold text-foreground">{store.name}</h1>
                  {!store.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Pending Approval</span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  {store.description ?? 'Manage your products and track orders.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {store.is_active && (
                <Link
                  href={`/marketplace/${store.slug ?? store.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground boty-transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Store
                </Link>
              )}
              <Button asChild size="sm">
                <Link href="/store/products/new" className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  Add Product
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Out-of-stock alert */}
      {visibleProducts.some((p) => p.stock === 0) && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {visibleProducts.filter((p) => p.stock === 0).length === 1
              ? '1 product is out of stock.'
              : `${visibleProducts.filter((p) => p.stock === 0).length} products are out of stock.`}{' '}
            Update their stock to keep selling.
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active', value: activeProducts.length },
          { label: 'Drafts', value: draftProducts.length },
          { label: 'Archived', value: archivedProducts.length },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl p-4 boty-shadow text-center">
            <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div>
        <div className="flex items-center gap-1 border-b border-border/50 mb-4">
          {(['products', 'archived', 'collaborations'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium boty-transition border-b-2 -mb-px flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'products' && `Products (${visibleProducts.length})`}
              {tab === 'archived' && `Archived (${archivedProducts.length})`}
              {tab === 'collaborations' && (
                <>
                  <Heart className="w-3.5 h-3.5" />
                  Collaborations
                  {allCollaborations.length > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
                      {allCollaborations.length}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Collaborations tab */}
        {activeTab === 'collaborations' && (
          <>
            {collabsLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : allCollaborations.length === 0 ? (
              <div className="py-12 text-center bg-card rounded-2xl boty-shadow">
                <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-semibold text-foreground">No collaboration requests yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a product and click the collaborate button to request an NGO partnership.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {allCollaborations.map((collab) => {
                  const statusColor: Record<string, string> = {
                    pending: 'bg-amber-100 text-amber-800',
                    accepted: 'bg-emerald-100 text-emerald-800',
                    rejected: 'bg-destructive/10 text-destructive',
                  }
                  return (
                    <div key={collab.id} className="bg-card rounded-2xl boty-shadow p-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            {collab.product.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={collab.product.images[0]} alt={collab.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{collab.product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {collab.ngo_proceeds_percent}% → {collab.ngo.ngo_profile?.organization_name ?? collab.ngo.full_name}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${statusColor[collab.status] ?? ''}`}>
                          {collab.status}
                        </span>
                      </div>
                      {collab.status === 'accepted' && (
                        <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1.5">
                          Featured in marketplace — buyers can see this NGO partnership.
                        </p>
                      )}
                      {collab.ngo_response_message && (
                        <p className="text-xs text-muted-foreground italic">NGO: &quot;{collab.ngo_response_message}&quot;</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Products / Archived tabs */}
        {activeTab !== 'collaborations' && (tabProducts.length === 0 ? (
          <div className="py-12 text-center bg-card rounded-2xl boty-shadow">
            <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            {activeTab === 'products' ? (
              <>
                <p className="font-semibold text-foreground">No products yet</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Add your first product to start selling.</p>
                <Button asChild size="sm">
                  <Link href="/store/products/new">Add Product</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="font-semibold text-foreground">No archived products</p>
                <p className="text-sm text-muted-foreground mt-1">Products you remove from the marketplace will appear here.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {tabProducts.map((product) => {
              const collab = productCollaborations[product.id] ?? null
              const collabStatusColor: Record<string, string> = {
                pending: 'bg-amber-100 text-amber-800',
                accepted: 'bg-emerald-100 text-emerald-800',
                rejected: 'bg-destructive/10 text-destructive',
              }
              return (
              <div
                key={product.id}
                className={`flex items-center gap-4 bg-card rounded-xl p-4 boty-shadow ${product.is_archived ? 'opacity-60' : ''}`}
              >
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {product.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-muted-foreground/40" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground truncate">{product.name}</p>
                    {!product.is_active && !product.is_archived && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Draft</span>
                    )}
                    {product.is_archived && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Archived</span>
                    )}
                    {product.stock === 0 && !product.is_archived && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">Out of stock</span>
                    )}
                    {collab && (
                      <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${collabStatusColor[collab.status] ?? ''}`}>
                        <Heart className="w-3 h-3" />
                        {collab.status === 'accepted' ? 'Featured' : collab.status === 'pending' ? 'Collab Pending' : 'Collab Rejected'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(product.price)} · {product.stock} in stock
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {product.is_archived ? (
                    <button
                      type="button"
                      onClick={() => handleRestoreProduct(product.id)}
                      className="p-2 text-muted-foreground hover:text-foreground boty-transition"
                      title="Restore product"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  ) : (
                    <>
                      {/* Collaborate button */}
                      <button
                        type="button"
                        onClick={() => { setCollaborateProduct(product); setCollaborateModalOpen(true) }}
                        className={`p-2 boty-transition ${collab && collab.status === 'accepted' ? 'text-emerald-600' : collab ? 'text-amber-500' : 'text-muted-foreground hover:text-primary'}`}
                        title={collab ? `Collaboration: ${collab.status}` : 'Request NGO collaboration'}
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/store/products/${product.id}/edit`}
                        className="p-2 text-muted-foreground hover:text-foreground boty-transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button type="button" className="p-2 text-muted-foreground hover:text-destructive boty-transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Archive product?</AlertDialogTitle>
                            <AlertDialogDescription>
                              &quot;{product.name}&quot; will be hidden from the marketplace. You can restore it later from the Archived tab.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleArchiveProduct(product.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Archive
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
              )
            })}
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}
