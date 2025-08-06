import React, { useContext, Fragment, useRef} from 'react'
import { SymbologyContext, PluginLibrary } from '../../'
// import { DamaContext } from "../../../../../../store"
import { Menu, Transition, Tab, Dialog } from '@headlessui/react'



function PluginSettings () {
  const { state } = React.useContext(SymbologyContext);
  console.log("plugin settings state::", state)
  const tabs = ['Legend', 'Layers', 'Plugins']
  return(
    <div className='p-4'>
      <div className='bg-white/95 w-[340px] rounded-lg drop-shadow-lg pointer-events-auto min-h-[400px] max-h-[calc(100vh_-_111px)] scroll-xs'>
        <Tab.Group>

          <Tab.Panels>
              {
                Object.keys(state.symbology.plugins).map(pluginName => <Tab.Panel>{PluginLibrary[pluginName].settingsPanel}</Tab.Panel>)
              //TODO -- maybe a panel for each plugin?
              }
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  )
}



export default PluginSettings