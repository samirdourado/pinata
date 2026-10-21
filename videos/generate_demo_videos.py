"""Render the Pinata pitch and demo videos with English and pt-BR subtitles.

Each video is exported in two languages, English (required by Colosseum) and Brazilian
Portuguese. Every version is narrated in its own language and has burned-in subtitles in
that same language, plus a matching .srt file that can be uploaded to YouTube/Loom.

Content lives in video_content.py; app captures come from capture_app.py.
"""

from __future__ import annotations

import argparse
import asyncio
from dataclasses import dataclass
from pathlib import Path

import edge_tts
import numpy as np
from moviepy import AudioFileClip, CompositeAudioClip, ImageClip, VideoFileClip, concatenate_videoclips
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

from video_content import DEMO, PITCH, TITLES, Scene

ROOT = Path(__file__).resolve().parent
RENDERED = ROOT / "rendered"
AUDIO = RENDERED / "audio"
WIDTH, HEIGHT, FPS = 1920, 1080, 30
VOICES = {
    "en": ("en-US-AriaNeural", "+4%"),
    "pt-BR": ("pt-BR-FranciscaNeural", "+6%"),
}
INTRO_SECONDS = 5.0
OUTRO_SECONDS = 6.0
GAP_SECONDS = 0.45
SCREEN_BOX = (240, 28, 1680, 838)  # 1440x810 app window above the caption band
BACKGROUND = (14, 18, 35)
PINK = (230, 77, 168)
LANGUAGES = ("en", "pt-BR")


@dataclass(frozen=True)
class Line:
    scene: Scene
    en: str
    pt: str
    audio: Path
    start: float
    end: float

    def text(self, language: str) -> str:
        return self.en if language == "en" else self.pt


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = (
        ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"]
        if bold
        else ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"]
    )
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size)


def capture(name: str) -> Image.Image:
    path = RENDERED / name
    if not path.is_file():
        raise FileNotFoundError(f"Missing app capture: {path}. Run capture_app.py first.")
    with Image.open(path) as source:
        return source.convert("RGB")


def screen_image(scene: Scene, size: tuple[int, int]) -> Image.Image:
    image = capture(scene.screen)
    if scene.crop:
        left, top, width = scene.crop
        image = image.crop((left, top, left + width, top + round(width * 9 / 16)))
    return ImageOps.fit(image, size, method=Image.Resampling.LANCZOS)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, selected_font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines: list[str] = []
    line = ""
    for word in text.split():
        candidate = f"{line} {word}".strip()
        if line and draw.textlength(candidate, font=selected_font) > max_width:
            lines.append(line)
            line = word
        else:
            line = candidate
    if line:
        lines.append(line)
    return lines


def caption_frame(line: Line, language: str, progress: float) -> Image.Image:
    left, top, right, bottom = SCREEN_BOX
    frame = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    shadow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((left - 4, top + 6, right + 4, bottom + 10), radius=22, fill=(0, 0, 0, 150))
    frame.paste(shadow.filter(ImageFilter.GaussianBlur(12)), (0, 0), shadow.filter(ImageFilter.GaussianBlur(12)))

    screen = screen_image(line.scene, (right - left, bottom - top))
    mask = Image.new("L", screen.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *screen.size), radius=18, fill=255)
    frame.paste(screen, (left, top), mask)

    draw = ImageDraw.Draw(frame)
    chapter = line.scene.chapter_en if language == "en" else line.scene.chapter_pt
    draw.text((left, 856), f"PINATA  /  {chapter.upper()}", font=font(22, True), fill=(255, 140, 200))

    caption_font = font(36, True)
    lines = wrap_text(draw, line.text(language), caption_font, right - left)
    if len(lines) > 3:
        caption_font = font(31, True)
        lines = wrap_text(draw, line.text(language), caption_font, right - left)
    line_height = round(caption_font.size * 1.3)
    text_y = 896 + (3 - len(lines[:3])) * line_height // 2
    for text in lines[:3]:
        width = draw.textlength(text, font=caption_font)
        draw.text(((WIDTH - width) / 2, text_y), text, font=caption_font, fill=(255, 255, 255))
        text_y += line_height

    draw.rounded_rectangle((left, 1052, right, 1060), radius=4, fill=(60, 66, 92))
    draw.rounded_rectangle((left, 1052, left + max(8, int((right - left) * progress)), 1060), radius=4, fill=PINK)
    return frame


def title_frame(background: str, eyebrow: str, title: str, subtitle: str) -> Image.Image:
    image = ImageOps.fit(capture(background), (WIDTH, HEIGHT)).filter(ImageFilter.GaussianBlur(6)).convert("RGBA")
    image = Image.alpha_composite(image, Image.new("RGBA", image.size, (9, 14, 31, 200)))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((160, 270, 1760, 810), radius=36, fill=(18, 23, 43, 235), outline=(255, 255, 255, 50), width=2)
    logo_path = ROOT.parent / "pinata_front" / "public" / "pinataA.png"
    if logo_path.is_file():
        with Image.open(logo_path) as logo:
            logo = logo.convert("RGBA")
            logo.thumbnail((150, 150))
            image.alpha_composite(logo, (1560 - logo.width // 2, 330))
    draw.text((240, 345), eyebrow.upper(), font=font(28, True), fill=(255, 140, 200, 255))
    draw.text((235, 400), title, font=font(84, True), fill=(255, 255, 255, 255))
    for index, text in enumerate(wrap_text(draw, subtitle, font(38), 1300)[:3]):
        draw.text((240, 545 + index * 56), text, font=font(38), fill=(222, 227, 240, 255))
    draw.rounded_rectangle((240, 740, 1680, 748), radius=4, fill=(60, 66, 92, 255))
    draw.rounded_rectangle((240, 740, 720, 748), radius=4, fill=(*PINK, 255))
    return image.convert("RGB")


async def synthesize(text: str, language: str, target: Path, semaphore: asyncio.Semaphore) -> Path:
    voice, rate = VOICES[language]
    async with semaphore:
        await edge_tts.Communicate(text, voice, rate=rate).save(str(target))
    return target


def build_timeline(kind: str, scenes: list[Scene], language: str) -> list[Line]:
    audio_dir = AUDIO / kind / language
    audio_dir.mkdir(parents=True, exist_ok=True)
    for stale in audio_dir.glob("*.mp3"):
        stale.unlink()
    pairs = [(scene, en, pt) for scene in scenes for en, pt in scene.lines]

    async def run() -> list[Path]:
        semaphore = asyncio.Semaphore(4)
        return await asyncio.gather(
            *(
                synthesize(en if language == "en" else pt, language, audio_dir / f"line_{index:03d}.mp3", semaphore)
                for index, (_, en, pt) in enumerate(pairs)
            )
        )

    paths = asyncio.run(run())
    timeline: list[Line] = []
    cursor = 0.0
    for (scene, en, pt), path in zip(pairs, paths, strict=True):
        with AudioFileClip(str(path)) as audio:
            duration = audio.duration
        timeline.append(Line(scene, en, pt, path, cursor, cursor + duration))
        cursor += duration + GAP_SECONDS
    return timeline


def srt_time(seconds: float) -> str:
    milliseconds = round(seconds * 1000)
    hours, milliseconds = divmod(milliseconds, 3_600_000)
    minutes, milliseconds = divmod(milliseconds, 60_000)
    secs, milliseconds = divmod(milliseconds, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{milliseconds:03d}"


def write_srt(timeline: list[Line], language: str, path: Path) -> None:
    blocks = []
    for index, line in enumerate(timeline, start=1):
        start = INTRO_SECONDS + line.start
        end = INTRO_SECONDS + line.end + GAP_SECONDS * 0.8
        blocks.append(f"{index}\n{srt_time(start)} --> {srt_time(end)}\n{line.text(language)}\n")
    path.write_text("\n".join(blocks), encoding="utf-8")


def render(kind: str, timeline: list[Line], language: str, output: Path) -> None:
    eyebrow, title, subtitle = TITLES[kind][language]
    outro = TITLES["outro"][language]
    total = timeline[-1].end + GAP_SECONDS
    clips = [ImageClip(np.asarray(title_frame("home.png", eyebrow, title, subtitle))).with_duration(INTRO_SECONDS)]
    for index, line in enumerate(timeline):
        next_start = timeline[index + 1].start if index + 1 < len(timeline) else total
        frame = caption_frame(line, language, line.end / total)
        clips.append(ImageClip(np.asarray(frame)).with_duration(next_start - line.start))
    clips.append(ImageClip(np.asarray(title_frame("home.png", *outro))).with_duration(OUTRO_SECONDS))
    video = concatenate_videoclips(clips, method="chain")

    audio_clips = [AudioFileClip(str(line.audio)) for line in timeline]
    narration = CompositeAudioClip(
        [clip.with_start(INTRO_SECONDS + line.start) for clip, line in zip(audio_clips, timeline, strict=True)]
    ).with_duration(video.duration)
    video = video.with_audio(narration)
    video.write_videofile(
        str(output), fps=FPS, codec="libx264", audio_codec="aac", bitrate="6000k", preset="medium", logger=None
    )
    video.close()
    for clip in [*clips, *audio_clips]:
        clip.close()

    expected = INTRO_SECONDS + total + OUTRO_SECONDS
    with VideoFileClip(str(output)) as check:
        if abs(check.duration - expected) > 0.3:
            raise RuntimeError(f"{output.name}: expected {expected:.2f}s, got {check.duration:.2f}s")
        if check.audio is None:
            raise RuntimeError(f"{output.name}: narration audio is missing")
        for timestamp in np.arange(0.5, check.duration, 2.0):
            if float(check.get_frame(timestamp).mean()) < 18:
                raise RuntimeError(f"{output.name}: near-black frame at {timestamp:.1f}s")
    print(f"{output.name}: {check.duration:.1f}s, {WIDTH}x{HEIGHT}, {FPS} fps, H.264/AAC")


def check_duration(kind: str, language: str, timeline: list[Line]) -> None:
    duration = INTRO_SECONDS + timeline[-1].end + GAP_SECONDS + OUTRO_SECONDS
    limits = (120, 180) if kind == "pitch" else (60, 180)
    print(f"{kind} ({language}): narration plan {duration:.1f}s")
    if not limits[0] <= duration <= limits[1]:
        raise RuntimeError(f"{kind} ({language}): {duration:.1f}s is outside {limits[0]}-{limits[1]}s")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("videos", nargs="*", help="pitch and/or demo (default: both)")
    parser.add_argument("--srt-only", action="store_true", help="Synthesize narration and write subtitles without rendering MP4s")
    args = parser.parse_args()

    plans = {"pitch": PITCH, "demo": DEMO}
    unknown = set(args.videos) - plans.keys()
    if unknown:
        parser.error(f"unknown video: {', '.join(sorted(unknown))}")
    for kind in args.videos or ["pitch", "demo"]:
        for language in LANGUAGES:
            timeline = build_timeline(kind, plans[kind], language)
            check_duration(kind, language, timeline)
            write_srt(timeline, language, ROOT / f"{kind}-video-{language}.srt")
            if not args.srt_only:
                render(kind, timeline, language, ROOT / f"{kind}-video-{language}.mp4")


if __name__ == "__main__":
    main()
