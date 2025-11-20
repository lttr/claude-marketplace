---
name: process-video
description: Convert lecture videos to transcripts and articles
argument-hint: [youtube-url-or-folder-path]
---

# Video to Article Conversion

Convert a lecture or presentation video into multiple text formats.

## Usage

- `/process-video https://youtube.com/watch?v=...` - Process YouTube video
- `/process-video /path/to/folder` - Process video in existing folder
- `/process-video` - Interactive mode (will ask for input)

---

Load video-to-article skill first.

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
