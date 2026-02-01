# Storage Directory

This directory contains generated audio files.

## Structure

- `audio/` - Generated TTS audio files (.wav)

## Notes

- Audio files are named with unique IDs: `{generationId}.wav`
- Files are served via `/api/audio/[filename]` endpoint
- Old files can be cleaned up periodically if needed

## Gitignore

Add the following to your `.gitignore` to exclude audio files:

```
storage/audio/*.wav
```
