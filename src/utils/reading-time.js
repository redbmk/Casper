const wordCount = (html) => {
  const pattern = /[a-zA-ZÀ-ÿ0-9_\u0392-\u03c9\u0410-\u04F9]+|[\u4E00-\u9FFF\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/g;
  const match = html.replace(/<(.|\n)*?>/g, ' ').match(pattern);
  let count = 0;
  if (match === null) {
    return count;
  }
  for (let i = 0; i < match.length; i += 1) {
    if (match[i].charCodeAt(0) >= 0x4E00) {
      count += match[i].length;
    } else {
      count += 1;
    }
  }
  return count;
};

const imageCount = html => (html.match(/<img(.|\n)*?>/g) || []).length;

export default ({ html, feature_image: featureImage } = {}) => {
  const wordsPerMinute = 275;
  const wordsPerSecond = wordsPerMinute / 60;

  const images = (featureImage ? 1 : 0) + imageCount(html);
  let readingTimeSeconds = wordCount(html) / wordsPerSecond;

  for (let i = 12; i > 12 - images; i -= 1) {
    // add 12 seconds for the first image, 11 for the second, etc. limiting at 3
    readingTimeSeconds += Math.max(i, 3);
  }

  const readingTimeMinutes = Math.round(readingTimeSeconds / 60);

  if (readingTimeSeconds < 60) {
    return '< 1 min read';
  } else if (readingTimeMinutes === 1) {
    return '1 min read';
  }

  return `${readingTimeMinutes} min read`;
};
