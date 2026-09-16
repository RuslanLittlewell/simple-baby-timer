interface ProAccessChild {
  id: string;
  proEnabled?: boolean;
}

interface ProAccessState {
  activeChildId: string | null;
  children: readonly ProAccessChild[];
  proActive: boolean;
}

/**
 * Account Pro unlocks every child. A shared child's Pro also unlocks all
 * child-scoped features for every member who has access to that child.
 */
export function hasProAccess(
  state: ProAccessState,
  childId: string | null = state.activeChildId,
): boolean {
  if (state.proActive) return true;
  if (!childId) return false;
  return state.children.some(
    (child) => child.id === childId && child.proEnabled === true,
  );
}

export const selectActiveChildProAccess = (state: ProAccessState): boolean =>
  hasProAccess(state);
