import React, {useMemo} from 'react'
import { DamaContext } from "~/pages/DataManager/store"
import get from 'lodash/get'

const TipHoverComp = ({ data, layer }) => {
  const { source: { type }, attributes, activeViewId, props: { filters, activeView: {metadata: { years } } }  } = layer

  const { pgEnv, falcor, falcorCache  } = React.useContext(DamaContext)
  const id = React.useMemo(() => get(data, '[0]', null), [data])
  let activeVar = useMemo(() => get(filters, "activeVar.value", ""), [filters]);

  let getAttributes = typeof attributes?.[0] === 'string' ?
    attributes : attributes.map(d => d.name)
  //console.log('filters', filters , layer)

  React.useEffect(() => {
    falcor.get([
      'dama',
      pgEnv,
      'viewsbyId',
      activeViewId,
      'databyId',
      id,
      getAttributes
    ])
  }, [falcor, pgEnv, activeViewId, id, attributes])


  const attrInfo = React.useMemo(() => {
    return get(falcorCache, [
        'dama',
        pgEnv,
        'viewsbyId',
        activeViewId,
        'databyId',
        id
      ], {});
  }, [id, falcorCache, activeViewId, pgEnv]);



  const cols = attrInfo['rtp_id'] ? [
    {col:'rtp_id', name: 'Project Id', display: d => d},
    {col:'year', name: 'Year', display: d => d},
    {col:'plan_portion', name: 'Plan Portion', display: d => d},
    {col:'sponsor', name: 'Sponsor', display: d => d},
    {col:'ptype', name: 'Project Type', display: d => d},
    {col:'cost', name: 'Cost', display: d => d && d !== 'null' ? `$${d}M` : ''},
    
  ] : [
    {col:'tip_id', name: 'Project Id', display: d => d},
    {col:'sponsor', name: 'Sponsor', display: d => d},
    {col:'mpo', name: 'MPO', display: d => d},
    {col:'ptype', name: 'Project Type', display: d => d},
    {col:'cost', name: 'Cost', display: d => d ? `$${d}M` : ''},
    
  ]

 

  return (
    <div className='bg-white px-4 py-2 max-w-[300px] scrollbar-xs overflow-y-scroll'>
     
      
      {cols.map(k => (
      <div className='flex border-b pt-1' >
        <div className='flex-1 font-medium text-sm pl-1'>{k.name}</div>
        <div className='flex-1 text-right font-thin pl-4 pr-1'>{k.display(attrInfo?.[k.col])}</div>
      </div>
      ))}
       <div className='flex flex-col border-b pt-1' >
        <div className='flex-1 font-medium text-sm pl-1'>Description</div>
        <div className='flex-1 text-[14px] font-thin pl-4 pr-1'>{attrInfo?.['description']}</div>
      </div>
         

    </div>
  )
}


export default TipHoverComp