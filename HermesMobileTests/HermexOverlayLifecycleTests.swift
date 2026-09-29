import XCTest
@testable import HermesMobile

@MainActor final class HermexOverlayLifecycleTests: XCTestCase {
    func testPresentationRequiresMatchingGenerationToBecomePresented() {
        var lifecycle = HermexOverlayLifecycle()
        let generation = lifecycle.beginPresentation()

        XCTAssertFalse(lifecycle.completePresentation(generation: generation - 1),
                        "A stale generation must not complete presentation")
        XCTAssertEqual(lifecycle.phase, .entering)

        XCTAssertTrue(lifecycle.completePresentation(generation: generation))
        XCTAssertEqual(lifecycle.phase, .presented)
    }

    func testDismissalRunsDeferredActionExactlyOnceAfterMatchingExit() {
        var lifecycle = HermexOverlayLifecycle()
        let entryGeneration = lifecycle.beginPresentation()
        XCTAssertTrue(lifecycle.completePresentation(generation: entryGeneration))

        var runCount = 0
        guard let dismissGeneration = lifecycle.beginDismissal(after: { runCount += 1 }) else {
            return XCTFail("An enabled action must be accepted while presented")
        }
        XCTAssertEqual(lifecycle.phase, .dismissing)
        XCTAssertEqual(runCount, 0, "The action must not run before exit completes")

        guard case .completed(let action) = lifecycle.completeDismissal(generation: dismissGeneration) else {
            return XCTFail("The matching generation must complete dismissal")
        }
        XCTAssertEqual(lifecycle.phase, .hidden)
        action?()
        XCTAssertEqual(runCount, 1)

        // Completing again for the same, now-stale generation must not run the action twice.
        if case .completed(let again) = lifecycle.completeDismissal(generation: dismissGeneration) {
            again?()
        }
        XCTAssertEqual(runCount, 1)
    }

    func testRepeatedDismissRequestDoesNotReplaceOrDuplicatePendingAction() {
        var lifecycle = HermexOverlayLifecycle()
        let entryGeneration = lifecycle.beginPresentation()
        XCTAssertTrue(lifecycle.completePresentation(generation: entryGeneration))

        var firstCount = 0
        var secondCount = 0
        guard let dismissGeneration = lifecycle.beginDismissal(after: { firstCount += 1 }) else {
            return XCTFail("The first action must be accepted")
        }
        XCTAssertNil(lifecycle.beginDismissal(after: { secondCount += 1 }),
                      "A second request while already dismissing must be rejected")

        guard case .completed(let action) = lifecycle.completeDismissal(generation: dismissGeneration) else {
            return XCTFail("The original generation must still complete")
        }
        action?()
        XCTAssertEqual(firstCount, 1, "Only the first accepted action may run")
        XCTAssertEqual(secondCount, 0, "The rejected second action must never run")
    }

    func testStaleExitCompletionCannotHideRePresentedOverlay() {
        var lifecycle = HermexOverlayLifecycle()
        let firstEntry = lifecycle.beginPresentation()
        XCTAssertTrue(lifecycle.completePresentation(generation: firstEntry))
        guard let staleDismissGeneration = lifecycle.beginDismissal() else {
            return XCTFail("Dismissal from presented must be accepted")
        }

        // A newer presentation begins before the stale dismissal ever completes.
        let secondEntry = lifecycle.beginPresentation()
        XCTAssertEqual(lifecycle.phase, .entering)
        XCTAssertNotEqual(secondEntry, staleDismissGeneration)

        if case .completed = lifecycle.completeDismissal(generation: staleDismissGeneration) {
            XCTFail("A stale dismissal must never complete against a newer presentation")
        }
        XCTAssertEqual(lifecycle.phase, .entering, "The newer presentation must stay untouched")
    }

    func testOwnerCancellationDropsPendingActionAndReturnsHidden() {
        var lifecycle = HermexOverlayLifecycle()
        let entryGeneration = lifecycle.beginPresentation()
        XCTAssertTrue(lifecycle.completePresentation(generation: entryGeneration))

        var runCount = 0
        guard let dismissGeneration = lifecycle.beginDismissal(after: { runCount += 1 }) else {
            return XCTFail("Dismissal with an action must be accepted while presented")
        }

        lifecycle.cancelOwner()
        XCTAssertEqual(lifecycle.phase, .hidden)

        if case .completed(let action) = lifecycle.completeDismissal(generation: dismissGeneration) {
            action?()
        }
        XCTAssertEqual(runCount, 0, "A cancelled owner must drop its pending action")
    }

    func testActionsAreAcceptedOnlyWhilePresented() {
        var lifecycle = HermexOverlayLifecycle()
        var runCount = 0

        XCTAssertNil(lifecycle.beginDismissal(after: { runCount += 1 }),
                      "An action cannot be accepted from .hidden")

        let entryGeneration = lifecycle.beginPresentation()
        XCTAssertNil(lifecycle.beginDismissal(after: { runCount += 1 }),
                      "An action cannot be accepted while still .entering")

        XCTAssertTrue(lifecycle.completePresentation(generation: entryGeneration))
        guard let dismissGeneration = lifecycle.beginDismissal(after: { runCount += 1 }) else {
            return XCTFail("An action must be accepted once .presented")
        }
        if case .completed(let action) = lifecycle.completeDismissal(generation: dismissGeneration) {
            action?()
        }
        XCTAssertEqual(runCount, 1)
    }

    func testPlainDismissalIsAcceptedWhileEntering() {
        // Approved contract T3: a dismissal request during `.entering` cancels pending entry work
        // and proceeds to `.dismissing` — unlike an action, which only fires once `.presented`.
        var lifecycle = HermexOverlayLifecycle()
        let entryGeneration = lifecycle.beginPresentation()
        guard let dismissGeneration = lifecycle.beginDismissal() else {
            return XCTFail("A plain dismiss-only request must be accepted while .entering")
        }
        XCTAssertEqual(lifecycle.phase, .dismissing)
        XCTAssertFalse(lifecycle.completePresentation(generation: entryGeneration),
                        "Entry must not complete once dismissal has begun")
        guard case .completed = lifecycle.completeDismissal(generation: dismissGeneration) else {
            return XCTFail("The dismissal must still complete")
        }
        XCTAssertEqual(lifecycle.phase, .hidden)
    }
}
