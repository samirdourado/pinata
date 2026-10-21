# Video Assets

Pitch and product demo for Pinata, each in two languages: **English** (required by Colosseum) and **Brazilian Portuguese** (Superteam Earn and Superteam Brasil). Every video is narrated in its own language and has burned-in subtitles in that same language. Matching `.srt` files are included so subtitles can also be uploaded as caption tracks on YouTube or Loom.

The videos state clearly that the wallet connection and SOL payments are simulated in the current prototype.

| File | Content |
| --- | --- |
| `pitch-video-en.mp4` | Pitch, ~2:45, English narration and subtitles |
| `pitch-video-pt-BR.mp4` | Pitch, ~2:50, Portuguese narration and subtitles |
| `demo-video-en.mp4` | Product demo, ~2:45, English narration and subtitles |
| `demo-video-pt-BR.mp4` | Product demo, ~2:40, Portuguese narration and subtitles |
| `*-video-en.srt` / `*-video-pt-BR.srt` | Subtitle tracks (EN / pt-BR) |
| `pitch-video-script.md`, `demo-video-script.md` | Bilingual scripts |
| `video_content.py` | Single source for narration, translations, and the screen shown in each scene |
| `capture_app.py` | Playwright script that drives the app and saves screenshots to `rendered/` |
| `generate_demo_videos.py` | Narration, subtitles, and MP4 renderer |

MP4 files and `rendered/` are git-ignored. Upload the MP4s to YouTube, Loom, or Vimeo and link them in the submission.

## What the demo shows

Recorded from the real app with two fresh accounts:

1. Guest home, then registration of "Maria Silva"
2. Signed-in feed and the simulated wallet connection
3. Trending posts and a post with paid comments
4. Maria publishes a free post
5. A second account, "Lucas Rocha", comments with a simulated 1.5 SOL; 0.6 SOL (40%) goes to Maria's Piñata
6. Lucas's dashboard, then Maria signs back in
7. Maria's Piñata reaches 60%, she bursts it, and Lucas receives 0.6 SOL
8. Persistence and the Solana roadmap

## Regenerate

Use the project virtual environment (Python 3.11):

```bash
python -m pip install -r videos/requirements-video.txt
```

1. Start the app from `pinata_front` (`npm run build && npm run start`).
2. Capture the screens (uses the installed Microsoft Edge; pass `--channel chrome` for Chrome):

   ```bash
   python videos/capture_app.py --url http://localhost:3000
   ```

3. Render both videos in both languages:

   ```bash
   python videos/generate_demo_videos.py            # pitch and demo
   python videos/generate_demo_videos.py demo       # only one video
   python videos/generate_demo_videos.py --srt-only # narration timing and .srt files only
   ```

To change the narration or translations, edit `video_content.py` and render again. Each sentence is synthesized separately with Edge TTS (`en-US-AriaNeural` for English, `pt-BR-FranciscaNeural` for Portuguese), and its audio length sets the subtitle timing, so each language has its own timeline and subtitles stay in sync with the voice. The renderer checks that the pitch is between 2 and 3 minutes and the demo is at most 3 minutes, then verifies the output duration, audio track, and frames. Edge TTS needs an internet connection.
