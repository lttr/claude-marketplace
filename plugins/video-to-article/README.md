# Video to Article Plugin

Automated workflow for converting lecture videos into transcripts, outlines, and article drafts.

## Features

- Extract audio from video files using ffmpeg
- Transcribe audio to text using ElevenLabs API
- Generate cleaned transcript with structure
- Create readable version optimized for reading
- Extract outline of main topics and ideas
- Draft article suitable for blog publication
- Multi-language support based on presentation language
- Automatically skip existing output files

## Requirements

### Dependencies

- **ffmpeg**: For audio extraction from video files
  ```bash
  # Ubuntu/Debian
  sudo apt install ffmpeg

  # macOS
  brew install ffmpeg
  ```

- **curl**: For API requests (usually pre-installed)
- **jq**: For JSON parsing (usually pre-installed)

### API Key

You need an ElevenLabs API key for transcription:

1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Get your API key from the dashboard
3. Set environment variable:
   ```bash
   export ELEVENLABS_API_KEY="your-api-key-here"
   ```

Add to your `~/.bashrc` or `~/.zshrc` to persist.

## Usage

### Input Requirements

Create a `README.md` file in your project directory with frontmatter:

```markdown
---
title: Your Lecture Title
speaker: Speaker Name
date: 2025-03-17
lang: english
abstract: Brief description of the lecture content
slides: https://link-to-slides.com
video: https://youtube.com/... (optional)
---
```

### Starting the Workflow

Simply ask Claude Code to process your lecture video:

```
Convert my lecture video to article
Process lecture.mp4 into text outputs
```

The plugin will:
1. Validate or prompt for missing README.md metadata
2. Extract audio from video file
3. Transcribe using ElevenLabs API
4. Generate all text outputs in sequence

### Output Files

The workflow creates:

- `audio.mp3` - Extracted audio
- `generated-transcript.txt` - Raw transcription
- `generated-transcript-cleaned.md` - Structured transcript
- `generated-transcript-readable.md` - Reader-optimized version
- `generated-transcript-outline.md` - Topic outline
- `generated-blog-suggestion.md` - Article draft

## Supported Languages

The plugin supports multiple languages. Set the `lang` field in README.md to:

- `english`, `czech`, `spanish`, `french`, `german`, `italian`, `portuguese`, etc.

All outputs will be generated in the specified language.

## Installation

```bash
/plugin install video-to-article@claude-marketplace
```

## License

MIT
