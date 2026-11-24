# features/
One folder per feature. Each file says at the top what it does and whether it uses on-device AI, cloud AI, or no AI.
| Folder | Feature | Runs |
|---|---|---|
| `home/` | Map-first home: map, red-zone alert, SOS sheet | UI |
| `sos/` | Write and send the SOS | on-device AI + SMS/push |
| `safetypack/` | Country safety pack (numbers, places, zones) | cloud AI once, then offline |
| `safetymap/` | Map drawing + red-zone logic (shown on Home) | offline logic + on-device AI |
| `safeplace/` | Pick the nearest open safe place | offline logic |
| `offlinemap/` | Google Maps-like map, saved to the phone per city | download once on wifi |
| `safetyphoto/` | Read taxi plates etc., send when back online | on-device AI |
| `contacts/` | Edit who gets the SOS | UI, saved on phone |
| `policecall/` | One-tap call to local police | phone dialer |
