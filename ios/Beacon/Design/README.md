# Design/
Look and feel. Matches the Figma file "Beacon v2" and Android's `design/`.
- `Colors.swift`: every color. Red is only for SOS, the police call and red zones; green for OK.
- `Type.swift`: the two fonts (Sora for headings, Inter for body) and the text sizes. Use `Text("…").style(.title)`.
- `Theme.swift`: corner radii, spacing and control heights (same numbers as David's Android components), the `status` text look, and David's Android names `IconCircle` / `ProgressDots`.
- `Components/`: reusable UI pieces.
