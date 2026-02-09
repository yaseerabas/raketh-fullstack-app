'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Volume2, Loader2, Play, ArrowLeft, Clock, Mic, ChevronLeft, ChevronRight, History } from 'lucide-react'

interface VoiceGeneration {
  id: string
  name?: string | null
  text: string
  textLength: number
  audioUrl: string | null
  duration: number | null
  status: string
  type: string
  createdAt: string
  voiceModel?: {
    name: string
  }
}

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [generations, setGenerations] = useState<VoiceGeneration[]>([])
  const [localGenerations, setLocalGenerations] = useState<VoiceGeneration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 10

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (session?.user?.role === 'admin') {
      router.push('/admin')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchGenerations()
    }
  }, [status, page])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('voiceGenerationHistory')
      const parsed = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) {
        setLocalGenerations(parsed)
      }
    } catch (error) {
      console.error('Error loading local generation history:', error)
    }
  }, [])

  const fetchGenerations = async () => {
    setIsLoading(true)
    try {
      const offset = (page - 1) * limit
      const response = await fetch(`/api/generations?limit=${limit}&offset=${offset}`)
      if (response.ok) {
        const data = await response.json()
        setGenerations(data.generations)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Error fetching generations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  const mergedGenerations = (() => {
    const seen = new Set<string>()
    const merged: VoiceGeneration[] = []
    for (const generation of generations) {
      const key = generation.audioUrl || generation.id
      seen.add(key)
      merged.push(generation)
    }
    for (const local of localGenerations) {
      const key = local.audioUrl || local.id
      if (!seen.has(key)) {
        merged.push(local)
      }
    }
    return merged
  })()

  const formatCredits = (credits: number) => {
    return new Intl.NumberFormat('en-US').format(credits)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-mesh">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-full blur-lg opacity-50 animate-pulse" />
            <Loader2 className="relative h-12 w-12 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading history...</p>
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
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="hover:bg-primary/10 transition-colors">
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
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Generation History</h1>
              <p className="text-muted-foreground">
                All your voice generations ({total} total)
              </p>
            </div>
          </div>
        </div>

        <Card className="glass-card border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Voice Generations</CardTitle>
                <CardDescription>
                  Page {page} of {totalPages || 1}
                </CardDescription>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : mergedGenerations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Mic className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground mb-4">No voice generations yet</p>
                <Button 
                  className="gradient-primary border-0 hover:shadow-lg hover:shadow-primary/25 transition-all" 
                  onClick={() => router.push('/generate')}
                >
                  Create Your First Voice
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {mergedGenerations.map((generation, index) => (
                  <div 
                    key={generation.id} 
                    className="p-4 rounded-xl border border-border/50 bg-muted/30 space-y-3 hover:border-primary/30 hover:bg-muted/50 transition-all duration-300 animate-fade-in cursor-pointer"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Play className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {generation.name && (
                          <p className="text-sm font-semibold text-foreground">
                            {generation.name}
                          </p>
                        )}
                        <p className="text-sm font-medium leading-relaxed">
                          {generation.text.length > 200 
                            ? generation.text.substring(0, 200) + '...' 
                            : generation.text}
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20">
                            {generation.type === 'tts' ? 'TTS' : 'Translate-TTS'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatCredits(generation.textLength)} characters
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(generation.createdAt)}
                          </span>
                          {generation.duration && (
                            <span className="text-xs text-muted-foreground">
                              Duration: {generation.duration.toFixed(1)}s
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {generation.audioUrl && (
                      <audio
                        controls
                        className="w-full h-10 rounded-lg"
                        preload="metadata"
                      >
                        <source src={generation.audioUrl} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-border/50">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setPage(pageNum)}
                        className={page === pageNum ? "gradient-primary border-0" : "hover:bg-primary/10"}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
