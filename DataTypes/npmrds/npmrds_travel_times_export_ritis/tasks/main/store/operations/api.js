import {
  checkApiResponse,
  getDamaApiRoutePrefix,
} from "pages/DataManager/utils/DamaControllerApi";

export {
  checkApiResponse,
  getNewEtlContextId,
  getDamaApiRoutePrefix,
} from "pages/DataManager/utils/DamaControllerApi";

export async function getNpmrdsDataDateExtent(ctx) {
  const {
    meta: { pgEnv },
  } = ctx;

  const rtPfx = getDamaApiRoutePrefix(pgEnv);

  const url = `${rtPfx}/data-types/npmrds/npmrds-travel-times-export-ritis/getNpmrdsDataDateExtent`;

  const res = await fetch(url);

  await checkApiResponse(res);

  const npmrdsDataDateExtent = await res.json();

  return npmrdsDataDateExtent;
}

export async function queueNpmrdsExportRequest(ctx) {
  const {
    meta: { pgEnv, userId },
  } = ctx;

  const {
    state: { dataState, dataStartDate, dataEndDate, expandedMap },
  } = ctx;

  const rtPfx = getDamaApiRoutePrefix(pgEnv);

  const url = `${rtPfx}/data-types/npmrds/npmrds-travel-times-export-ritis/queueNpmrdsExportRequest`;

  const updTblDscRes = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      state: dataState,
      start_date: dataStartDate,
      end_date: dataEndDate,
      is_expanded: expandedMap,
      user_id: userId,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  await checkApiResponse(updTblDscRes);

  const res = await updTblDscRes.json();

  console.log(JSON.stringify({ res }, null, 4));

  const {
    etl_context: { etl_context_id: etlContextId },
  } = res;

  // WARNING: MUTATION
  ctx.assignMeta({ etlContextId });

  return { etlContextId };
}

export async function getOpenRequestsStatuses(ctx) {
  const {
    meta: { pgEnv },
  } = ctx;

  const rtPfx = getDamaApiRoutePrefix(pgEnv);

  const url = `${rtPfx}/data-types/npmrds/npmrds-travel-times-export-ritis/getOpenRequestsStatuses`;

  const res = await fetch(url);

  await checkApiResponse(res);

  const openRequestsStatuses = await res.json();

  return openRequestsStatuses;
}

export async function getEtlProcessFinalEvent(ctx) {
  const {
    meta: { pgEnv },
  } = ctx;

  const {
    state: { etlContextId },
  } = ctx;

  const rtPfx = getDamaApiRoutePrefix(pgEnv);

  const url = new URL(`${rtPfx}/getEtlProcessFinalEvent`);
  url.searchParams.append("etlContextId", etlContextId);

  const res = await fetch(url);

  await checkApiResponse(res);

  const finalEvent = await res.json();

  return finalEvent;
}
