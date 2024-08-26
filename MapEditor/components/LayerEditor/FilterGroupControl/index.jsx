
import { useContext, useMemo, useEffect } from "react";
import {ColumnSelectControl} from "../PopoverEditor/PopoverControls";
import {SymbologyContext} from '../../../'
import { DamaContext } from "../../../../store"
import get from 'lodash/get'
const FilterGroupControl = ({path, datapath, params={}}) => {
  const { state, setState } = useContext(SymbologyContext);
  const { falcor, falcorCache, pgEnv } = useContext(DamaContext);
  const pathBase = params?.version === "interactive"
    ? `symbology.layers[${state.symbology.activeLayer}]${params.pathPrefix}`
    : `symbology.layers[${state.symbology.activeLayer}]`;

  const { layerType, viewId, sourceId, filterGroupEnabled } = useMemo(() => ({
    layerType: get(state,`${pathBase}['layer-type']`),
    viewId: get(state,`symbology.layers[${state.symbology.activeLayer}].view_id`),
    sourceId: get(state,`symbology.layers[${state.symbology.activeLayer}].source_id`),
    filterGroupEnabled: get(state,`${pathBase}['filterGroupEnabled']`, false),
  }),[state])

  let layerPath = ``;
  if (layerType === "interactive") {
    layerPath = `['interactive-filters'][${selectedInteractiveFilterIndex}]`;
  }

  useEffect(() => {
    if (sourceId) {
      falcor.get([
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata"
      ]);
    }
  }, [sourceId]);

  return (
      <div>
      <ColumnSelectControl
        path={`['filter-group']`}
        params={{
          version: layerType === 'interactive' ? 'interactive' : undefined,
          pathPrefix: layerPath
        }}
      />
    </div>

  )
}

export { FilterGroupControl }