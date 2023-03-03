import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import { selectPgEnv } from "pages/DataManager/store";

import {
  checkApiResponse,
  getDamaApiRoutePrefix,
} from "pages/DataManager/utils/DamaControllerApi";

async function getToposortedDamaSourcesMeta(pgEnv) {
  const prefix = getDamaApiRoutePrefix(pgEnv);

  const url = `${prefix}/data-types/npmrds/getToposortedDamaSourcesMeta`;

  const res = await fetch(url);

  await checkApiResponse(res);

  const toposortedMeta = await res.json();

  return toposortedMeta;
}

export async function getInitializedAndMissingDamaSources(pgEnv) {
  const toposortedMeta = await getToposortedDamaSourcesMeta(pgEnv);

  // NOTE: initialized and missing will both be toposorted.
  const initialzedAndMissing = toposortedMeta.reduce(
    (acc, meta) => {
      const { source_id } = meta;

      const status = Number.isFinite(source_id) ? "initialized" : "missing";

      acc[status].push(meta);

      return acc;
    },
    { initialized: [], missing: [] }
  );

  return initialzedAndMissing;
}

export async function getIsAlreadyCreated(pgEnv) {
  const { missing } = await getInitializedAndMissingDamaSources(pgEnv);

  const alreadyCreated = missing.length === 0;

  return alreadyCreated;
}

export async function initializeNpmrdsDamaSources(pgEnv) {
  const prefix = getDamaApiRoutePrefix(pgEnv);

  const url = `${prefix}/data-types/npmrds/initializeNpmrdsSources`;

  const res = await fetch(url);

  await checkApiResponse(res);

  const toposortedDamaSrcMeta = await res.json();

  return toposortedDamaSrcMeta;
}

function LinksTable(damaSrcMeta) {
  const history = useHistory();

  if (!damaSrcMeta) {
    return "";
  }

  const tdStyle = {
    border: "1px solid",
    padding: "5px",
    backgroundColor: "white",
  };

  const tableRows = damaSrcMeta.map(
    ({
      source_id,
      name,
      display_name,
      description,
      type,
      source_dependencies,
    }) => {
      const link = source_id ? (
        <span
          key={`link-${source_id}`}
          style={{ cursor: "pointer", color: "blue" }}
          onClick={() => {
            history.push(`/datasources/source/${source_id}`);
          }}
        >
          {source_id}
        </span>
      ) : (
        ""
      );

      return (
        <tr key={name} style={{ border: "1px solid" }}>
          <td style={tdStyle}>{link}</td>
          <td
            style={{
              border: "1px solid",
              padding: "7px",
              backgroundColor: "white",
            }}
          >
            {display_name}
          </td>
          <td style={tdStyle}>{description}</td>
          <td style={tdStyle}>{type}</td>
          <td style={tdStyle}>
            {Array.isArray(source_dependencies)
              ? source_dependencies.join(", ")
              : ""}
          </td>
        </tr>
      );
    }
  );

  return (
    <div>
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
            backgroundColor: "#d5e7ff",
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
              Source ID
            </th>
            <th style={{ border: "1px solid", borderColor: "black" }}> Name</th>
            <th style={{ border: "1px solid", borderColor: "black" }}>
              {" "}
              Description
            </th>
            <th style={{ border: "1px solid", borderColor: "black" }}> type</th>
            <th style={{ border: "1px solid", borderColor: "black" }}>
              {" "}
              Source Dependencies
            </th>
          </tr>
        </thead>
        <tbody style={{ border: "1px solid" }}>{tableRows}</tbody>
      </table>
    </div>
  );
}

export default function CreateAllNpmrdsDataSources() {
  const [initializedAndMissing, setInitializedAndMissing] = useState(null);

  const pgEnv = useSelector(selectPgEnv);

  useEffect(
    () =>
      (async () => {
        const d = await getInitializedAndMissingDamaSources(pgEnv);
        setInitializedAndMissing(d);
      })(),
    [pgEnv]
  );

  const { initialized = null, missing = null } = initializedAndMissing || {};

  const table =
    Array.isArray(missing) && missing.length
      ? LinksTable(missing)
      : LinksTable(initialized);

  if (!initializedAndMissing) {
    return <div>Querying NPMRDS Data Manager Source statuses</div>;
  }

  const titleStyle = {
    display: "inline-block",
    width: "100%",
    marginTop: "20px",
    textAlign: "center",
    paddingTop: "25px",
    paddingBottom: "50px",
    fontSize: "25px",
    borderTop: "4px solid",
  };

  // If any missing, we offer the "Initialize" button
  if (missing.length) {
    return (
      <div>
        <span style={titleStyle}>Missing NPMRDS Data Manager Sources</span>
        {table}
        <button
          style={{ backgroundColor: "green" }}
          className="text-white font-bold py-2 px-4 border rounded"
          onClick={async () => {
            await initializeNpmrdsDamaSources(pgEnv);

            const d = await getInitializedAndMissingDamaSources(pgEnv);

            setInitializedAndMissing(d);
          }}
        >
          Initialize NPMRDS Data Sources
        </button>
      </div>
    );
  }

  return (
    <div>
      <span style={titleStyle}>NPMRDS Data Manager Sources</span>
      {table}
    </div>
  );
}
