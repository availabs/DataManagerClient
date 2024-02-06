import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import get from "lodash/get";
import CollectionsLayout from "./layout";
import { useParams } from "react-router-dom";
import { DamaContext } from "~/pages/DataManager/store";
import { CollectionAttributes, SymbologyAttributes, getAttributes } from "./attributes";

const CollectionThumb = ({ collection }) => {
  const {pgEnv, baseUrl, falcor, falcorCache} = React.useContext(DamaContext)
  console.log("collection thumb, collection::", collection)
  useEffect(() => {
    async function fetchData() {
      const lengthPath = ["dama", pgEnv, "collections", "byId", collection.collection_id, "symbologies", "length"];
      const resp = await falcor.get(lengthPath);
      await falcor.get([
        "dama", pgEnv, "collections", "byId",
        collection.collection_id, "symbologies", "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes", Object.values(SymbologyAttributes)
      ]);
    }

    fetchData();
  }, [falcor, falcorCache, collection, pgEnv]);


  return (
    <div className="w-full p-4 bg-white my-1 hover:bg-blue-50 block border shadow flex justify-between">
      <div>
        <Link to={`${baseUrl}/collection/${collection.collection_id}`} className="text-xl font-medium w-full block">
          <span>{collection.name}</span>
        </Link>
        <div>
          {(get(collection, "categories", []) || [])
            .map(cat => cat.map((s, i) => (
              <Link key={i} to={`${baseUrl}collections/cat/${i > 0 ? cat[i - 1] + "/" : ""}${s}`}
                    className="text-xs p-1 px-2 bg-blue-200 text-blue-600 mr-2">{s}</Link>
            )))
          }
        </div>
        <Link to={`${baseUrl}/collection/${collection.collection_id}`} className="py-2 block">
          {collection.description}
        </Link>
      </div>

      
    </div>
  );
};


const CollectionsList = () => {
  const [layerSearch, setLayerSearch] = useState("");
  const { cat1, cat2 } = useParams();

  const {pgEnv, baseUrl, falcor, falcorCache} = React.useContext(DamaContext);

  useEffect(() => {
    async function fetchData() {
      const lengthPath = ["dama", pgEnv, "collections", "length"];
      const resp = await falcor.get(lengthPath);
      console.log(resp)
      await falcor.get([
        "dama", pgEnv, "collections", "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes", Object.values(CollectionAttributes)
      ]);
    }

    fetchData();
  }, [falcor, pgEnv]);

  const collections = useMemo(() => {
    console.log("ryan checking falcorCache::", falcorCache)
    return Object.values(get(falcorCache, ["dama", pgEnv, "collections", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
  }, [falcorCache, pgEnv]);

  return (

    <CollectionsLayout baseUrl={baseUrl}>
      <div className="py-4">
        <div>
          <input
            className="w-full text-lg p-2 border border-gray-300 "
            placeholder="Search collections"
            value={layerSearch}
            onChange={(e) => setLayerSearch(e.target.value)}
          />
        </div>
      </div>
      {
        collections
          .filter(collection => {
            let output = true;
            if (cat1) {
              output = false;
              (get(collection, "categories", []) || [])
                .forEach(site => {
                  if (site[0] === cat1 && (!cat2 || site[1] === cat2)) {
                    output = true;
                  }
                });
            }
            return output;
          })
          .filter(collection => {
            let searchTerm = (collection.name + " " + get(collection, "categories[0]", []).join(" "));
            return !layerSearch.length > 2 || searchTerm.toLowerCase().includes(layerSearch.toLowerCase());
          })
          .map((c, i) => <CollectionThumb key={i} collection={c} baseUrl={baseUrl} />)
      }
    </CollectionsLayout>

  );
};


export default CollectionsList;
