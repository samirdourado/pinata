# Video Assets

This folder contains the Pinata pitch and product walkthrough, along with their source scripts and subtitles.

- `pitch-video.mp4`: 2:30 pitch with English narration and burned-in captions
- `demo-video.mp4`: 2:10 product walkthrough with English narration and burned-in captions
- `pitch-video-script.md` and `pitch-video-subtitles.srt`
- `demo-video-script.md` and `demo-video-subtitles.srt`
- `generate_demo_videos.py`: reproducible video renderer
- `rendered/`: browser captures, narration audio, and review contact sheet

## Regenerate

Use Python 3.11 or newer. Install the video dependencies:

```bash
python -m pip install -r requirements-video.txt
```

Start the Next.js app in `pinata_front` and refresh the page captures in `rendered/` if the UI changes. Then run:

```bash
python videos/generate_demo_videos.py
```

The renderer uses the supplied SRT timings, adds US English neural narration, and exports 1920x1080 H.264/AAC at 30 fps. It checks the output duration and samples the opening, middle, and closing frames before reporting success. Edge TTS requires an internet connection.

The browser captures used for these exports were taken without submitting posts or comments, changing votes, connecting a wallet, or triggering a Piñata action.
