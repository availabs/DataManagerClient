import React from 'react'
import { TabPanel, Dropdown } from "~/modules/avl-components/src"
import get from 'lodash/get'

import { SymbologyControls } from '~/pages/DataManager/components/SymbologyControls'
import { SourceInfoPanel } from './SourceInfoPanel'




const LayerControlPanel = (props) => {
  const LayerTabs = [
    {
      name: 'styles',
      Component: SymbologyControls
    },
    // {
    //     name: 'filter',
    //     Component: () => <div className='border-t border-gray-300 h-full bg-gray-100'> filter </div>
    // },
    {
      name: 'source',
      Component: SourceInfoPanel
    },
  ]

  const activeView = get(props,`layer.activeView`, 0)
  const downloads = React.useMemo(() => get(props,`layer.views[${activeView}].metadata.download`, {}), [props,activeView])

  return (
    <div className='pl-[4px] w-full bg-gray-100' style={{height: get(props, 'rect.height',0) - 15}}>
      <div className='w-full h-full  border-l border-gray-200'>
        <div className=' flex justify-between p-2 h-11  bg-white'>
          <a href={`/datasources/source/${get(props,'layer.source.id',1)}`} target='_blank'  rel="noreferrer" className='block text-lg text-bold flex-1'>  {get(props, 'layer.name' , '')} </a>
          <div className=' hover:border-blue-50 hover:bg-blue-100 cursor-pointer'>
            <Dropdown
              control={<span className ='-m-0.5 fad fa-download text-blue-500 p-2' alt='download' />}
              className={` group `}
              openType='click'
            >
              {Object.keys(downloads)
                .map((d,i) => (
                  <a  key={i} onClick={() => console.log('clicked', d)} className='bg-white block text-left p-2 hover:bg-blue-100 w-full text-center hover:border-b border-blue-300 w-full'  href={downloads[d]}>{d}</a>

                ))
              }

            </Dropdown>


          </div>
        </div>
        <div className='bg-white overflow-hidden'>
          <TabPanel
            tabs={LayerTabs}
            {...props}
            onChange={(v) => {
              props.layer.symbology = v
              props.layer.updateState()
              console.log('symbology on change',props.layer)
            }}
            themeOptions={{tabLocation:'top'}}
          />
        </div>
      </div>
    </div>
  )
}
export default LayerControlPanel