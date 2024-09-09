
import { useContext, useMemo, useEffect } from "react";
import {SymbologyContext} from '../../../'
import { DamaContext } from "../../../../store"
import get from 'lodash/get'
import set from 'lodash/set'
import {AddColumnSelectControl} from '../Controls'
import { Close, StarSolid } from '../../icons'
import { SourceAttributes, ViewAttributes, getAttributes } from "../../../../Source/attributes"
import { DndList } from '~/modules/avl-components/src'
import { v1 } from "uuid";
const getDiffColumns = (baseArray, subArray) => {
  return baseArray.filter(baseItem => !subArray.includes(baseItem))
}
const ViewGroupControl = ({path, datapath, params={}}) => {
  const { state, setState } = useContext(SymbologyContext);
  const { falcor, falcorCache, pgEnv } = useContext(DamaContext);
  const pathBase = params?.version === "interactive"
    ? `symbology.layers[${state.symbology.activeLayer}]${params.pathPrefix}`
    : `symbology.layers[${state.symbology.activeLayer}]`;

  const { layerType, viewId, sourceId, viewGroupName, viewGroup, initialViewId, viewGroupId } = useMemo(() => ({
    layerType: get(state,`${pathBase}['layer-type']`),
    viewId: get(state,`symbology.layers[${state.symbology.activeLayer}].view_id`),
    sourceId: get(state,`symbology.layers[${state.symbology.activeLayer}].source_id`),
    viewGroup: get(state,`${pathBase}['filter-source-views']`, []),//TODO BETTER DEFAULT GROUP NAME
    viewGroupName: get(state,`${pathBase}['view-group-name']`, ''),//TODO BETTER DEFAULT GROUP NAME
    initialViewId: get(state,`${pathBase}['initial-view-id']`, ''),
    filterGroupLegendColumn: get(state, `${pathBase}['filter-group-legend-column']`),
    viewGroupId:get(state,`${pathBase}['view-group-id']`),
  }),[state])

  let layerPath = ``;
  if (layerType === "interactive") {
    layerPath = `['interactive-filters'][${selectedInteractiveFilterIndex}]`;
  }

  useEffect(() => {
    if(!initialViewId){
      setState(draft => {
        set(draft,`${pathBase}['initial-view-id']`, viewId);
      })
    }
  }, [])

  //----------------------------------
  // -- get selected source views
  // ---------------------------------
  useEffect(() => {
    async function fetchData() {
      //console.time("fetch data");
      const lengthPath = ["dama", pgEnv, "sources", "byId", sourceId, "views", "length"];
      const resp = await falcor.get(lengthPath);
      return await falcor.get([
        "dama", pgEnv, "sources", "byId", sourceId, "views", "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes", Object.values(ViewAttributes)
      ]);
    }
    if(sourceId) {
      fetchData();
    }
  }, [sourceId, falcor, pgEnv]);

  const views = useMemo(() => {
    return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byId", sourceId, "views", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
  }, [falcorCache, sourceId, pgEnv]);

  const viewIds = views.map(v => v.view_id);
  const availableViewIds = getDiffColumns(viewIds, viewGroup);
  const availableViews = views.filter(v => availableViewIds.includes(v.view_id));
  const selectedViews = views.filter(v => viewGroup.includes(v.view_id));

  useEffect(() => {
    if(viewGroup.length === 0) {
      setState(draft => {
        const defaultView = views.find(v => v.view_id === viewId);
        const defaultGroupName = (defaultView.version ?? defaultView.view_id + " group");

        set(draft,`${pathBase}['filter-source-views']`, [viewId]);
        set(draft, `${pathBase}['view-group-name']`, defaultGroupName);
        set(draft, `${pathBase}['view-group-id']`, viewId);
      })
    }
  }, [])

  return (
    <div className="pb-4 max-h-[calc(80vh_-_220px)] overflow-auto">
      <div className="group w-full flex px-2">
        Name: 
        <input
          type="text"
          className="mx-2 w-[150px]  border text-sm border-transparent group-hover:border-slate-200 outline-2 outline-transparent rounded-md bg-transparent text-slate-700 placeholder:text-gray-400 focus:outline-pink-300 sm:leading-6"
          value={viewGroupName}
          onChange={(e) => {
            setState(draft => {
              set(draft, `${pathBase}['view-group-name']`, e.target.value)
            })
          }}
        />
      </div>
      <div className="pb-2">
        <AddColumnSelectControl
          label={"Add Data View"}
          setState={(newViewId) => {
            setState((draft) => {
              console.log("adding new viewId to group::", newViewId)
              set(
                draft,
                `${pathBase}.${path}`,
                [...viewGroup, parseInt(newViewId)]
              );
            });
          }}
          availableColumnNames = { 
            availableViews.map(v => {
              return { value: v.view_id, label: v.version ?? v.view_id };
            }) 
          }
        />
      </div>

      <ExistingColumnList
        setViewGroupId={
          (viewId) => {
            console.log("in parent, setViewGroupId::", viewId)
            setState(draft => {
              // let sourceTiles = get(state, `${pathBase}.sources[0].source.tiles[0]`, 'no source tiles').split('?')[0]
            
              // if(sourceTiles !== 'no source tiles') {
              //   console.log("setting source tiles")
              //   //set(draft, `${pathBase}.sources[0].source.tiles[0]`, sourceTiles+`?cols=${e.target.value}`)
              // }
        
              // console.log("removing choropleth and categories for pathbase::", pathBase)
              // set(draft, `${pathBase}['choroplethdata']`, {});
              //set(draft, `${pathBase}['data-column']`, columnName) //TODO i dont htink this will work long term, but tryna get ANYTHIGN to work rn
              // set(draft, `${pathBase}['categories']`, {});
              //set(draft, `${pathBase}['legend-data']`, []);
             

              set(draft, `${pathBase}['view-group-id']`, viewId)




            })
          }
        }
        viewGroupId={viewGroupId}
        selectedViews={selectedViews.map(v => ({...v, display_name: v.version ?? v.view_id}))}
        reorderAttrs={(start, end) => {
          const sections = [...viewGroup];
          const [item] = sections.splice(start, 1);
          sections.splice(end, 0, item);
          
          setState((draft) => {
            set(
              draft,
              `${pathBase}.${path}`,
              sections
            );
          });
        }}
        removeAttr={(viewId) => {
          //console.log('column_name', viewId, selectedColumns.filter((colObj) => colObj.column_name !== viewId))
          setState((draft) => {
            set(
              draft,
              `${pathBase}.${path}`,
              viewGroup.filter((colObj) => colObj !== viewId)
            );
          })
        }}
      />
    </div>

  )
}

export const ExistingColumnList = ({selectedViews, reorderAttrs, removeAttr, viewGroupId, setViewGroupId}) => {
  return (
    <DndList
      onDrop={reorderAttrs}
    >
      {selectedViews?.map((selectedView, i) => {
        return (
          <div
            key={i}
            className="group/title w-full text-sm grid grid-cols-10 cursor-grab border-t border-slate-200 p-2"
          >
            <div
              className="flex items-center border-slate-200 cursor-pointer fill-white group-hover/title:fill-slate-300 hover:bg-slate-100 rounded group/icon col-span-1 p-0.5"
              onClick={() => {
                console.log("legend prop change, setting viewId::",selectedView)
                setViewGroupId(selectedView.view_id)
              }}
            >
              <StarSolid
                size={18}
                className={`${viewGroupId === selectedView.view_id ? 'fill-pink-400 ': ''} cursor-pointer group-hover/icon:fill-slate-500 `}
              />
            </div>
            <div className="truncate  col-span-8 px-2 py-1">
              {selectedView.display_name}
            </div>
            <div
              className="flex items-center  cursor-pointer fill-white group-hover/title:fill-slate-300 hover:bg-slate-100 rounded group/icon col-span-1 p-0.5"
              onClick={() => {
                removeAttr(selectedView.view_id)
              }}
            >
              <Close
                className="mx-[6px] cursor-pointer group-hover/icon:fill-slate-500 "
              />
            </div>
          </div>
        );
      })}
    </DndList>
  );
};


export { ViewGroupControl }