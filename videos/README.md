# Video Assets

Pitch and product demo for Pinata. The published videos are on YouTube, narrated in English with English subtitles:

| Video | Link |
| --- | --- |
| Pitch (~2:45) | https://www.youtube.com/watch?v=ev8Xz9rm4Nk |
| Demo (~2:45) | https://www.youtube.com/watch?v=Un_GRtISO6M |

The videos were recorded before the real wallet connection. They state that the wallet connection and SOL payments are simulated, which was true at the time; the app now connects a real Solana wallet on Devnet.

The video files are not versioned (`*.mp4` and `rendered/` are git-ignored). This folder keeps what is needed to recreate them:

| File | Content |
| --- | --- |
| `pitch-video-script.md`, `demo-video-script.md` | Bilingual scripts (English and Brazilian Portuguese) |
| `*-video-en.srt` | English subtitles, the same ones shown in the YouTube videos |
| `*-video-pt-BR.srt` | Brazilian Portuguese subtitles, timed for the Portuguese narration |
| `video_content.py` | Single source for narration, translations, and the screen shown in each scene |
| `capture_app.py` | Playwright script that drives the app and saves screenshots to `rendered/` |
| `generate_demo_videos.py` | Narration, subtitles, and MP4 renderer |

The renderer can also produce Portuguese versions (`*-video-pt-BR.mp4`), narrated and subtitled in Portuguese. They are not published.

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

1. Start the app: `docker compose up --build` from the repository root, or `npm run build && npm run start` from `pinata_front`.
2. Capture the screens (uses the installed Microsoft Edge; pass `--channel chrome` for Chrome):

   ```bash
   python videos/capture_app.py --url http://localhost:3000
   ```

3. Render both videos in both languages (output: `{pitch,demo}-video-{en,pt-BR}.mp4` and `.srt` in this folder):

   ```bash
   python videos/generate_demo_videos.py            # pitch and demo
   python videos/generate_demo_videos.py demo       # only one video
   python videos/generate_demo_videos.py --srt-only # narration timing and .srt files only
   ```

To change the narration or translations, edit `video_content.py` and render again. Each sentence is synthesized separately with Edge TTS (`en-US-AriaNeural` for English, `pt-BR-FranciscaNeural` for Portuguese), and its audio length sets the subtitle timing, so each language has its own timeline and subtitles stay in sync with the voice. The renderer checks that the pitch is between 2 and 3 minutes and the demo is at most 3 minutes, then verifies the output duration, audio track, and frames. Edge TTS needs an internet connection.
