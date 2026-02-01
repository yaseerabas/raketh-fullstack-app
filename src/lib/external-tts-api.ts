/**
 * External TTS API Client
 * Handles communication with external TTS service
 * Based on Translation & TTS API Documentation v1.0.0
 */

// API Configuration - require URL in production
// Remove trailing slash if present
const API_BASE_URL = (process.env.EXTERNAL_TTS_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
const API_KEY = process.env.EXTERNAL_TTS_API_KEY || ''

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 300000 // 5 minutes for long TTS generation

/**
 * Helper function to create headers with optional API key
 */
function getHeaders(contentType: string = 'application/json'): HeadersInit {
  const headers: HeadersInit = {}
  
  if (contentType) {
    headers['Content-Type'] = contentType
  }
  
  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`
  }
  
  return headers
}

/**
 * Helper function to make fetch requests with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    console.log(`[TTS API] Requesting: ${url}`)
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    console.log(`[TTS API] Response status: ${response.status}`)
    return response
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`)
    }
    console.error(`[TTS API] Fetch error:`, error)
    throw new Error(`Failed to connect to TTS API: ${error.message}`)
  } finally {
    clearTimeout(timeoutId)
  }
}

// ==========================================
// Health Check
// ==========================================

interface HealthResponse {
  status: 'healthy' | 'degraded'
  models: { translation: boolean; tts: boolean }
  models_enabled: { translation: boolean; tts: boolean }
  device: string
  cuda_available: boolean
}

/**
 * Check API health and model status
 * @returns Promise with health status
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/health`,
    { method: 'GET', headers: getHeaders() },
    10000 // 10 second timeout for health check
  )

  if (!response.ok) {
    throw new Error('TTS API health check failed')
  }

  return response.json()
}

// ==========================================
// Voice Clone Endpoints
// ==========================================

interface UploadVoiceResponse {
  message: string
  user_id: string
  path: string
}

interface Voice {
  user_id: string
  path: string
  available: boolean
}

interface ListVoicesResponse {
  voices: Voice[]
}

/**
 * Default speaker IDs for TTS when no custom voice clone is used
 * These are built-in voices available on the external API
 */
export const DEFAULT_MALE_SPEAKER = 'default_male_01'
export const DEFAULT_FEMALE_SPEAKER = 'default_female_01'
export const DEFAULT_SPEAKER_ID = DEFAULT_FEMALE_SPEAKER // Default to female voice

/**
 * Supported TTS languages (Qwen3-TTS)
 * These are the only languages supported for text-to-speech
 */
export const TTS_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'ru', name: 'Russian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
] as const

/**
 * Supported language codes for translate-tts workflows
 * Maps NLLB codes to TTS codes
 */
export const TRANSLATE_TTS_LANGUAGES = [
  { nllbCode: 'eng_Latn', ttsCode: 'en', name: 'English' },
  { nllbCode: 'zho_Hans', ttsCode: 'zh', name: 'Chinese (Simplified)' },
  { nllbCode: 'zho_Hant', ttsCode: 'zh', name: 'Chinese (Traditional)' },
  { nllbCode: 'jpn_Jpan', ttsCode: 'ja', name: 'Japanese' },
  { nllbCode: 'kor_Hang', ttsCode: 'ko', name: 'Korean' },
  { nllbCode: 'deu_Latn', ttsCode: 'de', name: 'German' },
  { nllbCode: 'fra_Latn', ttsCode: 'fr', name: 'French' },
  { nllbCode: 'rus_Cyrl', ttsCode: 'ru', name: 'Russian' },
  { nllbCode: 'por_Latn', ttsCode: 'pt', name: 'Portuguese' },
  { nllbCode: 'spa_Latn', ttsCode: 'es', name: 'Spanish' },
  { nllbCode: 'ita_Latn', ttsCode: 'it', name: 'Italian' },
] as const

/**
 * Upload a voice sample to the external API
 * @param userId - The user ID (voice_id)
 * @param file - The audio file to upload
 * @returns Promise with upload response
 */
export async function uploadVoice(
  userId: string,
  file: File
): Promise<UploadVoiceResponse> {
  const formData = new FormData()
  formData.append('user_id', userId)
  formData.append('voice_file', file)

  // Create headers without Content-Type (let browser set it for FormData)
  const headers: HeadersInit = {}
  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`
  }

  const response = await fetchWithTimeout(`${API_BASE_URL}/voice/upload`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Upload failed: ${errorText}`)
  }

  return response.json()
}

/**
 * List all available voices from the external API (full list with details)
 * @returns Promise with list of voices
 */
export async function listVoices(): Promise<ListVoicesResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/voice/list`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch voice list')
  }

  return response.json()
}

/**
 * Quick overview of available voices
 * @returns Promise with voice count and overview
 */
export async function getVoicesOverview(): Promise<{ count: number; voices: Voice[] }> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/voices`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch voices overview')
  }

  return response.json()
}

// ==========================================
// Language Endpoints
// ==========================================

interface TranslationLanguage {
  code: string // NLLB code (e.g., "eng_Latn")
  name: string
  tts_code: string // TTS code (e.g., "en")
}

interface TTSLanguage {
  code: string // TTS code (e.g., "en")
  name: string
  nllb_code: string // NLLB code (e.g., "eng_Latn")
}

interface LanguagesResponse {
  translation: {
    model: string
    languages: TranslationLanguage[]
  }
  tts: {
    model: string
    languages: TTSLanguage[]
  }
}

/**
 * Get supported languages for translation and TTS
 * @returns Promise with language mappings
 */
export async function getSupportedLanguages(): Promise<LanguagesResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/languages`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch supported languages')
  }

  return response.json()
}

// ==========================================
// TTS Endpoints
// ==========================================

interface TTSRequest {
  text: string
  speaker_id: string // Voice ID from clone library or default (e.g., "default_male_01", "voice_321")
}

interface TranslateTTSRequest {
  text: string
  speaker_id: string
  src_lang: string // NLLB code (e.g., "eng_Latn")
  tgt_lang: string // NLLB code (e.g., "fra_Latn")
}

/**
 * Generate speech from text with streaming response
 * Uses /tts/stream endpoint for long text to prevent timeouts
 * @param text - The text to convert to speech
 * @param speakerId - Voice ID (e.g., "default_male_01", "default_female_01", or custom voice ID)
 * @param language - TTS language code (e.g., "en", "zh", "ja") - defaults to "en"
 * @returns Promise with audio stream as Blob
 */
export async function generateTTS(text: string, speakerId: string = DEFAULT_SPEAKER_ID, language: string = 'en'): Promise<Blob> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/tts/stream`, {
    method: 'POST',
    headers: getHeaders('application/json'),
    body: JSON.stringify({
      text,
      speaker_id: speakerId,
      language
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`TTS generation failed: ${errorText}`)
  }

  return response.blob()
}

/**
 * Translate text and generate speech with streaming response
 * Uses /translate-tts/stream endpoint for combined translation + TTS
 * @param text - The text to translate and convert to speech
 * @param speakerId - Voice ID for the generated speech
 * @param srcLang - Source language NLLB code (e.g., "eng_Latn")
 * @param tgtLang - Target language NLLB code (e.g., "fra_Latn")
 * @returns Promise with audio stream as Blob
 */
export async function generateTranslateTTS(
  text: string,
  speakerId: string,
  srcLang: string,
  tgtLang: string
): Promise<Blob> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/translate-tts/stream`, {
    method: 'POST',
    headers: getHeaders('application/json'),
    body: JSON.stringify({
      text,
      speaker_id: speakerId,
      src_lang: srcLang,
      tgt_lang: tgtLang
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Translate-TTS generation failed: ${errorText}`)
  }

  return response.blob()
}

// ==========================================
// Language Code Mappings
// ==========================================

/**
 * Convert TTS language code to NLLB code
 * @param ttsCode - TTS language code (e.g., "en")
 * @param languages - Supported languages response
 * @returns NLLB code or null if not found
 */
export function ttsToNLLBCode(
  ttsCode: string,
  languages: LanguagesResponse
): string | null {
  const ttsLang = languages.tts.languages.find(lang => lang.code === ttsCode)
  return ttsLang?.nllb_code || null
}

/**
 * Convert NLLB language code to TTS code
 * @param nllbCode - NLLB language code (e.g., "eng_Latn")
 * @param languages - Supported languages response
 * @returns TTS code or null if not found
 */
export function nllbToTTSCode(
  nllbCode: string,
  languages: LanguagesResponse
): string | null {
  const transLang = languages.translation.languages.find(lang => lang.code === nllbCode)
  return transLang?.tts_code || null
}

/**
 * Get all available language options for UI
 * @param languages - Supported languages response
 * @returns Array of language options
 */
export function getLanguageOptions(languages: LanguagesResponse) {
  return languages.translation.languages.map(lang => ({
    value: lang.code,
    label: lang.name,
    ttsCode: lang.tts_code
  }))
}
