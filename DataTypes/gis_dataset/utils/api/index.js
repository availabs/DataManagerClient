import { createEtlContextPropsProxy } from "pages/DataManager/utils/EtlContext";

import { checkApiResponse } from "pages/DataManager/utils/DamaControllerApi";

export {
  checkApiResponse,
  getNewEtlContextId,
  getDamaApiRoutePrefix,
  getDamaTileServerUrl,
} from "pages/DataManager/utils/DamaControllerApi";

export async function stageLayerData(ctx) {
  console.log("stageLayerData");
  const {
    meta: { rtPfx },
  } = ctx;

  const { etlContextId, gisUploadId, layerName, tableDescriptor } =
    createEtlContextPropsProxy(ctx);

  const updTblDscRes = await fetch(
    `${rtPfx}/staged-geospatial-dataset/${gisUploadId}/updateTableDescriptor`,
    {
      method: "POST",
      body: JSON.stringify(tableDescriptor),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  await checkApiResponse(updTblDscRes);

  const url = new URL(
    `${rtPfx}/staged-geospatial-dataset/stageLayerData/${layerName}`
  );
  url.searchParams.append("etl_context_id", etlContextId);

  const stgLyrDataRes = await fetch(url);

  await checkApiResponse(stgLyrDataRes);
}

export async function approveQA(ctx) {
  const {
    meta: { rtPfx },
  } = ctx;

  const { etlContextId, userId } = createEtlContextPropsProxy(ctx);

  const url = new URL(`${rtPfx}/staged-geospatial-dataset/approveQA`);
  url.searchParams.append("etl_context_id", etlContextId);
  url.searchParams.append("user_id", userId);

  await fetch(url);
}

export async function queueCreateDamaSource(ctx) {
  const {
    meta: { rtPfx },
  } = ctx;

  const {
    etlContextId,
    userId,
    damaSourceId,
    damaSourceName,
    damaSourceDisplayName,
  } = createEtlContextPropsProxy(ctx);

  if (damaSourceId) {
    throw new Error("DamaSource already exists.");
  }

  const url = new URL(
    `${rtPfx}/staged-geospatial-dataset/dispatchCreateDamaSourceEvent`
  );

  url.searchParams.append("etl_context_id", etlContextId);

  const sourceMeta = {
    name: damaSourceName,
    display_name: damaSourceDisplayName,
    user_id: userId,
    type: "gis_dataset",
  };

  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(sourceMeta),
    headers: {
      "Content-Type": "application/json",
    },
  });

  await checkApiResponse(res);
}

export async function queueCreateDamaView(ctx) {
  const {
    meta: { rtPfx },
  } = ctx;

  const { etlContextId, userId, damaSourceId } =
    createEtlContextPropsProxy(ctx);

  const url = new URL(
    `${rtPfx}/staged-geospatial-dataset/dispatchCreateDamaViewEvent`
  );

  url.searchParams.append("etl_context_id", etlContextId);

  const viewMetadata = {
    source_id: damaSourceId || null,
    user_id: userId,
  };

  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(viewMetadata),
    headers: {
      "Content-Type": "application/json",
    },
  });

  await checkApiResponse(res);

  const submitViewMetaResponse = await res.json();

  console.log({ submitViewMetaResponse });
}

export async function publishGisDatasetLayer(ctx) {
  const {
    meta: { rtPfx },
  } = ctx;

  const { etlContextId, userId } = createEtlContextPropsProxy(ctx);

  const url = new URL(
    `${rtPfx}/staged-geospatial-dataset/publishGisDatasetLayer`
  );
  url.searchParams.append("etl_context_id", etlContextId);
  url.searchParams.append("user_id", userId);

  const res = await fetch(url);

  await checkApiResponse(res);

  const result = await res.json();

  return result;
}

// FIXME: damaViewId should be in ctx. Once implement, then publish with export.
async function generateMbTiles(ctx, damaViewId) {
  const {
    meta: { rtPfx },
  } = ctx;

  const url = `${rtPfx}/gis/create-mbtiles/damaViewId/${damaViewId}`;

  const res = await fetch(url);

  await checkApiResponse(res);

  return res;
}

export async function simpleCreateNewDamaSource(ctx) {
  await queueCreateDamaSource(ctx);

  const {
    payload: { damaSourceId },
  } = await simpleUpdateExistingDamaSource(ctx);

  return damaSourceId;
}

export async function simpleUpdateExistingDamaSource(ctx) {
  await stageLayerData(ctx);

  await queueCreateDamaView(ctx);

  await approveQA(ctx);

  const publishFinalEvent = await publishGisDatasetLayer(ctx);

  const {
    payload: { damaViewId },
  } = publishFinalEvent;

  await generateMbTiles(ctx, damaViewId);

  return publishFinalEvent;
}
