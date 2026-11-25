import Foundation
import XCTest

// Loads the cases in shared/test-vectors/ (at the repo root) and compares what the Swift logic
// returns with the expected values. Android and web run the same files, so the three ports cannot
// drift apart. Format: shared/test-vectors/README.md.

// Any JSON value, so a case's input and expected output can be read without one struct per case.
indirect enum J: Equatable {
    case null, bool(Bool), number(Double), string(String), array([J]), object([String: J])

    // From what JSONSerialization returns (much faster than trying each type in turn).
    init(_ any: Any) {
        switch any {
        case let n as NSNumber where CFGetTypeID(n) == CFBooleanGetTypeID(): self = .bool(n.boolValue)
        case let n as NSNumber: self = .number(n.doubleValue)
        case let s as String: self = .string(s)
        case let a as [Any]: self = .array(a.map(J.init))
        case let o as [String: Any]: self = .object(o.mapValues(J.init))
        default: self = .null
        }
    }

    subscript(key: String) -> J { if case .object(let o) = self { return o[key] ?? .null }; return .null }
    var string: String? { if case .string(let s) = self { return s }; return nil }
    var double: Double { if case .number(let n) = self { return n }; return .nan }
    var int: Int { Int(double) }
    var millis: Int64 { Int64(double) }
    var bool: Bool { if case .bool(let b) = self { return b }; return false }
    var items: [J] { if case .array(let a) = self { return a }; return [] }
    var isNull: Bool { self == .null }

    // Turns this value into one of the app's own types (a pack zone, a fix, a profile...).
    func decode<T: Decodable>(_ type: T.Type = T.self) throws -> T {
        try JSONDecoder().decode(T.self, from: JSONSerialization.data(withJSONObject: any, options: [.fragmentsAllowed]))
    }
    func decodeOrNil<T: Decodable>(_ type: T.Type = T.self) throws -> T? { isNull ? nil : try decode(T.self) }

    private var any: Any {
        switch self {
        case .null: return NSNull()
        case .bool(let b): return b
        case .number(let n): return n
        case .string(let s): return s
        case .array(let a): return a.map(\.any)
        case .object(let o): return o.mapValues(\.any)
        }
    }

    static func text(_ s: String?) -> J { s.map(J.string) ?? .null }
    static func num(_ n: Int64?) -> J { n.map { .number(Double($0)) } ?? .null }
    static func flag(_ b: Bool?) -> J { b.map(J.bool) ?? .null }

    // Equal JSON, where numbers may differ by `tolerance` (metres from different math libraries).
    static func same(_ a: J, _ b: J, tolerance: Double) -> Bool {
        switch (a, b) {
        case (.null, .null): return true
        case (.number(let x), .number(let y)): return abs(x - y) <= tolerance + 1e-9
        case (.array(let x), .array(let y)): return x.count == y.count && zip(x, y).allSatisfy { same($0, $1, tolerance: tolerance) }
        case (.object(let x), .object(let y)): return Set(x.keys) == Set(y.keys) && x.allSatisfy { same($0.value, y[$0.key]!, tolerance: tolerance) }
        default: return a == b
        }
    }
}

enum Vectors {

    static let folder = Repo.root.appendingPathComponent("shared/test-vectors")

    // Runs every case in one file. Returns how many ran, so a test can check none were skipped.
    @discardableResult
    static func run(_ name: String, file: StaticString = #filePath, line: UInt = #line, compute: (_ fn: String, _ input: J) throws -> J) -> Int {
        do {
            let root = J(try JSONSerialization.jsonObject(with: Data(contentsOf: folder.appendingPathComponent(name))))
            let cases = root["cases"].items
            XCTAssertFalse(cases.isEmpty, "\(name) has no cases", file: file, line: line)
            for c in cases {
                let actual = try compute(c["fn"].string ?? "", c["input"])
                let tolerance = c["tolerance"].isNull ? 0 : c["tolerance"].double
                XCTAssertTrue(J.same(c["expected"], actual, tolerance: tolerance),
                              "\(name) / \(c["name"].string ?? "?"):\n expected \(c["expected"])\n but got  \(actual)", file: file, line: line)
            }
            return cases.count
        } catch {
            XCTFail("\(name): \(error)", file: file, line: line)
            return 0
        }
    }

    struct UnknownFunction: Error { let fn: String }
}
