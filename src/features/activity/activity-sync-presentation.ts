export type ActivitySyncPresentation = {
  showHeaderIndicator: boolean;
  activityActionsDisabled: boolean;
  nonActivityControlsDisabled: false;
};

export function activitySyncPresentation(syncing: boolean): ActivitySyncPresentation {
  return {
    showHeaderIndicator: syncing,
    activityActionsDisabled: syncing,
    nonActivityControlsDisabled: false,
  };
}
