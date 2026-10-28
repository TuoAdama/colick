"""Coliclic: a continuous, editable vector-style motion film. Offline renderer.

All geometry uses the 1080 x 1920 master canvas. A SINGLE parcel is composited
over the moving scenes, so it cannot be duplicated by a transition. No tracking,
customer data, commercial offers, or external media services are used.
"""
from __future__ import annotations

import argparse
from functools import lru_cache
import json
import math
from pathlib import Path
import re
import subprocess
import wave

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
FILM = json.loads((ROOT / "film.json").read_text())
W, H = FILM["width"], FILM["height"]
NAVY, ORANGE, CREAM = (FILM["colors"][c] for c in ("navy", "orange", "cream"))
WHITE, MUTED, TEAL = "#FFFFFF", "#58707A", "#327F85"
FONT_PATH = ROOT / "assets/DM-Sans.ttf"
TEXT_BOUNDS = []


def clamp(v):
    return min(1.0, max(0.0, v))


def ease(v):
    """Quintic easing: zero velocity AND acceleration at both ends."""
    v = clamp(v)
    return v * v * v * (v * (v * 6 - 15) + 10)


def mix(a, b, p):
    return a + (b - a) * p


def scene_at(t):
    if not 0 <= t < FILM["duration"]:
        raise ValueError("Time outside film")
    return next(s for s in FILM["scenes"] if s["start"] <= t < s["end"])


@lru_cache(maxsize=160)
def font(size, bold=False):
    f=ImageFont.truetype(str(FONT_PATH),round(size))
    # Bundled OFL variable font already used by the application's detail screens.
    try:
        axes=f.get_variation_axes()
        values=[]
        for axis in axes:
            name=axis["name"].decode() if isinstance(axis["name"],bytes) else axis["name"]
            values.append(700 if "Weight" in name and bold else 400 if "Weight" in name else axis["default"])
        f.set_variation_by_axes(values)
    except OSError:
        pass  # --font also accepts a static TTF.
    return f


def text(d, x, y, value, size=36, color=NAVY, bold=False, center=False):
    f = font(size, bold)
    parts = value.split("→")
    total = sum(d.textlength(p, font=f) for p in parts) + (len(parts)-1)*size*1.12
    if center:
        x -= total / 2
    start_x=x
    for i,part in enumerate(parts):
        if i:
            arrow(d,x+size*.12,y+size*.49,size*.82,color)
            x+=size*1.12
        d.text((round(x), round(y)), part, font=f, fill=color, anchor="lt")
        x+=d.textlength(part,font=f)
    if TRACK_BOUNDS:
        TEXT_BOUNDS.append((value, (start_x,y,start_x+total,y+size)))


TRACK_BOUNDS = False


def line(d, pts, fill, width):
    pts = [(round(x), round(y)) for x, y in pts]
    width = max(1, round(width))
    d.line(pts, fill=fill, width=width, joint="curve")
    r = width / 2
    for x, y in (pts[0], pts[-1]):
        d.ellipse((x-r, y-r, x+r, y+r), fill=fill)


def rr(d, box, fill, radius=24, outline=None, width=1):
    d.rounded_rectangle(tuple(round(v) for v in box), radius=round(radius), fill=fill, outline=outline, width=width)


def heart(d, x, y, s, color):
    d.ellipse((x-s, y-s*.85, x, y+s*.15), fill=color)
    d.ellipse((x, y-s*.85, x+s, y+s*.15), fill=color)
    d.polygon([(x-s*.93, y-s*.2), (x+s*.93, y-s*.2), (x, y+s)], fill=color)


def wordmark(d, x, y, size, light=False, center=False):
    """Exact current header lockup: orange Coli + navy clic (cream on navy)."""
    first = d.textlength("Coli", font=font(size, True))
    total = d.textlength("Coliclic", font=font(size, True))
    if center:
        x -= total / 2
    text(d, x, y, "Coli", size, ORANGE, True)
    text(d, x+first, y, "clic", size, CREAM if light else NAVY, True)


def button(d, box, value, fill=ORANGE, color=NAVY, size=32):
    rr(d, box, fill, 22)
    text(d, (box[0]+box[2])/2, (box[1]+box[3]-size)/2-2, value, size, color, True, True)


def check(d, x, y, s=15, color=TEAL):
    line(d, [(x-s, y), (x-s*.25, y+s*.7), (x+s, y-s*.8)], color, 5)


def arrow(d, x, y, length=70, color=ORANGE):
    line(d, [(x, y), (x+length, y)], color, 4)
    line(d, [(x+length-16, y-14), (x+length, y), (x+length-16, y+14)], color, 4)


def person(d, x, ground, kind, scale=1, left_hand=None, right_hand=None, smile=1, wave=0):
    """Same character rig is used in the avatar, both meetings and all poses."""
    c = FILM["characters"][kind]
    skin, shirt, hair = c["skin"], c["shirt"], c["hair"]
    def p(a, b):
        return x+a*scale, ground+b*scale
    def poly(coords, color):
        d.polygon([p(a,b) for a,b in coords], fill=color)
    def oval(a,b,c1,e,fill):
        d.ellipse((*p(a,b), *p(c1,e)), fill=fill)
    def stroke(coords, color, w):
        line(d, [p(a,b) for a,b in coords], color, w*scale)
    # Shoes, long trousers, a curved jacket silhouette.
    oval(-114, -20, 120, 18, "#DCDDD5")
    stroke([(-39,-235),(-48,-114),(-58,-24)], NAVY, 49)
    stroke([(36,-235),(47,-116),(54,-24)], "#16465B", 49)
    stroke([(-65,-20),(-25,-20)], hair, 26)
    stroke([(45,-20),(88,-20)], hair, 26)
    poly([(-77,-427),(-95,-263),(-64,-222),(76,-222),(92,-276),(74,-426)], shirt)
    oval(-73,-447,74,-374,shirt)
    stroke([(0,-480),(0,-431)], skin, 43)
    oval(-57,-577,57,-461,skin)
    oval(-63,-581,63,-515,hair)
    poly([(-59,-543),(-59,-482),(-38,-503),(-35,-552)],hair)
    if kind == "sender":
        for a,b in [(-40,-574),(-13,-588),(16,-585),(42,-572)]:
            oval(a-24,b-18,a+24,b+25,hair)
    if kind == "recipient":
        oval(-28,-625,44,-560,hair)
        stroke([(-22,-575),(40,-571)],ORANGE,8)
    if kind == "traveler":
        # Teal cap + orange scarf are the profile-to-person match cues.
        oval(-69,-598,64,-538,TEAL)
        stroke([(-60,-543),(79,-543)],TEAL,18)
        poly([(-39,-446),(40,-444),(48,-419),(-37,-415)],ORANGE)
        poly([(12,-430),(48,-418),(33,-357),(8,-370)],ORANGE)
        stroke([(-43,-417),(-32,-265)],"#A7C2BE",8)
    # Brows, eyes, nose and expression.
    stroke([(-30,-524),(-16,-526)],hair,3)
    stroke([(18,-526),(30,-524)],hair,3)
    oval(-27,-516,-20,-507,NAVY)
    oval(21,-516,28,-507,NAVY)
    stroke([(3,-514),(8,-499),(1,-497)],"#623E30",2)
    if smile:
        # Small smile with white center, never a flat blank face.
        d.arc((*p(-19,-504),*p(24,-478)), 10, 167, fill=CREAM, width=max(2,round(5*scale)))
    # Bent arms reach the actual parcel edges during the handoff.
    for side, target in [(-1,left_hand),(1,right_hand)]:
        shoulder = p(side*68,-401)
        if target is None:
            target = p(side*104,-267 if not wave else -390-85*wave)
        elbow = (mix(shoulder[0],target[0],.48)+side*22*scale, mix(shoulder[1],target[1],.5)+22*scale)
        line(d,[shoulder,elbow],shirt,43*scale)
        line(d,[elbow,target],skin,30*scale)
        r=18*scale
        d.ellipse((target[0]-r,target[1]-r,target[0]+r,target[1]+r),fill=skin)


@lru_cache(maxsize=8)
def avatar(kind, size=100):
    canvas=Image.new("RGB",(260,260),"#E1EAE4")
    person(ImageDraw.Draw(canvas),130,565,kind,.9)
    canvas=canvas.resize((size,size),Image.Resampling.LANCZOS).convert("RGBA")
    mask=Image.new("L",(size,size)); ImageDraw.Draw(mask).ellipse((0,0,size-1,size-1),fill=255)
    canvas.putalpha(mask)
    return canvas


def paste_avatar(im,x,y,kind,size=80):
    a=avatar(kind,size); im.paste(a,(round(x),round(y)),a)


# One global trajectory. Each segment has zero velocity at its ends. At scene
# boundaries both the size and position remain continuous, even during dissolves.
PARCEL_KEYS = [
    (0,540,1160,300,0), (2.8,540,1160,300,0),
    (5.6,173,1390,165,-7), (12.5,173,1390,165,-7),
    (14.0,170,1390,165,-7), (19.7,170,1390,165,-7),
    (22.2,440,1165,244,0), (23.3,440,1165,244,0),
    (25.2,610,1165,244,0), (27.7,610,1165,244,0),
    (28.7,725,780,160,-8), (30.1,715,855,160,-8),
    (33.5,480,1130,160,-8), (35.3,395,1240,160,-8),
    (37.2,440,1165,244,0), (38.0,440,1165,244,0),
    (40.2,620,1165,244,0), (43.0,620,1165,244,0),
    (44.3,540,760,290,0), (50,540,760,290,0)
]


def parcel_pose(t):
    for a,b in zip(PARCEL_KEYS,PARCEL_KEYS[1:]):
        if a[0] <= t <= b[0]:
            p=ease((t-a[0])/(b[0]-a[0]))
            return tuple(mix(av,bv,p) for av,bv in zip(a[1:],b[1:]))
    return tuple(PARCEL_KEYS[-1][1:])


def parcel_image(size, angle, closing=1, morph=0):
    """Recognizable navy carton, orange cross tape, cream ABJ heart label."""
    s=340
    im=Image.new("RGBA",(520,520)); d=ImageDraw.Draw(im)
    # Slight perspective progressively flattens into the logo's box emblem.
    top=mix(57,25,morph); skew=mix(49,0,morph)
    x,y=85,145
    d.polygon([(x,y),(x+170,y-top),(x+s,y),(x+s,y+225),(x+skew,y+255),(x,y+220)],fill=NAVY)
    d.polygon([(x,y),(x+170,y-top),(x+s,y),(x+skew,y+40)],fill="#23566A")
    d.polygon([(x+skew,y+40),(x+s,y),(x+s,y+225),(x+skew,y+255)],fill="#023047")
    line(d,[(x,y+220),(x,y),(x+170,y-top),(x+s,y),(x+s,y+225),(x+skew,y+255),(x,y+220)],"#9CB5BC",2)
    # Carton flaps close during the opening close-up.
    if closing<1:
        rise=(1-closing)*94
        d.polygon([(x,y),(x+170,y-top),(x+158,y-top-rise),(x-18,y-rise)],fill="#467888")
        d.polygon([(x+170,y-top),(x+s,y),(x+s+15,y-rise),(x+181,y-top-rise)],fill="#72929B")
    d.polygon([(x+151,y-top/1.1),(x+186,y-top*.87),(x+208,y+26),(x+175,y+31)],fill=ORANGE)
    d.polygon([(x+175,y+31),(x+208,y+26),(x+208,y+241),(x+175,y+245)],fill=ORANGE)
    d.polygon([(x+skew,y+117),(x+s,y+83),(x+s,y+113),(x+skew,y+147)],fill=ORANGE)
    d.polygon([(x,y+85),(x+skew,y+117),(x+skew,y+147),(x,y+116)],fill="#D86D00")
    # The personal label fades only as the delivered box becomes the brand icon.
    if morph<.95:
        label=Image.new("RGBA",im.size);ld=ImageDraw.Draw(label)
        rr(ld,(x+222,y+151,x+307,y+214),CREAM,7)
        heart(ld,x+238,y+169,7,ORANGE)
        text(ld,x+254,y+164,"ABJ",19,NAVY,True)
        label.putalpha(label.getchannel("A").point(lambda a:round(a*(1-morph))))
        im=Image.alpha_composite(im,label)
    im=im.resize((round(size*520/s),round(size*520/s)),Image.Resampling.LANCZOS)
    return im.rotate(angle,resample=Image.Resampling.BICUBIC,expand=True)


def draw_parcel(im,t):
    x,y,s,a=parcel_pose(t)
    morph=ease((t-43.5)/1.3)
    stamp=parcel_image(s,a,ease((t-.7)/1.4),morph)
    im.paste(stamp,(round(x-stamp.width/2),round(y-stamp.height/2)),stamp)


def bezier(points,p):
    a,b,c=points
    return ((1-p)**2*a[0]+2*(1-p)*p*b[0]+p*p*c[0],(1-p)**2*a[1]+2*(1-p)*p*b[1]+p*p*c[1])


def skyline(d,city,y=1440,dark=False):
    col="#224D5C" if dark else "#DDE5DF"
    if city=="Paris":
        # Reduced Eiffel silhouette, only a geographic cue.
        d.polygon([(150,y),(205,y-355),(222,y-355),(280,y),(244,y),(212,y-223),(180,y)],fill=col)
        line(d,[(184,y-165),(245,y-165)],col,12)
        for x,h,w in [(305,167,98),(412,226,83),(508,143,115),(640,196,78),(735,152,115)]:
            rr(d,(x,y-h,x+w,y),col,4)
    else:
        for x,h,w in [(165,182,80),(263,300,73),(353,213,75),(447,158,100),(570,278,92),(690,345,66)]:
            rr(d,(x,y-h,x+w,y),col,4)
        # Lagoon and palm silhouettes.
        line(d,[(90,y+30),(365,y+30),(520,y+44),(910,y+44)],"#C7DDD7",8)
        line(d,[(837,y),(824,y-258)],col,13)
        for dx,dy in [(-104,-40),(-105,7),(-62,-72),(70,-62),(108,-6)]:
            line(d,[(824,y-258),(824+dx*.55,y-278+dy*.55),(824+dx,y-258+dy)],col,15)


def phone(im,x,y,w=656,h=858):
    d=ImageDraw.Draw(im)
    rr(d,(x+12,y+20,x+w+12,y+h+20),"#DCE2DB",65)
    rr(d,(x,y,x+w,y+h),NAVY,62)
    rr(d,(x+13,y+13,x+w-13,y+h-13),WHITE,50)
    rr(d,(x+w/2-65,y+24,x+w/2+65,y+43),NAVY,10)
    wordmark(d,x+40,y+68,41)
    rr(d,(x+w/2-65,y+h-31,x+w/2+65,y+h-25),"#CFD7D6",4)
    return d


def route_small(d,progress=1,y=1370):
    text(d,190,y-35,"Paris",37,NAVY,True)
    text(d,690,y-35,"Abidjan",37,NAVY,True)
    points=[bezier([(330,y-5),(530,y-100),(660,y-5)],u/100) for u in range(101)]
    line(d,points[:max(2,round(100*clamp(progress)))],ORANGE,5)
    for x in (318,674):
        d.ellipse((x-8,y-13,x+8,y+3),fill=ORANGE)


def prepare(im,t):
    d=ImageDraw.Draw(im)
    # Warm apartment arch and a living, packing gesture.
    rr(d,(250,620,830,1340),"#E8E7D9",285)
    rr(d,(295,670,785,1280),"#F3EEE1",245)
    line(d,[(540,700),(540,1160)],"#DFDFD1",6)
    x,y,s,a=parcel_pose(t)
    spread=mix(140,85,ease((t-.5)/1.4))
    release=ease((t-2.9)/.8)
    person(d,540,1510,"sender",1.13,
           left_hand=(mix(x-spread,423,release),mix(y+45,1205,release)),
           right_hand=(mix(x+spread,657,release),mix(y+45,1205,release)))
    rr(d,(115,1290,965,1330),"#C6A274",14)
    line(d,[(168,1330),(150,1530)],"#B58C61",22)
    line(d,[(912,1330),(930,1530)],"#B58C61",22)
    # City connector draws in while the packing action settles.
    if t>2.7:
        route_small(d,ease((t-2.7)/1.2),1475)


def search(im,t):
    local=t-5
    x,y=245,610+45*(1-ease(local/.8))
    d=phone(im,x,y,650,860)
    text(d,x+40,y+136,"Rechercher un trajet",33,NAVY,True)
    rr(d,(x+35,y+195,x+615,y+326),CREAM,20)
    text(d,x+59,y+218,"DÉPART",22,MUTED,True)
    text(d,x+360,y+218,"DESTINATION",22,MUTED,True)
    n1=round(5*ease((local-.35)/.8));n2=round(7*ease((local-.7)/.8))
    text(d,x+59,y+259,"Paris"[:n1],35,NAVY,True)
    text(d,x+360,y+259,"Abidjan"[:n2],35,NAVY,True)
    arrow(d,x+252,y+278,55)
    button(d,(x+35,y+349,x+615,y+419),"Rechercher",size=32)
    if local>1.9:
        offset=25*(1-ease((local-1.9)/.7))
        yy=y+449+offset
        selected=ease((local-5.3)/.65)
        rr(d,(x+35,yy,x+615,yy+290),"#F1F7F2" if selected>.5 else WHITE,22,TEAL if selected>.5 else "#DCE4E2",3)
        paste_avatar(im,x+58,yy+22,"traveler",78);d=ImageDraw.Draw(im)
        text(d,x+153,yy+28,"Aya",36,NAVY,True)
        text(d,x+153,yy+73,"Paris → Abidjan",30,NAVY,True)
        # Actual product criteria, deliberately without fictitious commercial figures.
        for i,label in enumerate(["Kilos disponibles", "Tarif au kilo", "Avis du voyageur"]):
            ry=yy+133+i*48
            active=clamp((local-2.6-i*.65)/.4)
            if active:
                rr(d,(x+53,ry-5,x+595,ry+35),"#E6EFEB",9)
            text(d,x+69,ry,label,34,TEAL if active else MUTED,i==2)
            if active:
                check(d,x+563,ry+14,10)
        if selected>.1:
            button(d,(x+35,y+760,x+615,y+819),"Voir le trajet  →",NAVY,WHITE,29)
        else:
            rr(d,(x+35,y+760,x+615,y+819),CREAM,18)
            d.ellipse((x+50,y+768,x+93,y+811),fill="#D9E5E2")
            text(d,x+72,y+776,"M",25,MUTED,True,True)
            text(d,x+110,y+777,"Marc · autre voyageur",28,MUTED)
    # Selection pulse belongs to the UI, never to a tracking position.
    tap=ease((local-5.45)/.5)
    if 0<tap<1:
        r=14+42*tap;cx,cy=x+548,y+489
        d.ellipse((cx-r,cy-r,cx+r,cy+r),outline=ORANGE,width=4)


def request(im,t):
    local=t-13;x,y=245,610
    d=phone(im,x,y,650,860)
    if local<3.1:
        text(d,x+40,y+136,"Votre demande",36,NAVY,True)
        paste_avatar(im,x+42,y+204,"traveler",68);d=ImageDraw.Draw(im)
        text(d,x+130,y+207,"Pour Aya",30,NAVY,True)
        text(d,x+130,y+251,"Paris → Abidjan",29,MUTED)
        text(d,x+40,y+339,"Description du colis",27,MUTED,True)
        rr(d,(x+35,y+388,x+615,y+564),CREAM,20)
        lines=["Des affaires et un cadeau", "pour ma sœur à Abidjan."]
        count=round(51*ease((local-.2)/1.5))
        for i,v in enumerate(lines):
            text(d,x+60,y+420+45*i,v[:max(0,count-i*27)],30)
        button(d,(x+35,y+610,x+615,y+689),"Envoyer ma demande",NAVY,WHITE,31)
        if local>2.4:
            rr(d,(x+35,y+718,x+615,y+796),"#E6F1E8",20)
            check(d,x+72,y+756,12)
            text(d,x+108,y+740,"Demande envoyée",30,TEAL,True)
    else:
        # The physical Aya in later scenes is the very same rig as this avatar.
        paste_avatar(im,x+41,y+133,"traveler",84);d=ImageDraw.Draw(im)
        text(d,x+150,y+146,"Aya",36,NAVY,True)
        text(d,x+150,y+195,"Votre voyageuse",27,MUTED)
        rr(d,(x+35,y+270,x+615,y+414),CREAM,21)
        text(d,x+60,y+292,"Nouvelle demande de Sam",29,NAVY,True)
        text(d,x+60,y+343,"Un colis pour Abidjan",30)
        if local<4.4:
            button(d,(x+35,y+450,x+615,y+525),"Accepter la demande",ORANGE,NAVY,30)
        else:
            button(d,(x+35,y+450,x+615,y+525),"Demande acceptée",TEAL,WHITE,30)
            if local>5.1:
                yy=y+560+20*(1-ease((local-5.1)/.4))
                rr(d,(x+35,yy,x+556,yy+94),"#EAF0EE",20)
                text(d,x+59,yy+21,"On se retrouve à Paris ?",32)
            if local>6.1:
                yy=y+683+20*(1-ease((local-6.1)/.4))
                rr(d,(x+143,yy,x+615,yy+91),NAVY,20)
                text(d,x+166,yy+21,"Oui, à notre rendez-vous !",29,WHITE)


def suitcase(d,x,y,s=1):
    rr(d,(x,y,x+115*s,y+170*s),"#C59C67",22*s)
    rr(d,(x+38*s,y-70*s,x+77*s,y+15*s),None,10*s,NAVY,round(7*s))
    for dx in (22,90):
        d.ellipse((x+dx*s-8,y+164*s,x+dx*s+8,y+180*s),fill=NAVY)
    line(d,[(x+18*s,y+52*s),(x+97*s,y+52*s)],"#E4C494",4*s)


def handoff(im,t):
    d=ImageDraw.Draw(im);local=t-21
    skyline(d,"Paris")
    x,y,s,a=parcel_pose(t)
    arrive=1-ease(local/1.0)
    leftx,rightx=315-65*arrive,750+65*arrive
    # Hands support opposite faces, then sender releases after transfer.
    release=ease((local-4.4)/1.1)
    senderhand=(mix(x-s*.36,leftx+95,release),mix(y+52,1220,release))
    person(d,leftx,1450,"sender",.91,right_hand=senderhand)
    leave=ease((local-6.7)/.5)
    person(d,rightx,1450,"traveler",.91,left_hand=(mix(x+s*.35,rightx-85,leave),mix(y+53,1210,leave)))
    suitcase(d,802,1280,.8)
    button(d,(160,1512,470,1580),"Sam · expéditeur",CREAM,NAVY,28)
    button(d,(565,1512,915,1580),"Aya · voyageuse",CREAM,TEAL,28)


def flight(im,t):
    d=ImageDraw.Draw(im);local=t-28
    # Stylized map, north is up: Paris is northeast of Abidjan.
    africa=[(460,890),(570,870),(675,905),(777,1000),(789,1090),(740,1160),(712,1270),(658,1378),(605,1440),(553,1355),(520,1260),(482,1200),(382,1154),(327,1060),(360,969)]
    europe=[(527,684),(563,628),(650,646),(691,609),(750,650),(791,741),(756,802),(802,869),(704,863),(658,828),(568,845),(508,791)]
    d.polygon(africa,fill="#174A5B");d.polygon(europe,fill="#174A5B")
    for y in (760,940,1120,1300,1480):
        line(d,[(130,y),(950,y)],"#103D50",1)
    for x in (240,440,640,840):
        line(d,[(x,640),(x,1490)],"#103D50",1)
    pts=[bezier([(715,790),(795,1050),(394,1288)],i/120) for i in range(121)]
    for i in range(0,118,6):
        line(d,pts[i:i+3],"#62818B",4)
    p=ease((local-.6)/6.4)
    n=max(2,round(120*p));line(d,pts[:n],ORANGE,6)
    px,py=pts[n-1]
    # Aircraft silhouette rotates smoothly to the curve's tangent.
    dx=2*(1-p)*80+2*p*(-401);dy=2*(1-p)*260+2*p*238
    angle=math.atan2(dy,dx);co,si=math.cos(angle),math.sin(angle)
    shape=[(57,0),(5,-9),(-23,-64),(-42,-64),(-22,-7),(-50,-7),(-65,-27),(-77,-27),(-68,0),(-77,27),(-65,27),(-50,7),(-22,7),(-42,64),(-23,64),(5,9)]
    d.polygon([(px+a*co-b*si,py+a*si+b*co) for a,b in shape],fill=CREAM)
    for cx,cy in [(715,790),(394,1288)]:
        d.ellipse((cx-10,cy-10,cx+10,cy+10),fill=ORANGE)
        d.ellipse((cx-22,cy-22,cx+22,cy+22),outline=ORANGE,width=2)
    text(d,575,698,"Paris",42,CREAM,True)
    text(d,210,1340,"Abidjan",47,CREAM,True)
    text(d,540,1540,"LE VOYAGE ILLUSTRÉ",28,"#B7CDD1",True,True)


def receive(im,t):
    d=ImageDraw.Draw(im);local=t-36
    skyline(d,"Abidjan")
    x,y,s,a=parcel_pose(t)
    release=ease((local-4.35)/.8)
    person(d,305,1450,"traveler",.91,right_hand=(mix(x-s*.35,390,release),mix(y+53,1200,release)))
    person(d,755,1450,"recipient",.91,left_hand=(x+s*.35,y+53),smile=local>3.8)
    suitcase(d,130,1295,.76)
    # Recognition: an animated heart rises only after the box is in her hands.
    p=ease((local-4.3)/1.0)
    if p>0:
        heart(d,753,815-30*p,19*p,ORANGE)
    button(d,(150,1512,480,1580),"Aya · voyageuse",CREAM,TEAL,28)
    button(d,(577,1512,930,1580),"Léa · destinataire",CREAM,NAVY,28)


def closing(im,t):
    d=ImageDraw.Draw(im);local=t-43
    # The very same delivered parcel flattens into the repository's cross-tape
    # emblem; current app wordmark is revealed underneath.
    p=ease((local-.35)/1.1)
    for r in (220,320,430):
        rradius=r+7*math.sin(local*.75)
        d.ellipse((540-rradius,760-rradius,540+rradius,760+rradius),outline="#1D4C5C",width=2)
    radius=205*p
    d.ellipse((540-radius,760-radius,540+radius,760+radius),fill=CREAM)
    if p>0:
        wordmark(d,540,975+40*(1-p),112,True,True)
        text(d,540,1158,"Des voyages,",58,CREAM,True,True)
        text(d,540,1234,"des colis, des liens.",58,CREAM,True,True)
    if local>1.4:
        q=ease((local-1.4)/.8)
        button(d,(120,1430+22*(1-q),960,1530+22*(1-q)),"Trouvez votre voyageur",ORANGE,NAVY,43)
        text(d,540,1580,"coliclic.com",49,CREAM,True,True)


SCENE_RENDERERS={"prepare":prepare,"search":search,"request":request,"handoff":handoff,"flight":flight,"receive":receive,"brand":closing}


@lru_cache(maxsize=2)
def background(dark):
    base=Image.new("RGB",(W,H),NAVY if dark else CREAM)
    d=ImageDraw.Draw(base)
    # Quiet, asymmetrical editorial framing; no gratuitous effects.
    c="#0E3C50" if dark else "#F0EADF"
    d.ellipse((720,-130,1260,410),fill=c)
    d.ellipse((-430,1370,190,1990),fill=c)
    return base


def scene_layer(scene,t):
    dark=scene["id"] in ("flight","brand")
    im=background(dark).copy();d=ImageDraw.Draw(im)
    if scene["id"]!="brand":
        local=t-scene["start"]
        # Headline settles once; it remains stationary and legible thereafter.
        rise=20*(1-ease(local/.7))
        text(d,98,268+rise,scene["kicker"],25,ORANGE if dark else MUTED,True)
        for i,v in enumerate(scene["lines"]):
            text(d,92,342+i*90+rise,v,70,ORANGE if i==scene["accent"] else (CREAM if dark else NAVY),True)
    SCENE_RENDERERS[scene["id"]](im,t)
    return im


def frame_at(t):
    scene=scene_at(t)
    im=scene_layer(scene,t)
    index=FILM["scenes"].index(scene)
    # Scenery dissolves behind one continuously moving physical parcel.
    if index>0 and t-scene["start"]<.6:
        previous=FILM["scenes"][index-1]
        before=scene_layer(previous,t)
        im=Image.blend(before,im,ease((t-scene["start"])/.6))
    draw_parcel(im,t)
    d=ImageDraw.Draw(im)
    dark=scene["id"] in ("flight","brand")
    # Header lives above the narrative. Safe margins avoid Reels/Shorts controls.
    if scene["id"]!="brand":
        wordmark(d,94,153,45,dark)
    if scene["id"] in ("search","request"):
        text(d,540,1618,"Démonstration · personnages fictifs",27,MUTED,False,True)
    if scene["id"] in ("prepare","handoff","receive"):
        text(d,540,1644,"UN COLIS. TOUT UN LIEN.",27,MUTED,True,True)
    return im


def soundtrack(path,stems_dir=None):
    """Original warm 100 BPM instrumental + timestamped, restrained Foley.

    Deterministic synthesis, no recordings or copyrighted sample packs.
    Stems are optional. Voiceover is supplied as a timed script for recording.
    """
    sr=48000;duration=FILM["duration"];count=round(sr*duration)
    music=np.zeros((count,2),dtype=np.float64);fx=np.zeros_like(music)
    rng=np.random.default_rng(2810)

    def add(track,start,signal,pan=0):
        begin=round(start*sr);n=min(len(signal),count-begin)
        if begin<0 or n<=0:return
        track[begin:begin+n,0]+=signal[:n]*math.sqrt((1-pan)/2)
        track[begin:begin+n,1]+=signal[:n]*math.sqrt((1+pan)/2)

    def tone(start,freq,duration,volume,kind="keys",pan=0):
        t=np.arange(round(sr*duration))/sr
        if kind=="pad":
            env=(1-np.exp(-3*t))*np.minimum(1,(duration-t)*2)*np.exp(-.16*t)
            signal=np.sin(2*np.pi*freq*t)+.2*np.sin(2*np.pi*freq*2.003*t)
        else:
            env=(1-np.exp(-130*t))*np.exp(-t*(2.8 if kind=="keys" else 9))
            env*=np.minimum(1,(duration-t)*15)
            signal=np.sin(2*np.pi*freq*t)+.28*np.sin(2*np.pi*freq*2*t)*np.exp(-t*4)+.12*np.sin(2*np.pi*freq*3*t)*np.exp(-t*9)
        add(music,start,signal*env*volume,pan)

    # Dmaj7, Aadd9, Bm7, Gmaj7; brushed pulse and soft electric-piano arpeggio.
    chords=[(146.83,185,220,277.18),(110,138.59,164.81,246.94),(123.47,146.83,185,220),(98,123.47,146.83,185)]
    beat=.6;bar=4*beat
    for n,start in enumerate(np.arange(0,duration,bar)):
        chord=chords[(n//2)%4]
        energy=.65 if start<5 else (1 if start<43 else .72)
        for j,f in enumerate(chord):
            tone(start,f,3.5,.038*energy,"pad",(j-1.5)*.4)
        for j in range(8):
            tone(start+j*beat/2,chord[[0,2,1,3,2,1,3,2][j]]*2,1.7,.053*energy,"keys",(-1)**j*.3)
        tone(start,chord[0]/2,.5,.13*energy,"bass")
    for n,start in enumerate(np.arange(4.8,47.5,beat)):
        t=np.arange(round(sr*.18))/sr
        kick=np.sin(2*np.pi*(50*t+35*.018*(1-np.exp(-t/.018))))*np.exp(-t*28)*.13
        if n%2==0:add(music,start,kick)
        brush=rng.normal(0,1,len(t));brush=np.diff(brush,prepend=0)*np.exp(-t*60)*.012
        add(music,start+.3,brush,.4 if n%2 else -.4)
        if n%4==2:
            add(music,start,rng.normal(0,1,len(t))*np.exp(-t*32)*.022,-.25)
    for cue in FILM["sfx"]:
        kind=cue["kind"];length={"air":1.5,"tape":.65,"cloth":.3,"send":.4,"accept":.5,"tap":.14}[kind]
        t=np.arange(round(sr*length))/sr
        if kind in ("tape","cloth","air"):
            noise=rng.normal(0,1,len(t))
            # Band-limited swishes, soft enough to sit behind the music.
            noise=np.convolve(noise,np.ones(23)/23,mode="same")
            signal=noise*np.sin(np.pi*t/length)**2*(.13 if kind=="air" else .17)
        elif kind=="accept":
            signal=(np.sin(2*np.pi*659.25*t)+np.sin(2*np.pi*880*t)*.65)*np.exp(-t*10)*.04*np.minimum(t*150,1)
        elif kind=="send":
            signal=np.sin(2*np.pi*(450*t+500*t*t))*np.sin(np.pi*t/length)**2*.025
        else:
            signal=np.sin(2*np.pi*760*t)*np.exp(-t*60)*.045*np.minimum(t*900,1)
        add(fx,cue["time"],signal)
    t=np.arange(count)/sr
    envelope=np.minimum(1,t/1.3)*np.minimum(1,(duration-t)/2)
    music*=envelope[:,None];fx*=envelope[:,None]
    result=music+fx
    peak=max(1e-6,float(np.abs(result).max()))
    result*=.65/peak

    def save(p,a):
        with wave.open(str(p),"wb") as w:
            w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr)
            w.writeframes(np.round(a*32767).astype("<i2").tobytes())
    save(path,result)
    if stems_dir:
        save(stems_dir/"music.wav",music*.65/peak);save(stems_dir/"foley.wav",fx*.65/peak)
    return {"peak":float(np.abs(result).max()),"sample_rate":sr,"samples":count}


def previews(out):
    # Seven portrait keyframes with a proper editorial title and time captions.
    cw,ch=360,640
    sheet=Image.new("RGB",(4*cw+100,2*(ch+110)+180),CREAM);d=ImageDraw.Draw(sheet)
    text(d,35,30,"COLICLIC / UN COLIS. TOUT UN LIEN.",36,NAVY,True)
    text(d,35,92,"Storyboard · 50 secondes · 1080 × 1920 · 30 i/s",26,MUTED)
    times=[2.3,11.7,19.8,25.5,33,40.7,47]
    for i,(s,t) in enumerate(zip(FILM["scenes"],times)):
        x=25+(i%4)*(cw+15);y=165+(i//4)*(ch+100)
        thumb=frame_at(t).resize((cw,ch),Image.Resampling.LANCZOS)
        sheet.paste(thumb,(x,y))
        text(d,x+8,y+655,f"{s['start']:02d}–{s['end']:02d} s",26,NAVY,True)
        text(d,x+8,y+696,["La préparation","La recherche","La demande","La remise à Paris","Le voyage","La réception","La marque"][i],23,MUTED)
    # Last cell documents continuity rather than introducing an eighth scene.
    x=25+3*(cw+15);y=165+ch+100
    text(d,x+16,y+70,"Un même colis.",32,NAVY,True)
    text(d,x+16,y+127,"Trois personnages.",32,NAVY,True)
    text(d,x+16,y+220,"Marine · Orange · Crème",23,MUTED)
    text(d,x+16,y+280,"Paris → Abidjan",29,TEAL,True)
    text(d,x+16,y+370,"Rendu illustré et fictif",23,MUTED)
    text(d,x+16,y+420,"Musique + bruitages",23,MUTED)
    text(d,x+16,y+470,"Voix off : script fourni",23,MUTED)
    sheet.save(out/"storyboard.jpg",quality=95)
    frame_at(47).save(out/"poster.jpg",quality=95)
    # Review all action beats and raccords; keep these outside source control.
    review=out/"review";review.mkdir(exist_ok=True)
    times=[0,.8,1.8,2.9,4.9,5,5.3,6.5,7.5,9.7,10.6,12.9,13,15.4,16.2,17.4,19.1,20.9,21,22.5,24,25.2,27.9,28,28.4,30,33.5,35.9,36,37.5,39.3,40.5,42.9,43,43.3,44.2,45.5,49.9]
    for page in range(math.ceil(len(times)/8)):
        tile=Image.new("RGB",(1080,1080),CREAM);td=ImageDraw.Draw(tile)
        for j,t in enumerate(times[page*8:(page+1)*8]):
            x=(j%4)*270;y=(j//4)*540
            tile.paste(frame_at(t).resize((270,480)),(x,y))
            text(td,x+15,y+493,f"{t:04.1f} s",25,NAVY,True)
        tile.save(review/f"beats-{page+1}.jpg",quality=93)


def timecode(t):
    ms=round(t*1000);return f"00:{ms//60000:02d}:{ms//1000%60:02d},{ms%1000:03d}"


def scripts(out):
    paragraphs=["# Coliclic — script voix off synchronisé", "\n50 secondes. Lecture française chaleureuse, souriante, sans emphase publicitaire.\nLes plages comprennent les respirations ; enregistrer chaque phrase dans sa plage.\nLa piste livrée contient musique et bruitages, sans voix enregistrée.\n"]
    cues=[]
    for i,s in enumerate(FILM["scenes"]):
        paragraphs.append(f"## {s['vo_start']:05.2f}–{s['vo_end']:05.2f} s · {s['id']}\n\n{s['voiceover']}\n")
        cues.append(f"{i+1}\n{timecode(s['vo_start'])} --> {timecode(s['vo_end'])}\n{s['voiceover']}\n")
    (ROOT/"voiceover.md").write_text("\n".join(paragraphs))
    (out/"voiceover.srt").write_text("\n".join(cues))


def validate_video(path):
    exe=imageio_ffmpeg.get_ffmpeg_exe()
    # Decode the complete encoded artifact, with timestamp/frame count evidence.
    p=subprocess.run([exe,"-v","error","-xerror","-i",str(path),"-map","0:v:0","-map","0:a:0","-progress","pipe:1","-f","null","-"],capture_output=True,text=True,check=True)
    progress=dict(row.split("=",1) for row in p.stdout.splitlines() if "=" in row)
    reader=imageio_ffmpeg.read_frames(str(path));meta=next(reader);reader.close()
    if progress.get("progress")!="end":raise RuntimeError("Incomplete decode")
    probe=subprocess.run([exe,"-hide_banner","-i",str(path)],capture_output=True,text=True)
    audio=re.search(r"Audio:.*?, (\d+) Hz, (stereo|mono)",probe.stderr)
    if not audio:raise RuntimeError("Cannot inspect encoded audio stream")
    return {"decode":"complete","frames":int(progress["frame"]),"size":list(meta["size"]),"fps":meta["fps"],"duration":meta["duration"],"codec":meta["codec"],"audio_codec":meta["audio_codec"],"pixel_format":meta["pix_fmt"],"audio_channels":2 if audio[2]=="stereo" else 1,"audio_sample_rate":int(audio[1])}


def render(out,fps,width):
    height=round(width*H/W)
    if width<=0 or width%2 or height%2 or fps<=0:raise ValueError("Positive even dimensions and fps required")
    audio=out/"soundtrack.wav";audio_report=soundtrack(audio,out)
    target=out/"coliclic-motion-vertical.mp4"
    command=[imageio_ffmpeg.get_ffmpeg_exe(),"-y","-v","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{width}x{height}","-r",str(fps),"-i","-","-i",str(audio),"-c:v","libx264","-preset","fast","-crf","18","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-ar","48000","-ac","2","-movflags","+faststart","-t",str(FILM["duration"]),str(target)]
    p=subprocess.Popen(command,stdin=subprocess.PIPE)
    try:
        for n in range(round(FILM["duration"]*fps)):
            im=frame_at(n/fps)
            if width!=W:im=im.resize((width,height),Image.Resampling.LANCZOS)
            p.stdin.write(im.tobytes())
            if n%(fps*5)==0:print(f"Rendu {n/fps:.0f}/50 s",flush=True)
        p.stdin.close()
        if p.wait()!=0:raise RuntimeError("Encoding failed")
    except BaseException:
        if p.stdin and not p.stdin.closed:p.stdin.close()
        p.terminate();p.wait();raise
    report=validate_video(target);report["audio_synthesis"]=audio_report
    (out/"validation.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(report),flush=True)


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,default=ROOT/"output")
    parser.add_argument("--previews-only",action="store_true")
    parser.add_argument("--width",type=int,default=W)
    parser.add_argument("--fps",type=int,default=FILM["fps"])
    parser.add_argument("--font",type=Path,default=FONT_PATH,help="Optional replacement TTF, DM Sans bundled by default")
    args=parser.parse_args();FONT_PATH=args.font
    args.output.mkdir(parents=True,exist_ok=True)
    previews(args.output);scripts(args.output)
    if not args.previews_only:render(args.output,args.fps,args.width)
