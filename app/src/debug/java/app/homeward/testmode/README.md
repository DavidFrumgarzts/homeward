# testmode/ (debug builds only)
- `TestMode.kt`: turns on "Test mode: no real SMS" (default on an emulator) and keeps the list of texts that would have been sent.
- `FakeSmsGateway.kt`: stands in for the phone's radio. Sends nothing; reports each text as sent, then delivered.

Release builds compile `app/src/release/java/app/homeward/testmode/TestMode.kt` instead, where test mode does not exist.
