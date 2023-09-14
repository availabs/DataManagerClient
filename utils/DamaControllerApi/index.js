// Consider:  Should this be a class so that tasks can extend and override methods?
// Consider: DONT USE THIS
// --------  this codebase is not designed to have centralized api calls
// --------  please put your api calls where you use them for readability

import { DAMA_HOST } from "~/config";

export async function checkApiResponse(res) {
  if (!res.ok) {
    let errMsg = res.statusText;
    try {
      const { message } = await res.json();
      errMsg = message;
    } catch (err) {
      console.error(err);
    }

    throw new Error(errMsg);
  }
}

export function getDamaApiRoutePrefix(pgEnv) {
  return `${DAMA_HOST}/dama-admin/${pgEnv}`;
}

export async function getNewEtlContextId(pgEnv) {
  const rtPfx = `${DAMA_HOST}/dama-admin/${pgEnv}`;

  const newEtlCtxRes = await fetch(`${rtPfx}/etl/new-context-id`);

  await checkApiResponse(newEtlCtxRes);

  const etlContextId = +(await newEtlCtxRes.text());

  return etlContextId;
}

export async function getDamaTileServerUrl() {
  const res = await fetch(`${DAMA_HOST}/dama-info/getTileServerUrl`);
  // const damaTileServerUrl = await res.text();
  const damaTileServerUrl = await res.json();

  return damaTileServerUrl;
}

export const getSrcViews = async ({rtPfx, setVersions, type}) => {
  const url = new URL(
    `${rtPfx}/hazard_mitigation/versionSelectorUtils`
  );
  url.searchParams.append("type", type);

  const list = await fetch(url);

  await checkApiResponse(list);

  const {
    sources, views
  } = await list.json();
  setVersions({sources, views})

  return {sources, views}
}

export const makeAuthoritative = async (rtPfx, viewId) => {
  const url = new URL(`${rtPfx}/makeAuthoritativeDamaView`);

  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ "view_id": viewId }),
    headers: {
      "Content-Type": "application/json"
    }
  });

  await checkApiResponse(res);

  const viewMetaRes = await res.json();

  return viewMetaRes;
};


