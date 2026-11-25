import SwiftUI

// Her name, the list of trusted contacts and the "add person" form. Shared by setup step 2 and the
// Contacts screen opened from Home. Saves on every change.
struct ContactsEditor: View {
    @EnvironmentObject private var store: LocalStore
    @State private var name = ""
    @State private var phone = ""
    @State private var picking = false
    @FocusState private var typing: Bool   // a text field here has the keyboard

    private var phoneOk: Bool { PhoneNumber.isValid(phone) }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            field("Your first name", text: $store.profile.name).textContentType(.givenName)
            pronouns

            if !store.contacts.isEmpty {
                VStack(spacing: 10) { ForEach(store.contacts) { row($0) } }
            }
            Button { picking = true } label: {
                Label("Choose from contacts", systemImage: "plus").font(TextLook.label.font).foregroundStyle(BeaconColors.primary)
                    .frame(maxWidth: .infinity, minHeight: 56, alignment: .leading).padding(.horizontal, 18)
                    .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(BeaconColors.border, style: StrokeStyle(lineWidth: 1.5, dash: [6, 5])))
            }
            .buttonStyle(.plain)
            Text("or type one in").style(.small)
            field("Their name, e.g. Mom", text: $name)
            field("Phone with country code, e.g. +972…", text: $phone).keyboardType(.phonePad)
            if !phone.isEmpty && !phoneOk { Text("Use the full number with country code, like +972501234567.").style(.small, color: BeaconColors.red) }
            Button { add(name, phone); name = ""; phone = "" } label: {
                Text("+ Add person").style(.label, color: canAdd ? BeaconColors.primary : BeaconColors.textMuted).frame(maxWidth: .infinity, minHeight: 52)
                    .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(BeaconColors.border, lineWidth: 1.5))
            }
            .buttonStyle(.plain).disabled(!canAdd)
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

    private func row(_ contact: TrustedContact) -> some View {
        WhiteCard(padding: 14) {
            HStack(spacing: 14) {
                Text(contact.initial).style(.heading, color: BeaconColors.primary).frame(width: 44, height: 44).background(BeaconColors.primaryTint).clipShape(Circle())
                VStack(alignment: .leading, spacing: 2) { Text(contact.name).style(.label); Text(contact.phone).style(.small) }
                Spacer(minLength: 0)
                Button { store.contacts.removeAll { $0 == contact } } label: {
                    Image(systemName: "xmark").foregroundStyle(BeaconColors.textMuted).frame(width: 44, height: 44)
                }
                .accessibilityLabel("Remove \(contact.name)")
            }
        }
    }

    private func field(_ placeholder: String, text: Binding<String>) -> some View {
        TextField(placeholder, text: text).font(TextLook.body.font).foregroundStyle(BeaconColors.text).autocorrectionDisabled().focused($typing)
            .padding(.horizontal, 16).frame(minHeight: 52).background(BeaconColors.surface).clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}
