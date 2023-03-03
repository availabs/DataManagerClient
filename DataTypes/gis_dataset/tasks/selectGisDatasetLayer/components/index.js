import { useContext } from "react";
import {
  useEtlContext,
  EtlContextReact,
} from "pages/DataManager/utils/EtlContext";

import { operations } from "../store";

const { selectLayer } = operations;

export const LayerSelector = () => {
  const parentCtx = useContext(EtlContextReact);

  const { layerNames, layerName } = useEtlContext(parentCtx);

  if (!layerNames) {
    return "";
  }

  let layerRow;

  if (layerNames.length === 1) {
    if (!layerName) {
      // FIXME: Momentarily renders row with undefined Layer Name
      selectLayer(parentCtx, layerNames[0]);
    }

    layerRow = (
      <tr>
        <td className="py-4 text-left">Layer Name</td>
        <td className="py-4 text-center">{layerName}</td>
      </tr>
    );
  } else {
    layerRow = (
      <tr>
        <td className="py-4 text-left">Select Layer</td>
        <td className="py-4 text-center">
          <select
            className="text-center w-1/2 bg-white p-2 shadow bg-grey-50 focus:bg-blue-100 border-gray-300"
            value={layerName || ""}
            onChange={(e) => selectLayer(parentCtx, e.target.value)}
          >
            {["", ...layerNames].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </td>
      </tr>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "inline-block",
          width: "100%",
          marginTop: "10px",
          textAlign: "center",
          paddingBottom: "20px",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "100%",
            marginTop: "20px",
            textAlign: "center",
            paddingTop: "25px",
            paddingBottom: "50px",
            fontSize: "25px",
            borderTop: "4px solid",
          }}
        >
          GIS Dataset Layers
        </span>
      </div>

      <table className="w-full">
        <tbody>{layerRow}</tbody>
      </table>
    </div>
  );
};

export const LayerAnalysisSection = () => {
  const parentCtx = useContext(EtlContextReact);

  const { etlContextId, layerName, lyrAnlysErrMsg, layerAnalysis } =
    useEtlContext(parentCtx);

  if (!layerName) {
    return "";
  }

  if (lyrAnlysErrMsg) {
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
              Layer Analysis Error
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
              {lyrAnlysErrMsg}
            </td>
            <td style={{ border: "1px solid", backgroundColor: "white" }}>
              {etlContextId}
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  if (!layerAnalysis) {
    return <div>Analyzing Layer... please wait.</div>;
  }

  const { layerGeometriesAnalysis } = layerAnalysis;

  const { featuresCount, countsByPostGisType, commonPostGisGeometryType } =
    layerGeometriesAnalysis;

  const plSfx = featuresCount > 1 ? "s" : "";

  const geomTypes = Object.keys(countsByPostGisType).sort(
    (a, b) => countsByPostGisType[b] - countsByPostGisType[a]
  );

  let geomTypeSection;
  if (geomTypes.length === 1) {
    const [geomType] = geomTypes;

    geomTypeSection = (
      <div
        className="text-blue-500"
        style={{ textAlign: "center", fontWeight: "bold" }}
      >
        The layer contains {featuresCount} {geomType} feature{plSfx}.
      </div>
    );
  } else {
    geomTypeSection = (
      <div style={{ width: "100%" }}>
        <div style={{ width: "50%", margin: "10px auto" }}>
          The layer contained features of multiple geometry types:
          <table
            style={{
              marginTop: "20px",
              backgroundColor: "white",
              margin: "30px auto",
              border: "1px solid",
            }}
          >
            <thead style={{ backgroundColor: "black", color: "white" }}>
              <tr>
                <th
                  className="text-center"
                  style={{ padding: "10px", borderRight: "1px solid white" }}
                >
                  Geometry Type
                </th>
                <th className="text-center" style={{ padding: "10px" }}>
                  Feature Count
                </th>
              </tr>
            </thead>
            <tbody>
              {geomTypes.map((type) => (
                <tr className="border-b">
                  <td
                    className="py-4 text-center"
                    style={{ padding: "10px", border: "1px solid" }}
                  >
                    {type}
                  </td>
                  <td
                    className="text-center  p-2"
                    style={{ padding: "10px", border: "1px solid" }}
                  >
                    {countsByPostGisType[type]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          For consistency, all features will be converted to{" "}
          {commonPostGisGeometryType}s.
        </div>
      </div>
    );
  }

  return (
    <div>
      <span
        style={{
          display: "inline-block",
          width: "100%",
          marginTop: "20px",
          textAlign: "center",
          paddingTop: "25px",
          paddingBottom: "50px",
          fontSize: "25px",
        }}
      >
        Layer Analysis
      </span>
      {geomTypeSection}
    </div>
  );
};
