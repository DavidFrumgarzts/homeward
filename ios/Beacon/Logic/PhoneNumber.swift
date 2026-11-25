import Foundation

// PURE LOGIC: cleans up a typed phone number and checks it can receive a text.
// Keeps a leading "+" and digits only. International format (+country code) is required,
// because travelers' contacts are usually in another country. Same as Android's PhoneNumber.kt.
enum PhoneNumber {
    static func clean(_ raw: String) -> String {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        let digits = trimmed.filter { $0.isASCII && $0.isNumber }
        return trimmed.hasPrefix("+") ? "+\(digits)" : digits
    }

    // E.164: "+" then 8 to 15 digits, e.g. +972501234567 or +12035551234.
    static func isValid(_ raw: String) -> Bool {
        let c = clean(raw)
        return c.hasPrefix("+") && (8...15).contains(c.count - 1)
    }
}

// "Mom", "Mom and Dad", "Mom, Dad and Alwis"
enum Names {
    static func join(_ names: [String]) -> String {
        switch names.count {
        case 0: return ""
        case 1: return names[0]
        default: return names.dropLast().joined(separator: ", ") + " and " + names[names.count - 1]
        }
    }
}
