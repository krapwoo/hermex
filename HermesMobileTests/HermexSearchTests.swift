import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for the custom Hermex Search foundation (`HermexSearch.swift`): one canonical visual
/// component, `HermexSearchField`, plus `.hermexSearch(...)`, a convenience modifier that composes
/// that same field as a persistent top content inset. Native `.searchable` and `SearchFieldPlacement`
/// are retired for the visible experience — the system-backed `TextField` still owns text editing,
/// selection, dictation, IME/composition, and platform accessibility. A SwiftUI view tree isn't
/// inspectable at runtime without a rendering harness, so this is a compile contract plus a source
/// contract that pins the field's chrome, local focus, clear, and keyboard-submit wiring.
final class HermexSearchTests: XCTestCase {
    private func resourceURL(_ relativePath: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent(relativePath)
    }

    private func source(_ relativePath: String) throws -> String {
        try String(contentsOf: resourceURL(relativePath), encoding: .utf8)
    }

    // MARK: - Compile contracts
    //
    // Now that `HermexSearchField` and `.hermexSearch` are real production symbols, these host
    // views compile-check the approved API shape directly — the enabled/disabled field, an omitted
    // prompt, and an omitted submission callback — in addition to the source contracts below, which
    // stay in place to pin the exact chrome/focus/clear/keyboard-submit wiring a compile check alone
    // can't see.

    @MainActor
    func testCustomFieldAndConvenienceModifierCompileFromOneAPI() {
        struct Host: View {
            @State var query = ""
            var body: some View {
                VStack {
                    HermexSearchField(
                        "Search sessions",
                        text: $query,
                        prompt: Text("Search sessions"),
                        onSubmit: {}
                    )
                    List {}
                        .hermexSearch(
                            "Search sessions",
                            text: $query,
                            prompt: Text("Search sessions")
                        )
                }
            }
        }
        XCTAssertFalse(String(describing: type(of: Host())).isEmpty)
    }

    @MainActor
    func testDisabledFieldCompiles() {
        struct Host: View {
            var body: some View {
                HermexSearchField("Search sessions", text: .constant("Read only"), isEnabled: false)
            }
        }
        XCTAssertFalse(String(describing: type(of: Host())).isEmpty)
    }

    @MainActor
    func testOmittedPromptAndSubmissionCallbackCompile() {
        struct Host: View {
            @State var query = ""
            var body: some View {
                HermexSearchField("Search sessions", text: $query)
            }
        }
        XCTAssertFalse(String(describing: type(of: Host())).isEmpty)
    }

    // MARK: - Approved API source contract

    func testApprovedFieldAndModifierSignaturesArePresent() throws {
        let src = try source("HermesMobile/Features/Shared/HermexSearch.swift")
        XCTAssertTrue(src.contains("struct HermexSearchField: View"))
        XCTAssertTrue(src.contains("_ titleKey: LocalizedStringKey"))
        XCTAssertTrue(src.contains("text: Binding<String>"))
        XCTAssertTrue(src.contains("prompt: Text? = nil"))
        XCTAssertTrue(src.contains("isEnabled: Bool = true"))
        XCTAssertTrue(src.contains("onSubmit: @escaping () -> Void = {}"))
        XCTAssertTrue(src.contains("func hermexSearch("))
    }

    // MARK: - Source contract: one custom visual implementation

    func testDefinesOneCanonicalVisualImplementationAndOneConvenienceModifier() throws {
        let src = try source("HermesMobile/Features/Shared/HermexSearch.swift")
        XCTAssertTrue(src.contains("struct HermexSearchField"), "expected one canonical visual component")
        XCTAssertTrue(src.contains("func hermexSearch("), "expected the convenience composition modifier")
    }

    func testOwnsLocalFocusAroundTheSystemBackedEditor() throws {
        let src = try source("HermesMobile/Features/Shared/HermexSearch.swift")
        XCTAssertTrue(src.contains("@FocusState"), "expected the field to own its local focus state")
        XCTAssertTrue(src.contains("TextField("), "expected the system-backed TextField to remain the editor")
    }

    func testWiresKeyboardSearchSubmission() throws {
        let src = try source("HermesMobile/Features/Shared/HermexSearch.swift")
        XCTAssertTrue(src.contains(".submitLabel(.search)"), "expected the keyboard Search submit label")
        XCTAssertTrue(src.contains(".onSubmit"), "expected submission to be wired through onSubmit")
    }

    func testFocusStateAnimationUsesTheExistingQualifiedMotionBundle() throws {
        let src = try source("HermesMobile/Features/Shared/HermexSearch.swift")
        XCTAssertTrue(
            src.contains("HermesMotion.animation(for: HermesMotion.Bundle.stateChange)"),
            "expected Search to reuse the existing qualified stateChange bundle"
        )
        XCTAssertFalse(
            src.contains("HermesMotion.animation(for: .stateChange)"),
            "the shorthand resolves against MotionBundle, which does not define stateChange"
        )
    }

    func testShowsAConditionalClearControlWithAnIndependentFortyFourPointTarget() throws {
        let src = try source("HermesMobile/Features/Shared/HermexSearch.swift")
        XCTAssertTrue(
            src.contains("!text.isEmpty"),
            "expected the clear control to be conditional on a nonempty query"
        )
        XCTAssertTrue(src.contains("Clear search"), "expected the clear control's accessible name")
        XCTAssertTrue(
            src.contains("minWidth: 44, minHeight: 44") || src.contains("minHeight: 44, minWidth: 44"),
            "expected the clear control to keep an independent 44pt minimum hit target"
        )
    }

    func testSearchIconsUseTheFixedHermexIconScaleInsteadOfBallooningWithAccessibilityText() throws {
        let src = try source("HermesMobile/Features/Shared/HermexSearch.swift")
        let fixedIconOccurrences = src.components(
            separatedBy: ".font(.system(size: HermesIconSize.small"
        ).count - 1
        XCTAssertGreaterThanOrEqual(
            fixedIconOccurrences,
            2,
            "both Search symbols need the fixed Hermex icon scale while text and hit targets remain accessible"
        )
    }

    func testInsertsTheFieldAsAPersistentTopSafeAreaInset() throws {
        let src = try source("HermesMobile/Features/Shared/HermexSearch.swift")
        XCTAssertTrue(
            src.contains("safeAreaInset(edge: .top"),
            "expected the convenience modifier to insert the field as a persistent top content inset"
        )
    }

    func testRemainsReachableFromTheDebugOverlayLab() throws {
        let src = try source("HermesMobile/Features/Shared/HermexOverlayLab.swift")
        XCTAssertTrue(
            src.contains("--hermex-overlay-lab-search"),
            "expected a deterministic launch flag scrolling straight to the Search fixtures"
        )
        XCTAssertTrue(
            src.contains("overlay-lab-search-section"),
            "expected a deterministic scroll anchor for the Search section"
        )
        XCTAssertTrue(
            src.contains("overlay-lab-search-field"),
            "expected the enabled direct-field fixture to carry a deterministic accessibility identifier"
        )
        XCTAssertTrue(
            src.contains("overlay-lab-search-field-disabled"),
            "expected a disabled direct-field fixture to be reachable in the DEBUG lab"
        )
        XCTAssertTrue(
            src.contains("overlay-lab-search-modifier-list"),
            "expected a .hermexSearch(...) convenience-modifier fixture so its inset geometry is inspectable"
        )
    }

    func testDebugFixturePluralizesSubmitCount() throws {
        let src = try source("HermesMobile/Features/Shared/HermexOverlayLab.swift")
        XCTAssertTrue(
            src.contains("submitCount == 1 ? \"time\" : \"times\""),
            "expected the Search fixture to say one time and multiple times"
        )
    }

    // MARK: - Source contract: clear-with-focus-retained and disabled-resigns-focus

    func testClearEmptiesTheQueryAndRetainsFocus() throws {
        let src = try source("HermesMobile/Features/Shared/HermexSearch.swift")
        XCTAssertTrue(src.contains("text = \"\""), "expected clear to empty the query")
        XCTAssertTrue(src.contains("isFocused = true"), "expected clear to retain/restore focus")
    }

    func testDisablingResignsFocusWhilePreservingText() throws {
        let src = try source("HermesMobile/Features/Shared/HermexSearch.swift")
        XCTAssertTrue(
            src.contains("onChange(of: isEnabled)"),
            "expected the field to observe the enabled state transitioning to false"
        )
        XCTAssertTrue(src.contains("isFocused = false"), "expected disabling to resign focus")
    }

    // MARK: - Source contract: no native .searchable, no SearchFieldPlacement, no Cancel label

    func testDoesNotCallNativeSearchable() throws {
        let src = try source("HermesMobile/Features/Shared/HermexSearch.swift")
        XCTAssertFalse(src.contains("searchable("), "the visible Search experience must not call .searchable")
    }

    func testRetiresSearchFieldPlacement() throws {
        let src = try source("HermesMobile/Features/Shared/HermexSearch.swift")
        XCTAssertFalse(
            src.contains("SearchFieldPlacement"),
            "SearchFieldPlacement is retired; Hermex cannot truthfully reproduce native navigation-drawer placement"
        )
    }

    func testHasNoVisibleCancelLabelOrAction() throws {
        let src = try source("HermesMobile/Features/Shared/HermexSearch.swift")
        XCTAssertFalse(
            src.contains("\"Cancel\""),
            "there is no visible Cancel label; clear and exit-focus remain distinct actions"
        )
    }
}
