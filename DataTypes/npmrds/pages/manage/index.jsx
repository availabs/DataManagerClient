import React, { useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { get, uniqBy, groupBy, orderBy } from "lodash";
import moment from "moment";

import { DamaContext } from "~/pages/DataManager/store";
import { DAMA_HOST } from "~/config";
import { useFalcor, ScalableLoading } from "~/modules/avl-components/src";
import MultiSelect from "../manage/components/multiselect";

const checkDateRanges = (dateRanges) => {
  if (dateRanges.length === 1) {
    return { msgString: null, isValidDateRage: true };
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
    return { msgString: null, isValidDateRage: true };
  } else if (!isContinuous && !isOverlapped) {
    return { msgString: "Dates are not continuous", isValidDateRage: false };
  } else if (!isContinuous && isOverlapped) {
    return {
      msgString: "Dates are not continuous and they are overlapped",
      isValidDateRage: false,
    };
  } else if (isContinuous && isOverlapped) {
    return {
      msgString: "Dates are continuous but they are overlapped",
      isValidDateRage: false,
    };
  }

  return { msgString: "Invalid date ranges", isValidDateRage: false };
};

const findMinMaxDates = (dateRanges) => {
  if (dateRanges.length === 0) {
    return {};
  }

  let minDate = new Date(dateRanges[0].start_date);
  let maxDate = new Date(dateRanges[0].end_date);

  for (const { start_date: start, end_date: end } of dateRanges) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate < minDate) minDate = startDate;
    if (endDate > maxDate) maxDate = endDate;
  }

  return (
    {
      startDate: minDate.toISOString().split("T")[0],
      endDate: maxDate.toISOString().split("T")[0],
    } || {}
  );
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
  activeViewId
}) {
  const { user: ctxUser, pgEnv } = useContext(DamaContext);
  const { falcor, falcorCache } = useFalcor();
  const navigate = useNavigate();

  const [showModal, setShowModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [selectedViews, setSelectedViews] = React.useState([]);
  const [removeViewId, setRemoveViewId] = React.useState(null);
  const [removeStateKey, setRemoveStateKey] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const lengthPath = ["dama", pgEnv, "sources", "length"];
      const resp = await falcor.get(lengthPath);
      await falcor.get([
        "dama",
        pgEnv,
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
      get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {})
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
        pgEnv,
        "sources",
        "byId",
        npmrdsRawSourcesId,
        "views",
        "length",
      ];

      const resp = await falcor.get(lengthPath);

      const requests = npmrdsRawSourcesId.map((s_id) => [
        "dama",
        pgEnv,
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
              ["dama", pgEnv, "sources", "byId", s_id, "views", "length"],
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
              pgEnv,
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
    return ([...selectedViews, activeView] || [])
      .filter(
        (v) => v && v.metadata && v.metadata.start_date && v.metadata.end_date
      )
      .map((dr) => ({
        start_date: dr?.metadata?.start_date,
        end_date: dr?.metadata?.end_date,
      }));
  }, [selectedViews, activeView]);

  const { msgString, isValidDateRage } = useMemo(() => {
    return { ...(checkDateRanges(dateRanges) || {}) };
  }, [dateRanges]);

  const headers = [
    "State",
    "View Id",
    "Version",
    "Start Date",
    "End Date",
    "Tmcs",
    "",
  ];

  const updateNpmrds = async () => {
    const publishData = {
      source_id: source?.source_id || null,
      view_id: activeView?.view_id,
      user_id: ctxUser?.user_id,
      npmrds_raw_view_ids: selectedViews.map((svs) => svs.value),
      name: source?.name,
      type: "npmrds",
      ...findMinMaxDates(dateRanges),
      pgEnv,
    };
    setLoading(true);
    try {
      const res = await fetch(`${DAMA_HOST}/dama-admin/${pgEnv}/npmrds/add`, {
        method: "POST",
        body: JSON.stringify(publishData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const publishFinalEvent = await res.json();
      const { source_id } = publishFinalEvent;

      setLoading(false);
      navigate(`/datasources/source/${source_id}`);
    } catch (err) {
      setLoading(false);
    }
  };

  const removeNpmrds = async (viewId, stateGroup) => {
    const publishData = {
      source_id: source?.source_id || null,
      view_id: activeView?.view_id,
      user_id: ctxUser?.user_id,
      npmrds_raw_removed_view_ids: [viewId],
      name: source?.name,
      type: "npmrds",
      ...findMinMaxDates(
        groupbyState[`${stateGroup}`]
          .filter(
            (v) =>
              v &&
              v.metadata &&
              v.metadata.start_date &&
              v.metadata.end_date &&
              v.view_id !== viewId
          )
          .map((dr) => ({
            start_date: dr?.metadata?.start_date,
            end_date: dr?.metadata?.end_date,
          }))
      ),
      pgEnv,
    };

    setLoading(true);
    try {
      const res = await fetch(
        `${DAMA_HOST}/dama-admin/${pgEnv}/npmrds/remove`,
        {
          method: "POST",
          body: JSON.stringify(publishData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const publishFinalEvent = await res.json();
      const { source_id } = publishFinalEvent;

      setLoading(false);
      navigate(`/datasources/source/${source_id}`);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-5">
      <div className="flex m-3">
        <div className="justify-start w-full md:w-1/2 px-3 mb-6 md:mb-0">
          <label className="block uppercase tracking-wide text-gray-700 text-xl font-bold mb-2">
            Input Data
          </label>
        </div>

        <div className="justify-right">
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

      {Object.keys(groupbyState).length ? (
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
                      {index === 0 ||
                      index === groupbyState[group].length - 1 ? (
                        <>
                          <td
                            key={`${group}.${index}`}
                            className="py-2 px-4 border-b"
                          >
                            <button
                              className="relative align-middle select-none font-sans font-medium text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none w-10 max-w-[40px] h-10 max-h-[40px] rounded-lg text-xs bg-red-500 text-white shadow-md shadow-red-900/10 hover:shadow-lg hover:shadow-red-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                              type="button"
                              onClick={() => {
                                setRemoveViewId(item?.view_id);
                                setRemoveStateKey(group);
                                setShowDeleteModal(true);
                              }}
                            >
                              <span className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                                <i
                                  className="fad fa-trash"
                                  aria-hidden="true"
                                ></i>
                              </span>
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td
                            key={`${group}.${index}`}
                            className="py-2 px-4 border-b"
                          ></td>
                        </>
                      )}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-red-400"
          role="alert"
        >
          <span className="font-medium">
            Please! Add npmrds by clicking Add button
          </span>
        </div>
      )}

      <Dialog
        as="div"
        className="relative z-50"
        open={showModal}
        onClose={() => setShowModal(false)}
      >
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <DialogPanel>
            <div className="inline-block w-full min-w-xl max-w-xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <DialogTitle
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                Add Npmrds
              </DialogTitle>

              {availableViewOptions && availableViewOptions.length > 0 ? (
                <div className="relative p-6 flex-auto">
                  {msgString ? (
                    <>
                      <div
                        className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
                        role="alert"
                      >
                        <span className="font-medium">{msgString}</span>
                      </div>
                    </>
                  ) : null}
                  <MultiSelect
                    options={availableViewOptions}
                    onChange={setSelectedViews}
                    value={selectedViews}
                  />
                </div>
              ) : (
                <>
                  <div
                    className="p-4 m-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
                    role="alert"
                  >
                    <span className="font-medium">
                      {"Npmrds Data for the Addition is not available."}
                    </span>
                  </div>
                </>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm text-red-900 bg-red-100 border border-transparent rounded-md hover:bg-red-200 duration-300"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                {selectedViews && selectedViews.length && isValidDateRage ? (
                  <button
                    className="ml-3 inline-flex justify-center px-4 py-2 text-sm text-green-900 bg-green-100 border border-transparent rounded-md hover:bg-green-200 duration-300"
                    type="button"
                    onClick={updateNpmrds}
                  >
                    {loading ? (
                      <div style={{ display: "flex" }}>
                        <div className="mr-2">Saving...</div>
                        <ScalableLoading scale={0.25} color={"#fefefe"} />
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog
        as="div"
        className="relative z-50"
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      >
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <DialogPanel>
            <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <DialogTitle
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                Remove Npmrds
              </DialogTitle>

              <div className="relative p-6 flex-auto">
                <div className="p-4 m-2 text-sm" role="alert">
                  <span className="font-medium">
                    Are you sure you want to Remove?
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm text-red-900 bg-red-100 border border-transparent rounded-md hover:bg-red-200 duration-300"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="ml-3 inline-flex justify-center px-4 py-2 text-sm text-green-900 bg-green-100 border border-transparent rounded-md hover:bg-green-200 duration-300"
                  onClick={async () => {
                    await removeNpmrds(removeViewId, removeStateKey);
                    setShowDeleteModal(false);
                  }}
                >
                  {loading ? (
                    <div style={{ display: "flex" }}>
                      <div className="mr-2">Deleting...</div>
                      <ScalableLoading scale={0.25} color={"#fefefe"} />
                    </div>
                  ) : (
                    "Yes"
                  )}
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
