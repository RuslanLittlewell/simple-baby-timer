export const ACTIVITY_GRADIENTS = {
  dark: {
    settling: ['#496070', '#163348'] as const,
    sleep: ['#3E5AA8', '#16234A'] as const,
    feed: ['#FFFDF6', '#F9E3A0'] as const,
    awake: ['#5C8A3E', '#1F3D12'] as const,
    poop: ['#A9714B', '#5E3A21'] as const,
    diaper: ['#FFFFFF', '#D8D8DE'] as const,
    nightWaking: ['#321B55', '#160B2B'] as const,
  },
  light: {
    settling: ['#EAF9FF', '#D2ECFA'] as const,
    sleep: ['#EEF2FF', '#DCE6FF'] as const,
    feed: ['#FFF9E3', '#FFF2C9'] as const,
    awake: ['#F1FCE6', '#E4F7D2'] as const,
    poop: ['#F3E3D3', '#E8CDB0'] as const,
    diaper: ['#F2EEFC', '#E4DBF8'] as const,
    nightWaking: ['#F4F0FC', '#E7DDF6'] as const,
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
  },
  light: {
    settling: '#0B4D6E',
    sleep: '#1E3A78',
    feed: '#7A5300',
    awake: '#2B5D18',
    poop: '#4A2E12',
    diaper: '#4B3583',
    nightWaking: '#4B3583',
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
  },
  light: {
    settling: '#2FA9E0',
    sleep: '#3F63D6',
    feed: '#E8A400',
    awake: '#4CAF3D',
    poop: '#8B5A2B',
    diaper: '#7C5CD6',
    nightWaking: '#7C5CD6',
  },
} as const;




export const ACTIVITY_FLOAT_ACCENT = {
  dark: { ...ACTIVITY_ACCENT.dark, awake: '#FFE066' },
  light: { ...ACTIVITY_ACCENT.light, awake: '#D99A00' },
} as const;
