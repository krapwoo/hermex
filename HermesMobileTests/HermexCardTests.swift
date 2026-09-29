import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for the Card family's shared defaults (`HermexCard.swift`): the exact 16-point content
/// padding available for Card-composing surfaces, the Compact Card surface's compile contract, and
/// the Request Card surface factory. A SwiftUI view tree isn't inspectable at runtime without a
/// rendering harness, so the factory's presence is a source contract read from `HermexCard.swift`
/// itself; the padding value is a pure contract.
final class HermexCardTests: XCTestCase {
    private func resourceURL(_ relativePath: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent(relativePath)
    }

    private func source(_ relativePath: String) throws -> String {
        try String(contentsOf: resourceURL(relativePath), encoding: .utf8)
    }

    // MARK: - Pure contract

    func testCardContentPaddingIsExactlySixteenPointsOnEveryEdge() {
        XCTAssertEqual(HermexCardMetrics.contentPadding, HermesSpacing.s16)
        XCTAssertEqual(HermexCardMetrics.contentPadding, 16)
    }

    // MARK: - Compile contract

    func testCompactCardSurfaceCompilesWithDefaultAndClearFill() {
        let filled = Color.clear.frame(width: 1, height: 1).compactCardSurface(cornerRadius: HermesRadius.r16)
        let bordered = Color.clear.frame(width: 1, height: 1).compactCardSurface(cornerRadius: HermesRadius.r16, fill: .clear)
        XCTAssertFalse(String(describing: type(of: filled)).isEmpty)
        XCTAssertFalse(String(describing: type(of: bordered)).isEmpty)
    }

    // MARK: - Request Card lives in the Card family

    func testRequestCardSurfaceIsDefinedInTheCardFamilyFile() throws {
        let src = try source("HermesMobile/Features/Shared/HermexCard.swift")
        XCTAssertTrue(src.contains("func requestCardSurface(cornerRadius:"))
    }

    func testOverlayLabIncludesAReachableBatchBCardFixtureForEverySurfaceVariant() throws {
        let src = try source("HermesMobile/Features/Shared/HermexOverlayLab.swift")
        XCTAssertTrue(src.contains("--hermex-overlay-lab-batch-b"))
        XCTAssertTrue(src.contains("private struct HermexOverlayLabCardFollowup"))
        XCTAssertTrue(src.contains(".hermexCardSurface(.glass)"))
        XCTAssertTrue(src.contains(".hermexCardSurface(.outlined)"))
        XCTAssertTrue(src.contains(".compactCardSurface()"))
        XCTAssertTrue(src.contains(".requestCardSurface("))
        XCTAssertTrue(src.contains("material: .opaque"))
        XCTAssertTrue(src.contains("material: .translucentOverScrim"))
    }

    // MARK: - DSF-07 (Batch B, corrected): HermexCardColors — the approved component-scoped Neutral
    // mapping
    //
    // Approved exact mapping (design-system-follow-up-plan.md, DSF-07, corrected per review):
    //   primary surface            Neutral.adaptive(light: Neutral.s50,  dark: Neutral.s950)
    //   secondary/compact surface  Neutral.adaptive(light: Neutral.s100, dark: Neutral.s900)
    //   standard border            Neutral.adaptive(light: Neutral.s400, dark: Neutral.s600)
    //   increased-contrast border  Neutral.adaptive(light: Neutral.s600, dark: Neutral.s400)
    //
    // The Increased Contrast pair was originally Neutral.s500/s500; the review found that pair
    // untested against 3:1 and revised it to s600 light / s400 dark, which
    // testIncreasedContrastBorderMeetsThreeToOneAgainstBothCardSurfacesInLightAndDarkAppearances below
    // proves meets 3:1 against both the primary and secondary Card surfaces in both appearances.
    //
    // A rendered Color value can't be inspected without a rendering harness (see this file's own
    // header note), so these are source contracts, mirroring every other test in this file. Member
    // names (primarySurface/secondarySurface/standardBorder/increasedContrastBorder) are this batch's
    // own naming choice for the required mapping, not a constraint stated in the plan itself; the
    // implementer may rename them, but must update these tests in the same change if so.

    func testHermexCardColorsDefinesTheFourApprovedAdaptiveNeutralPairs() throws {
        let src = try source("HermesMobile/Features/Shared/HermexCard.swift")
        XCTAssertTrue(src.contains("enum HermexCardColors"), "expected a component-scoped HermexCardColors mapping")
        XCTAssertNotNil(
            src.range(of: #"static let primarySurface\b[\s\S]*?HermesColorRamp\.Neutral\.adaptive\(\s*light:\s*HermesColorRamp\.Neutral\.s50,\s*dark:\s*HermesColorRamp\.Neutral\.s950\s*\)"#, options: .regularExpression),
            "expected .primarySurface == Neutral.adaptive(light: Neutral.s50, dark: Neutral.s950)"
        )
        XCTAssertNotNil(
            src.range(of: #"static let secondarySurface\b[\s\S]*?HermesColorRamp\.Neutral\.adaptive\(\s*light:\s*HermesColorRamp\.Neutral\.s100,\s*dark:\s*HermesColorRamp\.Neutral\.s900\s*\)"#, options: .regularExpression),
            "expected .secondarySurface == Neutral.adaptive(light: Neutral.s100, dark: Neutral.s900)"
        )
        XCTAssertNotNil(
            src.range(of: #"static let standardBorder\b[\s\S]*?HermesColorRamp\.Neutral\.adaptive\(\s*light:\s*HermesColorRamp\.Neutral\.s400,\s*dark:\s*HermesColorRamp\.Neutral\.s600\s*\)"#, options: .regularExpression),
            "expected .standardBorder == Neutral.adaptive(light: Neutral.s400, dark: Neutral.s600)"
        )
        XCTAssertNotNil(
            src.range(of: #"static let increasedContrastBorder\b[\s\S]*?HermesColorRamp\.Neutral\.adaptive\(\s*light:\s*HermesColorRamp\.Neutral\.s600,\s*dark:\s*HermesColorRamp\.Neutral\.s400\s*\)"#, options: .regularExpression),
            "expected .increasedContrastBorder == Neutral.adaptive(light: Neutral.s600, dark: Neutral.s400) — the corrected pair, replacing the retired untested s500/s500 pair"
        )
    }

    /// WCAG 2.x contrast ratio computed directly from the ramp's own hex values — the same "pure
    /// source-of-truth calculation" pattern this file already uses for pure value contracts, since a
    /// rendered `Color` can't be inspected without a rendering harness. Proves the corrected
    /// Increased Contrast border (light Neutral.s600, dark Neutral.s400) is non-decorative-boundary
    /// compliant (>=3:1, WCAG 1.4.11) against both Card surfaces it must apply to, in both
    /// appearances — the exact gap the review found unproven for the retired s500/s500 pair.
    func testIncreasedContrastBorderMeetsThreeToOneAgainstBothCardSurfacesInLightAndDarkAppearances() {
        let lightBorder = HermesColorRamp.Neutral.s600.hex
        let darkBorder = HermesColorRamp.Neutral.s400.hex
        let lightPrimarySurface = HermesColorRamp.Neutral.s50.hex
        let lightSecondarySurface = HermesColorRamp.Neutral.s100.hex
        let darkPrimarySurface = HermesColorRamp.Neutral.s950.hex
        let darkSecondarySurface = HermesColorRamp.Neutral.s900.hex

        XCTAssertGreaterThanOrEqual(contrastRatio(lightBorder, lightPrimarySurface), 3.0,
                                    "light Increased Contrast border (s600) must be >=3:1 against the primary Card surface (s50)")
        XCTAssertGreaterThanOrEqual(contrastRatio(lightBorder, lightSecondarySurface), 3.0,
                                    "light Increased Contrast border (s600) must be >=3:1 against the secondary Card surface (s100)")
        XCTAssertGreaterThanOrEqual(contrastRatio(darkBorder, darkPrimarySurface), 3.0,
                                    "dark Increased Contrast border (s400) must be >=3:1 against the primary Card surface (s950)")
        XCTAssertGreaterThanOrEqual(contrastRatio(darkBorder, darkSecondarySurface), 3.0,
                                    "dark Increased Contrast border (s400) must be >=3:1 against the secondary Card surface (s900)")
    }

    // MARK: - Contrast helper (test-only)
    //
    // A minimal WCAG 2.x relative-luminance/contrast-ratio calculator over #RRGGBB hex strings.
    // Test-only: production never needs to compute a contrast ratio at runtime, only to consume a
    // pre-validated ramp pairing.

    private func relativeLuminance(hex: String) -> Double {
        let digits = hex.hasPrefix("#") ? String(hex.dropFirst()) : hex
        let scanner = Scanner(string: digits)
        var value: UInt64 = 0
        scanner.scanHexInt64(&value)
        let r = Double((value & 0xFF0000) >> 16) / 255
        let g = Double((value & 0x00FF00) >> 8) / 255
        let b = Double(value & 0x0000FF) / 255
        func linearize(_ channel: Double) -> Double {
            channel <= 0.03928 ? channel / 12.92 : pow((channel + 0.055) / 1.055, 2.4)
        }
        return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
    }

    private func contrastRatio(_ hexA: String, _ hexB: String) -> Double {
        let luminanceA = relativeLuminance(hex: hexA)
        let luminanceB = relativeLuminance(hex: hexB)
        let lighter = max(luminanceA, luminanceB)
        let darker = min(luminanceA, luminanceB)
        return (lighter + 0.05) / (darker + 0.05)
    }

    func testGlassSurfaceUsesTheTokenizedPrimaryUnderlayAndStandardOrIncreasedContrastBorderWhilePreservingAdaptiveGlassBehavior() throws {
        let src = try source("HermesMobile/Features/Shared/HermexCard.swift")
        guard let caseRange = src.range(of: #"case \.glass:[\s\S]*?case \.outlined:"#, options: .regularExpression) else {
            return XCTFail("expected a `case .glass:` branch in HermexCardSurfaceModifier")
        }
        let glassCase = String(src[caseRange])
        XCTAssertTrue(glassCase.contains("HermexCardColors.primarySurface"), "expected the glass underlay/fallback fill to use HermexCardColors.primarySurface")
        XCTAssertTrue(glassCase.contains("HermexCardColors.standardBorder"), "expected the standard-contrast stroke to use HermexCardColors.standardBorder")
        XCTAssertTrue(glassCase.contains("HermexCardColors.increasedContrastBorder"), "expected the Increased Contrast stroke to use HermexCardColors.increasedContrastBorder")
        XCTAssertTrue(glassCase.contains(".adaptiveGlass("), "must preserve Adaptive Glass/material behavior")
        XCTAssertTrue(glassCase.contains("reduceTransparency"), "must preserve the Reduce Transparency solid fallback")
        XCTAssertFalse(glassCase.contains("secondarySystemBackground"), "the retired platform color must be gone from the glass case")
        XCTAssertFalse(glassCase.contains("Color.primary.opacity"), "the retired Color.primary.opacity border recipe must be gone from the glass case")
    }

    func testOutlinedSurfaceUsesTheTokenizedPrimaryBackgroundAndAStandardOrIncreasedContrastBorder() throws {
        let src = try source("HermesMobile/Features/Shared/HermexCard.swift")
        guard let caseRange = src.range(of: #"case \.outlined:[\s\S]*?\n    \}"#, options: .regularExpression) else {
            return XCTFail("expected a `case .outlined:` branch in HermexCardSurfaceModifier")
        }
        let outlinedCase = String(src[caseRange])
        XCTAssertTrue(outlinedCase.contains("HermexCardColors.primarySurface"), "expected the outlined background to use HermexCardColors.primarySurface")
        XCTAssertTrue(
            outlinedCase.contains("HermexCardColors.standardBorder") || outlinedCase.contains("HermexCardColors.increasedContrastBorder"),
            "expected the outlined border to use a tokenized HermexCardColors border"
        )
        XCTAssertFalse(outlinedCase.contains("Color(.systemBackground)"), "the retired platform background must be gone from the outlined case")
        XCTAssertFalse(outlinedCase.contains("Color(.separator)"), "the retired platform border must be gone from the outlined case")
    }

    func testCompactCardSurfaceDefaultsToTheTokenizedSecondaryBackgroundAndTokenizedStandardBorder() throws {
        let src = try source("HermesMobile/Features/Shared/HermexCard.swift")
        XCTAssertTrue(
            src.contains("fill: Color = HermexCardColors.secondarySurface"),
            "expected compactCardSurface's default fill to be the tokenized secondary surface — caller-supplied .clear remains supported per the existing compile contract above"
        )
        XCTAssertFalse(src.contains("fill: Color = Color(.secondarySystemBackground)"), "the retired platform default fill must be gone")

        guard let funcRange = src.range(of: #"func compactCardSurface[\s\S]*?\n\}"#, options: .regularExpression) else {
            return XCTFail("expected the compactCardSurface function body")
        }
        let body = String(src[funcRange])
        XCTAssertTrue(body.contains(".modifier(HermexCompactCardBorderModifier"),
                      "expected compactCardSurface to delegate border rendering to a file-scope environment-reading modifier; Swift forbids nesting that type inside this generic View extension method")
        XCTAssertFalse(body.contains("Color(.separator)"), "the retired platform border must be gone from compactCardSurface")

        guard let modifierStart = src.range(of: "private struct HermexCompactCardBorderModifier")?.lowerBound,
              let requestStart = src.range(of: "enum RequestCardMaterial")?.lowerBound else {
            return XCTFail("expected a file-scope HermexCompactCardBorderModifier before RequestCardMaterial")
        }
        let modifier = String(src[modifierStart..<requestStart])
        XCTAssertTrue(modifier.contains("@Environment(\\.colorSchemeContrast) private var colorSchemeContrast"))
        XCTAssertTrue(modifier.contains("HermexCardColors.standardBorder"), "expected the compact hairline border to use HermexCardColors.standardBorder at normal contrast")
        XCTAssertTrue(modifier.contains("HermexCardColors.increasedContrastBorder"), "expected the compact hairline border to use HermexCardColors.increasedContrastBorder under Increased Contrast")
        XCTAssertTrue(
            modifier.contains(".opacity(colorSchemeContrast == .increased ? 1 : HermexCompactCardMetrics.borderOpacity)"),
            "the validated Increased Contrast color must render at full opacity; only the normal subtle compact border keeps the legacy hairline opacity"
        )
        XCTAssertFalse(modifier.contains("Color(.separator)"), "the retired platform border must be absent from the compact modifier")
    }

    /// The accepted correction requires Increased Contrast to reach every Card variant, not just
    /// `.glass`/`.outlined`: `compactCardSurface`, Request Card `.opaque`, and Request Card
    /// `.translucentOverScrim` must all select `increasedContrastBorder` under Increased Contrast and
    /// `standardBorder` otherwise, using the same ternary `HermexCardSurfaceModifier` already applies
    /// for `.glass`/`.outlined`. A file-wide count is deliberately structure-agnostic about *where*
    /// each variant's border lives (a `ViewModifier`, a free function, or an environment-reading seam
    /// `compactCardSurface` delegates to) — only that the same conditional selection is applied
    /// consistently everywhere a Card variant draws a border.
    func testEveryCardVariantSelectsIncreasedContrastBorderUnderIncreasedContrastAndStandardBorderOtherwise() throws {
        let src = try source("HermesMobile/Features/Shared/HermexCard.swift")
        let ternary = "colorSchemeContrast == .increased ? HermexCardColors.increasedContrastBorder : HermexCardColors.standardBorder"
        let occurrences = src.components(separatedBy: ternary).count - 1
        XCTAssertEqual(occurrences, 5,
                       "expected all five Card variants (.glass, .outlined, compact default, opaque Request Card, translucent-over-scrim Request Card) to select increasedContrastBorder under Increased Contrast and standardBorder otherwise via this exact ternary — found \(occurrences)")
    }

    /// Reading `colorSchemeContrast` requires an environment-reading seam — `compactCardSurface` is
    /// today a plain `View` extension with no environment access, so it must move its border behind a
    /// `ViewModifier` (or equivalent) to gain one. `HermexCardSurfaceModifier` (the existing seam for
    /// `.glass`/`.outlined`) already declares one `@Environment(\.colorSchemeContrast)`; this requires
    /// at least two more — compact's new seam and `RequestCardSurfaceModifier` — while leaving
    /// `compactCardSurface`'s own public call signature (and its documented `.clear` fill support)
    /// completely unchanged.
    func testAtLeastTwoMoreEnvironmentReadingSeamsExistForCompactAndRequestCardBorders() throws {
        let src = try source("HermesMobile/Features/Shared/HermexCard.swift")
        let declaration = "@Environment(\\.colorSchemeContrast) private var colorSchemeContrast"
        let occurrences = src.components(separatedBy: declaration).count - 1
        XCTAssertGreaterThanOrEqual(occurrences, 3,
                                    "expected at least 3 declarations of @Environment(\\.colorSchemeContrast): the existing HermexCardSurfaceModifier, plus a new seam each for compactCardSurface and RequestCardSurfaceModifier — found \(occurrences)")
    }

    func testCompactCardSurfacesPublicSignatureStaysUnchangedWhileItGainsIncreasedContrastSupport() throws {
        let src = try source("HermesMobile/Features/Shared/HermexCard.swift")
        XCTAssertTrue(
            src.contains("func compactCardSurface(cornerRadius: CGFloat = HermesRadius.card, fill: Color = HermexCardColors.secondarySurface) -> some View {"),
            "compactCardSurface's public call signature — including its cornerRadius/fill defaults — must stay exactly as callers already depend on while its border gains Increased Contrast support behind a new environment-reading seam"
        )
    }

    func testRequestCardOpaqueUsesTheTokenizedPrimaryBackgroundAndTranslucentOverScrimKeepsMaterialBehaviorWithATokenizedBorder() throws {
        let src = try source("HermesMobile/Features/Shared/HermexCard.swift")
        guard let structIdx = src.range(of: "private struct RequestCardSurfaceModifier") else {
            return XCTFail("expected RequestCardSurfaceModifier")
        }
        let tail = String(src[structIdx.lowerBound...])
        guard let bodyRange = tail.range(of: #"func body\(content: Content\) -> some View \{[\s\S]*?\n    \}\n\}"#, options: .regularExpression) else {
            return XCTFail("expected RequestCardSurfaceModifier.body")
        }
        let body = String(tail[bodyRange])
        XCTAssertTrue(body.contains(".background(HermexCardColors.primarySurface, in: shape)"), "expected the opaque case to use HermexCardColors.primarySurface")
        XCTAssertTrue(body.contains(".regularMaterial, in: shape"), "translucent-over-scrim must keep material behavior")
        XCTAssertTrue(body.contains("HermexCardColors.standardBorder"), "expected a tokenized border on the Request Card surface")
        XCTAssertFalse(body.contains("secondarySystemBackground"), "the retired platform background must be gone from Request Card")
        XCTAssertFalse(body.contains(".primary.opacity(0.10)"), "the retired Color.primary.opacity border recipe must be gone from Request Card")
    }

    /// The accepted correction requires `RequestCardSurfaceModifier` itself to read
    /// `colorSchemeContrast` (it is already a `ViewModifier`, unlike the free-function
    /// `compactCardSurface`) and for both its `.opaque` and `.translucentOverScrim` branches to
    /// select `increasedContrastBorder`/`standardBorder` via the same ternary the other three
    /// variants use.
    func testRequestCardSurfaceModifierReadsColorSchemeContrastAndBothMaterialsSelectIncreasedContrastBorder() throws {
        let src = try source("HermesMobile/Features/Shared/HermexCard.swift")
        guard let structIdx = src.range(of: "private struct RequestCardSurfaceModifier") else {
            return XCTFail("expected RequestCardSurfaceModifier")
        }
        let tail = String(src[structIdx.lowerBound...])
        XCTAssertTrue(tail.contains("@Environment(\\.colorSchemeContrast)"),
                      "expected RequestCardSurfaceModifier to declare @Environment(\\.colorSchemeContrast) so both materials can select the Increased Contrast border")

        guard let bodyRange = tail.range(of: #"func body\(content: Content\) -> some View \{[\s\S]*?\n    \}\n\}"#, options: .regularExpression) else {
            return XCTFail("expected RequestCardSurfaceModifier.body")
        }
        let body = String(tail[bodyRange])
        let ternary = "colorSchemeContrast == .increased ? HermexCardColors.increasedContrastBorder : HermexCardColors.standardBorder"
        let occurrences = body.components(separatedBy: ternary).count - 1
        XCTAssertEqual(occurrences, 2,
                       "expected both the .opaque and .translucentOverScrim branches to select increasedContrastBorder under Increased Contrast and standardBorder otherwise — found \(occurrences)")
    }

    func testRetiredPlatformColorExpressionsAreAbsentFromHermexCardSwift() throws {
        let src = try source("HermesMobile/Features/Shared/HermexCard.swift")
        XCTAssertFalse(src.contains("Color(.secondarySystemBackground)"), "retired: direct secondarySystemBackground surface recipe")
        XCTAssertFalse(src.contains("Color(.systemBackground)"), "retired: direct systemBackground surface recipe")
        XCTAssertFalse(src.contains("Color(.separator)"), "retired: direct separator border recipe")
        XCTAssertFalse(src.contains(".primary.opacity"), "retired: Color.primary.opacity border recipe")
    }
}
