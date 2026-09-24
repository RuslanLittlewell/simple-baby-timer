export const ACTIVITY_GRADIENTS = {
  dark: {
    settling: ['#496070', '#163348'] as const,
    sleep: ['#3E5AA8', '#16234A'] as const,
    feed: ['#FFFDF6', '#F9E3A0'] as const,
    awake: ['#5C8A3E', '#1F3D12'] as const,
    poop: ['#A9714B', '#5E3A21'] as const,
    diaper: ['#FFFFFF', '#D8D8DE'] as const,
    nightWaking: ['#321B55', '#160B2B'] as const,
    custom: ['#FFFFFF', '#FFFFFF'] as const,
  },
  light: {
    settling: ['#EAF9FF', '#D2ECFA'] as const,
    sleep: ['#EEF2FF', '#DCE6FF'] as const,
    feed: ['#FFF9E3', '#FFF2C9'] as const,
    awake: ['#F1FCE6', '#E4F7D2'] as const,
    poop: ['#F3E3D3', '#E8CDB0'] as const,
    diaper: ['#F2EEFC', '#E4DBF8'] as const,
    nightWaking: ['#F4F0FC', '#E7DDF6'] as const,
    custom: ['#FFFFFF', '#FFFFFF'] as const,
  },
};

/**
 * Calendar blocks sit on a white timeline, where the pale light fills above
 * wash out, so the light theme gets a deeper tint of each hue there.
 */
export const ACTIVITY_TIMELINE_GRADIENTS = {
  dark: ACTIVITY_GRADIENTS.dark,
  light: {
    settling: ['#CDEBFA', '#B3DDF4'] as const,
    sleep: ['#D6E0FF', '#BFCFFF'] as const,
    feed: ['#FFEFB8', '#FFE38F'] as const,
    awake: ['#DDF5C6', '#C8EDA8'] as const,
    poop: ['#E8CDB0', '#D9B48E'] as const,
    diaper: ['#E1D8F7', '#CFC1F1'] as const,
    nightWaking: ['#E4D9F6', '#D2C1EE'] as const,
    custom: ['#FFFFFF', '#FFFFFF'] as const,
  },
};

export const ACTIVITY_FG = {
  dark: {
    settling: '#EAF8FF',
    sleep: '#EEF2FF',
    feed: '#6B4E00',
    awake: '#F0FFE7',
    poop: '#FFFFFF',
    diaper: '#45454B',
    nightWaking: '#F3E9FF',
    custom: '#1C1C1E',
  },
  light: {
    settling: '#0B4D6E',
    sleep: '#1E3A78',
    feed: '#7A5300',
    awake: '#2B5D18',
    poop: '#4A2E12',
    diaper: '#4B3583',
    nightWaking: '#4B3583',
    custom: '#1C1C1E',
  },
} as const;

export const ACTIVITY_ACCENT = {
  dark: {
    settling: '#69C6F0',
    sleep: '#4C8DFF',
    feed: '#F4C95D',
    awake: '#C6F23A',
    poop: '#8B5A2B',
    diaper: '#C7C7CE',
    nightWaking: '#B996F2',
    custom: '#FFFFFF',
  },
  light: {
    settling: '#2FA9E0',
    sleep: '#3F63D6',
    feed: '#E8A400',
    awake: '#4CAF3D',
    poop: '#8B5A2B',
    diaper: '#7C5CD6',
    nightWaking: '#7C5CD6',
    custom: '#A1A1AA',
  },
} as const;




export const ACTIVITY_FLOAT_ACCENT = {
  dark: { ...ACTIVITY_ACCENT.dark, awake: '#FFE066' },
  light: { ...ACTIVITY_ACCENT.light, awake: '#D99A00' },
} as const;
