// FIXME: These functions should probably get all their props from the ctx.
//        However, if an operation is used in an useEffect hook,
//          then the hook's dependencies array must contain the operation's deps.
//        Not sure how to resolve this at the moment.

import {
  getNpmrdsDataDateExtent,
  queueNpmrdsExportRequest,
  getOpenRequestsStatuses,
  getEtlProcessFinalEvent as getEtlProcessFinalEventFromDamaController,
} from "./api";

export async function configure(ctx = this) {
  const {
    dispatchers: {
      setRequestStatusToRequestingConfiguration,
      updateConfiguration,
      setRequestStatusToError,
      updateRequestErrMsg,
    },
  } = ctx;

  try {
    setRequestStatusToRequestingConfiguration();

    const npmrdsDataDateExtent = await getNpmrdsDataDateExtent(ctx);

    updateConfiguration({ npmrdsDataDateExtent });
  } catch (err) {
    console.error(err);
    setRequestStatusToError();
    updateRequestErrMsg(err.message);
  }
}

export async function monitorForStatusUpdates(ctx = this) {
  let interval;

  const fn = async () => {
    const {
      state: { etlContextId, npmrdsDownloadName },
      dispatchers: { updateRequestStatusMsg, updateNpmrdsDownloadName },
    } = ctx;

    if (!etlContextId) {
      return;
    }

    const openRequestsStatuses = await getOpenRequestsStatuses(ctx);

    const idx = openRequestsStatuses.findIndex(
      (e) => e.etl_context_id === etlContextId
    );

    if (idx === -1) {
      updateRequestStatusMsg("This request has finished processing");
      clearInterval(interval);
      getEtlProcessFinalEvent(ctx);
      return;
    }

    const {
      payload: { status: etlReqStatus },
    } = openRequestsStatuses[idx];

    if (idx > 0 && etlReqStatus === "QUEUED") {
      const plural = idx > 1 ? ["are", "s"] : ["is", ""];
      const [
        {
          payload: { status },
        },
      ] = openRequestsStatuses;

      updateRequestStatusMsg(
        `There ${plural[0]} ${idx} request${plural[1]} ahead of this one in the queue. The currently processing request's status is: ${status}`
      );
    } else {
      const {
        payload: { status, npmrdsDownloadName: _npmrdsDownloadName },
      } = openRequestsStatuses[idx];

      // Could leave this to the store to check, but why waste cycles
      if (!npmrdsDownloadName && _npmrdsDownloadName) {
        updateNpmrdsDownloadName(_npmrdsDownloadName);
      }

      updateRequestStatusMsg(`Request status: ${status}`);
    }
  };

  fn();
  interval = setInterval(fn, 1000);
}

export async function requestNpmrdsTravelTimesExport(ctx = this) {
  const {
    state: { dataState, dataStartDate, dataEndDate },
    dispatchers: {
      updateEtlContextId,
      setRequestStatusToSending,
      setRequestStatusToReceived,
      setRequestStatusToError,
      updateRequestErrMsg,
    },
  } = ctx;

  if (!(dataState && dataStartDate && dataEndDate)) {
    throw new Error("Incomplete data to throw request.");
  }

  try {
    setRequestStatusToSending();

    const { etlContextId } = await queueNpmrdsExportRequest(ctx);

    setRequestStatusToReceived();
    updateEtlContextId(etlContextId);

    monitorForStatusUpdates(ctx);
  } catch (err) {
    console.error(err);
    setRequestStatusToError();
    updateRequestErrMsg(err.message);
  }
}

export async function getEtlProcessFinalEvent(ctx = this) {
  const {
    dispatchers: { updateEtlProcessFinalEvent },
  } = ctx;

  try {
    const finalEvent = await getEtlProcessFinalEventFromDamaController(ctx);

    console.log(finalEvent);

    updateEtlProcessFinalEvent(finalEvent);
  } catch (err) {
    console.error(err);
  }
}
