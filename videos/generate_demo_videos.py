from __future__ import annotations

import asyncio
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path

import edge_tts
import numpy as np
from moviepy import AudioFileClip, CompositeAudioClip, ImageClip, VideoFileClip, concatenate_videoclips
from PIL import Image, ImageDraw, ImageFont, ImageOps
from imageio_ffmpeg import get_ffmpeg_exe

ROOT = Path(__file__).resolve().parent
RENDERED = ROOT / "rendered"
AUDIO = RENDERED / "audio"
WIDTH, HEIGHT, FPS = 1920, 1080, 30
VOICE = "en-US-AriaNeural"
INTRO_SECONDS = 6
OUTRO_SECONDS = 6
PITCH_INTRO_SECONDS = 8
PITCH_OUTRO_SECONDS = 12


@dataclass(frozen=True)
class Cue:
    start: float
    end: float
    text: str


PITCH_SCREENS = [
    "home.png", "home.png", "trending.png", "trending.png", "trending.png",
    "home.png", "home.png", "post-detail.png", "post-detail.png", "home.png",
    "creator.png", "creator.png", "profile.png", "home.png", "profile.png",
    "home.png", "home.png",
]

DEMO_SCREENS = [
    "home.png", "home.png", "trending.png", "post-detail.png", "post-detail.png",
    "home.png", "creator.png", "profile.png", "creator.png", "creator.png",
    "home.png", "home.png",
]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    font_path = "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"
    if not Path(font_path).exists():
        font_path = "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"
    return ImageFont.truetype(font_path, size) if Path(font_path).exists() else ImageFont.load_default()


def to_seconds(value: str) -> float:
    hours, minutes, rest = value.split(":")
    seconds, milliseconds = rest.split(",")
    return int(hours) * 3600 + int(minutes) * 60 + int(seconds) + int(milliseconds) / 1000


def read_srt(path: Path) -> list[Cue]:
    content = path.read_text(encoding="utf-8-sig").strip()
    cues: list[Cue] = []
    for block in re.split(r"\r?\n\s*\r?\n", content):
        lines = block.splitlines()
        time_line = next((line for line in lines if "-->" in line), None)
        if time_line is None:
            continue
        start, end = (part.strip() for part in time_line.split("-->"))
        text_index = lines.index(time_line) + 1
        cues.append(Cue(to_seconds(start), to_seconds(end), " ".join(lines[text_index:]).strip()))
    if not cues:
        raise ValueError(f"No subtitles found in {path}")
    return cues


def app_frame(name: str) -> Image.Image:
    path = RENDERED / name
    if not path.is_file():
        raise FileNotFoundError(f"Missing app capture: {path}. Capture the app pages first.")
    with Image.open(path) as source:
        screenshot = source.convert("RGB")
        if screenshot.width >= 1600 and screenshot.height >= 1000:
            screenshot = screenshot.crop((0, 0, min(929, screenshot.width), min(590, screenshot.height)))
        return ImageOps.fit(screenshot, (WIDTH, HEIGHT), method=Image.Resampling.LANCZOS)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, selected_font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    line = ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if line and draw.textlength(candidate, font=selected_font) > max_width:
            lines.append(line)
            line = word
        else:
            line = candidate
    if line:
        lines.append(line)
    return lines


def caption_frame(screen: str, cue: Cue, label: str, progress: float) -> Image.Image:
    image = app_frame(screen).convert("RGBA")
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rounded_rectangle((72, 48, 600, 112), radius=20, fill=(23, 28, 48, 225))
    draw.text((104, 63), f"PINATA  /  {label.upper()}", font=font(25, True), fill=(255, 255, 255, 255))
    draw.rectangle((0, 790, WIDTH, HEIGHT), fill=(14, 18, 35, 232))

    caption_font = font(36, True)
    lines = wrap_text(draw, cue.text, caption_font, WIDTH - 250)
    if len(lines) > 3:
        caption_font = font(31, True)
        lines = wrap_text(draw, cue.text, caption_font, WIDTH - 250)
    line_height = 48
    text_y = 838 + max(0, (3 - len(lines)) * 16)
    for line in lines[:3]:
        draw.text((125, text_y), line, font=caption_font, fill=(255, 255, 255, 255))
        text_y += line_height

    draw.rounded_rectangle((120, 1040, WIDTH - 120, 1050), radius=5, fill=(93, 101, 130, 220))
    draw.rounded_rectangle((120, 1040, 120 + int((WIDTH - 240) * progress), 1050), radius=5, fill=(230, 77, 168, 255))
    return Image.alpha_composite(image, overlay).convert("RGB")


def title_frame(screen: str, title: str, subtitle: str, eyebrow: str) -> Image.Image:
    image = app_frame(screen).convert("RGBA")
    overlay = Image.new("RGBA", image.size, (9, 14, 31, 166))
    image = Image.alpha_composite(image, overlay)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((120, 260, 1800, 820), radius=36, fill=(18, 23, 43, 218), outline=(255, 255, 255, 50), width=2)
    draw.text((205, 345), eyebrow.upper(), font=font(28, True), fill=(255, 119, 190, 255))
    draw.text((200, 420), title, font=font(84, True), fill=(255, 255, 255, 255))
    subtitle_lines = wrap_text(draw, subtitle, font(38), 1480)
    for index, line in enumerate(subtitle_lines[:3]):
        draw.text((205, 555 + index * 58), line, font=font(38), fill=(222, 227, 240, 255))
    draw.rounded_rectangle((205, 735, 1715, 744), radius=5, fill=(93, 101, 130, 220))
    draw.rounded_rectangle((205, 735, 690, 744), radius=5, fill=(230, 77, 168, 255))
    return image.convert("RGB")


def chapter_for(kind: str, seconds: float) -> str:
    if kind == "pitch":
        if seconds < 14:
            return "The problem"
        if seconds < 39:
            return "The solution"
        if seconds < 82:
            return "Piñata rewards"
        if seconds < 110:
            return "MVP and roadmap"
        return "The vision"
    if seconds < 24.5:
        return "Explore the platform"
    if seconds < 53.5:
        return "Meaningful comments"
    if seconds < 95:
        return "Creator Piñata"
    return "Built for Solana"


def estimated_rate(text: str, duration: float) -> int:
    words = len(text.split())
    words_per_minute = words * 60 / max(duration, 0.5)
    return max(-10, min(35, round((words_per_minute / 155 - 1) * 100)))


async def synthesize_cue(cue: Cue, index: int, audio_dir: Path, semaphore: asyncio.Semaphore) -> Path:
    target = audio_dir / f"voice_{index:03d}.mp3"
    if target.is_file() and target.stat().st_size > 1024:
        return target
    async with semaphore:
        request = edge_tts.Communicate(
            cue.text,
            VOICE,
            rate=f"{estimated_rate(cue.text, cue.end - cue.start):+d}%",
        )
        await request.save(str(target))
    return target


async def synthesize_all(cues: list[Cue], audio_dir: Path) -> list[Path]:
    audio_dir.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(4)
    return await asyncio.gather(*(synthesize_cue(cue, index, audio_dir, semaphore) for index, cue in enumerate(cues)))


def narration_clips(cues: list[Cue], audio_paths: list[Path], offset: float) -> tuple[list[AudioFileClip], CompositeAudioClip]:
    clips: list[AudioFileClip] = []
    positioned = []
    for cue, path in zip(cues, audio_paths, strict=True):
        audio = AudioFileClip(str(path))
        available = cue.end - cue.start
        if audio.duration > available:
            factor = audio.duration / available
            accelerated_path = path.with_name(f"{path.stem}_fast.mp3")
            filters = []
            while factor > 2:
                filters.append("atempo=2")
                factor /= 2
            filters.append(f"atempo={factor:.4f}")
            audio.close()
            subprocess.run(
                [get_ffmpeg_exe(), "-y", "-i", str(path), "-filter:a", ",".join(filters), "-vn", str(accelerated_path)],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            audio = AudioFileClip(str(accelerated_path))
        if audio.duration > available:
            audio = audio.subclipped(0, available)
        clips.append(audio)
        positioned.append(audio.with_start(offset + cue.start))
    return clips, CompositeAudioClip(positioned)


def make_video(kind: str, subtitle_path: Path, output_path: Path, screen_names: list[str]) -> None:
    cues = read_srt(subtitle_path)
    if len(cues) != len(screen_names):
        raise ValueError(f"{kind}: expected {len(screen_names)} scene captures, found {len(cues)} subtitle cues")

    is_pitch = kind == "pitch"
    intro_seconds = PITCH_INTRO_SECONDS if is_pitch else INTRO_SECONDS
    outro_seconds = PITCH_OUTRO_SECONDS if is_pitch else OUTRO_SECONDS
    intro_image = title_frame(
        "home.png",
        "Pinata",
        "A social protocol that rewards meaningful conversations.",
        "The pitch" if is_pitch else "Product walkthrough",
    )
    outro_image = title_frame(
        "home.png",
        "Built for better conversations",
        "A working MVP today. An on-chain SocialFi future on Solana.",
        "Pinata  /  Solana",
    )

    clips = [ImageClip(np.asarray(intro_image)).with_duration(intro_seconds)]
    total_cue_time = max(cue.end for cue in cues)
    for index, (cue, screen) in enumerate(zip(cues, screen_names, strict=True)):
        frame = caption_frame(screen, cue, chapter_for(kind, cue.start), cue.end / total_cue_time)
        clips.append(ImageClip(np.asarray(frame)).with_duration(cue.end - cue.start))
    clips.append(ImageClip(np.asarray(outro_image)).with_duration(outro_seconds))

    video = concatenate_videoclips(clips, method="chain")
    audio_dir = AUDIO / kind
    audio_paths = asyncio.run(synthesize_all(cues, audio_dir))
    audio_clips, narration = narration_clips(cues, audio_paths, intro_seconds)
    video = video.with_audio(narration.with_duration(video.duration))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    video.write_videofile(
        str(output_path),
        fps=FPS,
        codec="libx264",
        audio_codec="aac",
        bitrate="6000k",
        preset="medium",
        logger=None,
    )

    expected_duration = intro_seconds + total_cue_time + outro_seconds
    with VideoFileClip(str(output_path)) as check:
        if abs(check.duration - expected_duration) > 0.25:
            raise RuntimeError(f"{output_path.name}: expected {expected_duration:.2f}s, got {check.duration:.2f}s")
        if not 120 <= check.duration <= 180:
            raise RuntimeError(f"{output_path.name}: duration {check.duration:.2f}s is outside the 2–3 minute requirement")
        if check.audio is None or abs(check.audio.duration - check.duration) > 0.25:
            raise RuntimeError(f"{output_path.name}: narration audio is missing or has the wrong duration")
        for timestamp in np.arange(0.25, check.duration, 0.5):
            if float(check.get_frame(timestamp).mean()) < 18:
                raise RuntimeError(f"{output_path.name}: a near-black frame was found at {timestamp:.2f}s")

    video.close()
    narration.close()
    for clip in clips:
        clip.close()
    for clip in audio_clips:
        clip.close()
    print(f"{output_path.name}: {expected_duration:.1f}s, 1920x1080, {FPS} fps, H.264/AAC")


def main() -> None:
    make_video("pitch", ROOT / "pitch-video-subtitles.srt", ROOT / "pitch-video.mp4", PITCH_SCREENS)
    make_video("demo", ROOT / "demo-video-subtitles.srt", ROOT / "demo-video.mp4", DEMO_SCREENS)


if __name__ == "__main__":
    main()