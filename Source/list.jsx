import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import get from "lodash/get";
import SourcesLayout from "./layout";
import { useParams } from "react-router-dom";
import { DamaContext } from "~/pages/DataManager/store";
import { SourceAttributes, ViewAttributes, getAttributes } from "./attributes";

const SourceThumb = ({ source }) => {
  const {pgEnv, baseUrl, falcor, falcorCache} = React.useContext(DamaContext)

  useEffect(() => {
    async function fetchData() {
      const lengthPath = ["dama", pgEnv, "sources", "byId", source.source_id, "views", "length"];
      const resp = await falcor.get(lengthPath);
      await falcor.get([
        "dama", pgEnv, "sources", "byId",
        source.source_id, "views", "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes", Object.values(ViewAttributes)
      ]);
    }

    fetchData();
  }, [falcor, falcorCache, source, pgEnv]);


  return (
    <div className="w-full p-4 bg-white my-1 hover:bg-blue-50 block border shadow flex justify-between">
      <div>
        <Link to={`${baseUrl}/source/${source.source_id}`} className="text-xl font-medium w-full block">
          <span>{source.name}</span>
        </Link>
        <div>
          {(get(source, "categories", []) || [])
            .map(cat => cat.map((s, i) => (
              <Link key={i} to={`${baseUrl}/cat/${i > 0 ? cat[i - 1] + "/" : ""}${s}`}
                    className="text-xs p-1 px-2 bg-blue-200 text-blue-600 mr-2">{s}</Link>
            )))
          }
        </div>
        <Link to={`${baseUrl}/source/${source.source_id}`} className="py-2 block">
          {source.description}
        </Link>
      </div>

      
    </div>
  );
};


const SourcesList = () => {
  const [layerSearch, setLayerSearch] = useState("");
  const { cat1, cat2 } = useParams();

  const {pgEnv, baseUrl, falcor, falcorCache} = React.useContext(DamaContext);

  useEffect(() => {
    async function fetchData() {
      const lengthPath = ["dama", pgEnv, "sources", "length"];
      const resp = await falcor.get(lengthPath);
      // console.log(resp)
      await falcor.get([
        "dama", pgEnv, "sources", "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes", Object.values(SourceAttributes)
      ]);
    }

    fetchData();
  }, [falcor, pgEnv]);

  const sources = useMemo(() => {
    return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
  }, [falcorCache, pgEnv]);

  return (

    <SourcesLayout baseUrl={baseUrl}>
      <div className="py-4">
        <div>
          <input
            className="w-full text-lg p-2 border border-gray-300 "
            placeholder="Search datasources"
            value={layerSearch}
            onChange={(e) => setLayerSearch(e.target.value)}
          />
        </div>
      </div>
      {
        sources
          .filter(source => {
            let output = true;
            if (cat1) {
              output = false;
              (get(source, "categories", []) || [])
                .forEach(site => {
                  if (site[0] === cat1 && (!cat2 || site[1] === cat2)) {
                    output = true;
                  }
                });
            }
            return output;
          })
          .filter(source => {
            let searchTerm = (source.name + " " + get(source, "categories[0]", []).join(" "));
            return !layerSearch.length > 2 || searchTerm.toLowerCase().includes(layerSearch.toLowerCase());
          })
          .map((s, i) => <SourceThumb key={i} source={s} baseUrl={baseUrl} />)
      }
    </SourcesLayout>

  );
};


export default SourcesList;
