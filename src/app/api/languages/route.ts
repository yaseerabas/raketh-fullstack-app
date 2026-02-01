import { NextRequest, NextResponse } from 'next/server'
import { getSupportedLanguages, TTS_LANGUAGES, TRANSLATE_TTS_LANGUAGES } from '@/lib/external-tts-api'

// Fallback languages when external API is unavailable
const FALLBACK_LANGUAGES = {
  translation: {
    model: 'nllb',
    languages: TRANSLATE_TTS_LANGUAGES.map(l => ({
      code: l.nllbCode,
      name: l.name,
      tts_code: l.ttsCode
    }))
  },
  tts: {
    model: 'qwen3-tts',
    languages: TTS_LANGUAGES.map(l => ({
      code: l.code,
      name: l.name,
      nllb_code: TRANSLATE_TTS_LANGUAGES.find(t => t.ttsCode === l.code)?.nllbCode || l.code
    }))
  }
}

export async function GET(req: NextRequest) {
  try {
    const languages = await getSupportedLanguages()
    return NextResponse.json(languages)
  } catch (error: any) {
    console.error('Error fetching languages from external API, using fallback:', error.message)
    // Return fallback languages when external API is unavailable
    return NextResponse.json(FALLBACK_LANGUAGES)
  }
}
