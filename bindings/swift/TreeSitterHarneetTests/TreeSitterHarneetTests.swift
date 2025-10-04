import XCTest
import SwiftTreeSitter
import TreeSitterHarneet

final class TreeSitterHarneetTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_harneet())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Harneet grammar")
    }
}
