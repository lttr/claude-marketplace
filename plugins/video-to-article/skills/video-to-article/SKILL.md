---
name: video-to-article
description: Use this skill when the user wants to convert a lecture, presentation, or talk video into text formats (transcript, outline, or article). Trigger when user mentions processing video recordings, creating transcripts from lectures, or generating articles from recorded presentations.
---

# Video to Article Conversion Workflow

This skill automates the conversion of lecture/presentation videos into various text formats including transcripts, outlines, and article drafts.

## Workflow Overview

1. **Setup Folder** - Create properly named folder if needed
2. **Validate Input Metadata** - Check for README.md with required frontmatter
3. **Extract Audio** - Convert video to MP3 using ffmpeg
4. **Transcribe** - Generate text transcript using ElevenLabs API
5. **Process Text** - Create 5 progressive text refinements

## Step 0: Folder Setup (if starting from scratch)

If user is starting a new talk/lecture conversion and no folder exists yet:

Create folder using format: `YYYY Title of Talk`

After creating folder, navigate into it and proceed with workflow.

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

## Step 2: Find or Download Video File

### Check for Local Video

Look for video file in current directory:
- Common patterns: `*.mp4`, `*.mov`, `*.avi`, `*.mkv`
- If multiple found, ask user which to process

### If No Local Video Found

Ask user if they have a YouTube URL using AskUserQuestion tool:
- "Do you have a YouTube URL for this talk?"
- If yes, collect the YouTube URL
- If no, ask for local video file path

### Download from YouTube (if URL provided)

```bash
bash ${CLAUDE_PLUGIN_ROOT}/skills/video-to-article/scripts/download-youtube.sh <youtube-url>
```

This downloads the video as `video.mp4` in medium quality (720p max).

**Requirements**: User needs yt-dlp installed. If missing, show:
```
Install yt-dlp:
- pip install yt-dlp
- brew install yt-dlp (macOS)
- sudo apt install yt-dlp (Ubuntu/Debian)
```

## Step 3: Extract Audio

Check if `audio.mp3` already exists. If not:

Run the extract-audio.sh script using the plugin root variable:
```bash
bash ${CLAUDE_PLUGIN_ROOT}/skills/video-to-article/scripts/extract-audio.sh <video-file>
```

This creates `audio.mp3` in the current directory.

## Step 4: Transcribe Audio

Check if `generated-transcript.txt` already exists. If not:

### Map Language to ISO Code

Convert the `lang` field from README.md to the appropriate ISO 639-1 language code for ElevenLabs API. Use your knowledge of language codes to map language names to their two-letter codes (e.g., "english" → "en", "czech" → "cs", "spanish" → "es").

### Run Transcription

```bash
bash ${CLAUDE_PLUGIN_ROOT}/skills/video-to-article/scripts/transcribe-audio.sh <language-code>
```

## Step 5: Generate Text Outputs

Process the transcript through 5 progressive refinements. For each step, check if output file exists and skip if present.

### Output 1: Cleaned Transcript

**File:** `generated-transcript-cleaned.md`
**Input:** `generated-transcript.txt`

Convert the transcript into a more readable form by dividing it into paragraphs and adding headings.

**Instructions:**
- Do not change the content, except for obvious typos
- Do not change the tone of voice - if the speaker uses informal language, keep it
- Remove filler words like "Eh", "Ehm", "Um", "Uh"
- Remove comments related to the transcription itself, or rewrite them elegantly if possible (e.g., "(laughter)" or "(2 second pause)")
- Respond in {lang} language - maintain the same language as the original transcript

The cleaned transcript should preserve the speaker's authentic voice while being easier to read and follow.

### Output 2: Readable Transcript

**File:** `generated-transcript-readable.md`
**Inputs:** `generated-transcript.txt` and `generated-transcript-cleaned.md`

You have two inputs:
1. The first text contains the direct transcript of a lecture
2. The second text contains a better structured version of this transcript

The slides are available here: {slides}

Create a more readable text from this transcript:

**Instructions:**
- Preserve the style, but optimize for reading comprehension
- Fix typos, repetitions, and improve stylistic clarity
- Shorten where it doesn't affect the message
- Make it flow naturally for readers while keeping the speaker's voice
- Respond in {lang} language - the output must be in the same language as the input

The goal is to make the content accessible to readers while maintaining the essence of the spoken presentation.

### Output 3: Outline

**File:** `generated-transcript-outline.md`
**Inputs:** Cleaned and readable transcripts

From the provided transcript inputs, create an outline of what was discussed.

**Instructions:**
- List the main ideas and messages with very brief content
- Use bullet points for clarity
- Focus on key takeaways and core concepts
- Keep descriptions concise - just enough to understand the point
- Respond in {lang} language - the outline must be in the same language as the source material

This outline should serve as a quick reference guide to the presentation's structure and main points.

### Output 4: Key Ideas

**File:** `generated-key-ideas.md`
**Inputs:** Cleaned and readable transcripts

From the provided transcript inputs, extract the key ideas, tips, and main concepts.

**Instructions:**
- Focus on interesting insights, actionable tips, and core concepts
- Unlike the outline, don't follow chronological order - prioritize importance
- Exclude generic or procedural content
- Each idea should have a brief description explaining why it matters
- Use bullet points or numbered list
- Respond in {lang} language - the output must be in the same language as the source material

This should capture the most valuable takeaways someone would want to remember from the talk.

### Output 5: Article Draft

**File:** `generated-blog-suggestion.md`
**Inputs:** All previous outputs

From the provided inputs, create a draft article for a website.

**Instructions:**
- The article should be concise and clear
- Target an informed reader who may not be an expert but is interested in details
- Structure with proper headings and logical flow
- Include key insights and practical takeaways
- Make it engaging and informative
- Respond in {lang} language - the article must be in the same language as the source material

The article should stand alone as a valuable piece of content that captures the essence of the presentation for readers who weren't there.

## Summary

After completion, inform the user:
```
Workflow complete! Generated:
- audio.mp3
- generated-transcript.txt
- generated-transcript-cleaned.md
- generated-transcript-readable.md
- generated-transcript-outline.md
- generated-key-ideas.md
- generated-blog-suggestion.md

All outputs in <language> language.
```

## Error Handling

- **Missing ffmpeg**: Prompt user to install ffmpeg
- **Missing API key**: Prompt user to set ELEVENLABS_API_KEY
- **Transcription errors**: Show error message and suggest checking API key/quota
- **Script not found**: Use absolute paths to skill scripts directory
