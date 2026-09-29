import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for `HermexBottomSheet` (`HermexBottomSheet.swift`): a content scaffold supplied to
/// native `.sheet`, never a replacement for it. A SwiftUI view tree isn't inspectable at runtime
/// without a rendering harness, so this is a compile contract (the body slot genuinely accepts both
/// native `List` and arbitrary content, the footer slot accepts either axis, and the whole thing
/// composes inside a real `.sheet`) plus a source contract pinning the native composition — a
/// `NavigationStack`, this file's own `TopNav`, `.safeAreaInset` for the footer, and the explicit
/// absence of any custom presentation, transition, drag, or dimming behavior the caller's `.sheet`
/// already owns.
final class HermexBottomSheetTests: XCTestCase {
    private func resourceURL(_ relativePath: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent(relativePath)
    }

    private func source(_ relativePath: String) throws -> String {
        try String(contentsOf: resourceURL(relativePath), encoding: .utf8)
    }

    private func hermesBottomSheetSource() throws -> String {
        try source("HermesMobile/Features/Shared/HermexBottomSheet.swift")
    }

    // MARK: - Compile contracts

    @MainActor
    func testCompilesWithArbitraryBodyContentAndNoFooter() {
        struct Host: View {
            var body: some View {
                HermexBottomSheet("Add Attachment") {
                    VStack {
                        Text("Attach a file from Workspace.")
                    }
                }
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    /// The footer is documented as optional, so a caller must be able to omit it entirely using the
    /// explicit `content:` label form (not just trailing-closure syntax) with no other footer-shaped
    /// argument supplied.
    @MainActor
    func testCompilesWithNoFooterArgumentUsingTheLabeledContentForm() {
        struct Host: View {
            var body: some View {
                HermexBottomSheet("Information", content: { Text("Body") })
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    @MainActor
    func testCompilesWithANativeListBody() {
        struct Host: View {
            var body: some View {
                HermexBottomSheet("Choose a Source") {
                    List {
                        Text("Workspace file")
                        Text("Photo Library")
                    }
                }
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    @MainActor
    func testCompilesWithLeadingAndTrailingTopNavActions() {
        struct Host: View {
            var body: some View {
                HermexBottomSheet(
                    "New Task",
                    content: { Text("Body") },
                    leadingPrimary: { Button("Cancel") {} },
                    trailingPrimary: { Button("Save") {} }
                )
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    @MainActor
    func testCompilesWithAHorizontalFooterButtonStack() {
        struct Host: View {
            var body: some View {
                HermexBottomSheet(
                    "Add Attachment",
                    footerAxis: .horizontal,
                    content: { Text("Body") },
                    footer: {
                        Button("Cancel") {}
                        Button("Attach") {}
                    }
                )
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    @MainActor
    func testCompilesWithAVerticalFooterButtonStack() {
        struct Host: View {
            var body: some View {
                HermexBottomSheet(
                    "Choose a Source",
                    footerAxis: .vertical,
                    content: { Text("Body") },
                    footer: {
                        Button("Continue") {}
                        Button("Cancel") {}
                    }
                )
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    @MainActor
    func testFooterAxisDefaultsToHorizontalWhenOmitted() {
        struct Host: View {
            var body: some View {
                HermexBottomSheet("Add Attachment", content: { Text("Body") }, footer: {
                    Button("Cancel") {}
                })
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    /// The caller keeps owning `.sheet` itself — detents, drag indicator, interactive-dismiss
    /// policy, and dismissal — this only proves `HermexBottomSheet` is valid content for it.
    @MainActor
    func testComposesAsContentInsideANativeSheetPresentation() {
        struct Host: View {
            @State var isPresented = false
            var body: some View {
                Text("Screen")
                    .sheet(isPresented: $isPresented) {
                        HermexBottomSheet("Add Attachment") {
                            Text("Body")
                        }
                    }
                    .presentationDetents([.medium, .large])
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    // MARK: - Source contracts: native composition, no invented presentation behavior

    func testOwnsANavigationStackWithAnInlineNavigationTitle() throws {
        let src = try hermesBottomSheetSource()
        XCTAssertTrue(src.contains("NavigationStack"), "expected the scaffold to own a NavigationStack")
        XCTAssertTrue(src.contains(".navigationTitle(title)"), "expected an inline native navigation title")
        XCTAssertTrue(src.contains(".navigationBarTitleDisplayMode(.inline)"))
    }

    func testComposesTheSharedTopNavRatherThanAHandRolledBar() throws {
        let src = try hermesBottomSheetSource()
        XCTAssertTrue(src.contains("TopNav("), "expected composition of the shared TopNav, not a hand-rolled bar")
        XCTAssertTrue(src.contains(".toolbar"), "expected TopNav to be composed through native .toolbar")
    }

    func testUsesModalAppropriateTopNavPlacements() throws {
        let src = try hermesBottomSheetSource()
        XCTAssertTrue(src.contains(".cancellationAction"), "expected the leading slot to use modal-appropriate placement")
        XCTAssertTrue(src.contains(".confirmationAction"), "expected the trailing slot to use modal-appropriate placement")
    }

    func testBodySlotIsAnUnconstrainedViewBuilderWithNoImposedChrome() throws {
        let src = try hermesBottomSheetSource()
        XCTAssertTrue(src.contains("@ViewBuilder"), "expected the body slot to be a ViewBuilder")
        XCTAssertFalse(src.contains("ScrollView"), "must not impose its own scroll view around the body slot")
        XCTAssertFalse(src.contains("HermexCard"), "must not impose card chrome around the body slot")
    }

    func testFooterIsPinnedWithNativeSafeAreaInsetNotAFixedHeight() throws {
        let src = try hermesBottomSheetSource()
        XCTAssertTrue(src.contains(".safeAreaInset(edge: .bottom)"), "expected the footer to be pinned via native safeAreaInset")
        XCTAssertFalse(src.contains(".frame(height:"), "must not hard-code a sheet or footer height")
        XCTAssertFalse(src.contains(".presentationDetents("), "detents stay owned by the caller's .sheet")
    }

    func testFooterAxisSupportsHorizontalAndVerticalStacksUsingExistingSpacingTokens() throws {
        let src = try hermesBottomSheetSource()
        XCTAssertTrue(src.contains("enum FooterAxis"))
        XCTAssertTrue(src.contains("case horizontal"))
        XCTAssertTrue(src.contains("case vertical"))
        XCTAssertTrue(src.contains("HStack"))
        XCTAssertTrue(src.contains("VStack"))
        XCTAssertTrue(src.contains("HermesSpacing."), "expected footer spacing to use an existing Hermex spacing token")
    }

    func testFooterAxisDefaultsToHorizontal() throws {
        let src = try hermesBottomSheetSource()
        XCTAssertTrue(src.contains("footerAxis: FooterAxis = .horizontal"))
    }

    func testDoesNotWrapOrReplaceTheNativeSheetPresentationModifierItself() throws {
        let src = try hermesBottomSheetSource()
        XCTAssertFalse(src.contains(".sheet("), "must not wrap or replace the caller's own .sheet presentation")
        XCTAssertFalse(src.contains("interactiveDismissDisabled"), "dismiss policy stays with the caller")
    }

    func testIntroducesNoCustomPresentationMotionDragOrDimmingLayer() throws {
        let src = try hermesBottomSheetSource()
        XCTAssertFalse(src.contains("DragGesture"), "must not add a custom drag gesture")
        XCTAssertFalse(src.contains(".transition("), "must not add a custom transition")
        XCTAssertFalse(src.contains(".animation("), "must not add a custom animation — native .sheet owns presentation motion")
        XCTAssertFalse(src.contains("reduceMotion"), "must not add a home-grown Reduce Motion branch — native .sheet owns it")
        XCTAssertFalse(src.contains("Color.black.opacity"), "must not add a custom dimming/backdrop layer")
    }
}
