import React, { useEffect, useMemo, useContext } from "react";
import { get, uniqBy, groupBy, orderBy } from "lodash";
import moment from "moment";
import { DamaContext } from "~/pages/DataManager/store";
import { DAMA_HOST } from "~/config";
import { useFalcor } from "~/modules/avl-components/src";
import MultiSelect from "../manage/components/multiselect";

const BlankComponent = () => <></>;

const checkDateRanges = (dateRanges) => {
  if (dateRanges.length === 1) {
    return null;
  }
  dateRanges.sort((a, b) => moment(a.start_date).diff(moment(b.start_date)));

  let isContinuous = true;
  let isOverlapped = false;

  for (let i = 1; i < dateRanges.length; i++) {
    const prevEndDate = moment(dateRanges[i - 1].end_date);
    const currentStartDate = moment(dateRanges[i].start_date);

    if (currentStartDate.isBefore(prevEndDate)) isOverlapped = true;
    if (!currentStartDate.isSame(prevEndDate.clone().add(1, "days")))
      isContinuous = false;
  }

  if (isContinuous && !isOverlapped) {
    return null;
  } else if (!isContinuous && !isOverlapped) {
    return "Dates are not continuous";
  } else if (!isContinuous && isOverlapped) {
    return "Dates are not continuous and they are overlapped";
  } else if (isContinuous && isOverlapped) {
    return "Dates are continuous but they are overlapped";
  } else {
    return "Invalid date ranges";
  }
};
const SourceAttributes = {
  source_id: "source_id",
  name: "name",
  display_name: "display_name",
  type: "type",
  update_interval: "update_interval",
  category: "category",
  categories: "categories",
  description: "description",
  statistics: "statistics",
  metadata: "metadata",
};

const ViewAttributes = {
  view_id: "view_id",
  source_id: "source_id",
  data_type: "data_type",
  interval_version: "interval_version",
  geography_version: "geography_version",
  version: "version",
  source_url: "source_url",
  publisher: "publisher",
  table_schema: "table_schema",
  table_name: "table_name",
  data_table: "data_table",
  download_url: "download_url",
  tiles_url: "tiles_url",
  start_date: "start_date",
  end_date: "end_date",
  last_updated: "last_updated",
  statistics: "statistics",
  metadata: "metadata",
  user_id: "user_id",
  etl_context_id: "etl_context_id",
  view_dependencies: "view_dependencies",
  _created_timestamp: "_created_timestamp",
  _modified_timestamp: "_modified_timestamp",
};

const getAttributes = (data) =>
  Object.entries(data || {}).reduce((out, [k, v]) => {
    out[k] = v.value !== undefined ? v.value : v;
    return out;
  }, {});

export default function NpmrdsManage({
  source,
  views,
  activeViewId,
  ...props
}) {
  const { baseUrl, user: ctxUser } = useContext(DamaContext);
  const { falcor, falcorCache } = useFalcor();

  const [showModal, setShowModal] = React.useState(false);
  const [selectedViewIds, setSelectedViewIds] = React.useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const lengthPath = ["dama", "npmrds", "sources", "length"];
      const resp = await falcor.get(lengthPath);
      await falcor.get([
        "dama",
        "npmrds",
        "sources",
        "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes",
        Object.values(SourceAttributes),
      ]);
    };

    fetchData();
  }, [falcor]);

  const npmrdsRawSourcesId = useMemo(() => {
    return Object.values(
      get(falcorCache, ["dama", "npmrds", "sources", "byIndex"], {})
    )
      .map((v) =>
        getAttributes(
          get(falcorCache, v.value, { attributes: {} })["attributes"]
        )
      )
      .filter((source) => source?.type === "npmrds_raw")
      .map((rawS) => rawS.source_id);
  }, [falcorCache]);

  useEffect(() => {
    const getData = async () => {
      const lengthPath = [
        "dama",
        "npmrds",
        "sources",
        "byId",
        npmrdsRawSourcesId,
        "views",
        "length",
      ];

      const resp = await falcor.get(lengthPath);

      const requests = npmrdsRawSourcesId.map((s_id) => [
        "dama",
        "npmrds",
        "sources",
        "byId",
        s_id,
        "views",
        "byIndex",
        {
          from: 0,
          to:
            get(
              resp.json,
              ["dama", "npmrds", "sources", "byId", s_id, "views", "length"],
              0
            ) - 1,
        },
        "attributes",
        Object.values(ViewAttributes),
      ]);
      falcor.get(...requests);
    };

    getData();
  }, [falcor, npmrdsRawSourcesId]);

  const npmrdsRawViews = useMemo(() => {
    return npmrdsRawSourcesId
      .reduce((out, source_id) => {
        const views = Object.values(
          get(
            falcorCache,
            [
              "dama",
              "npmrds",
              "sources",
              "byId",
              source_id,
              "views",
              "byIndex",
            ],
            {}
          )
        ).map((v) =>
          getAttributes(
            get(falcorCache, v.value, { attributes: {} })["attributes"]
          )
        );

        if (views.length) {
          out = uniqBy([...out, ...views], "view_id");
        }
        return out;
      }, [])
      .filter(
        (v) =>
          v &&
          v.view_id &&
          v.metadata &&
          Object.keys(v.metadata || {}).length > 0
      );
  }, [falcorCache, npmrdsRawSourcesId]);

  const activeView = useMemo(() => {
    return views.find((v) => Number(v.view_id) === Number(activeViewId));
  }, [activeViewId, views]);

  const [availableViews, dependentViews] = useMemo(() => {
    return [
      (npmrdsRawViews || []).filter(
        (v) =>
          (activeView?.view_dependencies || []).indexOf(Number(v.view_id)) ===
          -1
      ),
      (npmrdsRawViews || []).filter(
        (v) =>
          (activeView?.view_dependencies || []).indexOf(Number(v.view_id)) >= 0
      ),
    ];
  }, [npmrdsRawViews, activeViewId, activeView, activeView?.view_dependencies]);

  const groupbyState = useMemo(() => {
    return groupBy(
      orderBy(
        dependentViews,
        ["metadata.start_date", "metadata.end_date"],
        ["asc", "asc"]
      ),
      (v) => v?.metadata?.state_code
    );
  }, [dependentViews]);

  const availableViewOptions = useMemo(() => {
    return availableViews.map((av) => ({
      label: `${av?.metadata?.name} From ${av?.metadata?.start_date} to ${av?.metadata?.end_date}`,
      value: av?.view_id,
      metadata: av?.metadata,
    }));
  }, [availableViews]);

  const dateRanges = useMemo(() => {
    return ([...selectedViewIds, activeView] || [])
      .filter(
        (v) => v && v.metadata && v.metadata.start_date && v.metadata.end_date
      )
      .map((dr) => ({
        start_date: dr?.metadata?.start_date,
        end_date: dr?.metadata?.end_date,
      }));
  }, [selectedViewIds, activeView]);

  console.log("dateRanges", dateRanges);

  const msgString = useMemo(() => {
    return checkDateRanges(dateRanges);
  }, [dateRanges]);
  const headers = [
    "State",
    "View Id",
    "Version",
    "Start Date",
    "End Date",
    "Tmcs",
  ];
  return (
    <div className="w-full p-5">
      <div className="flex m-3">
        <div className="justify-start w-full md:w-1/2 px-3 mb-6 md:mb-0">
          <label className="block uppercase tracking-wide text-gray-700 text-xl font-bold mb-2">
            Input Data
          </label>
        </div>

        <div className="justify-end">
          <button className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold mr-3 py-2 px-4 rounded">
            <div style={{ display: "flex" }}>
              <span className="mr-2">Replace</span>
            </div>
          </button>
          <button
            className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => setShowModal(true)}
          >
            <div style={{ display: "flex" }}>
              <span className="mr-2">Add</span>
            </div>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto px-5 py-3">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              {headers.map((key) => (
                <th
                  key={key}
                  className="py-2 px-4 bg-gray-200 text-left border-b"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(groupbyState).map((group) => (
              <React.Fragment key={group}>
                {groupbyState[group].map((item, index) => (
                  <tr key={index}>
                    {index === 0 && (
                      <td
                        rowSpan={groupbyState[group].length}
                        className="py-2 px-4 border-b font-bold"
                      >
                        {group}
                      </td>
                    )}
                    <td
                      key={`${group}.${item?.view_id}`}
                      className="py-2 px-4 border-b"
                    >
                      {item?.view_id}
                    </td>
                    <td
                      key={`${group}.${item?.metadata?.npmrds_version}`}
                      className="py-2 px-4 border-b"
                    >
                      {item?.metadata?.npmrds_version}
                    </td>
                    <td
                      key={`${group}.${item?.metadata?.start_date}`}
                      className="py-2 px-4 border-b"
                    >
                      {item?.metadata?.start_date}
                    </td>
                    <td
                      key={`${group}.${item?.metadata?.end_date}`}
                      className="py-2 px-4 border-b"
                    >
                      {item?.metadata?.end_date}
                    </td>
                    <td
                      key={`${group}.${item?.metadata?.no_of_tmc}`}
                      className="py-2 px-4 border-b"
                    >
                      {item?.metadata?.no_of_tmc}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {showModal ? (
        <>
          <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-3xl">
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                <div className="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 rounded-t">
                  <h3 className="text-3xl font-semibold">Add Npmrds</h3>
                  <button
                    className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                    onClick={() => setShowModal(false)}
                  >
                    <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                      ×
                    </span>
                  </button>
                </div>

                <div className="relative p-6 flex-auto">
                  <MultiSelect
                    options={availableViewOptions}
                    onChange={setSelectedViewIds}
                    value={selectedViewIds}
                  />
                  {msgString ? (
                    <>
                      <span>{msgString}</span>
                    </>
                  ) : null}
                </div>

                <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                  {/* <button
                    className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button> */}
                  <button
                    className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-50 fixed inset-0 z-40 bg-black"></div>
        </>
      ) : null}
    </div>
  );
}
