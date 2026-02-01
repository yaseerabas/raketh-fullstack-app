'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, Zap, Shield, Users, Clock, Volume2, Check, Play, Pause, ArrowRight, Sparkles, Globe, Headphones } from 'lucide-react'

// Demo voices configuration
const DEMO_VOICES = [
  {
    id: 'demo-female-en',
    name: 'Female English',
    description: 'Natural female voice in English',
    audioFile: '/demo/female-en.wav',
    language: 'English',
  },
  {
    id: 'demo-male-en',
    name: 'Male English',
    description: 'Natural male voice in English',
    audioFile: '/demo/male-en.wav',
    language: 'English',
  },
  {
    id: 'demo-female-ur',
    name: 'Female French',
    description: 'Natural female voice in French',
    audioFile: '/demo/female-ur.wav',
    language: 'French',
  },
]

const FEATURES = [
  {
    icon: Mic,
    title: 'Voice Cloning',
    description: 'Clone any voice with just a sample recording for personalized, branded content',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Globe,
    title: 'Multi-Language Support',
    description: 'Generate speech in multiple languages with automatic translation',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Generate high-quality audio in seconds, not minutes',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Enterprise-grade security with end-to-end encryption for all your content',
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    icon: Clock,
    title: 'Credits Never Expire',
    description: 'Pay for characters, not subscriptions. Use your credits whenever you need',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Headphones,
    title: 'High Quality Audio',
    description: 'Crystal clear, natural-sounding voice output at various formats',
    gradient: 'from-indigo-500 to-violet-500',
  },
]

const PLANS = [
  {
    name: 'Basic',
    price: '1,499',
    description: 'Perfect for personal use',
    credits: '1 Million',
    features: ['All voice models', 'Voice cloning', 'Email support'],
    popular: false,
  },
  {
    name: 'Pro',
    price: '3,499',
    description: 'For growing teams',
    credits: '3 Million',
    features: ['All voice models', '10 voice clones', 'Priority support'],
    popular: true,
  },
  {
    name: 'Premium',
    price: '5,999',
    description: 'For professionals',
    credits: '5 Million',
    features: ['All premium models', '25 voice clones', 'Priority support'],
    popular: false,
  },
  {
    name: 'Enterprise',
    price: '7,999',
    description: 'For large organizations',
    credits: '10 Million',
    features: ['All premium models', 'Unlimited voice clones', 'Dedicated support'],
    popular: false,
  },
]

export default function Home() {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({})

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handlePlayDemo = (demoId: string, audioFile: string) => {
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (audio && id !== demoId) {
        audio.pause()
        audio.currentTime = 0
      }
    })

    const audio = audioRefs.current[demoId]
    if (audio) {
      if (playingId === demoId) {
        audio.pause()
        setPlayingId(null)
      } else {
        audio.play().catch(console.error)
        setPlayingId(demoId)
      }
    }
  }

  const handleAudioEnded = (demoId: string) => {
    if (playingId === demoId) {
      setPlayingId(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity" />
                <Volume2 className="relative h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <span className="text-lg sm:text-xl font-bold">RaketH Clone</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-6">
              <a href="#features" className="hidden md:inline-block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Features</a>
              <a href="#demo" className="hidden md:inline-block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Demo</a>
              <a href="#pricing" className="hidden md:inline-block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Pricing</a>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/login'} className="transition-smooth hover:scale-105">
                Sign In
              </Button>
              <Button size="sm" onClick={() => window.location.href = '/login'} className="gradient-primary border-0 transition-smooth hover:scale-105 hover:shadow-lg hover:shadow-primary/25">
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center pt-32 pb-20 px-4 sm:px-6 lg:px-8 gradient-mesh min-h-screen">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className={`container mx-auto text-center max-w-4xl relative z-10 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-8 animate-bounce-soft">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-gradient font-semibold">AI-Powered Voice Cloning</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="block">Clone & Transform</span>
            <span className="block text-gradient mt-2">Your Voice Into AI</span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in animate-delay-200">
            Create professional voice recordings from text using advanced AI voice cloning technology. 
            Clone any voice and generate realistic speech in multiple languages.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in animate-delay-300">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 gradient-primary border-0 transition-bounce hover:scale-105 hover:shadow-xl hover:shadow-primary/30 group" 
              onClick={() => window.location.href = '/login'}
            >
              Get Started Free
              <Mic className="ml-2 h-5 w-5 group-hover:animate-bounce-soft" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 glass border-primary/20 transition-bounce hover:scale-105 hover:bg-primary/5" 
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Listen to Demo
              <Volume2 className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Trust indicators */}
          <p className="text-sm text-muted-foreground mt-8 animate-fade-in animate-delay-400">
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              No credit card required
            </span>
            <span className="mx-3 text-border">•</span>
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Credits never expire
            </span>
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Powerful Features for <span className="text-gradient">Every Need</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create professional voice content at scale
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="group glass-card hover-lift border-0 overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-gradient transition-all duration-300">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Live Demo
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Listen to Our <span className="text-gradient">Voice Demos</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the quality of our AI-generated voices. These samples showcase different languages and voice types.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEMO_VOICES.map((demo, index) => (
              <Card 
                key={demo.id} 
                className="glass-card hover-lift border-0 overflow-hidden group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{demo.name}</CardTitle>
                    <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary font-medium">
                      {demo.language}
                    </span>
                  </div>
                  <CardDescription>{demo.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <audio
                    ref={(el) => { audioRefs.current[demo.id] = el }}
                    src={demo.audioFile}
                    onEnded={() => handleAudioEnded(demo.id)}
                    preload="metadata"
                  />
                  <Button
                    onClick={() => handlePlayDemo(demo.id, demo.audioFile)}
                    variant={playingId === demo.id ? 'default' : 'outline'}
                    className={`w-full gap-2 transition-all duration-300 ${
                      playingId === demo.id 
                        ? 'gradient-primary border-0 shadow-lg shadow-primary/25' 
                        : 'hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    {playingId === demo.id ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        Play Demo
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Simple, <span className="text-gradient">Credit-Based</span> Plans
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Purchase credits and use them across all features. No subscriptions, no expiration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan, index) => (
              <Card 
                key={plan.name}
                className={`glass-card hover-lift border-0 overflow-hidden relative ${
                  plan.popular ? 'ring-2 ring-primary shadow-xl shadow-primary/20 scale-105' : ''
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.popular && (
                      <span className="px-3 py-1 rounded-full gradient-primary text-white text-xs font-medium">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">RS {plan.price}</span>
                    <span className="text-muted-foreground">/one-time</span>
                  </div>
                  <CardDescription className="mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <span className="text-sm text-muted-foreground">Characters</span>
                    <p className="text-2xl font-bold text-gradient">{plan.credits}</p>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={plan.popular ? 'default' : 'outline'} 
                    className={`w-full transition-all duration-300 ${
                      plan.popular 
                        ? 'gradient-primary border-0 hover:shadow-lg hover:shadow-primary/25' 
                        : 'hover:border-primary/50 hover:bg-primary/5'
                    }`}
                    onClick={() =>
                      window.open(
                        `https://wa.me/+923025295337?text=${encodeURIComponent(
                          `Hi, I want the ${plan.name} plan subscription (RS ${plan.price}).`
                        )}`,
                        '_blank'
                      )
                    }
                  >
                    Contact via WhatsApp
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-90" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto text-center max-w-3xl relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white">
            Ready to Clone Your Voice?
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
            Join thousands of content creators using AI voice technology to scale their production
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 transition-bounce hover:scale-105 hover:shadow-xl"
              onClick={() => window.location.href = '/login'}
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-white/30 text-white hover:bg-white/10 transition-bounce hover:scale-105"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-lg blur opacity-50" />
                  <Volume2 className="relative h-6 w-6 text-primary" />
                </div>
                <span className="text-lg font-bold">RaketH Clone</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Transform text into realistic speech with AI-powered voice cloning technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors cursor-pointer">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors cursor-pointer">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a href="/privacy" className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-primary transition-colors cursor-pointer">Terms of Service</a>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Privacy & Terms Summary */}
          <div className="border-t pt-8 pb-6">
            <div className="grid md:grid-cols-2 gap-6 text-xs text-muted-foreground mb-6">
              <div>
                <h5 className="font-semibold text-foreground mb-2">Privacy</h5>
                <p>We collect only essential data to provide our services. Your voice clones and generated audio are stored securely and never shared with third parties. All data is encrypted in transit and at rest.</p>
              </div>
              <div>
                <h5 className="font-semibold text-foreground mb-2">Terms</h5>
                <p>By using our service, you agree to use voice cloning responsibly and legally. You retain ownership of your content and voice clones. Credits are non-refundable but never expire.</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 RaketH Clone. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
