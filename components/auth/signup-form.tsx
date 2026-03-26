'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2, PawPrint, Stethoscope, Heart, Store, Upload, X, Instagram, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordStrength, calculatePasswordStrength } from './password-strength'
import { signUpWithEmail } from '@/lib/auth/service'
import type { SignupFormData, UserRole } from '@/lib/auth/types'
import { ROLE_LABELS, requiresVerification } from '@/lib/auth/types'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Role selection config ────────────────────────────────────────────────────

interface RoleOption {
  role: UserRole
  label: string
  description: string
  icon: React.ElementType
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'user',
    label: 'Pet Owner',
    description: 'Manage your pets, book vet appointments, and join the community.',
    icon: PawPrint,
  },
  {
    role: 'veterinarian',
    label: 'Veterinarian',
    description: 'Offer consultations and manage appointments with pet owners.',
    icon: Stethoscope,
  },
  {
    role: 'ngo',
    label: 'NGO / Rescue',
    description: 'Raise awareness, accept donations, and coordinate rescues.',
    icon: Heart,
  },
  {
    role: 'store_owner',
    label: 'Pet Store Owner',
    description: 'List products and reach pet owners across the platform.',
    icon: Store,
  },
]

type Step = 1 | 2 | 3 | 'success'

// ─── Component ────────────────────────────────────────────────────────────────

export function SignupForm() {
  const [step, setStep] = useState<Step>(1)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Role-specific fields
  const [licenseName, setLicenseName] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [clinicAddress, setClinicAddress] = useState('')
  const [orgName, setOrgName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [address, setAddress] = useState('')
  const [websiteLink, setWebsiteLink] = useState('')
  const [instagramLink, setInstagramLink] = useState('')

  // Document / image uploads
  const [primaryDocUrl, setPrimaryDocUrl] = useState<string | null>(null)
  const [extraDocUrls, setExtraDocUrls] = useState<string[]>([])
  const [storeImageUrls, setStoreImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const primaryDocRef = useRef<HTMLInputElement>(null)
  const extraDocsRef = useRef<HTMLInputElement>(null)
  const storeImagesRef = useRef<HTMLInputElement>(null)

  const passwordResult = password ? calculatePasswordStrength(password) : null

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {}
    if (!fullName.trim()) e.fullName = 'Full name is required'
    if (!email.trim()) {
      e.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Please enter a valid email'
    }
    if (!password) {
      e.password = 'Password is required'
    } else if (passwordResult && passwordResult.strength === 'weak') {
      e.password = 'Please choose a stronger password'
    }
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match'
    if (!agreed) e.agreed = 'You must agree to the Terms of Service'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep3 = (): boolean => {
    const e: Record<string, string> = {}
    if (selectedRole === 'veterinarian' && !licenseName.trim()) {
      e.licenseName = 'License number is required'
    }
    if (selectedRole === 'ngo' && !orgName.trim()) {
      e.orgName = 'Organisation name is required'
    }
    if (selectedRole === 'store_owner' && !storeName.trim()) {
      e.storeName = 'Store name is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ─── Upload helpers ─────────────────────────────────────────────────────────

  const handlePrimaryDocUpload = async (file: File) => {
    setUploading(true)
    const folder = selectedRole === 'veterinarian' ? 'vet-docs' : 'ngo-docs'
    const { url, error } = await uploadToCloudinary(file, folder)
    setUploading(false)
    if (error) { toast.error(error); return }
    if (url) setPrimaryDocUrl(url)
  }

  const handleExtraDocsUpload = async (files: FileList) => {
    const remaining = 3 - extraDocUrls.length
    if (remaining <= 0) return
    setUploading(true)
    const folder = selectedRole === 'veterinarian' ? 'vet-docs' : 'ngo-docs'
    const results = await Promise.all(
      Array.from(files).slice(0, remaining).map((f) => uploadToCloudinary(f, folder))
    )
    setUploading(false)
    setExtraDocUrls((prev) => [...prev, ...results.filter((r) => r.url).map((r) => r.url!)])
  }

  const handleStoreImagesUpload = async (files: FileList) => {
    const remaining = 5 - storeImageUrls.length
    if (remaining <= 0) return
    setUploading(true)
    const results = await Promise.all(
      Array.from(files).slice(0, remaining).map((f) => uploadToCloudinary(f, 'store-images'))
    )
    setUploading(false)
    setStoreImageUrls((prev) => [...prev, ...results.filter((r) => r.url).map((r) => r.url!)])
  }

  // ─── Step handlers ──────────────────────────────────────────────────────────

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setStep(2)
  }

  const handleStep2Continue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return
    if (selectedRole === 'user') { handleSubmit(); return }
    setStep(3)
  }

  const handleSubmit = async () => {
    if (step === 3 && !validateStep3()) return
    if (!selectedRole) return
    setLoading(true)

    const socialLinks: Record<string, string> = {}
    if (websiteLink.trim()) socialLinks.website = websiteLink.trim()
    if (instagramLink.trim()) socialLinks.instagram = instagramLink.trim()

    const payload: SignupFormData = {
      email: email.trim(),
      password,
      confirmPassword,
      full_name: fullName.trim(),
      role: selectedRole,
      ...(selectedRole === 'veterinarian' && {
        license_number: licenseName.trim(),
        clinic_name: clinicName.trim() || undefined,
        clinic_address: clinicAddress.trim() || undefined,
        license_document_url: primaryDocUrl ?? undefined,
        extra_document_urls: extraDocUrls.length ? extraDocUrls : undefined,
        social_links: Object.keys(socialLinks).length ? socialLinks : undefined,
      }),
      ...(selectedRole === 'ngo' && {
        organization_name: orgName.trim(),
        address: address.trim() || undefined,
        registration_document_url: primaryDocUrl ?? undefined,
        extra_document_urls: extraDocUrls.length ? extraDocUrls : undefined,
        social_links: Object.keys(socialLinks).length ? socialLinks : undefined,
      }),
      ...(selectedRole === 'store_owner' && {
        store_name: storeName.trim(),
        address: address.trim() || undefined,
        store_images: storeImageUrls.length ? storeImageUrls : undefined,
        social_links: Object.keys(socialLinks).length ? socialLinks : undefined,
      }),
    }

    try {
      const result = await signUpWithEmail(payload)
      if (result.error) { toast.error(result.error.message); return }
      setStep('success')
    } finally {
      setLoading(false)
    }
  }

  function clearError(key: string) {
    setErrors((p) => { const n = { ...p }; delete n[key]; return n })
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (step === 'success') return <SuccessState email={email} role={selectedRole!} />

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-semibold text-foreground leading-tight">
          Join the Sanctuary
        </h1>
        <p className="text-sm text-muted-foreground">
          Create a dedicated space for your companion&apos;s journey and well-being.
        </p>
      </div>

      {/* Progress dots */}
      {step !== 1 && (
        <div className="flex items-center gap-1.5">
          {([1, 2, 3] as const).map((s) => {
            const isActive = step === s
            const isDone = (step === 2 && s === 1) || (step === 3 && (s === 1 || s === 2))
            const isVisible = s !== 3 || (selectedRole && selectedRole !== 'user')
            if (!isVisible) return null
            return (
              <div
                key={s}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  isActive ? 'w-6 bg-primary' : isDone ? 'w-3 bg-primary/40' : 'w-3 bg-border'
                )}
              />
            )
          })}
        </div>
      )}

      {/* Step 1 - Role selection */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">I am a…</p>
          <div className="grid grid-cols-1 gap-2.5">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.role}
                type="button"
                onClick={() => handleRoleSelect(opt.role)}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-border/60 bg-background text-left hover:border-primary/60 hover:bg-primary/5 transition-all group"
              >
                <opt.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground pt-2">
            Already a member?{' '}
            <Link href="/login" className="text-foreground font-medium hover:text-primary transition-colors">
              Log in here
            </Link>
          </p>
        </div>
      )}

      {/* Step 2 - Basic info */}
      {step === 2 && (
        <form onSubmit={handleStep2Continue} className="space-y-4">
          <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors -mt-2">
            <ArrowLeft size={13} /> Back
          </button>
          <FieldGroup id="fullName" label="Full Name" error={errors.fullName}>
            <Input id="fullName" placeholder="Elena Rosa" value={fullName} onChange={(e) => { setFullName(e.target.value); clearError('fullName') }} disabled={loading} className="h-11 bg-background border-border/60 focus-visible:ring-primary/40" />
          </FieldGroup>
          <FieldGroup id="email" label="Email Address" error={errors.email}>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); clearError('email') }} disabled={loading} className="h-11 bg-background border-border/60 focus-visible:ring-primary/40" />
          </FieldGroup>
          <FieldGroup id="password" label="Password" error={errors.password}>
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" value={password} onChange={(e) => { setPassword(e.target.value); clearError('password') }} disabled={loading} className="h-11 pr-11 bg-background border-border/60 focus-visible:ring-primary/40" />
              <TogglePassword show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
            </div>
            <PasswordStrength password={password} />
          </FieldGroup>
          <FieldGroup id="confirmPassword" label="Confirm Password" error={errors.confirmPassword}>
            <div className="relative">
              <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword') }} disabled={loading} className="h-11 pr-11 bg-background border-border/60 focus-visible:ring-primary/40" />
              <TogglePassword show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
            </div>
          </FieldGroup>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); clearError('agreed') }} disabled={loading} className="mt-0.5 accent-primary" />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I agree to the{' '}
              <Link href="/terms" className="text-foreground underline underline-offset-2 hover:text-primary">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-foreground underline underline-offset-2 hover:text-primary">Privacy Policy</Link>
            </span>
          </label>
          {errors.agreed && <p className="text-xs text-destructive -mt-2">{errors.agreed}</p>}
          <Button type="submit" disabled={loading} className="w-full h-11 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : selectedRole === 'user' ? 'Sign Up' : 'Continue'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already a member?{' '}
            <Link href="/login" className="text-foreground font-medium hover:text-primary transition-colors">Log in here</Link>
          </p>
        </form>
      )}

      {/* Step 3 - Role-specific details */}
      {step === 3 && selectedRole && selectedRole !== 'user' && selectedRole !== 'admin' && (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-5">
          <button type="button" onClick={() => setStep(2)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors -mt-2">
            <ArrowLeft size={13} /> Back
          </button>

          <div className="rounded-xl bg-secondary/60 border border-border/40 p-3.5 text-xs text-muted-foreground leading-relaxed">
            {selectedRole === 'veterinarian' && 'Your credentials will be reviewed by our team before your profile goes live. This typically takes 1–2 business days.'}
            {selectedRole === 'ngo' && 'Your organisation will be reviewed for authenticity before you can receive donations.'}
            {selectedRole === 'store_owner' && 'Your store will be reviewed before products become publicly visible.'}
          </div>

          {/* Veterinarian */}
          {selectedRole === 'veterinarian' && (
            <>
              <FieldGroup id="licenseName" label="License Number *" error={errors.licenseName}>
                <Input id="licenseName" placeholder="e.g. VET-2024-001234" value={licenseName} onChange={(e) => { setLicenseName(e.target.value); clearError('licenseName') }} disabled={loading} className="h-11 bg-background border-border/60 focus-visible:ring-primary/40" />
              </FieldGroup>
              <FieldGroup id="clinicName" label="Clinic Name (optional)">
                <Input id="clinicName" placeholder="e.g. Pawsome Veterinary Clinic" value={clinicName} onChange={(e) => setClinicName(e.target.value)} disabled={loading} className="h-11 bg-background border-border/60 focus-visible:ring-primary/40" />
              </FieldGroup>
              <FieldGroup id="clinicAddress" label="Clinic Address (optional)">
                <Input id="clinicAddress" placeholder="123 Main St, City, Country" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} disabled={loading} className="h-11 bg-background border-border/60 focus-visible:ring-primary/40" />
              </FieldGroup>
              <DocUploadField label="License / Certification Document" description="Upload your veterinary license (PDF, JPG, PNG)" url={primaryDocUrl} onUpload={handlePrimaryDocUpload} onRemove={() => setPrimaryDocUrl(null)} inputRef={primaryDocRef} uploading={uploading} />
              <MultiDocUploadField label="Supporting Documents (up to 3)" description="Additional credentials, insurance, etc." urls={extraDocUrls} onUpload={handleExtraDocsUpload} onRemove={(i) => setExtraDocUrls((p) => p.filter((_, idx) => idx !== i))} inputRef={extraDocsRef} uploading={uploading} maxCount={3} />
            </>
          )}

          {/* NGO */}
          {selectedRole === 'ngo' && (
            <>
              <FieldGroup id="orgName" label="Organisation Name *" error={errors.orgName}>
                <Input id="orgName" placeholder="e.g. Paws & Rescue Society" value={orgName} onChange={(e) => { setOrgName(e.target.value); clearError('orgName') }} disabled={loading} className="h-11 bg-background border-border/60 focus-visible:ring-primary/40" />
              </FieldGroup>
              <FieldGroup id="ngoAddress" label="Organisation Address (optional)">
                <Input id="ngoAddress" placeholder="123 Rescue Lane, City, Country" value={address} onChange={(e) => setAddress(e.target.value)} disabled={loading} className="h-11 bg-background border-border/60 focus-visible:ring-primary/40" />
              </FieldGroup>
              <DocUploadField label="Registration Document" description="Upload your NGO registration certificate (PDF, JPG, PNG)" url={primaryDocUrl} onUpload={handlePrimaryDocUpload} onRemove={() => setPrimaryDocUrl(null)} inputRef={primaryDocRef} uploading={uploading} />
              <MultiDocUploadField label="Additional Documents (up to 3)" description="Tax exemption, annual reports, etc." urls={extraDocUrls} onUpload={handleExtraDocsUpload} onRemove={(i) => setExtraDocUrls((p) => p.filter((_, idx) => idx !== i))} inputRef={extraDocsRef} uploading={uploading} maxCount={3} />
            </>
          )}

          {/* Store owner */}
          {selectedRole === 'store_owner' && (
            <>
              <FieldGroup id="storeName" label="Store Name *" error={errors.storeName}>
                <Input id="storeName" placeholder="e.g. Oliver's Pet Emporium" value={storeName} onChange={(e) => { setStoreName(e.target.value); clearError('storeName') }} disabled={loading} className="h-11 bg-background border-border/60 focus-visible:ring-primary/40" />
              </FieldGroup>
              <FieldGroup id="storeAddress" label="Store Address (optional)">
                <Input id="storeAddress" placeholder="123 Pet Lane, City, Country" value={address} onChange={(e) => setAddress(e.target.value)} disabled={loading} className="h-11 bg-background border-border/60 focus-visible:ring-primary/40" />
              </FieldGroup>
              <StoreImagesField urls={storeImageUrls} onUpload={handleStoreImagesUpload} onRemove={(i) => setStoreImageUrls((p) => p.filter((_, idx) => idx !== i))} inputRef={storeImagesRef} uploading={uploading} />
            </>
          )}

          {/* Social links - all professional roles */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Social Links (optional)</p>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input placeholder="https://yourwebsite.com" value={websiteLink} onChange={(e) => setWebsiteLink(e.target.value)} disabled={loading} className="h-10 bg-background border-border/60 focus-visible:ring-primary/40 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input placeholder="https://instagram.com/yourhandle" value={instagramLink} onChange={(e) => setInstagramLink(e.target.value)} disabled={loading} className="h-10 bg-background border-border/60 focus-visible:ring-primary/40 text-sm" />
            </div>
          </div>

          <Button type="submit" disabled={loading || uploading} className="w-full h-11 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account…</>
              : uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading files…</>
              : 'Create Account'}
          </Button>
        </form>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldGroup({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function TogglePassword({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1} aria-label={show ? 'Hide password' : 'Show password'}>
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )
}

function DocUploadField({ label, description, url, onUpload, onRemove, inputRef, uploading }: {
  label: string; description: string; url: string | null;
  onUpload: (file: File) => void; onRemove: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>; uploading: boolean
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
      {url ? (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs text-foreground flex-1 truncate">Document uploaded</span>
          <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive"><X size={14} /></button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 w-full p-2.5 rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors">
          <Upload size={14} />{uploading ? 'Uploading…' : 'Click to upload'}
        </button>
      )}
      <input ref={inputRef as React.RefObject<HTMLInputElement>} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f) }} />
    </div>
  )
}

function MultiDocUploadField({ label, description, urls, onUpload, onRemove, inputRef, uploading, maxCount }: {
  label: string; description: string; urls: string[];
  onUpload: (files: FileList) => void; onRemove: (i: number) => void;
  inputRef: React.RefObject<HTMLInputElement | null>; uploading: boolean; maxCount: number
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
      {urls.length > 0 && (
        <div className="space-y-1">
          {urls.map((_, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs text-foreground flex-1">Document {i + 1}</span>
              <button type="button" onClick={() => onRemove(i)} className="text-muted-foreground hover:text-destructive"><X size={13} /></button>
            </div>
          ))}
        </div>
      )}
      {urls.length < maxCount && (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 w-full p-2.5 rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors">
          <Upload size={14} />{uploading ? 'Uploading…' : `Add document (${urls.length}/${maxCount})`}
        </button>
      )}
      <input ref={inputRef as React.RefObject<HTMLInputElement>} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={(e) => { if (e.target.files) onUpload(e.target.files) }} />
    </div>
  )
}

function StoreImagesField({ urls, onUpload, onRemove, inputRef, uploading }: {
  urls: string[]; onUpload: (files: FileList) => void; onRemove: (i: number) => void;
  inputRef: React.RefObject<HTMLInputElement | null>; uploading: boolean
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Store Photos (up to 5)</p>
      <p className="text-xs text-muted-foreground">Show customers what your store looks like.</p>
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Store ${i + 1}`} className="w-full h-full object-cover" />
              <button type="button" onClick={() => onRemove(i)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-background/80 text-foreground flex items-center justify-center hover:bg-destructive hover:text-white">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
      {urls.length < 5 && (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 w-full p-2.5 rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors">
          <Upload size={14} />{uploading ? 'Uploading…' : `Add photos (${urls.length}/5)`}
        </button>
      )}
      <input ref={inputRef as React.RefObject<HTMLInputElement>} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) onUpload(e.target.files) }} />
    </div>
  )
}

function SuccessState({ email, role }: { email: string; role: UserRole }) {
  const needsVerification = requiresVerification(role)
  return (
    <div className="space-y-6 text-center py-6 animate-blur-in">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Check Your Email</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          We&apos;ve sent a verification link to{' '}
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>
      {needsVerification && (
        <div className="rounded-xl bg-secondary/60 border border-border/40 p-4 text-left">
          <p className="text-xs font-medium text-foreground mb-2">What happens next for {ROLE_LABELS[role]}s:</p>
          <ol className="space-y-1.5 text-xs text-muted-foreground">
            <li>1. Verify your email via the link we just sent</li>
            <li>2. Our team reviews your submission (1–2 business days)</li>
            <li>3. You&apos;ll receive an approval email once verified</li>
          </ol>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Didn&apos;t receive the email? Check your spam folder.</p>
      <Link href="/login" className="inline-block text-sm font-medium text-foreground hover:text-primary transition-colors">
        Back to Login
      </Link>
    </div>
  )
}
