'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AudioScrubber } from '@/components/ui/audio-scrubber'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Mic, Clock, LogOut, Settings, Play, Loader2, Languages, Phone, CreditCard, Sparkles, TrendingUp, History } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface VoiceClone {
  id: string
  voiceId: string
  name: string
  description: string
  sampleUrl: string
  isDefault: boolean
  available: boolean
  createdAt?: string
}

interface VoiceGeneration {
  id: string
  text: string
  textLength: number
  audioUrl: string | null
  duration: number | null
  status: string
  type: string
  createdAt: string
}

interface Plan {
  id: string
  name: string
  price: number
  credits: number
  maxClones: number
  features: Record<string, boolean>
}

interface Subscription {
  id: string
  status: string
  startDate: string
  expiresAt: string
  endDate: string | null
  purchasedAt: string
  creditsPurchased: number
  creditsUsed: number
  creditsRemaining: number
  creditsPercentage: number
  daysRemaining: number
  plan: Plan
}

interface UserData {
  user: {
    id: string
    email: string
    name: string | null
    whatsapp: string | null
    role: string
  }
  subscription: Subscription
  stats: {
    generationsThisMonth: number
    totalGenerations: number
    voiceClonesCount: number
  }
}

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [generations, setGenerations] = useState<VoiceGeneration[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login')
    }
    if (sessionStatus === 'authenticated' && session?.user?.role === 'admin') {
      router.push('/admin')
    }
  }, [sessionStatus, session, router])

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchUserData()
      fetchGenerations()
    }
  }, [sessionStatus])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user')
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchGenerations = async () => {
    try {
      const response = await fetch('/api/generations?limit=5')
      if (response.ok) {
        const data = await response.json()
        setGenerations(data.generations)
      }
    } catch (error) {
      console.error('Error fetching generations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const handleGenerate = () => {
    router.push('/generate')
  }

  const handleVoiceClones = () => {
    router.push('/voice-clones')
  }

  const formatCredits = (credits: number) => {
    return new Intl.NumberFormat('en-US').format(credits)
  }

  const formatPercentage = (value: number) => {
    if (!Number.isFinite(value)) return '0'
    return Number.isInteger(value) ? value.toString() : value.toFixed(1)
  }

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-mesh">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-lg opacity-50 animate-pulse" />
            <Loader2 className="relative h-12 w-12 animate-spin text-foreground" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(10,10,10,0.7)] backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 group">
              <Image src="/logo.png" alt="RaketH Clone" width={44} height={44} className="h-11 w-11 object-contain drop-shadow-lg" />
              <span className="font-bold">RaketH Clone</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">
              Welcome back, <span className="text-gradient">{userData?.user.name || 'User'}</span>!
            </h1>
            <Sparkles className="h-6 w-6 text-foreground animate-pulse" />
          </div>
          <p className="text-muted-foreground">
            Manage your credits, voice clones, and generations
          </p>
        </div>

        {/* Quick Actions */}
        {userData?.subscription ? (
          <div className="mb-8 flex flex-wrap gap-4 animate-fade-in animate-delay-100">
            <Button onClick={handleGenerate} size="lg" className="gap-2 gradient-primary text-background border-0 transition-bounce hover:scale-105 hover:shadow-lg">
              <Mic className="h-5 w-5" />
              Generate New Voice
            </Button>
            <Button onClick={handleVoiceClones} size="lg" variant="outline" className="gap-2 hover:border-white/30 hover:bg-white/5 transition-all">
              <Languages className="h-5 w-5" />
              Manage Voice Clones
            </Button>
            <Button onClick={() => router.push('/history')} size="lg" variant="outline" className="gap-2 hover:border-white/30 hover:bg-white/5 transition-all">
              <History className="h-5 w-5" />
              View History
            </Button>
          </div>
        ) : (
          <Card className="mb-8 glass-card border-white/20 animate-fade-in animate-delay-100">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <CreditCard className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Subscription Required</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You need an active subscription to generate voices and manage clones. 
                    Contact admin via WhatsApp to subscribe.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card border-0 hover-lift animate-fade-in animate-delay-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Credits Remaining</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-lg">
                  <CreditCard className="h-5 w-5 text-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {formatCredits(userData?.subscription?.creditsRemaining || 0)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                of {formatCredits(userData?.subscription?.creditsPurchased || 0)} purchased
              </p>
              {userData?.subscription && (
                <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/80 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(0, 100 - userData.subscription.creditsPercentage)}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-0 hover-lift animate-fade-in animate-delay-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Generations</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-5 w-5 text-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {userData?.stats?.totalGenerations || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                All time
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 hover-lift animate-fade-in animate-delay-400">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Voice Clones</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-lg">
                  <Mic className="h-5 w-5 text-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {userData?.stats?.voiceClonesCount || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {userData?.subscription?.plan?.maxClones === -1
                  ? 'Unlimited available'
                  : `${userData?.subscription?.plan?.maxClones || 0} max`}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Subscription Info */}
          <Card className="glass-card border-0 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-foreground" />
                Your Subscription
              </CardTitle>
              <CardDescription>Plan details and usage</CardDescription>
            </CardHeader>
            <CardContent>
              {userData?.subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {userData.subscription.plan.name} Plan
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        RS {userData.subscription.plan.price} / month
                      </p>
                    </div>
                    <Badge variant={userData.subscription.status === 'active' ? 'default' : 'secondary'} className={userData.subscription.status === 'active' ? 'gradient-primary text-background border-0' : ''}>
                      {userData.subscription.status}
                    </Badge>
                  </div>

                  {/* Subscription Expiry Info */}
                  {userData.subscription.expiresAt && (
                    <div className={`flex items-center justify-between p-3 rounded-xl border ${userData.subscription.daysRemaining <= 7 ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex items-center gap-2">
                        <Clock className={`h-4 w-4 ${userData.subscription.daysRemaining <= 7 ? 'text-red-400' : 'text-muted-foreground'}`} />
                        <span className="text-sm">
                          {userData.subscription.daysRemaining > 0 
                            ? `${userData.subscription.daysRemaining} days remaining`
                            : 'Subscription expired'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Expires: {new Date(userData.subscription.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <Separator className="bg-border/50" />

                  {/* Credit Usage */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-foreground" />
                      Credit Usage
                    </h4>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">Remaining</span>
                        <span className="text-2xl font-bold text-foreground">
                          {formatCredits(userData.subscription.creditsRemaining)}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-white/80 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(0, 100 - userData.subscription.creditsPercentage)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatCredits(userData.subscription.creditsUsed)} used
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatPercentage(userData.subscription.creditsPercentage)}% consumed
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-border/50" />

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Features</h4>
                    <ul className="space-y-2">
                      {Object.entries(userData.subscription.plan.features).map(([feature, included]) => (
                        <li key={feature} className="flex items-center gap-3 text-sm">
                          <div className={`h-2 w-2 rounded-full ${included ? 'bg-white' : 'bg-muted-foreground/30'}`} />
                          <span className={included ? '' : 'text-muted-foreground line-through'}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Purchased: {new Date(userData.subscription.purchasedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {userData.user.role === 'admin' && (
                    <Button variant="outline" className="w-full mt-4 hover:border-white/30 hover:bg-white/5" onClick={() => router.push('/admin')}>
                      Go to Admin Panel
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-8 w-8 text-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">No active subscription</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Contact us via WhatsApp to purchase a plan
                  </p>
                  <Button
                    className="gradient-primary text-background border-0 hover:shadow-lg transition-all"
                    onClick={() =>
                      window.open(
                        `https://wa.me/+923025295337?text=${encodeURIComponent(
                          `Hi, I would like to subscribe to RaketH Clone.\n\nEmail: ${userData?.user.email}`
                        )}`,
                        '_blank'
                      )
                    }
                  >
                    Contact via WhatsApp
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Generations */}
          <Card className="glass-card border-0 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-foreground" />
                Recent Generations
              </CardTitle>
              <CardDescription>Your latest voice generations</CardDescription>
            </CardHeader>
            <CardContent>
              {generations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                    <Mic className="h-8 w-8 text-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">No voice generations yet</p>
                  <Button className="gradient-primary text-background border-0 hover:shadow-lg transition-all" onClick={handleGenerate}>
                    Create Your First Voice
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {generations.map((generation, index) => (
                    <div 
                      key={generation.id} 
                      className="p-3 sm:p-4 rounded-xl border border-border/50 bg-muted/30 space-y-3 hover:border-white/20 hover:bg-muted/50 transition-all duration-300 cursor-pointer"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start gap-2 sm:gap-4">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                          <Play className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="text-xs sm:text-sm font-medium line-clamp-2 break-words">
                            {generation.text}
                          </p>
                          <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px] sm:text-xs bg-white/5 border-white/20 shrink-0">
                              {generation.type === 'tts' ? 'TTS' : 'T-TTS'}
                            </Badge>
                            <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                              {formatCredits(generation.textLength)} ch
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              {new Date(generation.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            {generation.duration && (
                              <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                                {generation.duration.toFixed(1)}s
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {generation.audioUrl && (
                        <AudioScrubber src={generation.audioUrl} />
                      )}
                    </div>
                  ))}
                  <Button variant="outline" className="w-full hover:border-white/30 hover:bg-white/5 transition-all text-sm" onClick={() => router.push('/history')}>
                    View All History
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
