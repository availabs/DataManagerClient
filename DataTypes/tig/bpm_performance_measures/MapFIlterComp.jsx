import React from 'react'
import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import get from 'lodash/get'

import { Combobox } from '@headlessui/react'

import ProjectHoverComp from './MapHoverComp'

import { DamaContext } from "~/pages/DataManager/store"

const ProjectMapFilter = ({
    source,
    metaData,
    filters,
    setFilters,
    setTempSymbology,
    tempSymbology,
    activeViewId,
    layer
  }) => { 

  const { falcor, falcorCache, pgEnv } = React.useContext(DamaContext)

  let newSymbology  = cloneDeep(tempSymbology)
 
  React.useEffect(() => {
    const loadSourceData = async () => {
    
      const d = await falcor.get(['dama',pgEnv, 'viewsbyId' ,activeViewId, 'data', 'length'])
       
      let length = get(d,
        ['json', 'dama', pgEnv, 'viewsbyId' ,activeViewId, 'data', 'length'],
      0)

          // console.log('length',length)
      await falcor.chunk([
        'dama',
        pgEnv,
        'viewsbyId',
        activeViewId,
        'databyIndex',
        [...Array(length).keys()],
        ['ogc_fid',projectKey,'wkb_geometry']
      ])
    
    }
    loadSourceData()
  },[pgEnv,activeViewId,source])

  const filterData = React.useMemo(() => {
    const dataById = get(falcorCache,
      ['dama', pgEnv, 'viewsbyId', activeViewId, 'databyId'],
    {})

    return {
      [projectKey] :  ['', ...new Set(Object.values(dataById || {})
        .map(d => d?.[projectKey] )
        .filter(d => d))]
    }
  },[falcorCache])
      
  console.log(filterData)

  if(!newSymbology?.source) {
    newSymbology.sources = metaData?.tiles?.sources || []
    const source_id = newSymbology?.sources?.[0]?.id || '0'
    const source_layer = `s${source.source_id}_v${activeViewId}` 
    newSymbology.layers = ['line','circle','fill']
      .map(type => {
        return {
          id: `source_layer_${type}`,
          ...styles[type],
          source: source_id,
          "source-layer": source_layer
        }
      })
      //loadSourceData()
  }

  if(!newSymbology.images) {
    newSymbology.images = images
  }

  if(!isEqual(newSymbology, tempSymbology)){
    console.log('setting new newSymbology')
    setTempSymbology(newSymbology)
  }


  return (
    <div>
      <Selector 
        onChange={() => console.log('changed')} 
        options={filterData[projectKey]}
      />
    </div>
  )


}