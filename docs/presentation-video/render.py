"""Deterministic Coliclic film. No network, customer data or application changes."""
from __future__ import annotations

import argparse
from functools import lru_cache
import json
import math
from pathlib import Path
import subprocess
import wave

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]
FILM = json.loads((ROOT / "film.json").read_text())
W, H = FILM["width"], FILM["height"]
NAVY, ORANGE, CREAM = "#023047", "#FB8500", "#F8F5EF"
MUTED, WHITE = "#70838C", "#FFFFFF"
FONT_PATH = Path("/System/Library/Fonts/Avenir Next.ttc")


def ease(t):
    return 1 - (1 - min(1, max(0, t))) ** 3


def scene_at(t):
    if not 0 <= t < FILM["duration"]:
        raise ValueError("Time must lie within the film")
    return next(s for s in FILM["scenes"] if s["start"] <= t < s["end"])


@lru_cache(maxsize=64)
def font(size, bold=False):
    return ImageFont.truetype(str(FONT_PATH), size, index=0 if bold else 7)


def text(d, xy, value, size=32, color=NAVY, bold=False):
    for i, line in enumerate(value.splitlines()):
        x, y = xy[0], xy[1] + i * (size + 16)
        for j, part in enumerate(line.split("→")):
            if j:
                length = size * .85
                yy = y + size * .55
                stroke = max(2, round(size / 12))
                d.line([(x, yy), (x + length, yy)], fill=color, width=stroke)
                d.line([(x + length * .7, yy - size * .2), (x + length, yy), (x + length * .7, yy + size * .2)], fill=color, width=stroke)
                x += length + size * .12
            d.text((x, y), part, font=font(size, bold), fill=color, anchor="lt")
            x += d.textlength(part, font=font(size, bold))


def brand(d, x=120, y=80, size=38, light=False):
    text(d, (x, y), "Coli", size, WHITE if light else NAVY, True)
    offset = d.textlength("Coli", font=font(size, True))
    text(d, (x + offset, y), "clic", size, ORANGE, True)


def pill(d, box, label, fill=ORANGE, color=NAVY, size=24):
    d.rounded_rectangle(box, radius=(box[3] - box[1]) / 2, fill=fill)
    tw = d.textlength(label, font=font(size, True))
    text(d, ((box[0] + box[2] - tw) / 2, (box[1] + box[3] - size) / 2 - 1), label, size, color, True)


def arrow(d, x, y, color=ORANGE, scale=1):
    d.line([(x, y), (x + 60 * scale, y)], fill=color, width=4)
    d.line([(x + 44 * scale, y - 15 * scale), (x + 60 * scale, y), (x + 44 * scale, y + 15 * scale)], fill=color, width=4)


def parcel(d, cx, cy, size=180):
    s = size / 2
    top, left, mid, right = (cx, cy - s), (cx - s, cy - s * .5), (cx, cy), (cx + s, cy - s * .5)
    d.polygon([top, left, mid, right], fill="#FFB24D")
    d.polygon([left, mid, (cx, cy + s), (cx - s, cy + s * .5)], fill=ORANGE)
    d.polygon([mid, right, (cx + s, cy + s * .5), (cx, cy + s)], fill="#D66A00")
    d.line([(cx - s * .5, cy - s * .75), (cx + s * .5, cy - s * .25), (cx + s * .5, cy + s * .5)], fill="#FFE4B6", width=max(3, int(size / 12)))


def plane(d, x, y, angle=0, size=45):
    points = [(1, 0), (-.85, -.65), (-.35, 0), (-.85, .65)]
    co, si = math.cos(angle), math.sin(angle)
    p = [(x + size * (px * co - py * si), y + size * (px * si + py * co)) for px, py in points]
    d.polygon(p, fill=ORANGE)


@lru_cache(maxsize=2)
def background(dark=False):
    a, b = ((2, 33, 49), (4, 60, 79)) if dark else ((251, 249, 245), (241, 238, 230))
    yy, xx = np.mgrid[0:H, 0:W]
    g = np.clip(.25 + .5 * xx / W + .2 * yy / H, 0, 1)[..., None]
    pixels = (np.array(a) * (1 - g) + np.array(b) * g).astype(np.uint8)
    im = Image.fromarray(pixels)
    d = ImageDraw.Draw(im)
    line = "#124255" if dark else "#E6E3DC"
    for r in (360, 500, 660):
        d.ellipse((1450 - r, 510 - r, 1450 + r, 510 + r), outline=line, width=1)
    return im


@lru_cache(maxsize=1)
def photo():
    return Image.open(REPO / "front-office/public/images/landing-handoff.webp").convert("RGB")


def photo_circle(im, cx, cy, diameter, zoom=1):
    cropped = ImageOps.fit(photo(), (int(diameter * zoom), int(diameter * zoom)), centering=(.5, .45))
    off = (cropped.width - diameter) // 2
    cropped = cropped.crop((off, off, off + diameter, off + diameter))
    mask = Image.new("L", (diameter, diameter))
    ImageDraw.Draw(mask).ellipse((0, 0, diameter - 1, diameter - 1), fill=255)
    im.paste(cropped, (int(cx - diameter / 2), int(cy - diameter / 2)), mask)


def headline(d, scene, local, dark=False, size=86):
    fg = WHITE if dark else NAVY
    text(d, (120, 268), scene["eyebrow"], 22, ORANGE, True)
    for n, line in enumerate(scene["lines"]):
        shift = 45 * (1 - ease((local - .12 * n) / 1.1))
        text(d, (120, 350 + n * (size + 24) + shift), line, size, ORANGE if n == 1 else fg, True)
    text(d, (124, 350 + 2 * (size + 24) + 48), scene["body"], 29, "#BECFD3" if dark else MUTED)


def chrome(im, scene, local, dark):
    d = ImageDraw.Draw(im)
    brand(d, light=dark)
    text(d, (1480, 90), "LES VOYAGES CRÉENT DES LIENS", 17, "#9AB4BE" if dark else MUTED)
    d.line((120, 973, 1800, 973), fill="#315565" if dark else "#DBDED8", width=1)
    n = FILM["scenes"].index(scene)
    for k in range(6):
        x = 120 + k * 64
        d.rounded_rectangle((x, 1007, x + 44, 1011), radius=2, fill=ORANGE if k <= n else ("#315565" if dark else "#D3DAD7"))
    text(d, (1490, 998), "EXPÉDITEURS + VOYAGEURS", 18, "#9AB4BE" if dark else MUTED)


def ui_card(d, box, dark=False):
    x, y, x2, y2 = box
    d.rounded_rectangle((x + 10, y + 18, x2 + 10, y2 + 18), 32, fill="#012738" if dark else "#E1E4DE")
    d.rounded_rectangle(box, 30, fill=WHITE)


def route(d, local, dark=True, x=1080, y=385):
    fg = WHITE if dark else NAVY
    # A real geographic example; no live trip availability is implied.
    p = ease((local - .7) / 3.4)
    pts = []
    for i in range(121):
        u = i / 120
        pts.append((x + u * 590, y + 240 * u - 165 * math.sin(math.pi * u)))
    for i in range(0, 120, 5):
        d.line(pts[i:i + 3], fill="#527581" if dark else "#BDCBCB", width=3)
    count = max(1, int(p * 120))
    d.line(pts[:count + 1], fill=ORANGE, width=5)
    px, py = pts[count]
    theta = math.atan2(240 - 165 * math.pi * math.cos(math.pi * p), 590)
    plane(d, px, py, theta, 32)
    for cx, cy in [pts[0], pts[-1]]:
        d.ellipse((cx - 9, cy - 9, cx + 9, cy + 9), fill=ORANGE)
        d.ellipse((cx - 21, cy - 21, cx + 21, cy + 21), outline=ORANGE, width=2)
    text(d, (x - 40, y + 45), "Paris", 43, fg, True)
    text(d, (x - 40, y + 105), "FRANCE", 18, ORANGE)
    text(d, (x + 460, y + 290), "Abidjan", 43, fg, True)
    text(d, (x + 460, y + 350), "CÔTE D’IVOIRE", 18, ORANGE)
    text(d, (x + 95, 856), "UN TRAJET, DE NOUVELLES POSSIBILITÉS", 18, "#9AB4BE" if dark else MUTED)


def render_scene(scene, t):
    local = t - scene["start"]
    sid = scene["id"]
    dark = sid in ("opening", "connection", "closing")
    im = background(dark).copy()
    d = ImageDraw.Draw(im)
    drift = 22 * (1 - ease(local / 1.2))
    if sid == "opening":
        headline(d, scene, local, True, 112)
        photo_circle(im, 1430, 514 + drift, 620, 1.04 + .045 * min(local / 7, 1))
        d = ImageDraw.Draw(im)
        d.arc((1085, 169, 1775, 859), -80, 180, fill=ORANGE, width=3)
        pill(d, (1160, 767, 1640, 837), "Un voyage. Un colis. Un lien.", WHITE, NAVY, 23)
        parcel(d, 1700, 330 + math.sin(local * .9) * 9, 110)
    elif sid == "connection":
        headline(d, scene, local, True, 76)
        route(d, local)
        pill(d, (125, 771, 573, 839), "La rencontre fait le chemin.", "#14485A", WHITE, 22)
    elif sid == "search":
        headline(d, scene, local, False, 86)
        x, y = 1040, int(235 + drift)
        ui_card(d, (x, y, 1780, y + 619))
        text(d, (x + 45, y + 38), "Trouver un voyageur", 30, NAVY, True)
        d.rounded_rectangle((x + 36, y + 102, 1744, y + 217), 15, fill=CREAM)
        text(d, (x + 60, y + 123), "DÉPART", 16, MUTED)
        text(d, (x + 60, y + 157), "Paris", 28, NAVY, True)
        arrow(d, x + 290, y + 165)
        text(d, (x + 440, y + 123), "DESTINATION", 16, MUTED)
        text(d, (x + 440, y + 157), "Abidjan", 28, NAVY, True)
        pill(d, (x + 36, y + 240, 1744, y + 308), "Rechercher un trajet    →", ORANGE, NAVY, 23)
        reveal = ease((local - 1.3) / .8)
        yy = y + 345 + int(35 * (1 - reveal))
        d.rounded_rectangle((x + 36, yy, 1744, yy + 168), 15, outline="#DFE5E6", width=2)
        text(d, (x + 65, yy + 26), "Paris  →  Abidjan", 28, NAVY, True)
        text(d, (x + 65, yy + 76), "Profil voyageur  ·  Avis disponibles", 20, MUTED)
        text(d, (x + 65, yy + 119), "Consulter le trajet", 20, "#A75400", True)
        arrow(d, 1620, yy + 132, NAVY, .65)
        text(d, (x + 40, y + 559), "PARCOURS ILLUSTRÉ · TRAJET D’EXEMPLE", 15, MUTED)
    elif sid == "request":
        headline(d, scene, local, False, 84)
        x, y = 1040, int(232 + drift)
        ui_card(d, (x, y, 1780, y + 622))
        parcel(d, x + 92, y + 95, 67)
        text(d, (x + 162, y + 50), "Votre demande d’envoi", 28, NAVY, True)
        text(d, (x + 162, y + 96), "Paris  →  Abidjan", 22, MUTED)
        text(d, (x + 48, y + 176), "DESCRIPTION DU COLIS", 16, MUTED, True)
        d.rounded_rectangle((x + 38, y + 218, 1742, y + 322), 14, fill=CREAM)
        text(d, (x + 63, y + 250), "Des affaires pour mes proches.", 25, NAVY)
        pill(d, (x + 38, y + 348, 1742, y + 418), "Envoyer ma demande    →", NAVY, WHITE, 23)
        if local >= 2:
            yy = y + 465 + int(24 * (1 - ease((local - 2) / .8)))
            d.rounded_rectangle((x + 38, yy, 1742, yy + 81), 16, fill="#EAF4ED")
            text(d, (x + 65, yy + 24), "Demande envoyée au voyageur", 24, "#285C44", True)
        text(d, (x + 40, y + 574), "INTERFACE DE DÉMONSTRATION", 15, MUTED)
    elif sid == "travel":
        headline(d, scene, local, False, 76)
        x, y = 1080, int(240 + drift)
        ui_card(d, (x, y, 1770, y + 600))
        text(d, (x + 46, y + 40), "Votre prochain départ", 29, NAVY, True)
        for i, (label, value) in enumerate([("VOTRE TRAJET", "Paris → Abidjan"), ("VOTRE ESPACE", "Kilos disponibles"), ("VOTRE TARIF", "Prix au kilo")]):
            yy = y + 125 + i * 115 + int(20 * (1 - ease((local - .25 * i) / 1.1)))
            d.line((x + 48, yy + 90, 1722, yy + 90), fill="#E3E7E7", width=1)
            text(d, (x + 48, yy), label, 16, MUTED)
            text(d, (x + 48, yy + 34), value, 29, NAVY, True)
        pill(d, (x + 40, y + 495, 1730, y + 563), "Publier mon trajet    →", ORANGE, NAVY, 24)
        parcel(d, 1034, 725 + math.sin(local) * 8, 118)
    else:
        # A graphic closing lock-up gives the CTA nine seconds of screen time.
        for r in (150, 230, 310):
            rr = r + 8 * math.sin(local * .5)
            d.ellipse((1490 - rr, 510 - rr, 1490 + rr, 510 + rr), outline="#2C5362", width=2)
        parcel(d, 1490, 510 + math.sin(local * .7) * 10, 235)
        plane(d, 1650, 290, -.65, 42)
        brand(d, 120, 244, 91, True)
        for n, line in enumerate(scene["lines"]):
            yy = 404 + n * 104 + 24 * (1 - ease((local - n * .12) / 1.2))
            text(d, (120, yy), line, 77, WHITE if n == 0 else ORANGE, True)
        text(d, (124, 656), scene["body"], 29, "#BECFD3")
        pill(d, (120, 757, 662, 843), "Rejoignez Coliclic    →", ORANGE, NAVY, 28)
        text(d, (710, 785), FILM["website"], 29, WHITE)
        text(d, (125, 887), scene["eyebrow"], 19, "#9AB4BE", True)
    chrome(im, scene, local, dark)
    return im


def frame_at(t):
    scene = scene_at(t)
    im = render_scene(scene, t)
    remaining = scene["end"] - t
    if remaining < .65 and scene is not FILM["scenes"][-1]:
        nxt = FILM["scenes"][FILM["scenes"].index(scene) + 1]
        im = Image.blend(im, render_scene(nxt, nxt["start"]), ease(1 - remaining / .65))
    return im


def soundtrack(path):
    """Original instrumental: warm pads, sparse plucks, soft pulse, stereo."""
    sr, duration = 48000, FILM["duration"]
    audio = np.zeros((int(sr * duration), 2), dtype=np.float64)
    rng = np.random.default_rng(27)

    def add(start, frequency, length, amplitude, pan=0, pluck=False):
        begin = int(start * sr)
        n = min(int(length * sr), len(audio) - begin)
        if n <= 0:
            return
        t = np.arange(n) / sr
        env = (1 - np.exp(-t * (90 if pluck else 2.5))) * np.exp(-t * (2.3 if pluck else .35))
        env *= np.minimum(1, (n / sr - t) * 3)
        tone = np.sin(2 * np.pi * frequency * t) + .2 * np.sin(2 * np.pi * frequency * 2.002 * t)
        sig = tone * env * amplitude
        audio[begin:begin + n, 0] += sig * math.sqrt((1 - pan) / 2)
        audio[begin:begin + n, 1] += sig * math.sqrt((1 + pan) / 2)

    chords = [(146.83, 185, 220), (110, 138.59, 164.81), (123.47, 146.83, 185), (98, 123.47, 146.83)]
    for bar, start in enumerate(np.arange(0, duration, 4.8)):
        chord = chords[bar % 4]
        for j, f in enumerate(chord):
            add(start, f, 6.4, .052, (j - 1) * .5)
        for j in range(8):
            if j in (0, 3, 4, 6):
                add(start + j * .6, chord[j % 3] * 4, 2.4, .07, float(rng.uniform(-.65, .65)), True)
    for start in np.arange(7.2, 43, 1.2):
        add(start, 55, .24, .11, pluck=True)
    t = np.arange(len(audio)) / sr
    envelope = np.minimum(1, t / 2.5) * np.minimum(1, (duration - t) / 3)
    audio *= envelope[:, None]
    peak = np.max(np.abs(audio))
    audio *= .62 / max(peak, .62)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sr)
        wav.writeframes((audio * 32767).astype("<i2").tobytes())


def previews(out):
    sheet = Image.new("RGB", (1440, 3 * 460), "#E9E7E1")
    d = ImageDraw.Draw(sheet)
    for i, s in enumerate(FILM["scenes"]):
        sample = frame_at(s["start"] + 3).resize((720, 405), Image.Resampling.LANCZOS)
        x, y = (i % 2) * 720, (i // 2) * 460
        sheet.paste(sample, (x, y))
        text(d, (x + 22, y + 422), f"{i + 1:02d}   {s['start']:02d}–{s['end']:02d} s  /  {s['id']}", 18)
    sheet.save(out / "storyboard.jpg", quality=94)
    frame_at(44).save(out / "poster.jpg", quality=95)


def render(out, fps, width):
    if width <= 0 or width % 2 or (width * H // W) % 2:
        raise ValueError("H.264 dimensions must be positive and even")
    audio = out / "soundtrack.wav"
    soundtrack(audio)
    height = width * H // W
    target = out / "coliclic-presentation.mp4"
    command = [imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-f", "rawvideo", "-vcodec", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{width}x{height}", "-r", str(fps), "-i", "-", "-i", str(audio), "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", str(target)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for n in range(round(FILM["duration"] * fps)):
            im = frame_at(n / fps)
            if width != W:
                im = im.resize((width, height), Image.Resampling.LANCZOS)
            process.stdin.write(im.tobytes())
            if n % (fps * 5) == 0:
                print(f"Rendu {n / fps:.0f}/{FILM['duration']} secondes", flush=True)
        process.stdin.close()
        if process.wait() != 0:
            raise RuntimeError("Video encoding failed")
    except BaseException:
        if process.stdin and not process.stdin.closed:
            process.stdin.close()
        process.terminate()
        process.wait()
        raise
    # Validate both streams and the entire encoded file before delivery.
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-xerror", "-i", str(target), "-f", "null", "-"], check=True)
    print(target, flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "output")
    parser.add_argument("--previews-only", action="store_true")
    parser.add_argument("--fps", type=int, default=FILM["fps"])
    parser.add_argument("--width", type=int, default=W)
    parser.add_argument("--font", type=Path, default=FONT_PATH, help="Avenir Next TTC with Bold index 0 and Regular index 7")
    args = parser.parse_args()
    if args.fps <= 0:
        parser.error("fps must be positive")
    FONT_PATH = args.font
    args.output.mkdir(parents=True, exist_ok=True)
    previews(args.output)
    if not args.previews_only:
        render(args.output, args.fps, args.width)
