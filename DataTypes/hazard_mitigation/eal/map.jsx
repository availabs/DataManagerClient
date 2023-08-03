import React, { useMemo } from "react";
import { AvlMap } from "~/modules/avl-maplibre/src";
import config from "~/config.json";
import { EALFactory } from "./layers/EALChoropleth";
import { CustomSidebar } from "./mapControls";
import { useParams } from 'react-router-dom'
import VersionSelect from '../../components/VersionSelect'
import { DamaContext } from '~/pages/DataManager/store'

const hazards = [
        // "all",
        "avalanche", "coastal", "coldwave", "drought", "earthquake", "hail", "heatwave", "hurricane", "icestorm", "landslide", "lightning", "riverine", "tornado", "tsunami", "volcano", "wildfire", "wind", "winterweat"
      ]

const paintKeys = ['avail_eal', 'nri_eal', 'diff', 'wt_n', 'wt_r', 'wt_s', 'wt_c', 'max_wt', 'hlr_r', 'hlr'];

const consequences = ['buildings', 'crop', 'population'];

export const RenderMap = ({source, views}) => {
  //const mapOptions = ;
  const [hazard, setHazard ] = React.useState('hurricane');
  const [paintKey, setPaintKey ] = React.useState('avail_eal');
  const [consequence, setConsequence ] = React.useState(['avail_eal', 'nri_eal', 'diff'].includes(paintKey) ? 'All' : 'buildings');
  const {falcor, pgEnv} = React.useContext(DamaContext)
  let { viewId } = useParams()
  if(!viewId) {
    viewId = views?.[views?.length - 1]?.view_id;
  }

  const map_layers = useMemo(() => {
    return [
      EALFactory()
    ]
  },[])

  const p = {
    [map_layers[0].id]: { hazard, paintKey, consequence, viewId, pgEnv }
  }
  //console.log('p?', p)
  return (

    <div className="w-full h-[700px]">
      <div className='flex'>
          <div className='flex flex-1'>
            <div className='py-3.5 px-2 text-sm text-gray-400'>Hazard : </div>
            <div className='flex-1'>
              <select  
                className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
                value={hazard}
                onChange={(e) => setHazard(e.target.value)}
              >
                {hazards
                  //.sort((a,b) => b - a.view_id)
                  .map((v,i) => (
                  <option key={i} className="ml-2  truncate" value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

        <div className='flex flex-1'>
            <div className='py-3.5 px-2 text-sm text-gray-400'>Display : </div>
            <div className='flex-1'>
              <select
                className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
                value={paintKey}
                onChange={(e) => setPaintKey(e.target.value)}
              >
                {paintKeys
                  //.sort((a,b) => b - a.view_id)
                  .map((v,i) => (
                  <option key={i} className="ml-2  truncate" value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

        <div className='flex flex-1'>
            <div className='py-3.5 px-2 text-sm text-gray-400'>Consequence : </div>
            <div className='flex-1'>
              <select
                className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
                value={consequence}
                onChange={(e) => setConsequence(e.target.value)}
              >
                {(['avail_eal', 'nri_eal', 'diff'].includes(paintKey) ? ['All'] : consequences)
                  .map((v,i) => (
                  <option key={i} className="ml-2  truncate" value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
        <div>
          <VersionSelect views={views}/>
        </div>
      </div>
      <AvlMap
        falcor={falcor}
        mapOptions={{
          zoom: 6.2,
          center: [
            -75.95,
            42.89
          ],


        }}
        layers={map_layers}
        CustomSidebar={() => <div />}
        layerProps={p}
      />
    </div>

  );
};