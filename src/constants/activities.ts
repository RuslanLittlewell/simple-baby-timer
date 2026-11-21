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

export interface ActivitySurface {
  fill: string;
  gradient?: readonly [string, string];
  border: string;
  activeBorder: string;
  control: string;
  controlBorder: string;
  controlIcon: string;
  icon: string;
  tint: string;
  label: string;
}

export const ACTIVITY_SURFACES: Record<'dark' | 'light', Record<keyof typeof ACTIVITY_ACCENT.dark, ActivitySurface>> = {
  dark: {
    settling: {
      fill: '#17323A',
      border: '#25474F',
      activeBorder: '#6CC7E6',
      control: '#2A4F57',
      controlBorder: '#3A6670',
      controlIcon: '#F2FBFF',
      icon: '#6CC7E6',
      tint: '#6CC7E6',
      label: '#EAF6FA',
    },
    sleep: {
      fill: '#212A4A',
      border: '#323E66',
      activeBorder: '#8EA2FF',
      control: '#36426E',
      controlBorder: '#47548A',
      controlIcon: '#F2F4FF',
      icon: '#8EA2FF',
      tint: '#8EA2FF',
      label: '#EEF0FF',
    },
    awake: {
      fill: '#283222',
      border: '#3A4630',
      activeBorder: '#C9E86A',
      control: '#46582F',
      controlBorder: '#5B7039',
      controlIcon: '#F6FBEA',
      icon: '#C9E86A',
      tint: '#C9E86A',
      label: '#F2F7E8',
    },
    feed: {
      fill: '#FFFDF6',
      gradient: ['#FFFDF6', '#F9E3A0'],
      border: 'rgba(244,201,93,0.68)',
      activeBorder: '#B8860B',
      control: 'rgba(107,78,0,0.2)',
      controlBorder: 'rgba(107,78,0,0.38)',
      controlIcon: '#FFFFFF',
      icon: '#F4C95D',
      tint: '#F3C36B',
      label: '#6B4E00',
    },
    diaper: {
      fill: '#FFFFFF',
      gradient: ['#FFFFFF', '#D8D8DE'],
      border: 'rgba(105,112,124,0.82)',
      activeBorder: '#69707C',
      control: 'rgba(69,69,75,0.2)',
      controlBorder: 'rgba(69,69,75,0.38)',
      controlIcon: '#45454B',
      icon: '#45454B',
      tint: '#D2D7E3',
      label: '#45454B',
    },
    poop: {
      fill: '#4A3329',
      border: '#634538',
      activeBorder: '#E2B89A',
      control: '#634538',
      controlBorder: '#7A5646',
      controlIcon: '#FFF4EC',
      icon: '#F6E9E0',
      tint: '#F6E9E0',
      label: '#FBF1EA',
    },
    nightWaking: {
      fill: '#2A2342',
      border: '#3C325C',
      activeBorder: '#B996F2',
      control: '#3C325C',
      controlBorder: '#4E4274',
      controlIcon: '#F5EEFF',
      icon: '#B996F2',
      tint: '#B996F2',
      label: '#F1EAFD',
    },
    custom: {
      fill: '#262B38',
      border: '#383E4D',
      activeBorder: '#E6E8EE',
      control: '#383E4D',
      controlBorder: '#4A5162',
      controlIcon: '#FFFFFF',
      icon: '#E6E8EE',
      tint: '#E6E8EE',
      label: '#F4F5F8',
    },
  },
  light: {
    settling: {
      fill: '#E3F3F7',
      border: '#C3E2EA',
      activeBorder: '#2FA9E0',
      control: '#CBE7EF',
      controlBorder: '#AFD8E3',
      controlIcon: '#0B4D6E',
      icon: '#1F8DBE',
      tint: '#1F8DBE',
      label: '#0B4D6E',
    },
    sleep: {
      fill: '#E7EBFA',
      border: '#CDD5F2',
      activeBorder: '#3F63D6',
      control: '#D3DAF5',
      controlBorder: '#BCC6EE',
      controlIcon: '#1E3A78',
      icon: '#3F63D6',
      tint: '#3F63D6',
      label: '#1E3A78',
    },
    awake: {
      fill: '#ECF3E2',
      border: '#D3E2C1',
      activeBorder: '#4CAF3D',
      control: '#D9E8C8',
      controlBorder: '#C2D8AA',
      controlIcon: '#2B5D18',
      icon: '#4C9A2F',
      tint: '#4C9A2F',
      label: '#2B5D18',
    },
    feed: {
      fill: '#FFF9E3',
      gradient: ['#FFF9E3', '#FFF2C9'],
      border: 'rgba(232,164,0,0.68)',
      activeBorder: '#C98A00',
      control: 'rgba(122,83,0,0.14)',
      controlBorder: 'rgba(122,83,0,0.32)',
      controlIcon: '#7A5300',
      icon: '#E8A400',
      tint: '#C98A00',
      label: '#7A5300',
    },
    diaper: {
      fill: '#F2EEFC',
      gradient: ['#F2EEFC', '#E4DBF8'],
      border: 'rgba(105,112,124,0.82)',
      activeBorder: '#7C5CD6',
      control: 'rgba(75,53,131,0.14)',
      controlBorder: 'rgba(75,53,131,0.32)',
      controlIcon: '#4B3583',
      icon: '#4B3583',
      tint: '#7C5CD6',
      label: '#4B3583',
    },
    poop: {
      fill: '#F2E6DD',
      border: '#E2CDBE',
      activeBorder: '#8B5A2B',
      control: '#E8D4C5',
      controlBorder: '#D9BDA9',
      controlIcon: '#4A2E12',
      icon: '#8B5A2B',
      tint: '#8B5A2B',
      label: '#4A2E12',
    },
    nightWaking: {
      fill: '#EEE8F9',
      border: '#DACFF2',
      activeBorder: '#7C5CD6',
      control: '#E0D6F5',
      controlBorder: '#CDBFEE',
      controlIcon: '#4B3583',
      icon: '#7C5CD6',
      tint: '#7C5CD6',
      label: '#4B3583',
    },
    custom: {
      fill: '#FFFFFF',
      border: '#DCE3EC',
      activeBorder: '#A1A1AA',
      control: '#EEF1F5',
      controlBorder: '#DCE3EC',
      controlIcon: '#1C1C1E',
      icon: '#52525B',
      tint: '#52525B',
      label: '#1C1C1E',
    },
  },
};
