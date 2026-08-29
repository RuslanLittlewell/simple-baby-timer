export interface DevelopmentalGame {
  id: string;
  title: string;
  instruction: string;
}

export const DEVELOPMENTAL_GAME_IDS = [
  'faceToFace',
  'findVoice',
  'contrastCards',
  'songs',
  'tummyTime',
  'bicycle',
  'textures',
  'mirror',
  'homeTour',
  'imitation',
] as const;

export const THREE_TO_FOUR_MONTH_GAME_IDS = [
  'm34CatchToy',
  'm34EyeTracking',
  'm34HandsTogether',
  'm34ConversationPauses',
  'm34SongsWithMovements',
  'm34WhereSound',
  'm34Mirror',
  'm34Textures',
  'm34TummyPlay',
  'm34TurnTowardToy',
  'm34AirplaneCarry',
  'm34RoomTour',
] as const;

export const FIVE_TO_SIX_MONTH_GAME_IDS = [
  'm56ReachToy',
  'm56HandTransfer',
  'm56TwoToys',
  'm56CauseEffect',
  'm56HiddenToy',
  'm56Peekaboo',
  'm56WhereSound',
  'm56SoundDialogue',
  'm56BodySongs',
  'm56Mirror',
  'm56TextureBasket',
  'm56TummyPlay',
  'm56CrawlPrep',
  'm56RollTowardInterest',
  'm56BookTogether',
] as const;

export const SEVEN_TO_NINE_MONTH_GAME_IDS = [
  'm79WhereToy',
  'm79Peekaboo',
  'm79TreasureBox',
  'm79PutInTakeOut',
  'm79TwoContainers',
  'm79KnockDownTower',
  'm79RollingBall',
  'm79MusicalCauseEffect',
  'm79CopyMe',
  'm79SyllableDialogue',
  'm79NameAndShow',
  'm79PictureBooks',
  'm79MirrorGames',
  'm79ObstacleCourse',
  'm79ReachAndMove',
  'm79Tunnel',
  'm79SupervisedWater',
] as const;

export const TEN_TO_TWELVE_MONTH_GAME_IDS = [
  'm1012PutInTakeOut',
  'm1012SimpleSorting',
  'm1012Tower',
  'm1012StackingRings',
  'm1012Nesting',
  'm1012FindHidden',
  'm1012BringObject',
  'm1012EverydayImitation',
  'm1012GesturesSongs',
  'm1012AnimalVehicleSounds',
  'm1012QuestionBook',
  'm1012BodyParts',
  'm1012BallTogether',
  'm1012PushPull',
  'm1012ObstacleCourse',
  'm1012CruiseSupport',
  'm1012Rhythm',
  'm1012WaterPlay',
] as const;

export const TEN_TO_TWELVE_MONTH_GUIDANCE_KEY = 'regime.game.m1012Guidance';

export const TWELVE_TO_FIFTEEN_MONTH_GAME_IDS = [
  'm1215Scribble',
  'm1215ShapeSorter',
  'm1215TallerTower',
  'm1215LidsAndJars',
  'm1215PostingSlot',
  'm1215SimplePuzzle',
  'm1215FirstWords',
  'm1215ShowMeWhere',
  'm1215DollCare',
  'm1215HouseholdHelp',
  'm1215NamingBook',
  'm1215SoundImitation',
  'm1215StepsToGoal',
  'm1215PushToy',
  'm1215SafeClimbing',
  'm1215ThrowAndFetch',
  'm1215DoughAndSensory',
  'm1215DanceAndStop',
] as const;

export const TWELVE_TO_FIFTEEN_MONTH_GUIDANCE_KEY = 'regime.game.m1215Guidance';

export const FIFTEEN_TO_EIGHTEEN_MONTH_GAME_IDS = [
  'm1518MatchByShape',
  'm1518ColourPairs',
  'm1518BiggerTower',
  'm1518ThreadBeads',
  'm1518ClipsOnBox',
  'm1518PourBetweenCups',
  'm1518BodyParts',
  'm1518TwoWordPhrases',
  'm1518SimpleErrands',
  'm1518SpoonAndCup',
  'm1518UndressingHelp',
  'm1518SameBookAgain',
  'm1518KickBall',
  'm1518StairsWithSupport',
  'm1518CarryWhileWalking',
  'm1518WalkTheLine',
  'm1518SandAndWater',
  'm1518RhythmInstruments',
] as const;

export const FIFTEEN_TO_EIGHTEEN_MONTH_GUIDANCE_KEY = 'regime.game.m1518Guidance';

export const EIGHTEEN_TO_TWENTY_FOUR_MONTH_GAME_IDS = [
  'm1824SortByTwoTraits',
  'm1824FourPiecePuzzle',
  'm1824SixBlockTower',
  'm1824LinesAndCircles',
  'm1824StickersAndTape',
  'm1824SizeOrder',
  'm1824TwoStepInstructions',
  'm1824PretendScenes',
  'm1824NameInPictures',
  'm1824HandWashing',
  'm1824DressingSimple',
  'm1824TurnTaking',
  'm1824RunAndStop',
  'm1824JumpInPlace',
  'm1824ThrowOverhand',
  'm1824StairsHoldingRail',
  'm1824DoughTools',
  'm1824MoveBigObjects',
] as const;

export const EIGHTEEN_TO_TWENTY_FOUR_MONTH_GUIDANCE_KEY = 'regime.game.m1824Guidance';

export type DevelopmentalGameId =
  | (typeof DEVELOPMENTAL_GAME_IDS)[number]
  | (typeof THREE_TO_FOUR_MONTH_GAME_IDS)[number]
  | (typeof FIVE_TO_SIX_MONTH_GAME_IDS)[number]
  | (typeof SEVEN_TO_NINE_MONTH_GAME_IDS)[number]
  | (typeof TEN_TO_TWELVE_MONTH_GAME_IDS)[number]
  | (typeof TWELVE_TO_FIFTEEN_MONTH_GAME_IDS)[number]
  | (typeof FIFTEEN_TO_EIGHTEEN_MONTH_GAME_IDS)[number]
  | (typeof EIGHTEEN_TO_TWENTY_FOUR_MONTH_GAME_IDS)[number];

const ALL_DEVELOPMENTAL_GAME_IDS: DevelopmentalGameId[] = [
  ...DEVELOPMENTAL_GAME_IDS,
  ...THREE_TO_FOUR_MONTH_GAME_IDS,
  ...FIVE_TO_SIX_MONTH_GAME_IDS,
  ...SEVEN_TO_NINE_MONTH_GAME_IDS,
  ...TEN_TO_TWELVE_MONTH_GAME_IDS,
  ...TWELVE_TO_FIFTEEN_MONTH_GAME_IDS,
  ...FIFTEEN_TO_EIGHTEEN_MONTH_GAME_IDS,
  ...EIGHTEEN_TO_TWENTY_FOUR_MONTH_GAME_IDS,
];

export const DEVELOPMENTAL_GAMES: Record<DevelopmentalGameId, DevelopmentalGame> =
  Object.fromEntries(
    ALL_DEVELOPMENTAL_GAME_IDS.map((id) => [
      id,
      {
        id,
        title: `regime.game.${id}.title`,
        instruction: `regime.game.${id}.instruction`,
      },
    ]),
  ) as Record<DevelopmentalGameId, DevelopmentalGame>;

const gameGroup = (...ids: DevelopmentalGameId[]) =>
  ids.map((id) => DEVELOPMENTAL_GAMES[id]);

export const SIX_TO_TWELVE_WEEK_GAME_GROUPS: DevelopmentalGame[][] = [
  gameGroup('faceToFace', 'findVoice'),
  gameGroup('contrastCards', 'songs'),
  gameGroup('tummyTime', 'bicycle'),
  gameGroup('textures', 'mirror'),
  gameGroup('homeTour', 'imitation'),
  gameGroup('faceToFace', 'songs', 'tummyTime'),
];

export const THREE_TO_FOUR_MONTH_GAME_GROUPS: DevelopmentalGame[][] = [
  gameGroup('m34CatchToy', 'm34EyeTracking'),
  gameGroup('m34HandsTogether', 'm34ConversationPauses'),
  gameGroup('m34SongsWithMovements', 'm34WhereSound'),
  gameGroup('m34Mirror', 'm34Textures', 'm34TummyPlay'),
  gameGroup('m34TurnTowardToy', 'm34AirplaneCarry', 'm34RoomTour'),
];

export const FIVE_TO_SIX_MONTH_GAME_GROUPS: DevelopmentalGame[][] = [
  gameGroup('m56ReachToy', 'm56HandTransfer', 'm56TwoToys', 'm56CauseEffect'),
  gameGroup('m56HiddenToy', 'm56Peekaboo', 'm56WhereSound', 'm56SoundDialogue'),
  gameGroup('m56BodySongs', 'm56Mirror', 'm56TextureBasket', 'm56BookTogether'),
  gameGroup('m56TummyPlay', 'm56CrawlPrep', 'm56RollTowardInterest'),
];

export const SEVEN_TO_NINE_MONTH_TWO_NAP_GAME_GROUPS: DevelopmentalGame[][] = [
  gameGroup('m79WhereToy', 'm79Peekaboo', 'm79TreasureBox', 'm79PutInTakeOut', 'm79TwoContainers', 'm79KnockDownTower'),
  gameGroup('m79RollingBall', 'm79MusicalCauseEffect', 'm79CopyMe', 'm79SyllableDialogue', 'm79NameAndShow', 'm79PictureBooks'),
  gameGroup('m79MirrorGames', 'm79ObstacleCourse', 'm79ReachAndMove', 'm79Tunnel', 'm79SupervisedWater'),
];

export const SEVEN_TO_NINE_MONTH_THREE_NAP_GAME_GROUPS: DevelopmentalGame[][] = [
  gameGroup('m79WhereToy', 'm79Peekaboo', 'm79TreasureBox', 'm79PutInTakeOut', 'm79TwoContainers'),
  gameGroup('m79KnockDownTower', 'm79RollingBall', 'm79MusicalCauseEffect', 'm79CopyMe'),
  gameGroup('m79SyllableDialogue', 'm79NameAndShow', 'm79PictureBooks', 'm79MirrorGames'),
  gameGroup('m79ObstacleCourse', 'm79ReachAndMove', 'm79Tunnel', 'm79SupervisedWater'),
];

export const TEN_TO_TWELVE_MONTH_GAME_GROUPS: DevelopmentalGame[][] = [
  gameGroup(
    'm1012PutInTakeOut',
    'm1012SimpleSorting',
    'm1012Tower',
    'm1012StackingRings',
    'm1012Nesting',
    'm1012FindHidden',
  ),
  gameGroup(
    'm1012BringObject',
    'm1012EverydayImitation',
    'm1012GesturesSongs',
    'm1012AnimalVehicleSounds',
    'm1012QuestionBook',
    'm1012BodyParts',
  ),
  gameGroup(
    'm1012BallTogether',
    'm1012PushPull',
    'm1012ObstacleCourse',
    'm1012CruiseSupport',
    'm1012Rhythm',
    'm1012WaterPlay',
  ),
];

export const TWELVE_TO_FIFTEEN_MONTH_GAME_GROUPS: DevelopmentalGame[][] = [
  gameGroup(
    'm1215Scribble',
    'm1215ShapeSorter',
    'm1215TallerTower',
    'm1215LidsAndJars',
    'm1215PostingSlot',
    'm1215SimplePuzzle',
  ),
  gameGroup(
    'm1215FirstWords',
    'm1215ShowMeWhere',
    'm1215DollCare',
    'm1215HouseholdHelp',
    'm1215NamingBook',
    'm1215SoundImitation',
  ),
  gameGroup(
    'm1215StepsToGoal',
    'm1215PushToy',
    'm1215SafeClimbing',
    'm1215ThrowAndFetch',
    'm1215DoughAndSensory',
    'm1215DanceAndStop',
  ),
];

export const FIFTEEN_TO_EIGHTEEN_MONTH_GAME_GROUPS: DevelopmentalGame[][] = [
  gameGroup(
    'm1518MatchByShape',
    'm1518ColourPairs',
    'm1518BiggerTower',
    'm1518ThreadBeads',
    'm1518ClipsOnBox',
    'm1518PourBetweenCups',
  ),
  gameGroup(
    'm1518BodyParts',
    'm1518TwoWordPhrases',
    'm1518SimpleErrands',
    'm1518SpoonAndCup',
    'm1518UndressingHelp',
    'm1518SameBookAgain',
  ),
  gameGroup(
    'm1518KickBall',
    'm1518StairsWithSupport',
    'm1518CarryWhileWalking',
    'm1518WalkTheLine',
    'm1518SandAndWater',
    'm1518RhythmInstruments',
  ),
];

export const EIGHTEEN_TO_TWENTY_FOUR_MONTH_GAME_GROUPS: DevelopmentalGame[][] = [
  gameGroup(
    'm1824SortByTwoTraits',
    'm1824FourPiecePuzzle',
    'm1824SixBlockTower',
    'm1824LinesAndCircles',
    'm1824StickersAndTape',
    'm1824SizeOrder',
  ),
  gameGroup(
    'm1824TwoStepInstructions',
    'm1824PretendScenes',
    'm1824NameInPictures',
    'm1824HandWashing',
    'm1824DressingSimple',
    'm1824TurnTaking',
  ),
  gameGroup(
    'm1824RunAndStop',
    'm1824JumpInPlace',
    'm1824ThrowOverhand',
    'm1824StairsHoldingRail',
    'm1824DoughTools',
    'm1824MoveBigObjects',
  ),
];

export function assignGamesToAwakeFills<T extends { startMin: number; endMin: number }>(
  fills: T[],
  gameGroups: DevelopmentalGame[][] = [],
): (T & { games?: DevelopmentalGame[] })[] {
  if (!gameGroups.length) return fills;
  return fills.map((fill, index) => ({
    ...fill,
    games: gameGroups[index % gameGroups.length],
  }));
}

export function resolveDevelopmentalGameGroups(
  variantGroups?: DevelopmentalGame[][],
  ageGroups?: DevelopmentalGame[][],
): DevelopmentalGame[][] | undefined {
  return variantGroups ?? ageGroups;
}
