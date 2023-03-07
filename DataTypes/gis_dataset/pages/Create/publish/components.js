// -- api functions
async function checkApiResponse(res) {
  // console.log('hello', res)
  if (!res.ok) {
    let errMsg = res.statusText;
    try {
      const { message } = await res.json();
      errMsg = message;
    } catch (err) {
      console.error(`API Response Error: ${err}`);
    }

    throw new Error(errMsg);
  }
}


// export async function createDamaSource(ctx) {

//   const {
//     etlContextId,
//     userId,
//     damaSourceId,
//     damaSourceName,
//     damaSourceDisplayName,
//     damaServerPath
//   } = ctx;

//   if (damaSourceId) {
//     throw new Error("DamaSource already exists.");
//   }

//   const url = `${damaServerPath}/etl/contextId/${etlContextId}/queueCreateDamaSource`;

//   const sourceMeta = {
//     name: damaSourceName,
//     display_name: damaSourceDisplayName,
//     user_id: userId,
//     type: "gis_dataset",
//   };

//   const res = await fetch(url, {
//     method: "POST",
//     body: JSON.stringify(sourceMeta),
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });

//   //await checkApiResponse(res);
//   return await res.json()
// }

// export async function stageLayerData(ctx) {
  
//   const { 
//     etlContextId, 
//     gisUploadId, 
//     layerName, 
//     tableDescriptor, 
//     damaServerPath 
//   } = ctx;

//   const updTblDscRes = await fetch(
//     `${damaServerPath}/staged-geospatial-dataset/${gisUploadId}/updateTableDescriptor`,
//     {
//       method: "POST",
//       body: JSON.stringify(tableDescriptor),
//       headers: {
//         "Content-Type": "application/json",
//       },
//     }
//   );

//   await checkApiResponse(updTblDscRes);

//   const url = new URL(
//     `${damaServerPath}/staged-geospatial-dataset/stageLayerData/${layerName}`
//   );
//   url.searchParams.append("etl_context_id", etlContextId);

//   const stgLyrDataRes = await fetch(url);

//   await checkApiResponse(stgLyrDataRes);
// }

// export async function queueCreateDamaView(ctx) {
 

//   const { etlContextId, userId, damaSourceId, damaServerPath } = ctx

//   // console.log("=".repeat(100));
//   // console.log({ etlContextId, userId, damaSourceId });
//   const url = `${damaServerPath}/etl/contextId/${etlContextId}/queueCreateDamaView`;

//   const viewMetadata = {
//     source_id: damaSourceId || null,
//     user_id: userId,
//   };

//   const res = await fetch(url, {
//     method: "POST",
//     body: JSON.stringify(viewMetadata),
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });

//   await checkApiResponse(res);

//   const submitViewMetaResponse = await res.json();

//   console.log({ submitViewMetaResponse });
// }



export async function publishGisDatasetLayer(ctx) {
  const { 
    damaServerPath,
    etlContextId, 
    userId, 

    gisUploadId,
    layerName,
    tableDescriptor,

    damaSourceId,
    damaSourceName,
  } = ctx;

  const url = new URL(
    `${damaServerPath}/gis-dataset/publish`
  );
  
  const publishData = {
    source_id: damaSourceId || null,
    source_values: {
      name: damaSourceName,
      type: 'gis_dataset'
    },
    user_id: userId,
    tableDescriptor,
    gisUploadId,
    layerName,
    etlContextId
  };

  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(publishData),
    headers: {
      "Content-Type": "application/json",
    },
  });

  await checkApiResponse(res);

  return  await res.json();

}

export async function generateMbTiles(ctx, damaViewId) {
  
  const { damaServerPath } = ctx;

  const url = `${damaServerPath}/gis/create-mbtiles/damaViewId/${damaViewId}`;

  const res = await fetch(url);

  await checkApiResponse(res);

  //let data = await res.json()
  console.log('generateMbTiles', {})
  return {}
}