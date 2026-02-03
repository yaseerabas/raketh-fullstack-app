'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Volume2, Loader2, Play, AlertCircle, ArrowLeft, Mic, Languages, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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
  const [text, setText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAudio, setGeneratedAudio] = useState<{ url: string; duration: number; base64?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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

      // Fetch voices and languages in parallel - handle failures gracefully
      try {
        const [voicesResponse, languagesResponse] = await Promise.all([
          fetch('/api/voice-clones'),
          fetch('/api/languages')
        ])

        if (voicesResponse.ok) {
          const voicesData = await voicesResponse.json()
          setVoices(voicesData.voices || [])
          if (voicesData.voices?.length > 0) {
            setSelectedVoice(voicesData.voices[0].voiceId)
          }
        }

        if (languagesResponse.ok) {
          const langData = await languagesResponse.json()
          setLanguages(langData)
          if (langData.translation?.languages?.length > 0) {
            setSourceLanguage(langData.translation.languages[0].code)
          }
          if (langData.tts?.languages?.length > 0) {
            setTargetLanguage(langData.tts.languages[0].code)
            setTtsLanguage(langData.tts.languages[0].code)
          }
        }
      } catch (fetchError) {
        console.error('Error fetching voices/languages:', fetchError)
        // Continue anyway - voices have defaults, languages have fallback
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

    setIsGenerating(true)
    setGeneratedAudio(null)

    try {
      const payload: any = {
        text,
        voiceId: selectedVoice,
        type: activeTab,
      }

      if (activeTab === 'tts') {
        payload.language = ttsLanguage
      } else {
        payload.sourceLanguage = sourceLanguage
        payload.targetLanguage = targetLanguage
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedAudio({
          url: data.url,
          duration: data.duration,
          base64: data.base64
        })
        toast({
          title: 'Success',
          description: 'Voice generated successfully!',
        })
      } else {
        const error = await response.json()
        const errorMsg = error.message || error.error || 'Failed to generate voice'
        throw new Error(errorMsg)
      }
    } catch (error: any) {
      console.error('Error generating voice:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate voice',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedVoiceData = voices.find(v => v.voiceId === selectedVoice)

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
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity" />
                  <Volume2 className="relative h-6 w-6 text-primary" />
                </div>
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
                <CardContent className="space-y-6">
                  {/* Language Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="tts-language">Language</Label>
                    <Select value={ttsLanguage} onValueChange={setTtsLanguage}>
                      <SelectTrigger id="tts-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getTTSLanguageOptions().map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Voice Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="voice-tts">Select Voice</Label>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger id="voice-tts">
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {voices.map((voice) => (
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
                        ))}
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

                  {/* Text Input */}
                  <div className="space-y-2">
                    <Label htmlFor="text-tts">Text to Convert</Label>
                    <Textarea
                      id="text-tts"
                      placeholder="Enter text you want to convert to speech..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={6}
                      maxLength={10000}
                      className="resize-none rounded-xl border-border/50 bg-muted/30 focus:border-primary/50 focus:ring-primary/20 transition-all"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Enter text you want to convert</span>
                      <span className={text.length > 9000 ? 'text-orange-500' : ''}>{text.length}/10000</span>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !text.trim()}
                    size="lg"
                    className="w-full gradient-primary border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating Audio...
                      </>
                    ) : (
                      <>
                        <Volume2 className="mr-2 h-5 w-5" />
                        Generate Speech
                      </>
                    )}
                  </Button>
                  {isGenerating && text.length > 500 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Long text may take up to a few minutes to process. Please wait...
                    </p>
                  )}
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
                <CardContent className="space-y-6">
                  {/* Language Selection */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="source-lang">Source Language</Label>
                      <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                        <SelectTrigger id="source-lang">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getTranslationLanguageOptions().map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="target-lang">Target Language</Label>
                      <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                        <SelectTrigger id="target-lang">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getTranslationLanguageOptions().map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Voice Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="voice-translate">Select Voice</Label>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger id="voice-translate">
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {voices.map((voice) => (
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
                        ))}
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

                  {/* Text Input */}
                  <div className="space-y-2">
                    <Label htmlFor="text-translate">Text to Translate & Speak</Label>
                    <Textarea
                      id="text-translate"
                      placeholder="Enter text you want to translate and convert to speech..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={6}
                      maxLength={10000}
                      className="resize-none rounded-xl border-border/50 bg-muted/30 focus:border-primary/50 focus:ring-primary/20 transition-all"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Enter text you want to translate</span>
                      <span className={text.length > 9000 ? 'text-orange-500' : ''}>{text.length}/10000</span>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !text.trim()}
                    size="lg"
                    className="w-full gradient-primary border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Translating & Generating...
                      </>
                    ) : (
                      <>
                        <Languages className="mr-2 h-5 w-5" />
                        Translate & Generate Speech
                      </>
                    )}
                  </Button>
                  {isGenerating && text.length > 500 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Long text may take up to a few minutes to process. Please wait...
                    </p>
                  )}
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
                        a.download = `voice-generation-${Date.now()}.wav`
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
