import Foundation

/// The generation-based presentation lifecycle shared by every custom same-window overlay
/// (`HermexDialog`, and later `HermexPopoverMenu`). A generation identifies one present/dismiss
/// cycle: every `beginPresentation()` call starts a new generation, and every completion call must
/// name the generation it is completing so a stale, superseded, or cancelled transition can never
/// finish, hide a newer presentation, or run a second time.
@MainActor
struct HermexOverlayLifecycle {
    enum Phase: Equatable {
        case hidden
        case entering
        case presented
        case dismissing
    }

    /// The outcome of `completeDismissal(generation:)`. `notCurrent` and "completed with no pending
    /// action" both carry no closure, so this distinguishes "reject — do not unmount" from "accept —
    /// unmount and, if present, run the one deferred action" without a confusable double optional.
    enum DismissalCompletion {
        case notCurrent
        case completed(action: (@MainActor () -> Void)?)
    }

    private(set) var phase: Phase = .hidden
    private(set) var generation = 0
    private var pendingAction: (@MainActor () -> Void)?

    /// Starts a new presentation. Always succeeds: it advances the generation (invalidating any
    /// prior transition's completions), drops any stale pending action, and enters `.entering`.
    /// Returns the generation the caller must complete against.
    mutating func beginPresentation() -> Int {
        generation += 1
        pendingAction = nil
        phase = .entering
        return generation
    }

    /// Completes entry into `.presented`. Succeeds only when `generation` still names the current
    /// `.entering` transition — a stale or superseded call is a no-op.
    mutating func completePresentation(generation: Int) -> Bool {
        guard phase == .entering, generation == self.generation else { return false }
        phase = .presented
        return true
    }

    /// Requests dismissal, optionally deferring one action to run only after exit completes.
    /// An enabled footer/menu action (`action != nil`) is only accepted from `.presented`, matching
    /// the approved contract that an action never fires from anything but a fully interactive
    /// surface. A plain dismiss request (`action == nil`) is also accepted from `.entering`,
    /// cancelling pending entry work and proceeding straight to dismissal. Any request while already
    /// `.dismissing` is ignored, so a second close/action can never replace or duplicate the first
    /// accepted one. Returns the generation to complete against, or `nil` if rejected.
    mutating func beginDismissal(after action: (@MainActor () -> Void)? = nil) -> Int? {
        switch phase {
        case .entering where action == nil:
            pendingAction = nil
            phase = .dismissing
            return generation
        case .presented:
            pendingAction = action
            phase = .dismissing
            return generation
        default:
            return nil
        }
    }

    /// Completes dismissal into `.hidden`. Succeeds only when `generation` still names the current
    /// `.dismissing` transition, atomically clearing and returning any pending action so the caller
    /// can run it exactly once, after the surface has visually left.
    mutating func completeDismissal(generation: Int) -> DismissalCompletion {
        guard phase == .dismissing, generation == self.generation else { return .notCurrent }
        let action = pendingAction
        pendingAction = nil
        phase = .hidden
        return .completed(action: action)
    }

    /// The presentation's owner (the presenting view) is going away. Invalidates the current
    /// generation and drops any pending action so it can never escape after its owner disappears,
    /// then returns to `.hidden`.
    mutating func cancelOwner() {
        generation += 1
        pendingAction = nil
        phase = .hidden
    }
}

/// Handed to a caller's footer/menu-action content so it can request dismissal through the owning
/// surface's lifecycle instead of managing presentation state itself. `dismiss()` is a plain close;
/// `dismissAfter(_:)` defers exactly one action, which the surface runs only once its exit
/// animation completes (see `HermexOverlayLifecycle.beginDismissal(after:)`).
struct HermexOverlayActionContext {
    private let requestDismissal: ((@MainActor () -> Void)?) -> Void

    init(requestDismissal: @escaping ((@MainActor () -> Void)?) -> Void) {
        self.requestDismissal = requestDismissal
    }

    func dismiss() {
        requestDismissal(nil)
    }

    func dismissAfter(_ action: @escaping @MainActor () -> Void) {
        requestDismissal(action)
    }
}
