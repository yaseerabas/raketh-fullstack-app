# Demo Audio Files

Place your demo audio files here. The home page expects the following files:

1. `female-en.wav` - Female English voice demo
2. `male-en.wav` - Male English voice demo  
3. `female-ur.wav` - Female Urdu voice demo

## Adding New Demos

To add more demo voices, edit the `DEMO_VOICES` array in `src/app/page.tsx`:

```tsx
const DEMO_VOICES = [
  {
    id: 'demo-female-en',
    name: 'Female English',
    description: 'Natural female voice in English',
    audioFile: '/demo/female-en.wav',
    language: 'English',
  },
  // Add more demos here...
]
```

## Supported Formats

- `.wav` (recommended)
- `.mp3`
- `.ogg`

## Tips

- Keep demo audio files short (10-30 seconds)
- Use high quality recordings
- Ensure consistent audio levels across all demos
