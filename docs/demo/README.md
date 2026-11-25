# docs/demo

A recorded walk in Lapa for demos and testing: from the bar, around the red zone on Rua dos Inválidos, along Av. Mem de Sá to the police station. About 860 m, 73 points.

- `lapa-walk.gpx`: load it in the Android emulator (Extended controls > Location > Routes > Import GPX) or attach it to an Xcode scheme to simulate the walk.
- `lapa-walk.csv`: the same points as `lat,lng`.
- `play-route.sh`: plays the walk into a running Android emulator from the terminal (`./docs/demo/play-route.sh`, or `./docs/demo/play-route.sh 0.5` for a point every half second).

The points are the drawn Lapa map's grid turned into coordinates, so the green dot follows the streets on the illustrated map. `shared/fixtures/demo-incident.json` is an incident on this same walk.
