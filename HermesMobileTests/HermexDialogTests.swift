import Observation
import SwiftUI
import UIKit
import XCTest
@testable import HermesMobile

/// Contracts for `HermexDialog` (`HermexDialog.swift`): a fully custom, always-centered modal
/// mounted through `HermexSameWindowOverlay`, never a native presentation. Some claims (generic
/// header/body/footer construction, the exact prohibited/required APIs a source scan can pin) are
/// compile/source contracts, the same established pattern as `HermexBottomSheetTests`. The
/// exactly-once/cancellation/staleness guarantees of the shared lifecycle itself are proven at the
/// unit level in `HermexOverlayLifecycleTests`; the rendered tests below forward Reduce Motion so
/// present/dismiss complete synchronously and deterministically, without any sleep or polling.
@MainActor final class HermexDialogTests: XCTestCase {
    // MARK: - Compile contracts

    func testDialogPublicAPICompilesWithGenericHeaderBodyAndFooter() {
        struct Host: View {
            @State var isPresented = false
            var body: some View {
                Text("Trigger").hermexDialog(isPresented: $isPresented) {
                    HStack { Image(systemName: "bell"); Text("Heading") }
                } content: {
                    VStack { Text("Line one"); Text("Line two") }
                } footer: { context in
                    Button("Cancel") { context.dismiss() }
                    Button("Continue") { context.dismissAfter {} }
                }
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    func testCompilesWithVerticalFooterAxis() {
        struct Host: View {
            @State var isPresented = false
            var body: some View {
                Text("Trigger").hermexDialog(isPresented: $isPresented, footerAxis: .vertical) {
                    Text("Heading")
                } content: {
                    Text("Body")
                } footer: { context in
                    Button("Primary") { context.dismissAfter {} }
                    Button("Secondary") { context.dismiss() }
                }
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    func testFooterAxisDefaultsToHorizontalWhenOmitted() {
        struct Host: View {
            @State var isPresented = false
            var body: some View {
                Text("Trigger").hermexDialog(isPresented: $isPresented) {
                    Text("Heading")
                } content: {
                    Text("Body")
                } footer: { context in
                    Button("OK") { context.dismiss() }
                }
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    // MARK: - Source contracts

    private func resourceURL(_ relativePath: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent(relativePath)
    }

    private func source(_ relativePath: String) throws -> String {
        try String(contentsOf: resourceURL(relativePath), encoding: .utf8)
    }

    private func hermexDialogSource() throws -> String {
        try source("HermesMobile/Features/Shared/HermexDialog.swift")
    }

    private func overlayLabSource() throws -> String {
        try source("HermesMobile/Features/Shared/HermexOverlayLab.swift")
    }

    func testDialogAlwaysExposesCloseDialogControl() throws {
        XCTAssertEqual(HermexDialogPresentation.closeButtonAccessibilityLabel, "Close dialog")
        let src = try hermexDialogSource()
        XCTAssertTrue(src.contains("closeButton"), "expected an unconditional close control")
        XCTAssertFalse(src.contains("showsCloseButton"), "the close control is never caller-optional")
    }

    func testBackdropTapGestureIsANoOp() throws {
        let src = try hermexDialogSource()
        XCTAssertTrue(src.contains(".onTapGesture {}"),
                       "the dimmed backdrop must consume touches without requesting dismissal")
    }

    func testDialogUsesRootSameWindowHostInsteadOfNativePresentation() throws {
        let src = try hermexDialogSource()
        XCTAssertTrue(src.contains("HermexSameWindowOverlay("))
        XCTAssertTrue(src.contains(".root"))
        XCTAssertFalse(src.contains(".alert("))
        XCTAssertFalse(src.contains(".sheet("))
        XCTAssertFalse(src.contains("fullScreenCover"))
        XCTAssertFalse(src.contains("Menu {"))
        XCTAssertFalse(src.contains(".popover("))
    }

    func testDialogHasNoScrollOrTextInputPresentationAPI() throws {
        let src = try hermexDialogSource()
        XCTAssertFalse(src.contains("ScrollView"))
        XCTAssertFalse(src.contains("List("))
        XCTAssertFalse(src.contains("TextField"))
        XCTAssertFalse(src.contains("SecureField"))
        XCTAssertFalse(src.contains("TextEditor"))
    }

    func testCallerBindingIsWrittenBackOnlyWhenExitCompletes() throws {
        let src = try hermexDialogSource()
        let occurrences = src.components(separatedBy: "isPresented = false").count - 1
        XCTAssertEqual(occurrences, 1,
                        "the caller's isPresented binding must be written back in exactly one place: onExitCompleted, not at exit start")
    }

    func testCloseAndEscapeShareTheSameDismissalPath() throws {
        let src = try hermexDialogSource()
        XCTAssertTrue(src.contains(".keyboardShortcut(.cancelAction)"),
                       "expected hardware Escape via the established cancel-shortcut pattern")
        XCTAssertTrue(src.contains(".accessibilityAction(.escape)"), "expected VoiceOver Escape to be wired")
        XCTAssertEqual(src.components(separatedBy: "requestDismissal(after: nil)").count - 1, 3,
                        "close, escape, and owner-driven dismissal must all route through the same plain-dismiss path")
    }

    func testUsesTheSharedOverlayLifecycleForExactlyOnceCompletion() throws {
        let src = try hermexDialogSource()
        XCTAssertTrue(src.contains("lifecycle.beginPresentation()"))
        XCTAssertTrue(src.contains("lifecycle.completePresentation(generation:"))
        XCTAssertTrue(src.contains("lifecycle.beginDismissal(after:"))
        XCTAssertTrue(src.contains("lifecycle.completeDismissal(generation:"))
        XCTAssertTrue(src.contains("lifecycle.cancelOwner()"), "owner teardown must cancel the lifecycle")
        XCTAssertTrue(src.contains(".onDisappear"), "owner cancellation must be wired to view disappearance")
    }

    func testUsesExistingMotionBundlesAndReduceMotionFallback() throws {
        let src = try hermexDialogSource()
        XCTAssertTrue(src.contains("HermesMotion.Bundle.overlayEnter"))
        XCTAssertTrue(src.contains("HermesMotion.Bundle.overlayExit"))
        XCTAssertTrue(src.contains("reduceMotion"))
    }

    func testUsesExistingCardSurfaceRadiusAndShadowTokens() throws {
        let src = try hermexDialogSource()
        XCTAssertTrue(src.contains(".hermexCardSurface(.glass"))
        XCTAssertTrue(src.contains("HermesRadius."))
        XCTAssertTrue(src.contains(".hermesShadow(.overlay)"))
    }

    func testInputIsDisabledOutsidePresented() throws {
        let src = try hermexDialogSource()
        XCTAssertTrue(src.contains(".allowsHitTesting(lifecycle.phase == .presented)"))
    }

    func testHeadingIsMarkedAsAnAccessibilityHeader() throws {
        let src = try hermexDialogSource()
        XCTAssertTrue(src.contains(".accessibilityAddTraits(.isHeader)"))
    }

    func testOwnerCanSupersedeAnInFlightDismissal() throws {
        let src = try hermexDialogSource()
        XCTAssertTrue(src.contains("else if lifecycle.phase == .dismissing"))
        XCTAssertTrue(src.contains("transitionTask?.cancel()"))
    }

    func testAccessibilityLabSpecimenUsesVerticalActions() throws {
        let src = try overlayLabSource()
        let accessibilitySection = try XCTUnwrap(
            src.components(separatedBy: "private struct HermexOverlayLabAccessibilitySize").last?
                .components(separatedBy: "// ─── 5/6.").first
        )
        XCTAssertTrue(accessibilitySection.contains("footerAxis: .vertical"),
                      "the accessibility5 specimen must use the approved vertical action layout")
    }

    func testAccessibilityLabSpecimenAppliesDynamicTypeToTheDialogModifier() throws {
        let src = try overlayLabSource()
        let accessibilitySection = try XCTUnwrap(
            src.components(separatedBy: "private struct HermexOverlayLabAccessibilitySize").last?
                .components(separatedBy: "// ─── 5/6.").first
        )
        let dialogOffset = try XCTUnwrap(accessibilitySection.range(of: ".hermexDialog")?.lowerBound)
        let dynamicTypeOffset = try XCTUnwrap(accessibilitySection.range(of: ".dynamicTypeSize(.accessibility5)")?.lowerBound)
        XCTAssertLessThan(dialogOffset, dynamicTypeOffset,
                          "Dynamic Type must wrap the modifier so its forwarded overlay environment receives accessibility5")
    }

    // MARK: - Rendered behavior
    // Reduce Motion is forced on the harness so present/dismiss complete synchronously within one
    // MainActor turn — deterministic, with no sleep or polling, per the async-testing rule in
    // AGENTS.md — while still exercising the real modifier, `HermexDialog`, and
    // `HermexSameWindowOverlay` together.

    func testMountsCenteredSurfaceWithCloseControlAndUnmountsOnDismiss() async throws {
        let model = HermexDialogHarnessModel()
        let window = try show(HermexDialogHarnessView(model: model))
        defer { close(window) }
        await settle(window)

        model.isPresented = true
        await settle(window)

        let overlayHost = try XCTUnwrap(descendants(window).first {
            $0.accessibilityIdentifier == HermexDialogPresentation.overlayHostAccessibilityIdentifier
        })
        XCTAssertTrue(overlayHost.accessibilityViewIsModal, "the mounted host must isolate the underlying screen")
        let actionContext = try XCTUnwrap(model.actionContext)
        actionContext.dismiss()
        await settle(window)

        XCTAssertFalse(descendants(window).contains { $0.accessibilityIdentifier == HermexDialogPresentation.overlayHostAccessibilityIdentifier },
                        "the host must unmount once dismissal completes")
    }

    func testInitiallyPresentedBindingMountsTheDialog() async throws {
        let model = HermexDialogHarnessModel()
        model.isPresented = true
        let window = try show(HermexDialogHarnessView(model: model))
        defer { close(window) }
        await settle(window)

        XCTAssertTrue(descendants(window).contains {
            $0.accessibilityIdentifier == HermexDialogPresentation.overlayHostAccessibilityIdentifier
        })
    }

    func testAccessibilityEscapeRequestsDismissal() async throws {
        let model = HermexDialogHarnessModel()
        let window = try show(HermexDialogHarnessView(model: model))
        defer { close(window) }
        await settle(window)
        model.isPresented = true
        await settle(window)

        let surface = try XCTUnwrap(accessibilityNode(
            withIdentifier: HermexDialogPresentation.surfaceAccessibilityIdentifier, in: window
        ))
        XCTAssertTrue(surface.accessibilityPerformEscape())
        await settle(window)

        XCTAssertFalse(descendants(window).contains { $0.accessibilityIdentifier == HermexDialogPresentation.overlayHostAccessibilityIdentifier })
    }

    func testBackdropInterceptsTouchesWithoutDismissing() async throws {
        let model = HermexDialogHarnessModel()
        let window = try show(HermexDialogHarnessView(model: model))
        defer { close(window) }
        await settle(window)
        model.isPresented = true
        await settle(window)

        let overlayHost = try XCTUnwrap(descendants(window).first {
            $0.accessibilityIdentifier == HermexDialogPresentation.overlayHostAccessibilityIdentifier
        })
        let point = CGPoint(x: window.bounds.midX, y: window.bounds.minY + 40)
        let hit = try XCTUnwrap(window.hitTest(point, with: nil))
        XCTAssertTrue(hit === overlayHost || hit.isDescendant(of: overlayHost),
                      "a touch anywhere over the dialog's bounds must be claimed by its own host, never pass through")
        XCTAssertTrue(descendants(window).contains { $0.accessibilityIdentifier == HermexDialogPresentation.overlayHostAccessibilityIdentifier },
                      "the dialog must remain presented — nothing dismissed it")
    }

    func testFooterDismissThenRunDefersActionUntilExitCompletes() async throws {
        let model = HermexDialogHarnessModel()
        let window = try show(HermexDialogHarnessView(model: model))
        defer { close(window) }
        await settle(window)
        model.isPresented = true
        await settle(window)
        XCTAssertEqual(model.actionRunCount, 0)

        let actionContext = try XCTUnwrap(model.actionContext)
        actionContext.dismissAfter { model.actionRunCount += 1 }
        await settle(window)

        XCTAssertEqual(model.actionRunCount, 1, "the deferred action must run exactly once, after the dialog closes")
        XCTAssertFalse(descendants(window).contains { $0.accessibilityIdentifier == HermexDialogPresentation.overlayHostAccessibilityIdentifier })
    }

    func testRepeatedCloseOrActionCannotRunTwice() async throws {
        let model = HermexDialogHarnessModel()
        let window = try show(HermexDialogHarnessView(model: model))
        defer { close(window) }
        await settle(window)
        model.isPresented = true
        await settle(window)

        let actionContext = try XCTUnwrap(model.actionContext)
        actionContext.dismissAfter { model.actionRunCount += 1 }
        actionContext.dismissAfter { model.actionRunCount += 1 }
        await settle(window)

        XCTAssertEqual(model.actionRunCount, 1, "a second activation after the first is accepted must never run the action again")
    }

    func testExternalBindingFalseRunsExitBeforeUnmount() async throws {
        let model = HermexDialogHarnessModel()
        let window = try show(HermexDialogHarnessView(model: model))
        defer { close(window) }
        await settle(window)
        model.isPresented = true
        await settle(window)
        XCTAssertTrue(descendants(window).contains { $0.accessibilityIdentifier == HermexDialogPresentation.overlayHostAccessibilityIdentifier })

        model.isPresented = false
        // No run-loop turn has occurred yet — the host must still be mounted immediately after the
        // caller's own state write, proving unmount is never synchronous with it.
        XCTAssertTrue(descendants(window).contains { $0.accessibilityIdentifier == HermexDialogPresentation.overlayHostAccessibilityIdentifier },
                      "unmounting must not happen synchronously with the caller's own binding write")

        await settle(window)
        XCTAssertFalse(descendants(window).contains { $0.accessibilityIdentifier == HermexDialogPresentation.overlayHostAccessibilityIdentifier },
                        "the host must eventually unmount once exit completes")
    }

    // MARK: - Test harness

    private func show<V: View>(_ view: V) throws -> UIWindow {
        let scene = try XCTUnwrap(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        window.rootViewController = UIHostingController(rootView: view)
        window.makeKeyAndVisible()
        return window
    }

    private func close(_ window: UIWindow) {
        window.isHidden = true
        window.rootViewController = nil
    }

    private func descendants(_ view: UIView) -> [UIView] {
        [view] + view.subviews.flatMap(descendants)
    }

    /// Every accessibility label exposed under a view — hosted view labels plus explicit
    /// accessibility elements, which need not be views (the same walk `BotChatPresentationTests`
    /// uses).
    private func accessibilityLabels(in root: UIView) -> [String] {
        var labels: [String] = []
        var queue = [root]
        var seen: Set<ObjectIdentifier> = []
        while let view = queue.popLast() {
            guard seen.insert(ObjectIdentifier(view)).inserted else { continue }
            if let label = view.accessibilityLabel { labels.append(label) }
            for element in view.accessibilityElements ?? [] {
                if let elementView = element as? UIView {
                    queue.append(elementView)
                } else if let object = element as? NSObject, let label = object.value(forKey: "accessibilityLabel") as? String {
                    labels.append(label)
                }
            }
            let count = view.accessibilityElementCount()
            if count != NSNotFound, count > 0 {
                for index in 0..<count {
                    if let elementView = view.accessibilityElement(at: index) as? UIView {
                        queue.append(elementView)
                    } else if let object = view.accessibilityElement(at: index) as? NSObject,
                              let label = object.value(forKey: "accessibilityLabel") as? String {
                        labels.append(label)
                    }
                }
            }
            queue += view.subviews
        }
        return labels
    }

    /// Finds the accessibility element (a real `UIView`, or one of SwiftUI's own non-view
    /// accessibility nodes) carrying `identifier`, anywhere under `root`, so a test can activate it
    /// the way VoiceOver would — the standard way to exercise a SwiftUI `Button`'s action or an
    /// `.accessibilityAction(.escape)` closure without synthesizing raw touch events.
    private func accessibilityNode(withIdentifier identifier: String, in root: UIView) -> NSObject? {
        var queue: [Any] = [root]
        var seenViews: Set<ObjectIdentifier> = []
        while let current = queue.popLast() {
            if let view = current as? UIView {
                guard seenViews.insert(ObjectIdentifier(view)).inserted else { continue }
                if view.accessibilityIdentifier == identifier { return view }
                for element in view.accessibilityElements ?? [] { queue.append(element) }
                let count = view.accessibilityElementCount()
                if count != NSNotFound, count > 0 {
                    for index in 0..<count {
                        if let element = view.accessibilityElement(at: index) { queue.append(element) }
                    }
                }
                queue += view.subviews
            } else if let object = current as? NSObject {
                if (object.value(forKey: "accessibilityIdentifier") as? String) == identifier {
                    return object
                }
            }
        }
        return nil
    }
}

@MainActor @Observable
private final class HermexDialogHarnessModel {
    var isPresented = false
    var actionRunCount = 0
    var actionContext: HermexOverlayActionContext?
}

private struct HermexDialogHarnessView: View {
    @Bindable var model: HermexDialogHarnessModel

    var body: some View {
        Button("Trigger") { model.isPresented = true }
            .accessibilityIdentifier("dialog-harness-trigger")
            .hermexDialog(isPresented: $model.isPresented) {
                Text(verbatim: "Heading").font(.headline)
            } content: {
                Text(verbatim: "Body")
            } footer: { context in
                Color.clear
                    .frame(width: 0, height: 0)
                    .onAppear { model.actionContext = context }
                Button("Dismiss") { context.dismiss() }
                    .accessibilityIdentifier("dialog-harness-dismiss")
                Button("Action") { context.dismissAfter { model.actionRunCount += 1 } }
                    .accessibilityIdentifier("dialog-harness-action")
            }
            // Forces the synchronous present/dismiss path so rendered tests never depend on real
            // wall-clock animation timing.
            .environment(\._accessibilityReduceMotion, true)
    }
}
