import { checkApiResponse, getDamaApiRoutePrefix } from "../../../utils/api";

import {
  updateUploadedFile,
  updateFileUploadStatus,
  updateGisUploadId,
  updateUploadErrMsg,
} from "./actions";

const progressUpdateIntervalMs = 3000;

export async function uploadGisDataset(ctx, file) {
  const {
    meta: { etlContextId, userId, pgEnv },
  } = ctx;

  const { maxSeenEventId } = ctx.getState();

  const rtPfx = getDamaApiRoutePrefix(pgEnv);

  let stopPolling = false;

  try {
    ctx.dispatch(updateUploadedFile(file));

    const formData = new FormData();
    // https://moleculer.services/docs/0.14/moleculer-web.html#File-upload-aliases
    // text form-data fields must be sent before files fields.
    formData.append("etlContextId", etlContextId);
    formData.append("user_id", userId);
    formData.append("fileSizeBytes", file.size);
    formData.append("progressUpdateIntervalMs", progressUpdateIntervalMs);
    formData.append("file", file);

    let maxPolledEventId = maxSeenEventId;

    // TODO: Move to damaCtrl
    async function queryEtlContextEvents(
      etlCtxId = etlContextId,
      sinceEventId = maxSeenEventId
    ) {
      const url = new URL(`${rtPfx}/events/query`);

      url.searchParams.append("etl_context_id", etlCtxId);
      url.searchParams.append("event_id", sinceEventId);

      const res = await fetch(url);

      await checkApiResponse(res);

      const events = await res.json();

      return events;
    }

    async function pollEvents() {
      const events = await queryEtlContextEvents(
        etlContextId,
        maxPolledEventId
      );

      if (Array.isArray(events) && events.length) {
        const latestEvent = events[events.length - 1];
        maxPolledEventId = latestEvent.event_id;

        // CONSIDER: Next line may be worth keeping but will need to manage re-renders.
        // ctx.dispatch(updateMaxSeenEventId(maxPolledEventId));

        ctx.dispatch(updateFileUploadStatus(latestEvent));
      }

      if (!stopPolling) {
        setTimeout(pollEvents, progressUpdateIntervalMs);
      }
    }

    setTimeout(pollEvents, progressUpdateIntervalMs);

    // Upload the Geospatial Dataset
    const res = await fetch(
      `${rtPfx}/staged-geospatial-dataset/uploadGeospatialDataset`,
      {
        method: "POST",
        body: formData,
      }
    );

    await checkApiResponse(res);

    // Upload response is the ETL ID
    const [{ id }] = await res.json();

    stopPolling = true;

    ctx.dispatch(updateGisUploadId(id));
  } catch (err) {
    stopPolling = true;
    ctx.dispatch(updateUploadErrMsg(err.message));
  }
}
