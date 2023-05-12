import React, {useContext} from "react"
import { /*Select,*/
  useTheme,
  CollapsibleSidebar,
  TabPanel,
  Modal,
  DndList,
  Select,
  useSidebarContext
} from "~/modules/avl-components/src"
// import { LayerContext } from './FreightMap'
// import LayerManager from './LayerManager'
import LayerControlPanel from './LayerControlPanel'
import get from "lodash/get"

const FiltersTab = (props) => {
  return (
    <>
      {
        Object.keys(get(props, ['activeLayers', 0, 'filters'], {}))
          .map(filter => (
            <div>
              <div className={'w-full'}> Select {filter}: </div>
              <div className={'w-full'}><Select {...get(props, ['activeLayers', 0, 'filters', filter], {})} /></div>
            </div>
          ))
      }
    </>
  )
}
const CustomSidebar = (props) => {

  const SidebarTabs = [
    // {
    //   icon: "fad fa-layer-group",
    //   Component: LayerListTab
    // },
    // {
    //   icon: "fad fa-map",
    //   Component: MapStylesTab
    // }
    //
    {
      icon: "fad fa-map",
      Component: FiltersTab
    }
  ]
  return React.useMemo(() => (
    <CollapsibleSidebar>
      <div  className='relative w-full h-full bg-gray-100  z-10 shadow-lg overflow-hidden'>
        {/*<div className='py-2 px-4 font-medium'> Freight Layers</div>*/}
        <TabPanel
          tabs={SidebarTabs}
          {...props}
          themeOptions={{tabLocation:'top'}}
        />
      </div>
    </CollapsibleSidebar>
  ), [SidebarTabs])
}
export {
  CustomSidebar
}