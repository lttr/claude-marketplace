---
name: video-to-article
description: Convert lecture videos to transcripts and articles
argument-hint: [youtube-url-or-folder-path]
---

# Video to Article Conversion

Convert a lecture or presentation video into multiple text formats including transcripts, outlines, key ideas, and article drafts.

## Usage

- `/video-to-article https://youtube.com/watch?v=...` - Process YouTube video
- `/video-to-article /path/to/folder` - Process video in existing folder
- `/video-to-article` - Interactive mode (will ask for input)

## What This Does

1. Downloads/locates video file
2. Extracts audio using ffmpeg
3. Transcribes using ElevenLabs API
4. Generates 5 progressive text refinements:
   - Cleaned transcript
   - Readable transcript
   - Outline
   - Key ideas
   - Article draft

## Requirements

- ffmpeg installed
- ELEVENLABS_API_KEY environment variable set
- yt-dlp (for YouTube downloads)

---

{arg1}

Execute the video-to-article workflow for the provided input (YouTube URL, folder path, or prompt interactively if empty).
