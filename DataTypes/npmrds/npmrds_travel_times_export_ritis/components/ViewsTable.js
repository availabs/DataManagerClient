// https://docs.mapbox.com/mapbox-gl-js/style-spec/
// https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#tiled-sources

import React from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

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
        await getViewsDependenciesForSource(pgEnv, sourceId, {
          immediateDependenciesOnly: false,
          removeSelf: true,
        })
      ))();
  }, [pgEnv, sourceId]);

  if (!viewsMetaWithDeps) {
    return "";
  }

  const dependentsSourceNamesById = viewsMetaWithDeps.reduce(
    (acc, { dependents }) => {
      if (Array.isArray(dependents)) {
        for (const { source_id, source_name } of dependents) {
          acc[source_id] = source_name;
        }
      }

      return acc;
    },
    {}
  );

  const dependencyNames = Object.entries(dependentsSourceNamesById)
    .sort(([srcIdA], [srcIdB]) => +srcIdA - +srcIdB)
    .map(([, srcName]) => srcName);

  const dependencyCols = dependencyNames.map((name) => (
    <th
      key={`th-${name}`}
      style={{
        border: "1px solid",
        borderColor: "black",
        paddingLeft: "10px",
        paddingRight: "10px",
      }}
    >
      {name}
    </th>
  ));

  const tableRows = viewsMetaWithDeps
    .sort((a, b) => +b.attributes.view_id - +a.attributes.view_id)
    .map((meta) => {
      const {
        attributes: { view_id, version },
        dependents,
      } = meta;

      const rowColumns = [
        <td
          key={`view_id-${view_id}`}
          style={{
            border: "1px solid",
            padding: "10px",
            backgroundColor: "white",
          }}
        >
          {view_id}
        </td>,
        <td
          key={`version-${view_id}`}
          style={{
            border: "1px solid",
            padding: "10px",
            backgroundColor: "white",
          }}
        >
          {version}
        </td>,
      ];

      const dependentsBySourceName = dependents.reduce((acc, d) => {
        const { source_name } = d;
        acc[source_name] = d;
        return acc;
      }, {});

      for (const name of dependencyNames) {
        const dep = dependentsBySourceName[name];

        if (!dep) {
          rowColumns.push(
            <td
              key={name}
              style={{
                border: "1px solid",
                padding: "10px",
                backgroundColor: "white",
              }}
            ></td>
          );
          continue;
        }

        const { source_id: depSrcId, view_id: depViewId } = dep;

        const link = (
          <span
            key={`link-${depSrcId}-${depViewId}`}
            style={{ cursor: "pointer", color: "blue" }}
            onClick={() => {
              history.push(`/datasources/source/${depSrcId}/view/${depViewId}`);
            }}
          >{`s${depSrcId}:v${depViewId}`}</span>
        );

        rowColumns.push(
          <td
            key={`link-cell-${depSrcId}-${depViewId}`}
            style={{
              border: "1px solid",
              padding: "10px",
              backgroundColor: "white",
            }}
          >
            {link}
          </td>
        );
      }

      return (
        <tr key={`tr-${view_id}`} style={{ border: "1px solid" }}>
          {rowColumns}
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
          {dependencyCols}
        </tr>
      </thead>
      <tbody style={{ border: "1px solid" }}>{tableRows}</tbody>
    </table>
  );
}
