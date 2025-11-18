---
name: video-to-article
description: Use this skill when the user wants to convert a lecture, presentation, or talk video into text formats (transcript, outline, or article). Trigger when user mentions processing video recordings, creating transcripts from lectures, or generating articles from recorded presentations.
---

# Video to Article Conversion Workflow

This skill automates the conversion of lecture/presentation videos into various text formats including transcripts, outlines, and article drafts.

## Workflow Overview

1. **Validate Input Metadata** - Check for README.md with required frontmatter
2. **Extract Audio** - Convert video to MP3 using ffmpeg
3. **Transcribe** - Generate text transcript using ElevenLabs API
4. **Process Text** - Create 4 progressive text refinements

## Step 1: Validate Metadata

Look for `README.md` in the current directory with these frontmatter fields:

- `title` - Lecture/presentation title
- `speaker` - Speaker name
- `date` - Presentation date (YYYY-MM-DD)
- `lang` - Presentation language (e.g., "english", "czech", "spanish")
- `abstract` - Brief description
- `slides` - Link to slides (or file path)
- `video` - Optional: link to video

### If README.md is Missing or Incomplete

Use the AskUserQuestion tool to collect missing information:

```
- What is the lecture title?
- Who is the speaker?
- What date was this presented?
- What language is the presentation in?
- Brief description or abstract?
- Link to slides or presentation file?
```

Create or update README.md with collected information.

## Step 2: Find Video File

Look for video file in current directory:
- Common patterns: `*.mp4`, `*.mov`, `*.avi`, `*.mkv`
- If multiple found, ask user which to process
- If none found, ask user for video file path

## Step 3: Extract Audio

Check if `audio.mp3` already exists. If not:

Run the extract-audio.sh script:
```bash
bash scripts/extract-audio.sh <video-file>
```

This creates `audio.mp3` in the current directory.

## Step 4: Transcribe Audio

Check if `generated-transcript.txt` already exists. If not:

### Map Language to ISO Code

Convert the `lang` field from README.md to the appropriate ISO 639-1 language code for ElevenLabs API. Use your knowledge of language codes to map language names to their two-letter codes (e.g., "english" → "en", "czech" → "cs", "spanish" → "es").

### Run Transcription

```bash
bash scripts/transcribe-audio.sh <language-code>
```

## Step 5: Generate Text Outputs

Process the transcript through 4 progressive refinements. For each step:
1. Check if output file exists - skip if present
2. Load the appropriate prompt template
3. Apply the prompt using Claude Code
4. Save to the specified output file

### Output 1: Cleaned Transcript

**File:** `generated-transcript-cleaned.md`
**Prompt Template:** `prompts/01-clean-transcript.md`

Read the prompt template, replace `{lang}` with the language from README.md, and apply it to `generated-transcript.txt`.

### Output 2: Readable Transcript

**File:** `generated-transcript-readable.md`
**Prompt Template:** `prompts/02-make-readable.md`

Read the prompt template, replace `{lang}` with language and `{slides}` with slides link, then apply to both `generated-transcript.txt` and `generated-transcript-cleaned.md`.

### Output 3: Outline

**File:** `generated-transcript-outline.md`
**Prompt Template:** `prompts/03-create-outline.md`

Read the prompt template, replace `{lang}`, and apply to the cleaned and readable transcripts.

### Output 4: Article Draft

**File:** `generated-blog-suggestion.md`
**Prompt Template:** `prompts/04-draft-article.md`

Read the prompt template, replace `{lang}`, and apply to all previous outputs.

## Summary

After completion, inform the user:
```
Workflow complete! Generated:
- audio.mp3
- generated-transcript.txt
- generated-transcript-cleaned.md
- generated-transcript-readable.md
- generated-transcript-outline.md
- generated-blog-suggestion.md

All outputs in <language> language.
```

## Error Handling

- **Missing ffmpeg**: Prompt user to install ffmpeg
- **Missing API key**: Prompt user to set ELEVENLABS_API_KEY
- **Transcription errors**: Show error message and suggest checking API key/quota
- **Script not found**: Use absolute paths to skill scripts directory
