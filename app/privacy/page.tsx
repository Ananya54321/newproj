import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Furever',
  description: 'Privacy Policy for the Furever platform.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground mb-4">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last Updated: April 8, 2026</p>
        </div>
        <div className="prose prose-stone dark:prose-invert max-w-none text-foreground/80 leading-relaxed space-y-6">
          <section>
            <h2 className="text-2xl font-serif text-foreground font-semibold mb-3">1. Information We Collect</h2>
            <p>We collect information to provide better services to all our users. Information we collect includes your name, email address, password, role specific details, and uploaded documents depending on your user type (e.g., Veterinary licenses or NGO registration details).</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-serif text-foreground font-semibold mb-3">2. How We Use Information</h2>
            <p>We use the information we collect from all our services to provide, maintain, protect, and improve them, to develop new ones, and to protect Furever and our users. For verified roles, your documents are securely reviewed by our team to ensure the safety and authenticity of our platform.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-serif text-foreground font-semibold mb-3">3. Information You Share</h2>
            <p>Many of our services let you share information with others, such as pet profiles, clinic details, or organization updates. Remember that when you share information publicly, it may be indexable by search engines and viewable by other Furever users.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-serif text-foreground font-semibold mb-3">4. Data Security</h2>
            <p>We work hard to protect Furever and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold. We utilize industry-standard security measures, including database-native encryption and secure upload handling via Cloudinary.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-serif text-foreground font-semibold mb-3">5. Changes to This Policy</h2>
            <p>Our Privacy Policy may change from time to time. We will not reduce your rights under this Privacy Policy without your explicit consent. We will post any privacy policy changes on this page and, if the changes are significant, we will provide a more prominent notice.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
