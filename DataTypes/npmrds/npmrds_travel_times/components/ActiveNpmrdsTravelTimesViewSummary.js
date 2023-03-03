import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import { selectPgEnv } from "pages/DataManager/store";

import {
  Falcor,
  getAllDamaViewsForDamaSourceName,
} from "pages/DataManager/utils/FalcorApi";

import {
  checkApiResponse,
  getDamaApiRoutePrefix,
} from "pages/DataManager/utils/DamaControllerApi";

import NpmrdsDataSources from "../../constants/NpmrdsDataSources";

const getActiveNpmrdsTravelTimesDamaViewFalcorPath = (pgEnv) => [
  "dama",
  pgEnv,
  "npmrds",
  "activeNpmrdsTravelTimesDamaView",
];

async function getActiveNpmrdsTravelTimesDamaView(pgEnv) {
  const path = getActiveNpmrdsTravelTimesDamaViewFalcorPath(pgEnv);

  const value = await Falcor.getValue(path);

  return value;
}

async function invalidateCachedActiveNpmrdsTravelTimesDamaView(pgEnv) {
  const path = getActiveNpmrdsTravelTimesDamaViewFalcorPath(pgEnv);

  await Falcor.invalidate(path);
}

async function getAllNpmrdsTravelTimeImportViews(pgEnv) {
  const importViews = await getAllDamaViewsForDamaSourceName(
    pgEnv,
    NpmrdsDataSources.NpmrdsTravelTimesImp
  );

  return importViews;
}

async function updateAuthoritativeImports(pgEnv, damaViewIds) {
  const rtPfx = getDamaApiRoutePrefix(pgEnv);

  const url = new URL(
    `${rtPfx}/data-types/npmrds/npmrds-travel-times/makeTravelTimesExportTablesAuthoritative`
  );

  for (const viewId of damaViewIds) {
    url.searchParams.append("damaViewIds", viewId);
  }

  const res = await fetch(url);

  await checkApiResponse(res);

  await invalidateCachedActiveNpmrdsTravelTimesDamaView(pgEnv);

  const d = await res.json();

  return d;
}

function groupAndSortImportViews(importViews) {
  const sortedImportsByMonthByYearByState =
    importViews &&
    importViews.reduce((acc, view) => {
      const {
        metadata: { state, data_start_date, data_end_date },
      } = view;

      const [startYear, startMonth] = data_start_date.split(/-/g);
      const [endYear, endMonth] = data_end_date.split(/-/g);

      if (startYear !== endYear || startMonth !== endMonth) {
        return acc;
      }

      acc[state] = acc[state] || {};
      acc[state][startYear] = acc[state][startYear] || {};
      acc[state][startYear][startMonth] =
        acc[state][startYear][startMonth] || [];

      acc[state][startYear][startMonth].push(view);

      return acc;
    }, {});

  for (const state of Object.keys(sortedImportsByMonthByYearByState)) {
    for (const year of Object.keys(sortedImportsByMonthByYearByState[state])) {
      for (const month of Object.keys(
        sortedImportsByMonthByYearByState[state][year]
      )) {
        sortedImportsByMonthByYearByState[state][year][month].sort(
          (
            { metadata: { download_timestamp: aTs } },
            { metadata: { download_timestamp: bTs } }
          ) => bTs.localeCompare(aTs)
        );
      }
    }
  }

  return sortedImportsByMonthByYearByState;
}

function activeNpmrdsTravelTimesMetadataTable(activeNpmrdsTravelTimesDamaView) {
  if (activeNpmrdsTravelTimesDamaView === undefined) {
    return (
      <div>Requesting active NPMRDS TravelTimes Data Manager View Metadata</div>
    );
  }

  if (activeNpmrdsTravelTimesDamaView === null) {
    return <div>No active NPMRDS TravelTimes</div>;
  }

  const {
    view_id,
    active_start_timestamp,
    metadata: { dateExtentsByState },
  } = activeNpmrdsTravelTimesDamaView;

  const activeStartTs = new Date(active_start_timestamp)
    .toISOString()
    .replace(/\..*/, "");

  const dataExtentsSubtableRows = Object.keys(dateExtentsByState)
    .sort()
    .map((state) => {
      const [startDate, endDate] = dateExtentsByState[state];

      return (
        <tr key={state}>
          <td>{state}</td>
          <td>{startDate}</td>
          <td>{endDate}</td>
        </tr>
      );
    });

  const thStyle = {
    border: "1px solid",
    borderColor: "black",
    paddingLeft: "10px",
    paddingRight: "10px",
  };

  const dataExtentsSubtable = (
    <table
      className="w-2/3"
      style={{
        width: "100%",
        textAlign: "center",
      }}
    >
      <thead
        style={{
          color: "black",
          textAlign: "center",
          border: "1px solid",
          borderColor: "black",
        }}
      >
        <tr>
          <th style={thStyle}> State</th>
          <th style={thStyle}> Data Start Date</th>
          <th style={thStyle}> Data End Date</th>
        </tr>
      </thead>
      <tbody style={{ border: "1px solid" }}>{dataExtentsSubtableRows}</tbody>
    </table>
  );

  const metaTable = (
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
          NPMRDS Authoritative Travel Times
        </div>
      </div>
      <table
        className="w-3/4"
        style={{
          margin: "40px auto",
          textAlign: "center",
        }}
      >
        <tbody style={{ border: "1px solid" }}>
          <tr className="border-b">
            <th className="py-4 text-left" style={{ paddingLeft: "15px" }}>
              View ID
            </th>
            <td className="text-center  p-2">{view_id}</td>
          </tr>
          <tr className="border-b">
            <th className="py-4 text-left" style={{ paddingLeft: "15px" }}>
              Active Start Timestamp
            </th>
            <td className="text-center  p-2">{activeStartTs}</td>
          </tr>
          <tr className="border-b">
            <th className="py-4 text-left" style={{ paddingLeft: "15px" }}>
              Data Date Extents
            </th>
            <td className="text-center  p-2">{dataExtentsSubtable}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return metaTable;
}

function importSelectionTable(
  activeNpmrdsTravelTimesDamaView,
  importViewsByMonthByYearByState,
  selectedImports,
  toggleImport
) {
  if (importViewsByMonthByYearByState === undefined) {
    return <div>Requesting NPMRDS Travel Times Imports.</div>;
  }

  if (importViewsByMonthByYearByState === null) {
    return <div>No NPMRDS Travel Times Imports in the database.</div>;
  }

  const currentAuthoritativeImportViewIds = activeNpmrdsTravelTimesDamaView
    ? new Set(activeNpmrdsTravelTimesDamaView.view_dependencies)
    : new Set();

  const trows = [];
  const states = Object.keys(importViewsByMonthByYearByState).sort();

  for (const state of states) {
    const years = Object.keys(importViewsByMonthByYearByState[state])
      .sort()
      .reverse();

    for (const year of years) {
      const months = Object.keys(importViewsByMonthByYearByState[state][year])
        .sort()
        .reverse();

      for (const month of months) {
        const stYrMoViews = importViewsByMonthByYearByState[state][year][month];

        const rows = stYrMoViews.map(
          (
            {
              view_id,
              metadata: {
                data_start_date,
                data_end_date,
                download_timestamp,
                is_complete_month,
                is_expanded,
              },
            },
            i
          ) => {
            const first = i === 0;
            const last = i === stYrMoViews.length - 1;

            const borderBottom = last
              ? "2px solid black"
              : "1px solid LightGray";

            const style = last
              ? {
                  backgroundColor: "LightGray",
                  borderBottom: "2px solid black",
                }
              : {};

            const isAuthoritative =
              currentAuthoritativeImportViewIds.has(view_id);

            const backgroundColor = isAuthoritative ? "LightGreen" : null;

            const selector = isAuthoritative ? (
              ""
            ) : (
              <input
                type="checkbox"
                defaultChecked={selectedImports.has(view_id)}
                onClick={() => toggleImport(view_id)}
              />
            );

            return (
              <tr key={`styrmo-${state}-${year}-${month}-${i}`}>
                <td
                  style={{
                    ...style,
                    backgroundColor: "LightGray",
                    fontWeight: "bold",
                  }}
                >
                  {first ? state : ""}
                </td>
                <td
                  style={{
                    ...style,
                    backgroundColor: "LightGray",
                    fontWeight: "bold",
                  }}
                >
                  {first ? year : ""}
                </td>
                <td
                  style={{
                    ...style,
                    backgroundColor: "LightGray",
                    fontWeight: "bold",
                  }}
                >
                  {first ? month : ""}
                </td>
                <td
                  style={{
                    backgroundColor,
                    borderLeft: "1px solid LightGray",
                    borderBottom,
                  }}
                >
                  {view_id}
                </td>
                <td style={{ backgroundColor, borderBottom }}>
                  {data_start_date}
                </td>
                <td style={{ backgroundColor, borderBottom }}>
                  {data_end_date}
                </td>
                <td style={{ backgroundColor, borderBottom }}>
                  {download_timestamp}
                </td>
                <td style={{ backgroundColor, borderBottom }}>
                  {is_complete_month ? "✓" : ""}
                </td>
                <td style={{ backgroundColor, borderBottom }}>
                  {is_expanded ? "✓" : ""}
                </td>
                <td
                  style={{
                    backgroundColor,
                    borderBottom,
                  }}
                >
                  {selector}
                </td>
              </tr>
            );
          }
        );

        trows.push(...rows);
      }
    }
  }

  const thStyle = {
    border: "1px solid",
    borderColor: "black",
    paddingLeft: "10px",
    paddingRight: "10px",
  };

  const table = (
    <div>
      <div>
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
          NPMRDS Travel Times Import Views Summary
        </div>

        <div
          style={{ marginTop: "30px", marginBottom: "30px", marginLeft: "33%" }}
        >
          <ul className="list-disc">
            <li>
              <span>
                The NPMRDS Authoritative Travel Times Data Source is comprised
                of multiple NPMRDS Travel Time Imports. The below table is used
                to declare which imports are authoritative.
              </span>
            </li>
            <li>
              <span>
                New authoritative NPMRDS Travel Times must cover at least the
                same date extent for each state as the current authoritative
                NPMRDS Travel Times. (For each state, data date extents cannot
                contract.)
              </span>
            </li>
            <li>
              <span>
                There cannot be a gap in the date ranges for any state's data.
              </span>
            </li>
            <li>
              <span>
                Currently authoritative NPMRDS Travel Time Imports can be made
                non-authoritative ONLY by replacement.
              </span>
            </li>
            <li>
              <span
                style={{
                  color: "LightGreen",
                }}
              >
                Green rows indicate currently authoritative imports
              </span>
            </li>
          </ul>
        </div>
      </div>

      <table
        className="w-2/3"
        style={{
          width: "100%",
          textAlign: "center",
          border: "1px solid",
          borderColor: "back",
        }}
      >
        <thead
          style={{
            color: "black",
            textAlign: "center",
            border: "1px solid",
            borderColor: "black",
          }}
        >
          <tr>
            <th style={thStyle}> State</th>
            <th style={thStyle}> Year</th>
            <th style={thStyle}> Month</th>

            <th style={thStyle}> View ID</th>
            <th style={thStyle}> Start Date</th>
            <th style={thStyle}> End Date</th>
            <th style={thStyle}> Download Timestamp</th>
            <th style={thStyle}> Complete Month</th>
            <th style={thStyle}> Expanded Map</th>
            <th style={thStyle}> Make Authoritative</th>
          </tr>
        </thead>
        <tbody style={{ border: "1px solid" }}>{trows}</tbody>
      </table>
    </div>
  );

  return table;
}

export function InvariantViolationsFeedbackTable(invariantViolations) {
  console.log(invariantViolations);
  if (!(Array.isArray(invariantViolations) && invariantViolations.length)) {
    return "";
  }

  const rows = invariantViolations.map((violation) => (
    <tr key={violation} style={{ border: "1px solid" }}>
      <td>{violation}</td>
    </tr>
  ));

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
            NPMRDS Travel Times Invariant Violations
          </th>
        </tr>
      </thead>
      <tbody style={{ border: "1px solid" }}>{rows}</tbody>
    </table>
  );
}

export default function ActiveNpmrdsTravelTimesViewSummary() {
  const [activeNpmrdsTravelTimesDamaView, setActiveNpmrdsTravelTimesDamaView] =
    useState(undefined);

  const [importViewsByMonthByYearByState, setIimportViewsByMonthByYearByState] =
    useState(undefined);

  const [selectedImports, setSelectedImports] = useState(new Set());

  const [invariantViolations, setInvariantViolations] = useState(null);

  // Used to trigger a page reload after updating the Authoritative Travel Times Imports.
  // https://stackoverflow.com/a/55862077/3970755
  const [tick, setTick] = useState(0);

  const pgEnv = useSelector(selectPgEnv);

  const toggleImport = (view_id) => {
    const newSelectedImports = new Set(selectedImports);

    if (newSelectedImports.has(view_id)) {
      newSelectedImports.delete(view_id);
    } else {
      newSelectedImports.add(view_id);
    }

    setInvariantViolations(null);
    setSelectedImports(newSelectedImports);
  };

  useEffect(() => {
    (async () => {
      const [activeDamaView, importViews] = await Promise.all([
        getActiveNpmrdsTravelTimesDamaView(pgEnv),
        getAllNpmrdsTravelTimeImportViews(pgEnv),
      ]);

      const sortedImportsByMonthByYearByState =
        groupAndSortImportViews(importViews);

      setActiveNpmrdsTravelTimesDamaView(activeDamaView);
      setIimportViewsByMonthByYearByState(sortedImportsByMonthByYearByState);
    })();
  }, [pgEnv, tick]);

  const hasViolations =
    Array.isArray(invariantViolations) && invariantViolations.length;

  const updateButton =
    selectedImports.size && !hasViolations ? (
      <button
        style={{ backgroundColor: "green" }}
        className="text-white font-bold py-2 px-4 border rounded"
        onClick={async () => {
          try {
            await updateAuthoritativeImports(pgEnv, selectedImports);
            setSelectedImports(new Set());
            setTick(tick + 1);
          } catch (err) {
            const { message = "ERROR" } = err;

            if (/^INVARIANT VIOLATIONS:/.test(message)) {
              const violations = message
                .split(/\n/)
                .slice(1)
                .map((s) => s.replace(/^[^a-z0-9]*/i, ""));

              return setInvariantViolations(violations);
            }

            setInvariantViolations([message]);
          }
        }}
      >
        Make Selected Imports Authoritative
      </button>
    ) : (
      ""
    );

  const metaTable = activeNpmrdsTravelTimesMetadataTable(
    activeNpmrdsTravelTimesDamaView
  );
  const importsTable = importSelectionTable(
    activeNpmrdsTravelTimesDamaView,
    importViewsByMonthByYearByState,
    selectedImports,
    toggleImport
  );

  const invariantViolationsTable =
    InvariantViolationsFeedbackTable(invariantViolations);

  return (
    <div>
      {metaTable}
      {importsTable}
      {updateButton}
      {invariantViolationsTable}
    </div>
  );
}
