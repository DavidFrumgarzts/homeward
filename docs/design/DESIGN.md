# Beacon design (approved version)

This is the design David approved on 2026-11-24. The source is the Figma file
[`jCWSWsN9Cf2zJBWWP4n5Pf`](https://www.figma.com/design/jCWSWsN9Cf2zJBWWP4n5Pf), page "Beacon v2"
(checked against this folder on 2026-11-25). It matches git commit `f6beff0`.
If the app or the web page looks different from the pictures in `screens/`, the pictures win.

## What's in this folder
- `screens/`: the nine screens, in order, exported from Figma at 2x (786 x 1704).
- `map-lapa.svg`: the drawn Lapa map. `landmarks/`: the place badges (and `make_landmarks.py`, which draws them).
- `cop/`: the cartoon cop in the chat.

The design in code (change these, not copies):

| What | Android | Web |
|---|---|---|
| Colors | `app/src/main/java/app/homeward/design/Colors.kt` | `web/styles.css` |
| Type | `app/src/main/java/app/homeward/design/Type.kt` | `web/styles.css` |
| Map | `app/.../features/lapamap/LapaMapDrawing.kt`, `LapaIllustratedMap.kt` | `web/js/map.js` |
| Cop | `app/.../features/ask/BeaconCop.kt` | `web/js/cop.js` |

## Rules David set (do not undo these)
- No "AI look": no uppercase tag chips ("OFFLINE READY"), no glows, no gradients, no dark navy screens.
- No subheadlines under screen titles. No text that has no tangible benefit to the user.
- The map is light grey with white streets. Not cream, not dark blue.
- Places are small badges, not drawn buildings. The user is a green dot with an arrow, not a person.
- Red is only for SOS, the police call and the red zone.
- No "Based on a real case" line on the story screen.
- The cop is small (60 dp tall in the chat) and friendly, a classic cartoon officer.

## Colors
| Use | Hex |
|---|---|
| Page background (warm paper) | #F7F4EE |
| Cards | #FFFFFF |
| Lines and borders | #E3DED4 |
| Text | #101A33 |
| Muted text | #5E6880 |
| Blue: buttons, links, route | #2F6BFF |
| Blue tint (icon tiles) | #E7EEFF |
| Red: SOS, police call, red zone | #E5484D |
| Red tint | #FDE4E4 |
| Green: OK, done, your dot | #22A06B |
| Green tint | #E4F4EC |
| Amber accent / tint | #E07A2B / #FFEBDA |

Map: ground #E9EBEE, streets #FFFFFF, parks #CFE6CB, cream blocks #FAF3DF, water #B9E0F7,
red zone fill #F4C3BC, red zone label #B4282D, trees #A5D3A0 with #5E9B6B outline,
street-name text #5E6880, place-name text #3C4658 with a white edge.

## Type
- Headings: Sora. Title 24/30 SemiBold (letter-spacing -0.4), Heading 18/24 SemiBold.
- Body: Inter. Body 16/24 Regular, Label 15/20 Medium, Small 13/18 Regular (muted).
- Map capitals ("RED ZONE", "AV. MEM DE SÁ"): Sora 10/12 SemiBold, letter-spacing 0.7.
- Place names under badges: Inter 10 SemiBold.

## Shapes
- Main button: full width, 56 high, radius 18, blue, white Label text.
- SOS button: 64 high, radius 20, red, Sora 18 SemiBold.
- Cards: white, radius 22, padding 14, no shadow.
- Icon tiles: 44 x 44, radius 14, tinted background.
- Bottom sheet on Home: page-background color, top corners radius 30.
- Chat bubbles: yours blue, radius 20 with a 6 corner bottom-right; Beacon's white, 6 corner bottom-left.
- Setup progress: equal bars across the top, 4 high, blue up to the current step.

## The map (`map-lapa.svg`)
- Drawn on a 393 x 520 grid. Stylized, not to scale. Cream blocks and water are decoration.
- Av. Mem de Sá is the wide white road (16 wide); two bigger streets are 8 wide; side streets 4.
- Red zone: a soft rounded patch on Rua dos Inválidos, drawn under the streets, label at its top.
- Place badges: 24 x 24 rounded squares (radius about 8), white edge, white symbol, name underneath.
  Police blue #2F6BFF (shield), hospital red #E5484D (cross), bar orange #F2994A (glass),
  cathedral purple #8B6FE8 (cross), Arcos da Lapa teal #1FA89A (arches), Selarón steps pink #E8589A (stairs).
- You: green dot (radius 7) with a white edge (9.5), a soft green circle pulsing under it, and a small
  green arrow on the side you are walking toward. No arrow while standing still.
- Motion: a ring pulses around the police badge; the circle pulses under your dot; in the story the
  walk draws itself over about two seconds.

## The screens
1. Story, without Beacon: map, a dotted walk from the bar into the red zone, one sentence, one button.
2. Story, with Beacon: same map, "Red zone ahead" card, blue route around the zone to a blue end dot.
3. Welcome: title, three feature cards (red zone warning, Ask Beacon, SOS), one button.
4. Who should hear from you?: contact cards, add from contacts, location switch.
5. One press: quick-settings tile mock (designed, not built).
6. Ready offline: four rows with DONE.
7. Home: map on top; sheet with Ask Beacon bar, two question chips, nearest safe place, I'm OK,
   Police 190, red SOS button.
8. Chat with Beacon: small cop at the top, bubbles, input bar at the bottom.
9. SOS sent: green check, "… know", the message, Call police, nearest safe place.
