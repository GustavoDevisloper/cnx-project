/**
 * Biblioteca de emojis em formato Unicode
 * Isso garante a compatibilidade em diferentes plataformas e sistemas
 */

// Pessoas e expressões
export const EMOJI = {
  // Expressões e pessoas
  SMILE: '\u{1F600}',
  GRIN: '\u{1F601}',
  JOY: '\u{1F602}',
  LAUGH: '\u{1F603}',
  HEART_EYES: '\u{1F60D}',
  WINK: '\u{1F609}',
  THINKING: '\u{1F914}',
  PRAY: '\u{1F64F}',
  CLAP: '\u{1F44F}',
  THUMBS_UP: '\u{1F44D}',
  THUMBS_DOWN: '\u{1F44E}',
  WAVE: '\u{1F44B}',
  RAISED_HANDS: '\u{1F64C}',
  MUSCLE: '\u{1F4AA}',
  PERSON: '\u{1F464}',
  PEOPLE: '\u{1F465}',
  
  // Natureza
  SUN: '\u{2600}',
  CLOUD: '\u{2601}',
  RAIN: '\u{1F327}',
  SNOW: '\u{1F328}',
  THUNDER: '\u{26C8}',
  STAR: '\u{2B50}',
  SPARKLES: '\u{2728}',
  FLOWER: '\u{1F33C}',
  TREE: '\u{1F332}',
  DOVE: '\u{1F54A}',
  BUTTERFLY: '\u{1F98B}',
  RAINBOW: '\u{1F308}',
  
  // Objetos
  BOOK: '\u{1F4D6}',
  BOOKS: '\u{1F4DA}',
  BELL: '\u{1F514}',
  ALARM: '\u{23F0}',
  CLOCK: '\u{1F550}',
  GIFT: '\u{1F381}',
  CAKE: '\u{1F382}',
  BALLOON: '\u{1F388}',
  PARTY: '\u{1F389}',
  CALENDAR: '\u{1F4C5}',
  PIN: '\u{1F4CD}',
  MEMO: '\u{1F4DD}',
  MEGAPHONE: '\u{1F4E2}',
  EMAIL: '\u{1F4E7}',
  PHONE: '\u{1F4DE}',
  SMARTPHONE: '\u{1F4F1}',
  LAPTOP: '\u{1F4BB}',
  LIGHT_BULB: '\u{1F4A1}',
  INFO: '\u{2139}',
  CHECK: '\u{2714}',
  CROSS: '\u{274C}',
  WARNING: '\u{26A0}',
  HEART: '\u{2764}',
  
  // Música
  MUSIC: '\u{1F3B5}',
  MUSICAL_NOTE: '\u{1F3B5}',
  MUSICAL_NOTES: '\u{1F3B6}',
  MICROPHONE: '\u{1F3A4}',
  HEADPHONES: '\u{1F3A7}',
  
  // Religião
  CROSS_SYMBOL: '\u{271D}',
  BIBLE: '\u{1F4D6}', // Mesmo que livro
  CHURCH: '\u{26EA}',
  PRAY_HANDS: '\u{1F64F}', // Mesmo que oração
  
  // Símbolos diversos
  ARROW_RIGHT: '\u{27A1}',
  ARROW_LEFT: '\u{2B05}',
  ARROW_UP: '\u{2B06}',
  ARROW_DOWN: '\u{2B07}',
  CHECK_MARK: '\u{2705}',
  RED_CIRCLE: '\u{1F534}',
  GREEN_CIRCLE: '\u{1F7E2}',
};

/**
 * Substitui emojis literais por suas representações Unicode
 * @param text Texto com emojis literais
 * @returns Texto com emojis em formato Unicode
 */
export const convertLiteralToUnicode = (text: string): string => {
  // Mapeamento de emojis literais para códigos Unicode
  const emojiMap: {[key: string]: string} = {
    '😀': EMOJI.SMILE,
    '😁': EMOJI.GRIN,
    '😂': EMOJI.JOY,
    '😃': EMOJI.LAUGH,
    '😍': EMOJI.HEART_EYES,
    '😉': EMOJI.WINK,
    '🤔': EMOJI.THINKING,
    '🙏': EMOJI.PRAY,
    '👏': EMOJI.CLAP,
    '👍': EMOJI.THUMBS_UP,
    '👎': EMOJI.THUMBS_DOWN,
    '👋': EMOJI.WAVE,
    '🙌': EMOJI.RAISED_HANDS,
    '💪': EMOJI.MUSCLE,
    '👤': EMOJI.PERSON,
    '👥': EMOJI.PEOPLE,
    '☀️': EMOJI.SUN,
    '☁️': EMOJI.CLOUD,
    '🌧️': EMOJI.RAIN,
    '🌨️': EMOJI.SNOW,
    '⛈️': EMOJI.THUNDER,
    '⭐': EMOJI.STAR,
    '✨': EMOJI.SPARKLES,
    '🌼': EMOJI.FLOWER,
    '🌲': EMOJI.TREE,
    '🕊️': EMOJI.DOVE,
    '🦋': EMOJI.BUTTERFLY,
    '🌈': EMOJI.RAINBOW,
    '📖': EMOJI.BOOK,
    '📚': EMOJI.BOOKS,
    '🔔': EMOJI.BELL,
    '⏰': EMOJI.ALARM,
    '🕐': EMOJI.CLOCK,
    '🎁': EMOJI.GIFT,
    '🎂': EMOJI.CAKE,
    '🎈': EMOJI.BALLOON,
    '🎉': EMOJI.PARTY,
    '📅': EMOJI.CALENDAR,
    '📍': EMOJI.PIN,
    '📝': EMOJI.MEMO,
    '📢': EMOJI.MEGAPHONE,
    '📧': EMOJI.EMAIL,
    '📞': EMOJI.PHONE,
    '📱': EMOJI.SMARTPHONE,
    '💻': EMOJI.LAPTOP,
    '💡': EMOJI.LIGHT_BULB,
    'ℹ️': EMOJI.INFO,
    '✅': EMOJI.CHECK,
    '❌': EMOJI.CROSS,
    '⚠️': EMOJI.WARNING,
    '❤️': EMOJI.HEART,
    '🎵': EMOJI.MUSIC,
    '🎶': EMOJI.MUSICAL_NOTES,
    '🎤': EMOJI.MICROPHONE,
    '🎧': EMOJI.HEADPHONES,
    '✝️': EMOJI.CROSS_SYMBOL,
    '⛪': EMOJI.CHURCH,
  };
  
  // Substitui todos os emojis literais por suas representações Unicode
  let result = text;
  for (const [literal, unicode] of Object.entries(emojiMap)) {
    result = result.replace(new RegExp(literal, 'g'), unicode);
  }
  
  return result;
};

/**
 * Verifica se uma string contém emojis literais e os converte para Unicode
 * @param text Texto para verificar
 * @returns Texto com emojis em formato Unicode
 */
export const ensureUnicodeEmojis = (text: string): string => {
  // Regex para detectar a presença de emojis literais
  const emojiRegex = /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2B00}-\u{2BFF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2702}-\u{27B0}]|[\u{24C2}-\u{1F251}]/gu;
  
  // Se houver emojis literais, converte para Unicode
  if (emojiRegex.test(text)) {
    return convertLiteralToUnicode(text);
  }
  
  return text;
}; 