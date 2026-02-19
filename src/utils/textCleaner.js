function collapseSpaces(value) {
  return (value || '').replace(/[ \t]{2,}/g, ' ').trim();
}

function stripDecorativeLines(lines) {
  return lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^[-_=~]{3,}$/.test(trimmed)) return false;
    if (/^[*#.,:;'"`|/\\()[\]{}<>%\-–—]+$/.test(trimmed)) return false;
    if (/^[â€¢â–ªï¸]+$/.test(trimmed)) return false;
    return true;
  });
}

function cleanBase(value) {
  if (!value) return '';

  let out = String(value)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  // Remove most emoji and dingbat-style symbols.
  out = out
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[\u2600-\u27BF]/g, '')
    .replace(/[â€¢â–ªï¸]+/g, ' ');

  const lines = out
    .split('\n')
    .map((line) =>
      collapseSpaces(
        line.replace(/^[\s\-–—•▪◾◼◆◇●○▶►■□✦✧★☆]+/g, '')
      )
    )
    .filter(Boolean);

  return stripDecorativeLines(lines).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function cleanArabicText(value) {
  // Keep brackets/symbols, but remove markdown and decorative star markers from Arabic display.
  const withoutStars = cleanBase(value).replace(/[*_`~٭✱✲✳✴✶✷✸✹✺✻✼✽✾✿❇❈❉❊❋⭐🌟]+/g, ' ');
  return collapseSpaces(withoutStars).trim();
}

export function cleanBodyText(value) {
  return cleanBase(value);
}
