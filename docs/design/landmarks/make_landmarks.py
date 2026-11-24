#!/usr/bin/env python3
"""Draws Beacon's map pictures (police, hospital, bar, ...) and saves each one twice:
  - an .svg file here (paste into Figma, components "Landmark/...")
  - an Android picture in app/src/main/res/drawable/landmark_<name>.xml
Change a shape here, run `python3 docs/design/landmarks/make_landmarks.py` from the repo root,
and both stay in sync. Only simple shapes are used (path, rect, circle, ellipse) so the
conversion to Android is exact."""
import os, re, xml.etree.ElementTree as ET

N, C, T, R, B, Y, G, O, W = "#1F3A6E", "#FFF8EC", "#EBD9B5", "#E5484D", "#2F6BFF", "#F6B93B", "#22A06B", "#FF9B4A", "#CFE0FF"
DEEP = "#D9C49A"  # inside of arches

def attrs(fill=None, stroke=None, sw=None, op=None, cap=None, join=None):
    a = f' fill="{fill or "none"}"'
    if op is not None: a += f' fill-opacity="{op}"'
    if stroke: a += f' stroke="{stroke}" stroke-width="{sw}"'
    if cap: a += f' stroke-linecap="{cap}"'
    if join: a += f' stroke-linejoin="{join}"'
    return a
def path(d, **k): return f'<path d="{d}"{attrs(**k)}/>'
def rect(x, y, w, h, rx=0, **k): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"{attrs(**k)}/>'
def circle(cx, cy, r, **k): return f'<circle cx="{cx}" cy="{cy}" r="{r}"{attrs(**k)}/>'
def ellipse(cx, cy, rx, ry, **k): return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"{attrs(**k)}/>'
def shadow(cx, cy, rx): return ellipse(cx, cy, rx, 2.2, fill=N, op=0.12)
def ground(w, y): return path(f"M2,{y}H{w-2}", stroke=N, sw=2, cap="round")

def police():
    return 50, 50, [
        shadow(25, 46.8, 19), rect(6, 42, 38, 3.5, 1, fill=C, stroke=N, sw=1.6),
        rect(9, 22, 32, 20, fill=C), rect(34, 22, 7, 20, fill=T), rect(9, 22, 32, 20, stroke=N, sw=2),
        path("M6,22 L25,10 L44,22 Z", fill=C, stroke=N, sw=2, join="round"),
        path("M25,13.2 l3.2,1.4 v2.3 c0,1.7 -1.5,2.8 -3.2,3.3 c-1.7,-0.5 -3.2,-1.6 -3.2,-3.3 v-2.3 z", fill=B),
        rect(13, 24.5, 24, 4.5, 1, fill=N),
        rect(12.5, 32, 5, 6, 1, fill=W, stroke=N, sw=1.3), rect(32.5, 32, 5, 6, 1, fill=W, stroke=N, sw=1.3),
        path("M21,42 V35.5 a4,4 0 0 1 8,0 V42 Z", fill=N),
        rect(22, 6.5, 6, 3.2, fill=N),
        rect(19.5, 3, 5.5, 4.5, 2, fill=R, stroke=N, sw=1.2), rect(25, 3, 5.5, 4.5, 2, fill=B, stroke=N, sw=1.2),
    ]

def hospital():
    return 46, 46, [
        shadow(23, 43.6, 18),
        rect(5, 18, 36, 24, fill=C), rect(34, 18, 7, 24, fill=T), rect(5, 18, 36, 24, stroke=N, sw=2),
        rect(15, 5.5, 16, 14.5, fill=C, stroke=N, sw=2),
        circle(23, 12.6, 4.8, fill="#FFFFFF", stroke=N, sw=1.2), path("M23,9.9v5.4M20.3,12.6h5.4", stroke=R, sw=2.4, cap="round"),
        rect(9, 23, 5, 5, 1, fill=W, stroke=N, sw=1.3), rect(9, 32, 5, 5, 1, fill=W, stroke=N, sw=1.3),
        rect(32, 23, 5, 5, 1, fill=W, stroke=N, sw=1.3), rect(32, 32, 5, 5, 1, fill=W, stroke=N, sw=1.3),
        rect(19, 31, 8, 11, 1, fill=B, stroke=N, sw=1.4), path("M23,31V42", stroke=N, sw=1),
        ground(46, 42.5),
    ]

def bar():
    top = [9 + 4.8 * i for i in range(6)]; bot = [5 + 6.4 * i for i in range(6)]
    stripes = [path(f"M{top[i]:.1f},7 L{top[i+1]:.1f},7 L{bot[i+1]:.1f},17 L{bot[i]:.1f},17 Z", fill=O if i % 2 == 0 else C) for i in range(5)]
    return 42, 42, [
        shadow(21, 39.6, 17),
        rect(7, 17, 28, 21, fill=C), rect(29, 17, 6, 21, fill=T), rect(7, 17, 28, 21, stroke=N, sw=2),
        *stripes, path("M9,7 H33 L37,17 H5 Z", stroke=N, sw=2, join="round"),
        rect(10.5, 21.5, 10, 9, 1, fill=W, stroke=N, sw=1.3),
        path("M13,24h5l-2.5,3.2z", fill=Y, stroke=N, sw=1, join="round"), path("M15.5,27.2v2", stroke=N, sw=1, cap="round"),
        rect(24, 23, 7, 15, 1, fill=N), circle(25.7, 31, 0.9, fill=Y),
        ground(42, 38.5),
    ]

def catedral():
    return 58, 58, [
        shadow(29, 55.4, 23),
        path("M9,51 L22,9 H36 L49,51 Z", fill=C), path("M36,9 L49,51 H39 L31.5,9 Z", fill=T),
        path("M27,9 L25.5,51 h7 L31,9 z", fill=B),
        path("M26.7,20h4.6", stroke=Y, sw=3), path("M26.3,30h5.4", stroke=R, sw=3), path("M26,40h6", stroke=Y, sw=3),
        path("M18.6,20h20.8M15.5,30h27M12.4,40h33.2", stroke=N, sw=1.2),
        path("M9,51 L22,9 H36 L49,51 Z", stroke=N, sw=2, join="round"),
        path("M29,2.5v6.5M26.4,4.8h5.2", stroke=N, sw=1.8, cap="round"),
        rect(6, 51, 46, 3.2, 1, fill=C, stroke=N, sw=1.6),
    ]

def arcos():
    upper = " ".join(f"M{6.5 + 9.4 * i:.1f},31 V26 a3,3 0 0 1 6,0 V31 Z" for i in range(9))
    lower = " ".join(f"M{7 + 14.2 * i:.1f},50 V41 a4.6,4.6 0 0 1 9.2,0 V50 Z" for i in range(6))
    return 96, 54, [
        shadow(48, 51.6, 44),
        rect(3, 14, 90, 36, fill=C), rect(3, 14, 90, 5, fill=T),
        path(upper, fill=DEEP, stroke=N, sw=1.3), path(lower, fill=DEEP, stroke=N, sw=1.4),
        path("M3,19H93M3,32.5H93", stroke=N, sw=1.5), rect(3, 14, 90, 36, stroke=N, sw=2),
    ]

def tram():  # rides along the top of the arches
    return 24, 13, [
        circle(6, 11.2, 1.7, fill=N), circle(18, 11.2, 1.7, fill=N),
        rect(1, 1, 22, 9.4, 2.6, fill=Y, stroke=N, sw=1.5),
        rect(4, 3.2, 4, 3.6, 0.8, fill=C, stroke=N, sw=0.9), rect(10, 3.2, 4, 3.6, 0.8, fill=C, stroke=N, sw=0.9), rect(16, 3.2, 4, 3.6, 0.8, fill=C, stroke=N, sw=0.9),
    ]

def steps():
    colors = [R, Y, G, B]; out = [shadow(23, 46.2, 20)]
    for i in range(5):
        x, y, w = 15 - 2.8 * i, 5 + 8 * i, 16 + 5.6 * i
        for t in range(4):
            out.append(rect(round(x + t * w / 4, 2), y, round(w / 4, 2), 8, fill=colors[(t + i) % 4]))
        out.append(path(" ".join(f"M{x + t * w / 4:.2f},{y}v8" for t in range(1, 4)), stroke=N, sw=0.9))
        out.append(rect(round(x, 2), y, round(w, 2), 8, stroke=N, sw=1.5))
    return 46, 48, out

def hostel():  # only used in the Figma design for now
    return 46, 46, [
        shadow(23, 43.6, 17),
        rect(9, 20, 28, 22, fill=C), rect(31, 20, 6, 22, fill=T), rect(9, 20, 28, 22, stroke=N, sw=2),
        path("M5,21 L23,7 L41,21 Z", fill=B, stroke=N, sw=2, join="round"), circle(23, 15, 2.2, fill="#FFFFFF"),
        rect(13, 25, 6, 6, 1, fill=W, stroke=N, sw=1.3), rect(27, 25, 6, 6, 1, fill=W, stroke=N, sw=1.3),
        path("M20,42 V35 a3,3 0 0 1 6,0 V42 Z", fill=N), ground(46, 42.5),
    ]

def person():  # "you are here": an outlined stick figure with a round head, filled yellow
    parts = [circle(12, 5.6, 4.4), rect(4.4, 13, 3.6, 12, 1.8), rect(16, 13, 3.6, 12, 1.8),      # head, arms
             rect(7.4, 12.4, 9.2, 13.6, 3), rect(7.8, 22.5, 3.9, 13.5, 1.95), rect(12.3, 22.5, 3.9, 13.5, 1.95)]  # body, legs
    # Drawn twice so the parts read as ONE outlined shape: first every part in navy with a thick edge,
    # then every part again in yellow on top. Only the outer edge of the navy stays visible.
    outline = [x.replace(' fill="none"', f' fill="{N}" stroke="{N}" stroke-width="3.4" stroke-linejoin="round"') for x in parts]
    fill = [x.replace(' fill="none"', f' fill="{Y}"') for x in parts]
    return 24, 38, outline + fill

# ---- SVG -> Android VectorDrawable ----
def rect_d(x, y, w, h, r):
    if r <= 0: return f"M{x},{y}h{w}v{h}h{-w}z"
    return (f"M{x + r},{y}h{w - 2 * r}a{r},{r} 0 0 1 {r},{r}v{h - 2 * r}a{r},{r} 0 0 1 {-r},{r}h{-(w - 2 * r)}"
            f"a{r},{r} 0 0 1 {-r},{-r}v{-(h - 2 * r)}a{r},{r} 0 0 1 {r},{-r}z")
def oval_d(cx, cy, rx, ry): return f"M{cx - rx},{cy}a{rx},{ry} 0 1 0 {2 * rx},0a{rx},{ry} 0 1 0 {-2 * rx},0z"

def to_android(w, h, shapes, note):
    lines = [f"<!-- {note} Made by docs/design/landmarks/make_landmarks.py: edit there, not here. -->",
             '<vector xmlns:android="http://schemas.android.com/apk/res/android"',
             f'    android:width="{w}dp" android:height="{h}dp" android:viewportWidth="{w}" android:viewportHeight="{h}">']
    for s in shapes:
        e = ET.fromstring(s); g = lambda k, d=0.0: float(e.get(k, d))
        d = {"path": lambda: e.get("d"), "rect": lambda: rect_d(g("x"), g("y"), g("width"), g("height"), g("rx")),
             "circle": lambda: oval_d(g("cx"), g("cy"), g("r"), g("r")), "ellipse": lambda: oval_d(g("cx"), g("cy"), g("rx"), g("ry"))}[e.tag]()
        a = f'    <path android:pathData="{d}"'
        if e.get("fill", "none") != "none": a += f' android:fillColor="{e.get("fill")}"'
        if e.get("fill-opacity"): a += f' android:fillAlpha="{e.get("fill-opacity")}"'
        if e.get("stroke"): a += f' android:strokeColor="{e.get("stroke")}" android:strokeWidth="{e.get("stroke-width")}"'
        if e.get("stroke-linecap"): a += f' android:strokeLineCap="{e.get("stroke-linecap")}"'
        if e.get("stroke-linejoin"): a += f' android:strokeLineJoin="{e.get("stroke-linejoin")}"'
        lines.append(a + "/>")
    return "\n".join(lines) + "\n</vector>\n"

ALL = {"police": (police, "Police station: red and blue lights on the roof."), "hospital": (hospital, "Hospital with a red cross."),
       "bar": (bar, "Bar with a striped awning."), "catedral": (catedral, "Rio's cone-shaped cathedral."),
       "arcos": (arcos, "Arcos da Lapa aqueduct (the tram is its own picture)."), "tram": (tram, "The yellow Santa Teresa tram."),
       "steps": (steps, "Selarón steps: colored tile stairs."), "hostel": (hostel, "A hostel (blue roof)."),
       "person": (person, '"You are here": a yellow outlined stick figure.')}

if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__)); res = os.path.join(here, "..", "..", "..", "app", "src", "main", "res", "drawable")
    for name, (draw, note) in ALL.items():
        w, h, shapes = draw()
        open(os.path.join(here, f"{name}.svg"), "w").write(f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg">' + "".join(shapes) + "</svg>\n")
        open(os.path.join(res, f"landmark_{name}.xml"), "w").write(to_android(w, h, shapes, note))
    print("wrote", len(ALL), "pictures")
