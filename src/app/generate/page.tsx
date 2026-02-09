'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Volume2, Loader2, Play, AlertCircle, ArrowLeft, Mic, Languages, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const MAX_TEXT_LENGTH = 50000

interface Voice {
  id: string
  voiceId: string
  name: string
  description: string
  sampleUrl: string
  isDefault: boolean
  available: boolean
}

interface LanguageOption {
  value: string
  label: string
  ttsCode?: string
}

interface Language {
  translation: {
    model: string
    languages: {
      code: string
      name: string
      tts_code: string
    }[]
  }
  tts: {
    model: string
    languages: {
      code: string
      name: string
      nllb_code: string
    }[]
  }
}

const DEFAULT_TTS_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
]

export default function GeneratePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [voices, setVoices] = useState<Voice[]>([])
  const [languages, setLanguages] = useState<Language | null>(null)
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [generationName, setGenerationName] = useState('')
  const [text, setText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamProgress, setStreamProgress] = useState<string | null>(null)
  const [generatedAudio, setGeneratedAudio] = useState<{ url: string; duration: number; savedUrl?: string; name?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVoicesLoading, setIsVoicesLoading] = useState(false)
  const [isLanguagesLoading, setIsLanguagesLoading] = useState(false)
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const [languagesLoaded, setLanguagesLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState('tts')
  const [ttsLanguage, setTtsLanguage] = useState('en')
  const [sourceLanguage, setSourceLanguage] = useState('eng_Latn')
  const [targetLanguage, setTargetLanguage] = useState('fra_Latn')
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    // Admin should not access voice generation features
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.push('/admin')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      loadPageData()
    }
  }, [status, session])

  const loadPageData = async () => {
    setIsLoading(true)
    try {
      // Check subscription first
      const userResponse = await fetch('/api/user')
      if (userResponse.ok) {
        const userData = await userResponse.json()
        const hasSub = !!userData.subscription && userData.subscription.creditsRemaining > 0
        setHasSubscription(hasSub)
        if (!hasSub) {
          toast({
            title: 'No Active Subscription',
            description: 'Please subscribe to a plan to generate voices',
            variant: 'destructive',
          })
          router.push('/dashboard')
          return
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to verify subscription',
          variant: 'destructive',
        })
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('Error loading page data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load page data',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchVoices = async () => {
    if (voicesLoaded || isVoicesLoading) return
    setIsVoicesLoading(true)
    try {
      const response = await fetch('/api/voice-clones')
      if (!response.ok) {
        throw new Error('Failed to load voice clones')
      }

      const voicesData = await response.json()
      setVoices(voicesData.voices || [])
      if (!selectedVoice && voicesData.voices?.length > 0) {
        setSelectedVoice(voicesData.voices[0].voiceId)
      }
      setVoicesLoaded(true)
    } catch (error) {
      console.error('Error fetching voices:', error)
      toast({
        title: 'Error',
        description: 'Failed to load voice clones',
        variant: 'destructive',
      })
    } finally {
      setIsVoicesLoading(false)
    }
  }

  const fetchLanguages = async () => {
    if (languagesLoaded || isLanguagesLoading) return
    setIsLanguagesLoading(true)
    try {
      const response = await fetch('/api/languages')
      if (!response.ok) {
        throw new Error('Failed to load languages')
      }

      const langData = await response.json()
      setLanguages(langData)
      if (langData.translation?.languages?.length > 0) {
        setSourceLanguage(langData.translation.languages[0].code)
      }
      if (langData.tts?.languages?.length > 0) {
        setTargetLanguage(langData.tts.languages[0].code)
        setTtsLanguage(langData.tts.languages[0].code)
      }
      setLanguagesLoaded(true)
    } catch (error) {
      console.error('Error fetching languages:', error)
      toast({
        title: 'Error',
        description: 'Failed to load languages',
        variant: 'destructive',
      })
    } finally {
      setIsLanguagesLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter some text to generate speech',
        variant: 'destructive',
      })
      return
    }

    if (!selectedVoice) {
      toast({
        title: 'Validation Error',
        description: 'Please select a voice',
        variant: 'destructive',
      })
      return
    }

    if (activeTab === 'tts' && !ttsLanguage) {
      toast({
        title: 'Validation Error',
        description: 'Please select a language',
        variant: 'destructive',
      })
      return
    }

    if (activeTab === 'translate-tts' && (!sourceLanguage || !targetLanguage)) {
      toast({
        title: 'Validation Error',
        description: 'Please select source and target languages',
        variant: 'destructive',
      })
      return
    }

    if (text.length > MAX_TEXT_LENGTH) {
      toast({
        title: 'Text Too Long',
        description: `Maximum ${MAX_TEXT_LENGTH.toLocaleString()} characters allowed. You have ${text.length.toLocaleString()}.`,
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    setGeneratedAudio(null)
    setStreamProgress(null)

    try {
      const trimmedName = generationName.trim()
      const payload: any = {
        text,
        voiceId: selectedVoice,
        type: activeTab,
      }

      if (trimmedName) {
        payload.name = trimmedName
      }

      if (activeTab === 'tts') {
        payload.language = ttsLanguage
      } else {
        payload.sourceLanguage = sourceLanguage
        payload.targetLanguage = targetLanguage
      }

      setStreamProgress('Connecting to TTS service...')

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000)

      const response = await fetch('/api/generate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ message: 'Generation failed' }))
        throw new Error(errBody.message || errBody.error || 'Failed to generate voice')
      }

      const savedAudioUrl = response.headers.get('X-Audio-Url') || ''

      const durationEstimateSeconds = Math.max(1, Math.ceil(text.length / 15))
      const estimatedTotalBytes = durationEstimateSeconds * 32000
      const totalBytesHeader = response.headers.get('Content-Length')
      const parsedTotalBytes = totalBytesHeader ? Number.parseInt(totalBytesHeader, 10) : NaN
      const totalBytes = Number.isFinite(parsedTotalBytes) ? parsedTotalBytes : estimatedTotalBytes

      setStreamProgress('Generating audio... 0%')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const chunks: Uint8Array[] = []
      let receivedBytes = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        receivedBytes += value.length
        const percent = Math.min(99, Math.max(1, Math.round((receivedBytes / totalBytes) * 100)))
        setStreamProgress(`Generating audio... ${percent}%`)
      }

      setStreamProgress('Generating audio... 100%')

      // Combine all chunks into one ArrayBuffer, then create a Blob
      const combined = new Uint8Array(receivedBytes)
      let offset = 0
      for (const chunk of chunks) {
        combined.set(chunk, offset)
        offset += chunk.length
      }
      const audioBlob = new Blob([combined.buffer as ArrayBuffer], { type: 'audio/wav' })
      const blobUrl = URL.createObjectURL(audioBlob)

      setGeneratedAudio({
        url: blobUrl,
        duration: Math.max(1, text.length / 15),
        savedUrl: savedAudioUrl,
        name: trimmedName || undefined,
      })

      const historyAudioUrl = savedAudioUrl || blobUrl
      saveLocalHistory({
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: trimmedName || undefined,
        text: text.substring(0, 500),
        textLength: text.length,
        audioUrl: historyAudioUrl,
        duration: Math.max(1, text.length / 15),
        status: 'completed',
        type: activeTab,
        createdAt: new Date().toISOString(),
      })

      toast({
        title: 'Success',
        description: `Voice generated! (${Math.round(audioBlob.size / 1024)} KB)`,
      })
    } catch (error: any) {
      console.error('Error generating voice:', error)
      const isAbort = error.name === 'AbortError'
      toast({
        title: isAbort ? 'Timeout' : 'Error',
        description: isAbort ? 'Request timed out. Try shorter text.' : (error.message || 'Failed to generate voice'),
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
      setStreamProgress(null)
    }
  }

  const selectedVoiceData = voices.find(v => v.voiceId === selectedVoice)

  const buildDownloadFilename = (name?: string) => {
    const base = (name || 'raketh')
      .trim()
      .replace(/[^a-zA-Z0-9-_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60)
    const safeBase = base || 'viwan'
    const now = new Date()
    const pad = (value: number) => value.toString().padStart(2, '0')
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    return `${safeBase}-${stamp}.wav`
  }

  const saveLocalHistory = (entry: {
    id: string
    name?: string
    text: string
    textLength: number
    audioUrl: string
    duration: number
    status: string
    type: string
    createdAt: string
  }) => {
    try {
      const raw = localStorage.getItem('voiceGenerationHistory')
      const existing = raw ? JSON.parse(raw) : []
      const next = [entry, ...existing].slice(0, 50)
      localStorage.setItem('voiceGenerationHistory', JSON.stringify(next))
    } catch (error) {
      console.error('Failed to save local generation history:', error)
    }
  }

  // Get language options for dropdowns
  const getTranslationLanguageOptions = (): LanguageOption[] => {
    if (languages?.translation?.languages) {
      return languages.translation.languages.map(lang => ({
        value: lang.code,
        label: lang.name,
        ttsCode: lang.tts_code
      }))
    }
    // Fallback defaults
    return [
      { value: 'eng_Latn', label: 'English' },
      { value: 'spa_Latn', label: 'Spanish' },
      { value: 'fra_Latn', label: 'French' },
      { value: 'deu_Latn', label: 'German' },
      { value: 'zho_Hans', label: 'Chinese' },
      { value: 'jpn_Jpan', label: 'Japanese' },
    ]
  }

  const getTTSLanguageOptions = (): LanguageOption[] => {
    if (languages?.tts?.languages) {
      return languages.tts.languages.map(lang => ({
        value: lang.code,
        label: lang.name
      }))
    }
    // Fallback defaults
    return DEFAULT_TTS_LANGUAGES.map(lang => ({
      value: lang.code,
      label: lang.name
    }))
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-mesh">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-full blur-lg opacity-50 animate-pulse" />
            <Loader2 className="relative h-12 w-12 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading voice studio...</p>
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
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-primary/10 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 group">
                <Image
                  src="/logo.png"
                  alt="RaketH Clone"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain drop-shadow-lg"
                />
                <span className="font-bold">RaketH Clone</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/voice-clones')}
                className="gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Mic className="h-4 w-4" />
                Voice Clones
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')} className="hover:border-primary/50 hover:bg-primary/5 transition-all">
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                <Volume2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Generate Voice</h1>
                <p className="text-muted-foreground">
                  Transform your text into natural-sounding speech using AI
                </p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in-up animation-delay-100">
            <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="tts" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Volume2 className="h-4 w-4" />
                Text to Speech
              </TabsTrigger>
              <TabsTrigger value="translate-tts" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Languages className="h-4 w-4" />
                Translate & TTS
              </TabsTrigger>
            </TabsList>

            {/* TTS Section */}
            <TabsContent value="tts">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                      <Volume2 className="h-4 w-4 text-primary" />
                    </div>
                    Text to Speech
                  </CardTitle>
                  <CardDescription>
                    Convert text directly to speech with streaming audio
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-[1fr_0.9fr]">
                  {/* Text Input */}
                  <div className="space-y-2">
                    <Label htmlFor="text-tts">Text to Convert</Label>
                    <div className="md:aspect-square">
                      <Textarea
                        id="text-tts"
                        placeholder="Enter text you want to convert to speech..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        maxLength={MAX_TEXT_LENGTH}
                        className="h-full min-h-[260px] resize-none overflow-y-auto rounded-xl border-border/50 bg-muted/30 focus:border-primary/50 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{text.length > 2000 ? 'Uses streaming for faster delivery' : 'Enter text you want to convert'}</span>
                      <span className={
                        text.length > MAX_TEXT_LENGTH * 0.95 ? 'text-red-500 font-medium' :
                        text.length > MAX_TEXT_LENGTH * 0.8 ? 'text-orange-500' : ''
                      }>{text.length.toLocaleString()}/{MAX_TEXT_LENGTH.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="generation-name-tts">Generation Name</Label>
                      <Input
                        id="generation-name-tts"
                        placeholder="e.g., Intro voice, Promo take 1"
                        value={generationName}
                        onChange={(e) => setGenerationName(e.target.value)}
                        maxLength={60}
                        className="rounded-xl border-border/50 bg-muted/30 focus:border-primary/50 focus:ring-primary/20 transition-all"
                      />
                    </div>

                    {/* Language Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="tts-language">Language</Label>
                      <Select
                        value={ttsLanguage}
                        onValueChange={setTtsLanguage}
                        onOpenChange={(open) => {
                          if (open) fetchLanguages()
                        }}
                      >
                        <SelectTrigger id="tts-language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {isLanguagesLoading && !languagesLoaded ? (
                            <SelectItem value="loading" disabled>
                              Loading languages...
                            </SelectItem>
                          ) : (
                            getTTSLanguageOptions().map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Voice Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="voice-tts">Select Voice</Label>
                      <Select
                        value={selectedVoice}
                        onValueChange={setSelectedVoice}
                        onOpenChange={(open) => {
                          if (open) fetchVoices()
                        }}
                      >
                        <SelectTrigger id="voice-tts">
                          <SelectValue placeholder="Select a voice" />
                        </SelectTrigger>
                        <SelectContent>
                          {isVoicesLoading && !voicesLoaded ? (
                            <SelectItem value="loading" disabled>
                              Loading voices...
                            </SelectItem>
                          ) : voices.length === 0 ? (
                            <SelectItem value="empty" disabled>
                              No voices available
                            </SelectItem>
                          ) : (
                            voices.map((voice) => (
                              <SelectItem key={voice.id} value={voice.voiceId}>
                                <div className="flex items-center gap-2">
                                  <span>{voice.name}</span>
                                  {voice.isDefault && (
                                    <Badge variant="secondary" className="text-xs">
                                      Default
                                    </Badge>
                                  )}
                                  {!voice.available && (
                                    <Badge variant="destructive" className="text-xs">
                                      Unavailable
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      {selectedVoiceData && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10">
                          <p className="text-sm font-medium">{selectedVoiceData.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedVoiceData.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Generate Button */}
                    <div className="space-y-2">
                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !text.trim()}
                        size="lg"
                        className="w-full gradient-primary border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {streamProgress || 'Generating Audio...'}
                          </>
                        ) : (
                          <>
                            <Volume2 className="mr-2 h-5 w-5" />
                            Generate Speech
                          </>
                        )}
                      </Button>
                      {isGenerating && (
                        <p className="text-sm text-muted-foreground text-center">
                          Audio is streaming — please wait for download to finish.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Translate-TTS Section */}
            <TabsContent value="translate-tts">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                      <Languages className="h-4 w-4 text-primary" />
                    </div>
                    Translate & Text to Speech
                  </CardTitle>
                  <CardDescription>
                    Translate text first, then generate speech with streaming audio
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-[1fr_0.9fr]">
                  {/* Text Input */}
                  <div className="space-y-2">
                    <Label htmlFor="text-translate">Text to Translate & Speak</Label>
                    <div className="md:aspect-square">
                      <Textarea
                        id="text-translate"
                        placeholder="Enter text you want to translate and convert to speech..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        maxLength={MAX_TEXT_LENGTH}
                        className="h-full min-h-[260px] resize-none overflow-y-auto rounded-xl border-border/50 bg-muted/30 focus:border-primary/50 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{text.length > 2000 ? 'Uses streaming for faster delivery' : 'Enter text you want to translate'}</span>
                      <span className={
                        text.length > MAX_TEXT_LENGTH * 0.95 ? 'text-red-500 font-medium' :
                        text.length > MAX_TEXT_LENGTH * 0.8 ? 'text-orange-500' : ''
                      }>{text.length.toLocaleString()}/{MAX_TEXT_LENGTH.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="generation-name-translate">Generation Name</Label>
                      <Input
                        id="generation-name-translate"
                        placeholder="e.g., French narration, Ad v2"
                        value={generationName}
                        onChange={(e) => setGenerationName(e.target.value)}
                        maxLength={60}
                        className="rounded-xl border-border/50 bg-muted/30 focus:border-primary/50 focus:ring-primary/20 transition-all"
                      />
                    </div>

                    {/* Language Selection */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="source-lang">Source Language</Label>
                        <Select
                          value={sourceLanguage}
                          onValueChange={setSourceLanguage}
                          onOpenChange={(open) => {
                            if (open) fetchLanguages()
                          }}
                        >
                          <SelectTrigger id="source-lang">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {isLanguagesLoading && !languagesLoaded ? (
                              <SelectItem value="loading" disabled>
                                Loading languages...
                              </SelectItem>
                            ) : (
                              getTranslationLanguageOptions().map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                  {lang.label}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="target-lang">Target Language</Label>
                        <Select
                          value={targetLanguage}
                          onValueChange={setTargetLanguage}
                          onOpenChange={(open) => {
                            if (open) fetchLanguages()
                          }}
                        >
                          <SelectTrigger id="target-lang">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {isLanguagesLoading && !languagesLoaded ? (
                              <SelectItem value="loading" disabled>
                                Loading languages...
                              </SelectItem>
                            ) : (
                              getTranslationLanguageOptions().map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                  {lang.label}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Voice Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="voice-translate">Select Voice</Label>
                      <Select
                        value={selectedVoice}
                        onValueChange={setSelectedVoice}
                        onOpenChange={(open) => {
                          if (open) fetchVoices()
                        }}
                      >
                        <SelectTrigger id="voice-translate">
                          <SelectValue placeholder="Select a voice" />
                        </SelectTrigger>
                        <SelectContent>
                          {isVoicesLoading && !voicesLoaded ? (
                            <SelectItem value="loading" disabled>
                              Loading voices...
                            </SelectItem>
                          ) : voices.length === 0 ? (
                            <SelectItem value="empty" disabled>
                              No voices available
                            </SelectItem>
                          ) : (
                            voices.map((voice) => (
                              <SelectItem key={voice.id} value={voice.voiceId}>
                                <div className="flex items-center gap-2">
                                  <span>{voice.name}</span>
                                  {voice.isDefault && (
                                    <Badge variant="secondary" className="text-xs">
                                      Default
                                    </Badge>
                                  )}
                                  {!voice.available && (
                                    <Badge variant="destructive" className="text-xs">
                                      Unavailable
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      {selectedVoiceData && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10">
                          <p className="text-sm font-medium">{selectedVoiceData.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedVoiceData.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Generate Button */}
                    <div className="space-y-2">
                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !text.trim()}
                        size="lg"
                        className="w-full gradient-primary border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {streamProgress || 'Translating & Generating...'}
                          </>
                        ) : (
                          <>
                            <Languages className="mr-2 h-5 w-5" />
                            Translate & Generate Speech
                          </>
                        )}
                      </Button>
                      {isGenerating && (
                        <p className="text-sm text-muted-foreground text-center">
                          Audio is streaming — please wait for download to finish.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Result */}
          {generatedAudio && (
            <Card className="mt-6 glass-card border-0 animate-fade-in-up">
              <CardContent className="pt-6">
                <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/25">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Voice Generated Successfully!</p>
                      {generatedAudio.name && (
                        <p className="text-sm text-muted-foreground">
                          {generatedAudio.name}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Duration: {generatedAudio.duration.toFixed(1)}s
                      </p>
                    </div>
                  </div>
                  <audio controls className="w-full rounded-lg" controlsList="nodownload">
                    <source src={generatedAudio.url} type="audio/wav" />
                    Your browser does not support audio element.
                  </audio>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const a = document.createElement('a')
                        a.href = generatedAudio.url
                        a.download = buildDownloadFilename(generatedAudio.name)
                        a.click()
                      }}
                      className="hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                      Download WAV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Note */}
          <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 animate-fade-in-up animation-delay-200">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1 text-foreground">About Voice Generation</p>
              <p className="leading-relaxed">
                Audio is generated using streaming for faster response times. Select voices from your clone library
                or use default voices. Long texts are handled efficiently with streaming to prevent timeouts.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
