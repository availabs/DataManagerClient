import React, {useMemo} from 'react'
import get from 'lodash/get'

const buttonStates = {
    AWAITING: {
      text: 'Publish',
      color: 'bg-blue-500'
    },
    IN_PROGRESS: {
      text: "Publishing...",
      color: "bg-amber-500"
    },
    PUBLISHED: {
       text: "Publishing...",
       color: "bg-amber-500"
    },
    ERROR : {
       text: "Error...",
       color: "bg-red-500"
    }
}

export default function PublishButton({ state, dispatch }) {
  
  const {
    layerName,
    publishStatus,
    uploadErrMsg,
    lyrAnlysErrMsg,
    tableDescriptor,
    damaSourceName,
    damaSourceId,
    damaServerPath,
    etlContextId,
    gisUploadId,
    userId,
    customViewAttributes,
    sourceType
  } = state

  const { 
    text: publishButtonText, 
    color: publishButtonBgColor } = useMemo(()=> 
      get(buttonStates, publishStatus, buttonStates['AWAITING'])
  , [publishStatus]) 

  if (!layerName || uploadErrMsg || lyrAnlysErrMsg || !tableDescriptor) {
    return "";
  }


  const publish = () => {
    const runPublish = async () => { 
      try {
        dispatch({type: 'update', payload: { publishStatus : 'IN_PROGRESS' }})

        const publishData = {
          source_id: damaSourceId || null,
          source_values: {
            name: damaSourceName,
            type: sourceType || 'gis_dataset'
          },
          user_id: userId,
          tableDescriptor,
          gisUploadId,
          layerName,
          etlContextId,
          customViewAttributes
        };

        const res = await fetch(`${state.damaServerPath}/gis-dataset/publish`, 
        {
          method: "POST",
          body: JSON.stringify(publishData),
          headers: {
            "Content-Type": "application/json",
          },
        });

        //await checkApiResponse(res);

        // const taskContext = await res.json();
        // console.log("{ etl_context_id, source_id }", taskContext);
        // dispatch({ type: 'update', payload: { publishStatus : 'IN_PROGRESS',  damaSourceId: taskContext?.source_id }});
      
        // awaiting till the final event
        // const publishFinalEvent = await new Promise((res, rej) => {
        //   const interval = setInterval(async () => {
        //     // call api to get the final event
        //     // if final event then cleatr interval and resolve final event else return;

        //     try {
        //       const finalEventRes = await fetch(`${state.damaServerPath}/gis-dataset/getTaskFinalEvent/${taskContext?.etl_context_id}`);
        //       console.log("finalEventRes",  finalEventRes);
        //       console.log("\n\n\nfinalEventRes----2",  finalEventRes.data, finalEventRes.body);
        //       const finalEvent = finalEventRes.json();
        //       if (finalEvent === null) {
        //         return;  
        //       }
        //       clearInterval(interval);
        //       return res(finalEvent);
              
        //     } catch (error) {
        //       console.error("error is ", error);
        //     }
        //   }, 5000);
        // });
        
        // OLD
        const publishFinalEvent = await res.json();
        console.log('publishFinalEvent', publishFinalEvent)

        const { etl_context_id, source_id } = publishFinalEvent
        // const {
        //   payload: { damaViewId, damaSourceId: finalSourceId },
        // } = publishFinalEvent;

        // console.log('published view id', damaViewId)
        dispatch({ type: 'update', payload: { publishStatus : 'PUBLISHED',  damaSourceId: source_id, etlContextId: etl_context_id }});
      } catch (err) {
        dispatch({
          type: 'update', 
          payload: { 
            publishStatus : 'ERROR', 
            publishErrMsg: err.message 
          }
        });
        console.error("==>", err);
      }
    }
    runPublish()
  }

  return (
    <div>
      <div>
        <button
          className={`cursor-pointer py-4 px-8 ${publishButtonBgColor} border-none`}
          //disabled={publishStatus'AWAITING'}
          onClick={() => {
            console.log('onClick publush', publishStatus)
            if (publishStatus === "AWAITING" || publishStatus === "ERROR" ) {
              publish();
            }
          }}
        >
          {publishButtonText}
        </button>
      </div>
      <PublishErrorMessage state={state} />
    </div>
  );
}

function PublishErrorMessage({state}) {
  
  const { 
    etlContextId, 
    publishStatus, 
    publishErrMsg 
  } = state

  if (publishStatus !== "ERROR") {
    return "";
  }

  return (
    <table
      className="w-2/3"
      style={{
        margin: "40px auto",
        textAlign: "center",
        border: "1px solid",
        borderColor: "back",
      }}
    >
      <thead
        style={{
          color: "black",
          backgroundColor: "red",
          fontWeight: "bolder",
          textAlign: "center",
          marginTop: "40px",
          fontSize: "20px",
          border: "1px solid",
          borderColor: "black",
        }}
      >
        <tr>
          <th style={{ border: "1px solid", borderColor: "black" }}>
            {" "}
            Publish Error
          </th>
          <th style={{ border: "1px solid", borderColor: "black" }}>
            {" "}
            ETL Context ID
          </th>
        </tr>
      </thead>
      <tbody style={{ border: "1px solid" }}>
        <tr style={{ border: "1px solid" }}>
          <td
            style={{
              border: "1px solid",
              padding: "10px",
              backgroundColor: "white",
              color: "darkred",
            }}
          >
            {publishErrMsg}
          </td>
          <td style={{ border: "1px solid", backgroundColor: "white" }}>
            {etlContextId}
          </td>
        </tr>
      </tbody>
    </table>
  );
}


