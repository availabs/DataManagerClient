import PublishStatus from "../../../constants/PublishStatus";

import { createSimpleIdentityAction } from "pages/DataManager/utils/Reducks";

export const resetState = createSimpleIdentityAction("RESET_STATE");

export const updateDamaSourceName = createSimpleIdentityAction(
  "damaSourceName/UPDATE"
);

export const updateDamaSourceDisplayName = createSimpleIdentityAction(
  "damaSourceDisplayName/UPDATE"
);

export const updateDamaSourceId = createSimpleIdentityAction(
  "damaSourceId/UPDATE"
);

export const updateEtlContextId = createSimpleIdentityAction(
  "etlContextId/UPDATE"
);

export const updateMaxSeenEventId = createSimpleIdentityAction(
  "maxSeenEventId/UPDATE"
);

export const setPublishStatusToInProgress = createSimpleIdentityAction(
  "publishStatus/UPDATE"
).bind(null, PublishStatus.IN_PROGRESS);

export const setPublishStatusToPublished = createSimpleIdentityAction(
  "publishStatus/UPDATE"
).bind(null, PublishStatus.PUBLISHED);

export const setPublishStatusToError = createSimpleIdentityAction(
  "publishStatus/UPDATE"
).bind(null, PublishStatus.ERROR);

export const updatePublishErrMsg = createSimpleIdentityAction(
  "publishErrMsg/UPDATE"
);
