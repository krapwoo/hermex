import SwiftUI
import UIKit

struct ChatUIKitMenuButton<Label: View>: View {
    @Environment(\.isEnabled) private var isEnabled

    private let menu: () -> UIMenu
    private let label: Label
    private let horizontalPadding: CGFloat
    private let verticalPadding: CGFloat
    private let loadsMenuEagerly: Bool

    init(
        horizontalPadding: CGFloat = 0,
        verticalPadding: CGFloat = 0,
        loadsMenuEagerly: Bool = false,
        @ViewBuilder label: () -> Label,
        menu: @escaping () -> UIMenu
    ) {
        self.label = label()
        self.menu = menu
        self.horizontalPadding = horizontalPadding
        self.verticalPadding = verticalPadding
        self.loadsMenuEagerly = loadsMenuEagerly
    }

    var body: some View {
        label
            .opacity(isEnabled ? 1 : 0.62)
            .overlay {
                ChatUIKitMenuButtonBacker(
                    horizontalPadding: horizontalPadding,
                    verticalPadding: verticalPadding,
                    loadsMenuEagerly: loadsMenuEagerly,
                    menu: menu
                )
            }
            .accessibilityElement(children: .combine)
            .accessibilityAddTraits(.isButton)
    }
}

private struct ChatUIKitMenuButtonBacker: UIViewControllerRepresentable {
    @Environment(\.isEnabled) private var isEnabled

    let horizontalPadding: CGFloat
    let verticalPadding: CGFloat
    let loadsMenuEagerly: Bool
    let menu: () -> UIMenu

    func makeCoordinator() -> Coordinator {
        Coordinator(menu: menu)
    }

    func makeUIViewController(context: Context) -> ChatMenuButtonHostController {
        let controller = ChatMenuButtonHostController()
        let button = controller.button

        controller.setHitPadding(horizontal: horizontalPadding, vertical: verticalPadding)
        button.menu = loadsMenuEagerly
            ? context.coordinator.menu()
            : deferredMenu(using: context.coordinator)
        button.isEnabled = isEnabled
        button.isAccessibilityElement = false

        return controller
    }

    func updateUIViewController(_ uiViewController: ChatMenuButtonHostController, context: Context) {
        context.coordinator.menu = menu
        uiViewController.setHitPadding(horizontal: horizontalPadding, vertical: verticalPadding)
        uiViewController.button.isEnabled = isEnabled
        if loadsMenuEagerly {
            uiViewController.button.menu = menu()
        }
    }

    func sizeThatFits(
        _ proposal: ProposedViewSize,
        uiViewController: ChatMenuButtonHostController,
        context: Context
    ) -> CGSize? {
        CGSize(
            width: proposal.width ?? UIView.noIntrinsicMetric,
            height: proposal.height ?? UIView.noIntrinsicMetric
        )
    }

    final class Coordinator {
        var menu: () -> UIMenu

        init(menu: @escaping () -> UIMenu) {
            self.menu = menu
        }
    }

    private func deferredMenu(using coordinator: Coordinator) -> UIMenu {
        UIMenu(children: [
            UIDeferredMenuElement.uncached { completion in
                completion(coordinator.menu().children)
            }
        ])
    }
}

private final class ChatMenuButtonHostController: UIViewController {
    let button = UIButton(type: .custom)
    private let container = ChatMenuButtonContainerView()

    func setHitPadding(horizontal: CGFloat, vertical: CGFloat) {
        container.horizontalPadding = horizontal
        container.verticalPadding = vertical
    }

    override func loadView() {
        container.backgroundColor = .clear
        container.isOpaque = false
        container.isAccessibilityElement = false
        container.button = button
        view = container

        button.showsMenuAsPrimaryAction = true
        button.backgroundColor = .clear
        button.setTitle(nil, for: .normal)
        button.setImage(nil, for: .normal)
        button.translatesAutoresizingMaskIntoConstraints = false

        container.addSubview(button)
        NSLayoutConstraint.activate([
            button.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            button.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            button.topAnchor.constraint(equalTo: container.topAnchor),
            button.bottomAnchor.constraint(equalTo: container.bottomAnchor)
        ])
    }
}

private final class ChatMenuButtonContainerView: UIView {
    var horizontalPadding: CGFloat = 0
    var verticalPadding: CGFloat = 0
    weak var button: UIButton?

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        guard
            isUserInteractionEnabled,
            !isHidden,
            alpha >= 0.01,
            let button,
            button.isEnabled,
            !button.isHidden,
            button.alpha >= 0.01
        else {
            return nil
        }

        let expandedBounds = bounds.insetBy(dx: -horizontalPadding, dy: -verticalPadding)
        return expandedBounds.contains(point) ? button : nil
    }
}

extension View {
    func chatMinimumHitTarget<HitShape: Shape>(
        horizontalPadding: CGFloat = 8,
        verticalPadding: CGFloat = 8,
        in shape: HitShape
    ) -> some View {
        modifier(ChatMinimumHitTargetModifier(
            horizontalPadding: horizontalPadding,
            verticalPadding: verticalPadding,
            shape: shape
        ))
    }
}

private struct ChatMinimumHitTargetModifier<HitShape: Shape>: ViewModifier {
    let horizontalPadding: CGFloat
    let verticalPadding: CGFloat
    let shape: HitShape

    func body(content: Content) -> some View {
        // Expand the hit shape without making compact composer controls consume row space.
        content
            .padding(.horizontal, horizontalPadding)
            .padding(.vertical, verticalPadding)
            .contentShape(shape)
            .padding(.horizontal, -horizontalPadding)
            .padding(.vertical, -verticalPadding)
    }
}
