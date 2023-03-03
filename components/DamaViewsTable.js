// https://docs.mapbox.com/mapbox-gl-js/style-spec/
// https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#tiled-sources

import React from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import { DAMA_HOST } from "config";

import { getViewsDependenciesForSource } from "pages/DataManager/utils/FalcorApi";

import { selectPgEnv } from "pages/DataManager/store";

export default function DamaViewsTable() {
  const history = useHistory();
  const { sourceId } = useParams();
  const [viewsMetaWithDeps, setViewsMetaWithDeps] = React.useState(null);

  const pgEnv = useSelector(selectPgEnv);

  React.useEffect(() => {
    (async () =>
      setViewsMetaWithDeps(
        await getViewsDependenciesForSource(pgEnv, sourceId)
      ))();
  }, [pgEnv, sourceId]);

  if (!viewsMetaWithDeps) {
    return "";
  }

  const tableRows = viewsMetaWithDeps
    .sort((a, b) => +b.attributes.view_id - +a.attributes.view_id)
    .map((meta) => {
      const {
        attributes: { view_id, version, /*last_updated,*/ metadata = {} },
        dependencies,
      } = meta;

      const { files = {} } = metadata;
      const fileTypes = Object.keys(files);

      const dowloadLinks = fileTypes.map((name) => {
        const { path } = files[name];

        return (
          <li>
            <a key={name} href={`${DAMA_HOST}/files${path}`}>
              {name}
            </a>
          </li>
        );
      });

      const dependenciesList = Array.isArray(dependencies) ? (
        <ul>
          {dependencies.map(({ source_id: depSrcId, view_id: depViewId }) => {
            return (
              <li
                key={depViewId}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  history.push(
                    `/datasources/source/${depSrcId}/view/${depViewId}`
                  );
                }}
              >{`s${depSrcId}:v${depViewId}`}</li>
            );
          })}
        </ul>
      ) : (
        ""
      );

      return (
        <tr key={view_id} style={{ border: "1px solid" }}>
          <td
            style={{
              border: "1px solid",
              padding: "10px",
              backgroundColor: "white",
            }}
          >
            {view_id}
          </td>
          <td
            style={{
              border: "1px solid",
              padding: "10px",
              backgroundColor: "white",
            }}
          >
            {version}
          </td>
          <td
            style={{
              border: "1px solid",
              backgroundColor: "white",
              color: "blue",
            }}
          >
            {dependenciesList}
          </td>
          <td
            style={{
              border: "1px solid",
              backgroundColor: "white",
              color: "blue",
            }}
          >
            <ul>{dowloadLinks}</ul>
          </td>
        </tr>
      );
    });

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
          <th
            style={{
              border: "1px solid",
              borderColor: "black",
              paddingLeft: "10px",
              paddingRight: "10px",
            }}
          >
            {" "}
            View ID
          </th>
          <th
            style={{
              border: "1px solid",
              borderColor: "black",
              paddingLeft: "10px",
              paddingRight: "10px",
            }}
          >
            {" "}
            Version Name
          </th>
          <th
            style={{
              border: "1px solid",
              borderColor: "black",
              paddingLeft: "10px",
              paddingRight: "10px",
            }}
          >
            {" "}
            Dependencies
          </th>
          <th
            style={{
              border: "1px solid",
              borderColor: "black",
              paddingLeft: "10px",
              paddingRight: "10px",
            }}
          >
            {" "}
            Download
          </th>
        </tr>
      </thead>
      <tbody style={{ border: "1px solid" }}>{tableRows}</tbody>
    </table>
  );
}
