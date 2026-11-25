import SwiftUI

// Her name, the list of trusted contacts and the "add person" form. Shared by setup step 2 and the
// Contacts screen opened from Home. Saves on every change.
struct ContactsEditor: View {
    // Setup (Figma "04") shows a green tick on each person; the Contacts screen from Home shows a remove button.
    // Either way, a long press on a person offers Remove.
    var showsRemove: Bool = false
    @EnvironmentObject private var store: LocalStore
    @State private var name = ""
    @State private var phone = ""
    @State private var picking = false
    @FocusState private var typing: Bool   // a text field here has the keyboard

    private var phoneOk: Bool { PhoneNumber.isValid(phone) }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if !store.contacts.isEmpty {
                VStack(spacing: BeaconSpacing.cards) {
                    ForEach(Array(store.contacts.enumerated()), id: \.element.id) { index, contact in row(contact, index: index) }
                }
            }
            // Figma "04": a dashed outline, a blue plus and blue text.
            Button { picking = true } label: {
                Label { Text("Choose from contacts").style(.label, color: BeaconColors.primary) } icon: {
                    Image(systemName: "plus").font(.system(size: 18, weight: .medium)).foregroundStyle(BeaconColors.primary)
                }
                .frame(maxWidth: .infinity, minHeight: 56, alignment: .leading).padding(.horizontal, 20)
                .overlay(RoundedRectangle(cornerRadius: BeaconRadius.card, style: .continuous).stroke(BeaconColors.border, style: StrokeStyle(lineWidth: 1.5, dash: [6, 5])))
                .contentShape(RoundedRectangle(cornerRadius: BeaconRadius.card, style: .continuous))
            }
            .buttonStyle(.plain)
            Text("or type one in").style(.small).padding(.top, 4)
            field("Their name, e.g. Mom", text: $name)
            field("Phone with country code, e.g. +972…", text: $phone).keyboardType(.phonePad)
            if !phone.isEmpty && !phoneOk { Text("Use the full number with country code, like +972501234567.").style(.small, color: BeaconColors.red) }
            Button { add(name, phone); name = ""; phone = "" } label: {
                Text("+ Add person").style(.label, color: canAdd ? BeaconColors.primary : BeaconColors.textMuted).frame(maxWidth: .infinity, minHeight: 52)
                    .overlay(RoundedRectangle(cornerRadius: BeaconRadius.button, style: .continuous).stroke(BeaconColors.border, lineWidth: 1.5))
            }
            .buttonStyle(.plain).disabled(!canAdd)

            // About her: the name and pronoun the messages use.
            Text("About you").style(.heading).padding(.top, 12)
            field("Your first name", text: $store.profile.name).textContentType(.givenName)
            pronouns
        }
        // The phone keypad has no return key, so the keyboard gets a Done key of its own.
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") { typing = false }.font(TextLook.label.font)
            }
        }
        .sheet(isPresented: $picking) {
            ContactPicker { pickedName, pickedPhone in
                // Numbers with a country code are added straight away; others go into the form so she can add the code.
                if PhoneNumber.isValid(pickedPhone) { add(pickedName, pickedPhone) } else { name = pickedName; phone = pickedPhone }
            }
            .ignoresSafeArea()
        }
    }

    private var canAdd: Bool { !name.isBlank && phoneOk }

    private func add(_ name: String, _ phone: String) {
        store.contacts.append(TrustedContact(name: name.trimmingCharacters(in: .whitespacesAndNewlines), phone: PhoneNumber.clean(phone)))
    }

    // How messages refer to her after the first mention. Her name is the default: no pronoun is assumed.
    private var pronouns: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("In messages, refer to me as").style(.small)
            HStack(spacing: 8) {
                ForEach(Pronoun.allCases, id: \.self) { option in
                    let on = store.profile.pronoun == option
                    Button { store.profile.pronoun = option } label: {
                        Text(label(option)).style(.small, color: on ? .white : BeaconColors.text).padding(.horizontal, 14).frame(minHeight: 44)
                            .background(on ? BeaconColors.primary : BeaconColors.surface).clipShape(Capsule())
                    }
                    .buttonStyle(.plain).accessibilityAddTraits(on ? .isSelected : [])
                }
            }
        }
    }

    private func label(_ pronoun: Pronoun) -> String {
        switch pronoun { case .useName: "my name"; case .she: "she"; case .he: "he"; case .they: "they" }
    }

    // Figma "04": the initial on a soft circle (blue, amber, green in turn), name, number, a green tick.
    private static let avatarColors: [(letter: Color, circle: Color)] = [
        (BeaconColors.primary, BeaconColors.primaryTint), (BeaconColors.amber, BeaconColors.amberTint), (BeaconColors.green, BeaconColors.primaryTint),
    ]

    private func row(_ contact: TrustedContact, index: Int) -> some View {
        let colors = Self.avatarColors[index % Self.avatarColors.count]
        let remove = { store.contacts.removeAll { $0 == contact } }
        return WhiteCard(padding: 14) {
            HStack(spacing: 14) {
                Text(contact.initial).font(BeaconFonts.sora(20, weight: 600)).foregroundStyle(colors.letter)
                    .frame(width: 44, height: 44).background(colors.circle).clipShape(Circle())
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 2) { Text(contact.name).style(.label); Text(contact.phone).style(.small) }
                Spacer(minLength: 0)
                if showsRemove {
                    Button(action: remove) {
                        Image(systemName: "xmark").foregroundStyle(BeaconColors.textMuted).frame(width: 44, height: 44)
                    }
                    .accessibilityLabel("Remove \(contact.name)")
                } else {
                    Image(systemName: "checkmark").font(.system(size: 18, weight: .semibold)).foregroundStyle(BeaconColors.green)
                        .frame(width: 44, height: 44).accessibilityHidden(true)
                }
            }
        }
        .contextMenu { Button("Remove \(contact.name)", systemImage: "trash", role: .destructive, action: remove) }
        .accessibilityAction(named: "Remove \(contact.name)", remove)
    }

    private func field(_ placeholder: String, text: Binding<String>) -> some View {
        TextField(placeholder, text: text).font(TextLook.body.font).foregroundStyle(BeaconColors.text).autocorrectionDisabled().focused($typing)
            .padding(.horizontal, 16).frame(minHeight: 52).background(BeaconColors.surface).clipShape(RoundedRectangle(cornerRadius: BeaconRadius.field, style: .continuous))
    }
}
