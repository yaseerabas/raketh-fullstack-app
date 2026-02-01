'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Volume2, Shield, FileText } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="hover:bg-primary/10 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity" />
                  <Volume2 className="relative h-6 w-6 text-primary" />
                </div>
                <span className="font-bold">RaketH Clone</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Privacy & Terms</h1>
              <p className="text-muted-foreground">
                Last updated: February 1, 2026
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="privacy" className="animate-fade-in-up animation-delay-100">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-xl mb-8">
            <TabsTrigger value="privacy" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <Shield className="h-4 w-4" />
              Privacy Policy
            </TabsTrigger>
            <TabsTrigger value="terms" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <FileText className="h-4 w-4" />
              Terms of Service
            </TabsTrigger>
          </TabsList>

          {/* Privacy Policy */}
          <TabsContent value="privacy">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle>Privacy Policy</CardTitle>
                <CardDescription>How we collect, use, and protect your data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-sm leading-relaxed">
                <div>
                  <h3 className="font-semibold text-base mb-2">1. Information We Collect</h3>
                  <p className="text-muted-foreground mb-2">We collect the following types of information:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Account information (email, name, phone number)</li>
                    <li>Voice samples you upload for cloning</li>
                    <li>Text input and generated audio files</li>
                    <li>Usage data and service interactions</li>
                    <li>Payment and billing information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-2">2. How We Use Your Data</h3>
                  <p className="text-muted-foreground mb-2">Your information is used to:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Provide and improve our voice generation services</li>
                    <li>Process your voice cloning requests</li>
                    <li>Manage your account and subscriptions</li>
                    <li>Send service updates and notifications</li>
                    <li>Ensure platform security and prevent abuse</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-2">3. Data Security</h3>
                  <p className="text-muted-foreground">
                    We implement industry-standard security measures to protect your data. All voice clones and generated audio are encrypted both in transit (using TLS/SSL) and at rest. Access to your data is restricted to authorized personnel only.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-2">4. Data Sharing</h3>
                  <p className="text-muted-foreground">
                    We do not sell or share your personal data with third parties for marketing purposes. Your voice clones and generated content remain private and are only accessible to you unless you explicitly share them.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-2">5. Data Retention</h3>
                  <p className="text-muted-foreground">
                    Voice clones and generated audio are stored as long as your account is active. You can delete your voice clones at any time. Upon account deletion, all associated data is permanently removed within 30 days.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-2">6. Your Rights</h3>
                  <p className="text-muted-foreground mb-2">You have the right to:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Access your personal data</li>
                    <li>Request data correction or deletion</li>
                    <li>Export your voice clones and generated content</li>
                    <li>Opt-out of non-essential communications</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-2">7. Cookies</h3>
                  <p className="text-muted-foreground">
                    We use essential cookies for authentication and session management. No third-party tracking cookies are used without your consent.
                  </p>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <p className="text-muted-foreground">
                    For privacy-related inquiries, contact us via WhatsApp or email support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Terms of Service */}
          <TabsContent value="terms">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle>Terms of Service</CardTitle>
                <CardDescription>Rules and guidelines for using our service</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-sm leading-relaxed">
                <div>
                  <h3 className="font-semibold text-base mb-2">1. Acceptance of Terms</h3>
                  <p className="text-muted-foreground">
                    By accessing or using RaketH Clone, you agree to be bound by these Terms of Service. If you do not agree, please discontinue use of the service immediately.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-2">2. Service Description</h3>
                  <p className="text-muted-foreground">
                    RaketH Clone provides AI-powered text-to-speech and voice cloning services. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-2">3. Account Responsibilities</h3>
                  <p className="text-muted-foreground mb-2">You are responsible for:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Maintaining the confidentiality of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Ensuring your use complies with applicable laws</li>
                    <li>Not sharing account access with others</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-2">4. Acceptable Use</h3>
                  <p className="text-muted-foreground mb-2">You agree NOT to:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Clone voices without proper authorization or consent</li>
                    <li>Create deepfakes or misleading content</li>
                    <li>Use the service for illegal, harmful, or fraudulent purposes</li>
                    <li>Attempt to reverse engineer or abuse the system</li>
                    <li>Violate intellectual property rights</li>
                    <li>Impersonate others or create defamatory content</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-2">5. Content Ownership</h3>
                  <p className="text-muted-foreground">
                    You retain full ownership of all voice clones you create and audio you generate using our service. We do not claim any rights to your content. However, you grant us a license to process and store your content to provide the service.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-2">6. Credits and Payments</h3>
                  <p className="text-muted-foreground">
                    Credits are purchased in advance and used for character generation. Credits never expire but are non-refundable. All payments are final. Pricing is subject to change with notice to existing subscribers.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-2">7. Service Limitations</h3>
                  <p className="text-muted-foreground">
                    We strive for high availability but do not guarantee uninterrupted service. We are not liable for service downtime, data loss, or quality variations in generated audio.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-2">8. Termination</h3>
                  <p className="text-muted-foreground">
                    We reserve the right to suspend or terminate accounts that violate these terms or engage in abusive behavior. Users may delete their accounts at any time.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-2">9. Disclaimer</h3>
                  <p className="text-muted-foreground">
                    The service is provided "as is" without warranties of any kind. We are not responsible for how users choose to use generated content or any consequences thereof.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-2">10. Changes to Terms</h3>
                  <p className="text-muted-foreground">
                    We may update these terms periodically. Continued use of the service after changes constitutes acceptance of the updated terms.
                  </p>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <p className="text-muted-foreground">
                    For questions about these terms, contact us via WhatsApp or email support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => router.push('/')} className="hover:border-primary/50 hover:bg-primary/5 transition-all">
            Back to Home
          </Button>
        </div>
      </main>
    </div>
  )
}
