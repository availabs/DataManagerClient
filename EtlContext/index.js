import React from "react";
import { useParams, useHistory } from "react-router-dom";
import { useSelector } from "react-redux";

import { getEtlContext } from "pages/DataManager/utils/FalcorApi";

import { selectPgEnv } from "pages/DataManager/store";

export function EtlContextEvents() {
  const history = useHistory();

  const [etlContext, setEtlContext] = React.useState(undefined);

  const pgEnv = useSelector(selectPgEnv);
  const { etlContextId } = useParams();

  // console.log({ pgEnv, etlContextId });

  React.useEffect(() => {
    (async () => {
      const ctx = await getEtlContext(pgEnv, etlContextId);
      setEtlContext(ctx);
    })();
  }, [pgEnv, etlContextId]);

  if (etlContext === undefined) {
    return <div>Requesting ETL Context Events</div>;
  }

  if (etlContext === null) {
    return <div>No ETL Context with ID {etlContextId}</div>;
  }

  const {
    meta: {
      parent_context_id,
      source_id,
      etl_status,
      _created_timestamp,
      _modified_timestamp,
    },
    events,
  } = etlContext;

  const createdTs = new Date(_created_timestamp).toLocaleString();
  const modifiedTs = new Date(_modified_timestamp).toLocaleString();

  const metaTable = (
    <table
      className="w-1/2"
      style={{
        margin: "40px auto",
        textAlign: "center",
        border: "1px solid",
        borderColor: "back",
      }}
    >
      <tbody style={{ border: "1px solid" }}>
        <tr className="border-b">
          <td className="py-4 text-left" style={{ paddingLeft: "15px" }}>
            Database
          </td>
          <td className="text-center  p-2">{pgEnv}</td>
        </tr>
        <tr className="border-b">
          <td className="py-4 text-left" style={{ paddingLeft: "15px" }}>
            ETL Context ID
          </td>
          <td className="text-center  p-2">{etlContextId}</td>
        </tr>
        <tr className="border-b">
          <td className="py-4 text-left" style={{ paddingLeft: "15px" }}>
            Parent Context ID
          </td>
          <td className="text-center  p-2">{parent_context_id}</td>
        </tr>
        <tr className="border-b">
          <td className="py-4 text-left" style={{ paddingLeft: "15px" }}>
            Source ID
          </td>
          <td className="text-center  p-2">
            <span
              style={{ cursor: "pointer", color: "blue" }}
              onClick={() => {
                history.push(`/datasources/source/${source_id}`);
              }}
            >
              {source_id}
            </span>
          </td>
        </tr>
        <tr className="border-b">
          <td className="py-4 text-left" style={{ paddingLeft: "15px" }}>
            ETL Status
          </td>
          <td className="text-center  p-2">{etl_status}</td>
        </tr>
        <tr className="border-b">
          <td className="py-4 text-left" style={{ paddingLeft: "15px" }}>
            Created Timestamp
          </td>
          <td className="text-center  p-2">{createdTs}</td>
        </tr>
        <tr className="border-b">
          <td className="py-4 text-left" style={{ paddingLeft: "15px" }}>
            Modified Timestamp
          </td>
          <td className="text-center  p-2">{modifiedTs}</td>
        </tr>
      </tbody>
    </table>
  );

  const eventsList = events.map((event,i) => (
    <div key={i} style={{  padding: "10px" }}>
      <pre className='bg-gray-800 text-gray-100'>
        {JSON.stringify(event,null,3)}
      </pre>
      {/*<ReactJson
        src={event}
        name={false}
        collapsed={2}
        theme="monokai"
        collapseStringsAfterLength={80}
      />*/}
    </div>
  ));

  return (
    <div>
      <div margin="50px" padding="50px">
        <div
          style={{
            display: "inline-block",
            width: "100%",
            marginTop: "20px",
            textAlign: "center",
            paddingTop: "20px",
            fontSize: "35px",
          }}
        >
          Metadata
        </div>
      </div>

      {metaTable}
      <div margin="50px" padding="50px">
        <div
          style={{
            display: "inline-block",
            width: "100%",
            marginTop: "20px",
            textAlign: "center",
            paddingTop: "20px",
            fontSize: "35px",
          }}
        >
          Events
        </div>

        {eventsList}
      </div>
    </div>
  );
}


export default EtlContextEvents;
