import React, {
    useEffect,
    useMemo,
    useContext,
  } from "react";
  import { get, uniqBy } from "lodash";
  import { DamaContext } from "~/pages/DataManager/store";
  import { DAMA_HOST } from "~/config";
  import { useFalcor } from "~/modules/avl-components/src";
  
  const BlankComponent = () => <></>;
  
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
    source = {},
    views,
    CustomAttributes = BlankComponent,
  }) {

    console.log("source", source);
    const { name: damaSourceName, source_id: sourceId, type } = source;
    const { baseUrl, user: ctxUser } = useContext(DamaContext);
    const { falcor, falcorCache } = useFalcor();
  
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

    console.log("npmrdsRawViews", npmrdsRawViews);
    return (
      <div className="w-full max-w-lg my-4">
        Hello Manage
      </div>
    );
  }
  