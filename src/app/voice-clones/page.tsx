'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Volume2, Upload, Trash2, Play, Loader2, ArrowLeft, Mic, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Voice {
  id: string
  voiceId: string
  name: string
  description: string
  sampleUrl: string
  isDefault: boolean
  available: boolean
  createdAt?: string
}

export default function VoiceClonesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [voices, setVoices] = useState<Voice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null)
  const [uploadForm, setUploadForm] = useState({
    name: '',
    file: null as File | null
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    // Admin should not access voice management features
    if (session?.user?.role === 'admin') {
      router.push('/admin')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated') {
      checkSubscription()
      fetchVoices()
    }
  }, [status])

  const checkSubscription = async () => {
    try {
      const response = await fetch('/api/user')
      if (response.ok) {
        const data = await response.json()
        const hasSub = !!data.subscription
        setHasSubscription(hasSub)
        if (!hasSub) {
          toast({
            title: 'No Active Subscription',
            description: 'Please subscribe to a plan to manage voice clones',
            variant: 'destructive',
          })
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/voice-clones')
      if (response.ok) {
        const data = await response.json()
        setVoices(data.voices)
      }
    } catch (error) {
      console.error('Error fetching voices:', error)
      toast({
        title: 'Error',
        description: 'Failed to load voices',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadForm({ ...uploadForm, file })
    }
  }

  const handleUpload = async () => {
    if (!uploadForm.name || !uploadForm.file) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a name and select a file',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('name', uploadForm.name)
      formData.append('voice_file', uploadForm.file)

      const response = await fetch('/api/voice-clones/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Voice uploaded successfully!',
        })
        setUploadForm({ name: '', file: null })
        fetchVoices()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
    } catch (error: any) {
      console.error('Error uploading voice:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload voice',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/voice-clones/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Voice deleted successfully!',
        })
        fetchVoices()
      } else {
        throw new Error('Delete failed')
      }
    } catch (error) {
      console.error('Error deleting voice:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete voice',
        variant: 'destructive',
      })
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-mesh">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-full blur-lg opacity-50 animate-pulse" />
            <Loader2 className="relative h-12 w-12 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading voice library...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-primary/10 transition-colors">
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
            <Button variant="outline" onClick={() => router.push('/dashboard')} className="hover:border-primary/50 hover:bg-primary/5 transition-all">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Voice Clone Library</h1>
                <p className="text-muted-foreground">
                  Manage your cloned voices for use in TTS and Translate-TTS
                </p>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <Card className="mb-8 glass-card border-0 animate-fade-in-up animation-delay-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <Upload className="h-4 w-4 text-primary" />
                </div>
                Upload New Voice
              </CardTitle>
              <CardDescription>Upload a voice sample to create a clone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voice-name">Voice Name</Label>
                <Input
                  id="voice-name"
                  placeholder="e.g., My Voice, Professional Voice"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  className="rounded-xl border-border/50 bg-muted/30 focus:border-primary/50 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voice-file">Voice Sample</Label>
                <div className="relative">
                  <Input
                    id="voice-file"
                    type="file"
                    accept=".wav,.mp3,.flac,.ogg"
                    onChange={handleFileChange}
                    className="rounded-xl border-border/50 bg-muted/30 focus:border-primary/50 focus:ring-primary/20 transition-all file:bg-primary/10 file:text-primary file:border-0 file:rounded-lg file:px-4 file:py-2 file:mr-4 file:cursor-pointer"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Supported formats: .wav, .mp3, .flac, .ogg
                </p>
              </div>

              <Button onClick={handleUpload} disabled={isUploading} className="gradient-primary border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Voice
                  </>
                )}
              </Button>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1 text-foreground">Voice Sample Requirements</p>
                  <p className="leading-relaxed">
                    Upload a clear, high-quality audio sample (10-30 seconds recommended)
                    for the best cloning results. Avoid background noise and ensure consistent tone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voice List */}
          <Card className="glass-card border-0 animate-fade-in-up animation-delay-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <Volume2 className="h-4 w-4 text-primary" />
                </div>
                Available Voices
              </CardTitle>
              <CardDescription>
                Default voices and your custom clones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {voices.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <Mic className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground mb-4">No voices available</p>
                  <Button onClick={() => router.push('/generate')} className="gradient-primary border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">
                    Go to Generate Voice
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {voices.map((voice, index) => (
                    <div
                      key={voice.id}
                      className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-muted/30 hover:border-primary/30 hover:bg-muted/50 transition-all duration-300 animate-fade-in cursor-pointer"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Play className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{voice.name}</h3>
                          {voice.isDefault && (
                            <Badge variant="secondary" className="text-xs bg-primary/10 border-primary/20">
                              Default
                            </Badge>
                          )}
                          {!voice.available && (
                            <Badge variant="destructive" className="text-xs">
                              Unavailable
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                          {voice.description}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          Voice ID: {voice.voiceId}
                        </p>
                      </div>
                      {!voice.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(voice.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
