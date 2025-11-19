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

Execute the video-to-article workflow for: {arg1}

**Handling file references:**
- When user provides path via @ syntax (e.g., @"folder name"), extract the actual path
- The @ syntax provides file/folder context automatically - use the referenced path
- If path contains spaces and quotes, clean them: `@"My Folder"` → `My Folder`
- Support both absolute and relative paths
- Navigate to the folder before executing workflow

**Input types:**
1. **YouTube URL**: Detect youtube.com or youtu.be pattern and download first
2. **Folder path**: Navigate to folder and process existing video
3. **Empty/Interactive**: Ask user for input or use current directory
