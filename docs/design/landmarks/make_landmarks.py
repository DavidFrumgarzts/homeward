#!/usr/bin/env python3
"""Draws Beacon's map pictures and saves each one twice:
  - an .svg file here (paste into Figma, components "Landmark/...")
  - an Android picture in app/src/main/res/drawable/landmark_<name>.xml
Change a shape here, run `python3 docs/design/landmarks/make_landmarks.py` from the repo root,
and both stay in sync. Only simple shapes are used (path, rect, circle) so the conversion to Android is exact.

Places are small badges: a rounded square in the place's color, a white edge, and a white symbol.
(Same idea as the round pins in phone map apps, but square-ish, so they are ours.)"""
import os, xml.etree.ElementTree as ET

WHITE = "#FFFFFF"
S = 26                                   # every badge is 26 x 26

def attrs(fill=None, stroke=None, sw=None, cap=None, join=None):
    a = f' fill="{fill or "none"}"'
    if stroke: a += f' stroke="{stroke}" stroke-width="{sw}"'
    if cap: a += f' stroke-linecap="{cap}"'
    if join: a += f' stroke-linejoin="{join}"'
    return a
def path(d, **k): return f'<path d="{d}"{attrs(**k)}/>'
def rect(x, y, w, h, rx=0, **k): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"{attrs(**k)}/>'
def circle(cx, cy, r, **k): return f'<circle cx="{cx}" cy="{cy}" r="{r}"{attrs(**k)}/>'
def line(d, w=1.9): return path(d, stroke=WHITE, sw=w, cap="round", join="round")

def badge(color, symbol):
    return S, S, [rect(0, 0, S, S, 8.5, fill=WHITE), rect(2, 2, S - 4, S - 4, 6.5, fill=color), *symbol]

def police():   return badge("#2F6BFF", [path("M13,6.3 l5,2 v3.7 c0,3.3 -2.2,5.5 -5,6.6 c-2.8,-1.1 -5,-3.3 -5,-6.6 v-3.7 z", fill=WHITE)])
def hospital(): return badge("#E5484D", [rect(11.2, 7, 3.6, 12, 1, fill=WHITE), rect(7, 11.2, 12, 3.6, 1, fill=WHITE)])
def bar():      return badge("#F2994A", [path("M7.6,7.8 h10.8 l-5.4,6 z", fill=WHITE), line("M13,13.8 v4.6 M10.2,18.8 h5.6", 1.7)])
def catedral(): return badge("#8B6FE8", [line("M13,6.6 v12.8 M9.2,10.6 h7.6", 2.2)])
def arcos():    return badge("#1FA89A", [line("M6.6,8.6 H19.4 M6.6,19.2 H19.4 M7.6,19 V14 a2.7,2.7 0 0 1 5.4,0 V19 M13,14 a2.7,2.7 0 0 1 5.4,0 V19", 1.7)])
def steps():    return badge("#E8589A", [line("M6.8,19 h3.6 v-3.6 h3.6 v-3.6 h3.6 v-3.6 h1.8", 2)])
def hostel():   return badge("#2F6BFF", [line("M7,18.6 v-9.4 M7,15.2 h12 v3.4 M19,15.2 v-2 a2.2,2.2 0 0 0 -2.2,-2.2 h-4.6 v4.2", 1.7), circle(9.9, 12.3, 1.4, fill=WHITE)])

# ---- SVG -> Android VectorDrawable ----
def rect_d(x, y, w, h, r):
    if r <= 0: return f"M{x},{y}h{w}v{h}h{-w}z"
    return (f"M{x + r},{y}h{w - 2 * r}a{r},{r} 0 0 1 {r},{r}v{h - 2 * r}a{r},{r} 0 0 1 {-r},{r}h{-(w - 2 * r)}"
            f"a{r},{r} 0 0 1 {-r},{-r}v{-(h - 2 * r)}a{r},{r} 0 0 1 {r},{-r}z")
def oval_d(cx, cy, r): return f"M{cx - r},{cy}a{r},{r} 0 1 0 {2 * r},0a{r},{r} 0 1 0 {-2 * r},0z"

def to_android(w, h, shapes, note):
    lines = [f"<!-- {note} Made by docs/design/landmarks/make_landmarks.py: edit there, not here. -->",
             '<vector xmlns:android="http://schemas.android.com/apk/res/android"',
             f'    android:width="{w}dp" android:height="{h}dp" android:viewportWidth="{w}" android:viewportHeight="{h}">']
    for s in shapes:
        e = ET.fromstring(s); g = lambda k, d=0.0: float(e.get(k, d))
        d = {"path": lambda: e.get("d"), "rect": lambda: rect_d(g("x"), g("y"), g("width"), g("height"), g("rx")),
             "circle": lambda: oval_d(g("cx"), g("cy"), g("r"))}[e.tag]()
        a = f'    <path android:pathData="{d}"'
        if e.get("fill", "none") != "none": a += f' android:fillColor="{e.get("fill")}"'
        if e.get("stroke"): a += f' android:strokeColor="{e.get("stroke")}" android:strokeWidth="{e.get("stroke-width")}"'
        if e.get("stroke-linecap"): a += f' android:strokeLineCap="{e.get("stroke-linecap")}"'
        if e.get("stroke-linejoin"): a += f' android:strokeLineJoin="{e.get("stroke-linejoin")}"'
        lines.append(a + "/>")
    return "\n".join(lines) + "\n</vector>\n"

ALL = {"police": (police, "Police: blue badge with a shield."), "hospital": (hospital, "Hospital: red badge with a cross."),
       "bar": (bar, "Bar: orange badge with a glass."), "catedral": (catedral, "Cathedral: purple badge with a cross."),
       "arcos": (arcos, "Arcos da Lapa: teal badge with arches."), "steps": (steps, "Selarón steps: pink badge with stairs."),
       "hostel": (hostel, "Hostel: blue badge with a bed.")}

if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__)); res = os.path.join(here, "..", "..", "..", "app", "src", "main", "res", "drawable")
    for name, (draw, note) in ALL.items():
        w, h, shapes = draw()
        open(os.path.join(here, f"{name}.svg"), "w").write(f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg">' + "".join(shapes) + "</svg>\n")
        open(os.path.join(res, f"landmark_{name}.xml"), "w").write(to_android(w, h, shapes, note))
    print("wrote", len(ALL), "pictures")
