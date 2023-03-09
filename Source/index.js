import React, { useEffect, useMemo, useState } from "react";
import { useFalcor, TopNav } from "modules/avl-components/src";


import get from "lodash.get";
import { useParams } from "react-router-dom";
import { Pages, DataTypes } from "../DataTypes";

import SourcesLayout from "../components/SourcesLayout";

import { SourceAttributes, ViewAttributes, getAttributes } from "pages/DataManager/components/attributes";
import { useSelector } from "react-redux";
import { selectPgEnv } from "pages/DataManager/store";


const Source = ({user, baseUrl='datasources/'}) => {
  const {falcor, falcorCache} = useFalcor()
  const { sourceId, page, viewId } = useParams()
  const [ pages, setPages] = useState(Pages)
  const [ activeView, setActiveView ] = useState(null)
  const pgEnv = useSelector(selectPgEnv);

  const Page = useMemo(() => {
    return page
      ? get(pages, `[${page}].component`, Pages["overview"].component)
      : Pages["overview"].component;
  }, [page, pages]);

  useEffect(() => {
    async function fetchData() {
      console.time("fetch data");
      const lengthPath = ["dama", pgEnv, "sources", "byId", sourceId, "views", "length"];
      const resp = await falcor.get(lengthPath);
      let data = await falcor.get(
        [
          "dama", pgEnv, "sources", "byId", sourceId, "views", "byIndex",
          { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
          "attributes", Object.values(ViewAttributes)
        ],
        [
          "dama", pgEnv, "sources", "byId", sourceId,
          "attributes", Object.values(SourceAttributes)
        ],
        [
          "dama", pgEnv, "sources", "byId", sourceId, "meta"
        ]
      );
      console.timeEnd("fetch data");
      //console.log(data)
      return data;
    }

    fetchData();
  }, [sourceId, falcor, pgEnv]);

  const views = useMemo(() => {
    return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byId", sourceId, "views", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
  }, [falcorCache, sourceId, pgEnv]);

  const source = useMemo(() => {
    let attributes = getAttributes(get(falcorCache, ["dama", pgEnv, "sources", "byId", sourceId], { "attributes": {} })["attributes"]);
    if (DataTypes[attributes.type]) {

      // check for pages to add 
      let typePages = Object.keys(DataTypes[attributes.type]).reduce((a, c) => {
        if (DataTypes[attributes.type][c].path) {
          a[c] = DataTypes[attributes.type][c];
        }
        return a;
      }, {});

      let allPages = { ...Pages, ...typePages };
      setPages(allPages);
    } else {
      setPages(Pages);
    }
    return attributes;
  }, [falcorCache, sourceId, pgEnv]);

  const meta = useMemo(() => {
    return get(
      falcorCache,
      ["dama", pgEnv, "sources", "byId", sourceId, "meta", "value"],
      {}
    );
  }, [falcorCache, sourceId, pgEnv]);

  return (
    <div className="max-w-6xl mx-auto">
      <SourcesLayout baseUrl={baseUrl}>
        <div className="text-xl font-medium overflow-hidden p-2 border-b ">
          {source.display_name || source.name}
        </div>
        <TopNav
          menuItems={Object.values(pages)
            .map(d => {
              return {
<<<<<<< HEAD
                name:d.name,
                path: `${baseUrl}/source/${sourceId}${d.path}` // ${viewId ? '/'+viewId : ''}
              }
=======
                name: d.name,
                path: `${baseUrl}/source/${sourceId}${d.path}`
              };
>>>>>>> 52d4f42ec6aff20cad024e0263486ba6241e1dfb
            })}
          themeOptions={{ size: "inline" }}
        />
<<<<<<< HEAD
        <div className='w-full p-4 bg-white shadow mb-4'>
          <Page 
            source={source} 
            views={views} 
            user={user}
            baseUrl={baseUrl}
          />
=======
        <div className="w-full p-4 bg-white shadow mb-4">
          <Page source={source} views={views} user={user} meta={meta} baseUrl={baseUrl} />
>>>>>>> 52d4f42ec6aff20cad024e0263486ba6241e1dfb
        </div>
      </SourcesLayout>
    </div>
  );
};


export default Source;
