'use client'

import { useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'

import { cn } from '@/lib/utils'

type AudioScrubberProps = {
  src: string
  className?: string
}

export function AudioScrubber({ src, className }: AudioScrubberProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const handleToggle = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      try {
        await audio.play()
      } catch (error) {
        console.error('Failed to play audio:', error)
      }
    } else {
      audio.pause()
    }
  }

  const handleSeek = (value: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value
    setCurrentTime(value)
  }

  const formatTime = (value: number) => {
    if (!Number.isFinite(value)) return '0:00'
    const totalSeconds = Math.floor(value)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0

  return (
    <div className={cn('rounded-lg border border-white/10 bg-white/5 p-3', className)}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleToggle}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-foreground transition hover:bg-white/20"
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.01}
        value={currentTime}
        onChange={(event) => handleSeek(Number(event.target.value))}
        className="audio-scrubber-range mt-3 w-full"
        style={{
          background: `linear-gradient(90deg, rgba(250,250,250,0.9) ${progressPercent}%, rgba(255,255,255,0.15) ${progressPercent}%)`,
        }}
        aria-label="Audio progress"
      />
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  )
}
