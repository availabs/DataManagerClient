import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import get from "lodash/get";
import SourcesLayout from "../../../../../../../Source/layout";
import { useParams } from "react-router-dom";
import { DamaContext } from "~/pages/DataManager/store";
import { SourceAttributes, ViewAttributes, getAttributes } from "../../../../../../../Source/attributes";
import {CheckCircleIcon} from "@heroicons/react/20/solid/index.js";
const SourceThumb = ({ source, selectedSource, setSource }) => {
  const {pgEnv, baseUrl, falcor, falcorCache} = React.useContext(DamaContext)
  const activeViewId = selectedSource.viewId;

  const isActiveSource = selectedSource?.source_id === source.source_id;
  const lengthPath = ["dama", pgEnv, "sources", "byId", source.source_id, "views", "length"];

  const viewLength = useMemo(() => {
    return parseInt(get(falcorCache, lengthPath, 0))
  }, [falcorCache])

  useEffect(() => {
    async function fetchData() {

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

  const sourceViews = useMemo(() => {
    return Object.values(
      get(falcorCache,["dama", pgEnv, "sources", "byId", source.source_id, "views", "byIndex"], {}
    )).map(d => getAttributes(get(falcorCache, d.value, {})?.attributes)).sort((a,b) => new Date(b?._modified_timestamp) - new Date(a?._modified_timestamp))
  }, [falcorCache])

//On click, display all versions underneath the selected source
//If only 1 version exists, auto-select

//Finally, when a version has been selected, the "add" button in the bottom-right becomes enabled.

//TODO -- fix the `category` link

  return (
    <div>
      <div 
        className={`w-full p-4 ${isActiveSource ? 'bg-blue-100 hover:bg-blue-200' : 'bg-white hover:bg-blue-50'} block border shadow flex`} 
        onClick={() => {
          const newSource = {...source, add:true, sourceId: source.source_id};
          if(viewLength === 1 && sourceViews.length === 1){
            newSource.viewId = sourceViews[0].view_id;
          }
          setSource(newSource)
        }}
      >
        <div>
          <div className='text-xl font-medium w-full block'>
            <span>{source.name}</span>
          </div>
          <div>
            {(get(source, 'categories', []) || [])
              .map(cat => (typeof cat === 'string' ? [cat] : cat).map((s, i) => (
                <Link key={i} to={`${baseUrl}/cat/${i > 0 ? cat[i - 1] + "/" : ""}${s}`}
                      className={`text-xs p-1 px-2 ${isActiveSource ? 'bg-blue-300 text-blue-500' : 'bg-blue-200 text-blue-600'} mr-2`}>{s}</Link>
              )))
            }
          </div>
          <div className='py-2 block'>
            {source.description}
          </div>
        </div>      
      </div>
      {
        isActiveSource && <div className='bg-gray-200 shadow'>
          {
            sourceViews.map(view => {
              const isActiveView = activeViewId === view.view_id
              return (
                <div
                  onClick={(e) => setSource({...selectedSource, viewId: view.view_id})}
                  className={`flex items-center ${isActiveView ? 'bg-gray-300 hover:bg-gray-400' : 'hover:bg-gray-300'} px-2`}
                  key={view.view_id}
                >
                  <div className='mx-2'>
                    {view.version ?? view.data_table}
                  </div>
                  {isActiveView && <CheckCircleIcon className='ml-2 text-green-700 h-4 w-4'/>}
                </div>
              )
            })
          }
        </div>
      }
    </div>

  );
};


const SourcesList = ({selectedSource, setSource}) => {
  console.log("sources list render")
  const [layerSearch, setLayerSearch] = useState("");
  const { cat1, cat2, ...rest } = useParams();
  const {pgEnv, baseUrl, falcor, falcorCache} = React.useContext(DamaContext);
  const [sort, setSort] = useState('asc');
  const sourceDataCat = 'Unknown'
  const isListAll = window.location.pathname.replace(`${baseUrl}/`, '')?.split('/')?.[0] === 'listall';

  useEffect(() => {
    async function fetchData() {
      const lengthPath = ["dama", pgEnv, "sources", "length"];
      const resp = await falcor.get(lengthPath);

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

  const categories = [...new Set(
      sources
          .filter(source => {
            return isListAll || (!isListAll && !source.categories?.find(cat => cat.includes(sourceDataCat)))
          })
          .reduce((acc, s) => [...acc, ...(s.categories?.map(s1 => s1[0]) || [])], []))].sort()

  const categoriesCount = categories.reduce((acc, cat) => {
    acc[cat] = sources.filter(source => {
      return source.categories?.find(category => category.includes(cat))
    })?.length
    return acc;
  }, {})
  const actionButtonClassName = 'bg-transparent hover:bg-blue-100 rounded-sm p-2 ml-0.5 border-2'
  return (

    <SourcesLayout baseUrl={baseUrl} isListAll={isListAll}>
      <div className="py-4 flex flex-rows items-center">
        <input
            className="w-full text-lg p-2 border border-gray-300 "
            placeholder="Search datasources"
            value={layerSearch}
            onChange={(e) => setLayerSearch(e.target.value)}
        />

        <button
            className={actionButtonClassName}
            title={'Toggle Sort'}
            onClick={() => setSort(sort === 'asc' ? 'desc' : 'asc')}
        >
          <i className={`fa-solid ${sort === 'asc' ? `fa-arrow-down-z-a` : `fa-arrow-down-a-z`} text-xl text-blue-400`}/>
        </button>

        <Link
            to={isListAll ? `${baseUrl}` : `${baseUrl}/listall`}
            className={actionButtonClassName} title={isListAll ? 'View Key Sources' : 'View All Sources'}>
          <i className={`fa-solid ${isListAll ? `fa-filter-list` : `fa-list-ul`} text-xl text-blue-400`}/>
        </Link>

      </div>
      <div className={'flex flex-row'}>
        <div className={'w-1/4 flex flex-col space-y-1.5 max-h-[80dvh] overflow-auto scrollbar-sm'}>
          {(categories || [])
              .filter(cat => cat !== sourceDataCat)
              .sort((a,b) => a.localeCompare(b))
              .map(cat => (
              <Link
                  key={cat}
                  className={`${cat1 === cat || cat2 === cat ? `bg-blue-100` : `bg-white`} hover:bg-blue-50 p-2 rounded-md flex items-center`}
                  to={`${baseUrl}${isListAll ? `/listall` : ``}/cat/${cat}`}
              >
                <i className={'fa fa-category'} /> {cat}
                <div className={'bg-blue-200 text-blue-600 text-xs w-5 h-5 ml-2 shrink-0 grow-0 rounded-lg flex items-center justify-center border border-blue-300'}>{categoriesCount[cat]}</div>
              </Link>
          ))
          }
        </div>
        <div className={'w-3/4 flex flex-col space-y-1.5 ml-1.5 max-h-[80dvh] overflow-auto scrollbar-sm'}>
          {
            sources
                .filter(source => {
                  return isListAll || (!isListAll && !source.categories?.find(cat => cat.includes(sourceDataCat)))
                })
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
                  let searchTerm = (source.name + " " + (source?.categories || [])
                      .reduce((out,cat) => {
                        out += Array.isArray(cat) ? cat.join(' ') : typeof cat === 'string' ? cat : '';
                        return out
                      },'')) //get(source, "categories[0]", []).join(" "));
                  return !layerSearch.length > 2 || searchTerm.toLowerCase().includes(layerSearch.toLowerCase());
                })
                .sort((a,b) => {
                  const m = sort === 'asc' ? 1 : -1;
                  return m * a.name?.localeCompare(b.name)
                })
                .map((s, i) => <SourceThumb key={i} source={s} baseUrl={baseUrl} selectedSource={selectedSource} setSource={setSource} />)
          }
        </div>
      </div>
    </SourcesLayout>

  );
};


export default SourcesList;
