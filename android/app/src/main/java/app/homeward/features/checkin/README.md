# features/checkin/
"I'm OK" check-ins: peace of mind for family, no live tracking.
- `CheckInMessage.kt`: pure logic. The text, with a map link only if she allowed it.
- `LocationSharing.kt`: her choice from onboarding (off by default).
- `CheckInSender.kt`: texts it to every trusted contact. Button on the Home sheet.
