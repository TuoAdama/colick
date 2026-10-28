"""Unit and functional checks for the standalone film, without a server."""
import tempfile
import unittest
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

import render


class FilmTests(unittest.TestCase):
    def test_timeline_is_contiguous_and_covers_fifty_seconds(self):
        scenes = render.FILM["scenes"]
        self.assertEqual(scenes[0]["start"], 0)
        self.assertEqual(scenes[-1]["end"], 50)
        self.assertEqual(len({s["id"] for s in scenes}), len(scenes))
        for index, scene in enumerate(scenes):
            self.assertGreaterEqual(scene["end"] - scene["start"], 7)
            if index:
                self.assertEqual(scene["start"], scenes[index - 1]["end"])
            self.assertEqual(render.scene_at(scene["start"]), scene)
            self.assertEqual(render.scene_at(scene["end"] - 1 / 30), scene)
        for invalid in (-1, 50):
            with self.assertRaises(ValueError):
                render.scene_at(invalid)

    def test_copy_fits_safe_area_without_covering_visuals(self):
        d = ImageDraw.Draw(Image.new("RGB", (1920, 1080)))
        sizes = [112, 76, 86, 84, 76, 77]
        for scene, size in zip(render.FILM["scenes"], sizes):
            for line in scene["lines"]:
                self.assertLess(d.textlength(line, font=render.font(size, True)), 900, line)
            for line in scene["body"].splitlines():
                self.assertLess(d.textlength(line, font=render.font(29)), 900, line)

    def test_frames_render_at_every_transition_and_scene_midpoint(self):
        for scene in render.FILM["scenes"]:
            for t in (scene["start"], scene["start"] + 3, scene["end"] - .1):
                frame = render.frame_at(t)
                self.assertEqual(frame.size, (1920, 1080))
                self.assertEqual(frame.mode, "RGB")
                # An accidentally blank frame must fail even at a cut.
                self.assertGreater(float(np.asarray(frame).std()), 15)

    def test_soundtrack_is_stereo_full_length_and_does_not_clip(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "audio.wav"
            render.soundtrack(path)
            with wave.open(str(path)) as wav:
                self.assertEqual(wav.getnchannels(), 2)
                self.assertEqual(wav.getnframes() / wav.getframerate(), 50)
                samples = np.frombuffer(wav.readframes(wav.getnframes()), dtype="<i2")
            self.assertLess(int(np.abs(samples.astype(np.int32)).max()), 32767)
            self.assertEqual(samples[0], 0)
            self.assertLess(abs(int(samples[-1])), 100)
            self.assertGreater(float(samples.std()), 100)


if __name__ == "__main__":
    unittest.main()
