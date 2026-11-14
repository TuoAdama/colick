"""Unit and functional assertions, also executed by the JUnit test harness."""
import json
import math
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import wave

import numpy as np

import render


class TimelineTests(unittest.TestCase):
    def test_exact_contiguous_brief_and_voiceover_slots(self):
        expected=[0,5,13,21,28,36,43,50]
        scenes=render.FILM["scenes"]
        self.assertEqual([s["start"] for s in scenes]+[scenes[-1]["end"]],expected)
        self.assertEqual((render.W,render.H,render.FILM["fps"]),(1080,1920,30))
        for s in scenes:
            self.assertEqual(render.scene_at(s["start"])["id"],s["id"])
            self.assertLessEqual(s["start"],s["vo_start"])
            self.assertLess(s["vo_start"],s["vo_end"])
            self.assertLessEqual(s["vo_end"],s["end"])
            # Leave a plausible recording slot: no tongue-twisting >190 wpm.
            wpm=len(s["voiceover"].split())*60/(s["vo_end"]-s["vo_start"])
            self.assertLess(wpm,190,s["id"])
        for t in (-1,50):
            with self.assertRaises(ValueError):render.scene_at(t)

    def test_one_continuous_parcel_with_physical_transfers(self):
        for t in np.arange(0,50-1/30,1/30):
            a=np.array(render.parcel_pose(float(t)))
            b=np.array(render.parcel_pose(float(t+1/30)))
            self.assertLess(float(np.linalg.norm(a[:2]-b[:2])),32)
            self.assertLess(abs(a[2]-b[2]),8)
            self.assertGreater(a[0]-a[2]*.6,45)
            self.assertLess(a[0]+a[2]*.6,980)
        for begin,end in [(23.3,25.2),(38,40.2)]:
            self.assertGreater(render.parcel_pose(end)[0]-render.parcel_pose(begin)[0],160)
        for s in render.FILM["scenes"]:
            with patch.object(render,"draw_parcel",wraps=render.draw_parcel) as parcel:
                render.frame_at(s["start"]+.3)
                parcel.assert_called_once()

    def test_identity_and_product_evidence(self):
        self.assertEqual(render.FILM["parcel"]["label"],"ABJ")
        self.assertEqual(render.FILM["characters"]["traveler"]["name"],"Aya")
        self.assertEqual(render.FILM["characters"]["traveler"]["scarf"],render.ORANGE)
        repo=render.ROOT.parents[1]
        readme_path=repo/"readme.md"
        readme=(readme_path if readme_path.exists() else render.ROOT/"product-context.md").read_text()
        self.assertIn("mise en relation",readme)
        self.assertIn("ne gère pas le paiement",readme)
        script=" ".join(s["voiceover"]+" ".join(s["lines"]) for s in render.FILM["scenes"]).lower()
        for forbidden in ("garanti", "assurance", "express", "gps", "paiement", "%", "€/kg"):
            self.assertNotIn(forbidden,script)
        self.assertIn("fictifs",render.FILM["demo_notice"])


class FrameTests(unittest.TestCase):
    def test_action_beats_and_transitions_are_readable_and_in_frame(self):
        render.TRACK_BOUNDS=True
        try:
            for s in render.FILM["scenes"]:
                for offset in (0,.1,.3,.6,1.5,(s["end"]-s["start"])/2,s["end"]-s["start"]-.04):
                    t=s["start"]+offset
                    render.TEXT_BOUNDS.clear()
                    frame=render.frame_at(t)
                    self.assertEqual(frame.mode,"RGB")
                    self.assertEqual(frame.size,(1080,1920))
                    self.assertGreater(np.asarray(frame).std(),19)
                    for value,(x,y,x2,y2) in render.TEXT_BOUNDS:
                        self.assertGreaterEqual(x,0,(t,value))
                        self.assertLessEqual(x2,1000,(t,value))
                        self.assertGreaterEqual(y,0,(t,value))
                        self.assertLessEqual(y2,1690,(t,value))
        finally:render.TRACK_BOUNDS=False

    def test_every_scene_contains_an_actual_animated_action(self):
        for s in render.FILM["scenes"]:
            a=np.asarray(render.frame_at(s["start"]+.7)).astype(float)
            b=np.asarray(render.frame_at(s["end"]-.3)).astype(float)
            self.assertGreater(float(np.abs(a-b).mean()),.3,s["id"])


class AudioTests(unittest.TestCase):
    def test_stereo_full_length_fades_no_clipping_and_audible_foley(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);path=root/"soundtrack.wav"
            report=render.soundtrack(path,root)
            self.assertLessEqual(report["peak"],.7)
            for name in ("soundtrack.wav","music.wav","foley.wav"):
                with wave.open(str(root/name)) as wav:
                    self.assertEqual((wav.getnchannels(),wav.getframerate()),(2,48000))
                    self.assertEqual(wav.getnframes()/wav.getframerate(),50)
                    samples=np.frombuffer(wav.readframes(wav.getnframes()),dtype="<i2").astype(np.int32).reshape(-1,2)
                self.assertLess(int(np.abs(samples).max()),32767)
                self.assertEqual(samples[0].tolist(),[0,0])
                self.assertLess(abs(int(samples[-1].max())),20)
                self.assertGreater(float(samples.std()),10)
                if name=="foley.wav":
                    for cue in render.FILM["sfx"]:
                        begin=round(cue["time"]*48000)
                        self.assertGreater(float(samples[begin:begin+5000].std()),10,cue)


class ExportTests(unittest.TestCase):
    def test_final_mp4_decode_streams_faststart_and_duration(self):
        path=render.ROOT/"output/coliclic-motion-vertical.mp4"
        self.assertTrue(path.exists(),"Render the final master before running the export gate")
        report=render.validate_video(path)
        self.assertEqual(report["size"],[1080,1920])
        self.assertEqual(report["fps"],30)
        self.assertEqual(report["frames"],1500)
        self.assertAlmostEqual(report["duration"],50,places=1)
        self.assertIn("h264",report["codec"])
        self.assertIn("aac",report["audio_codec"])
        self.assertEqual((report["audio_channels"],report["audio_sample_rate"]),(2,48000))
        self.assertTrue(report["pixel_format"].startswith("yuv420p"))
        # Parse top-level MP4 atoms, so the faststart assertion cannot match bytes
        # which happen to appear inside a compressed frame.
        atoms=[]
        with path.open("rb") as stream:
            while True:
                header=stream.read(8)
                if len(header)<8:break
                length=int.from_bytes(header[:4],"big");atom=header[4:8]
                if length==1:
                    length=int.from_bytes(stream.read(8),"big");length-=8
                if length<8:break
                atoms.append(atom);stream.seek(length-8,1)
        self.assertLess(atoms.index(b"moov"),atoms.index(b"mdat"))


if __name__=="__main__":unittest.main()
