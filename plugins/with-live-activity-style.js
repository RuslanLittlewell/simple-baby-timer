const fs = require('node:fs');
const path = require('node:path');

const { withFinalizedMod } = require('expo/config-plugins');

function replaceRequired(source, original, replacement, fileName) {
  if (source.includes(replacement)) return source;
  if (!source.includes(original)) {
    throw new Error(`Cannot apply BabyTimer Live Activity styling to ${fileName}`);
  }
  return source.replace(original, replacement);
}

function styleMediumView(source) {
  return replaceRequired(
    source,
    `          Text(contentState.title)
            .font(.title2)
            .fontWeight(.semibold)
            .modifier(ConditionalForegroundViewModifier(color: attributes.titleColor))`,
    `          HStack(spacing: 8) {
            Circle()
              .fill(progressViewTint ?? .white.opacity(0.35))
              .frame(width: 12, height: 12)
            Text(contentState.title)
              .font(.title2)
              .fontWeight(.semibold)
              .modifier(ConditionalForegroundViewModifier(color: attributes.titleColor))
          }`,
    'LiveActivityMediumView.swift',
  );
}

function styleSmallView(source) {
  return replaceRequired(
    source,
    `                Text(contentState.title)
                  .font(carPlayView
                    ? (isSubtitleDisplayed || contentState.hasSegmentedProgress ? .body : .footnote)
                    : (isSubtitleDisplayed ? .footnote : .callout))
                  .fontWeight(.semibold)
                  .lineLimit(1)
                  .modifier(ConditionalForegroundViewModifier(color: attributes.titleColor))`,
    `                HStack(spacing: 5) {
                  Circle()
                    .fill(progressViewTint ?? .white.opacity(0.35))
                    .frame(width: 8, height: 8)
                  Text(contentState.title)
                    .font(carPlayView
                      ? (isSubtitleDisplayed || contentState.hasSegmentedProgress ? .body : .footnote)
                      : (isSubtitleDisplayed ? .footnote : .callout))
                    .fontWeight(.semibold)
                    .lineLimit(1)
                    .modifier(ConditionalForegroundViewModifier(color: attributes.titleColor))
                }`,
    'LiveActivitySmallView.swift',
  );
}

function styleDynamicIsland(source) {
  let styled = replaceRequired(
    source,
    `          dynamicIslandExpandedLeading(title: context.state.title, subtitle: context.state.subtitle)`,
    `          dynamicIslandExpandedLeading(
            title: context.state.title,
            subtitle: context.state.subtitle,
            progressViewTint: context.attributes.progressViewTint
          )`,
    'LiveActivityWidget.swift',
  );
  styled = replaceRequired(
    styled,
    `  private func dynamicIslandExpandedLeading(title: String, subtitle: String?) -> some View {
    VStack(alignment: .leading) {
      Spacer()
      Text(title)
        .font(.title2)
        .foregroundStyle(.white)
        .fontWeight(.semibold)`,
    `  private func dynamicIslandExpandedLeading(
    title: String,
    subtitle: String?,
    progressViewTint: String?
  ) -> some View {
    VStack(alignment: .leading) {
      Spacer()
      HStack(spacing: 7) {
        Circle()
          .fill(progressViewTint.map { Color(hex: $0) } ?? .white.opacity(0.35))
          .frame(width: 10, height: 10)
        Text(title)
          .font(.title2)
          .foregroundStyle(.white)
          .fontWeight(.semibold)
      }`,
    'LiveActivityWidget.swift',
  );
  return styled;
}

const SUBTITLE_VIEW = `
// BabyTimer: subtitles may carry "visible␟lastFeedingMs␟locale␟template" (␟ = U+001F),
// rendered as "visible (template with live elapsed time)".
struct LiveActivitySubtitleText: View {
  private let visible: String
  private let lastFeedingDate: Date?
  private let locale: Locale
  private let prefix: String
  private let suffix: String

  init(_ subtitle: String) {
    let fields = subtitle.components(separatedBy: "\\u{1F}")
    visible = fields[0]
    if fields.count == 4, let milliseconds = Double(fields[1]) {
      let template = fields[3].components(separatedBy: "{time}")
      lastFeedingDate = Date(timeIntervalSince1970: milliseconds / 1000)
      locale = Locale(identifier: fields[2])
      prefix = template[0]
      suffix = template.count > 1 ? template[1] : ""
    } else {
      lastFeedingDate = nil
      locale = .current
      prefix = ""
      suffix = ""
    }
  }

  var body: some View {
    if let lastFeedingDate {
      Text("\\(visible) (\\(prefix)\\(elapsedText(since: lastFeedingDate))\\(suffix))")
        .environment(\\.locale, locale)
    } else {
      Text(visible)
    }
  }

  private func elapsedText(since date: Date) -> Text {
    if #available(iOS 18.0, *) {
      return Text(.currentDate, format: .offset(to: date, allowedFields: [.hour, .minute], sign: .never))
    }
    return Text(date, style: .relative)
  }
}
`;

function withSubtitleText(source, fileName) {
  return replaceRequired(source, 'Text(subtitle)', 'LiveActivitySubtitleText(subtitle)', fileName);
}

function addSubtitleView(source) {
  return source.includes('struct LiveActivitySubtitleText') ? source : source + SUBTITLE_VIEW;
}

const transformations = {
  'LiveActivityMediumView.swift': (source) =>
    withSubtitleText(styleMediumView(source), 'LiveActivityMediumView.swift'),
  'LiveActivitySmallView.swift': (source) =>
    withSubtitleText(styleSmallView(source), 'LiveActivitySmallView.swift'),
  'LiveActivityWidget.swift': (source) =>
    withSubtitleText(styleDynamicIsland(source), 'LiveActivityWidget.swift'),
  'ViewHelpers.swift': addSubtitleView,
};

function applyLiveActivityStyles(targetDirectory) {
  for (const [fileName, transform] of Object.entries(transformations)) {
    const filePath = path.join(targetDirectory, fileName);
    const source = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, transform(source));
  }
}

function withLiveActivityStyle(config) {
  return withFinalizedMod(config, ['ios', (modConfig) => {
    applyLiveActivityStyles(
      path.join(modConfig.modRequest.platformProjectRoot, 'LiveActivity'),
    );
    return modConfig;
  }]);
}

module.exports = withLiveActivityStyle;
module.exports.applyLiveActivityStyles = applyLiveActivityStyles;
module.exports.transformations = transformations;
