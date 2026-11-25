# shared/prompts

The text of Beacon's AI prompts, with `{placeholders}` each app fills in. Android's Kotlin templates are the source (`SharedPromptsTest` fails if a file here differs from them).

| File | Used for | Runs | Placeholders |
|---|---|---|---|
| `pack-research.txt` | Researching a city into a safety pack | Cloud only, with Google Search | `{who}` ("a British traveler"), `{city}`, `{country}` |
| `ask-beacon.txt` | Answering a question from the saved pack | On device first, cloud fallback | `{city}`, `{country}`, `{clock}` ("11pm"), `{police}`, `{ambulance}`, `{embassyName}`, `{embassyPhone}`, `{zones}`, `{safer}`, `{places}`, `{phrases}`, `{chat}`, `{question}` |
| `sos-sentence.txt` | Rewriting her words into one clear sentence | On device first, cloud fallback | `{name}`, `{refer}` (how to refer to her), `{note}` |

Rules every prompt keeps: the model only rewrites or answers from the facts it is handed. Phone numbers, places and coordinates are never asked of the model in the SOS; they are added by code. Fill `{question}` and `{note}` last, so her own words cannot fill another placeholder.
