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

const transformations = {
  'LiveActivityMediumView.swift': styleMediumView,
  'LiveActivitySmallView.swift': styleSmallView,
  'LiveActivityWidget.swift': styleDynamicIsland,
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
