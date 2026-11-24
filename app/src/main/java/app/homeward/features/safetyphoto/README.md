# features/safetyphoto/
- `SafetyPhotoReader.kt`: on-device AI reads the photo (taxi plate, sign).
- `PhotoOutbox.kt`: keeps notes on the phone until there is a connection.
- `OutboxSender.kt`: when back online, texts each note to every trusted contact. Triggered from `app/HomewardApplication.kt`.
