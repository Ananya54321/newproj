import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Furever',
  description: 'Terms of Service for using the Furever platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground mb-4">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last Updated: April 8, 2026</p>
        </div>
        <div className="prose prose-stone dark:prose-invert max-w-none text-foreground/80 leading-relaxed space-y-6">
          <section>
            <h2 className="text-2xl font-serif text-foreground font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using Furever, you accept and agree to be bound by the terms and provision of this agreement. These terms apply to all visitors, users, and others who access or use the Service.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-serif text-foreground font-semibold mb-3">2. Use of Service</h2>
            <p>Furever is a dedicated platform for pet owners, veterinarians, NGOs, and store owners. You agree to use the platform in a respectful and responsible manner, adhering to all community guidelines and Furever's philosophy of putting animal welfare first.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-serif text-foreground font-semibold mb-3">3. Accounts and Roles</h2>
            <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. Specialized roles (Veterinarians, NGOs, Store Owners) require verification. Failure to provide accurate information constitutes a breach of the Terms.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-serif text-foreground font-semibold mb-3">4. Intellectual Property</h2>
            <p>The Service and its original content, features, and functionality are and will remain the exclusive property of Furever and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Furever.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-serif text-foreground font-semibold mb-3">5. Termination</h2>
            <p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
