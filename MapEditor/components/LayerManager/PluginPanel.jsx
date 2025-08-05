import React, { useContext , useMemo, useCallback, Fragment, useRef} from 'react'
import { SymbologyContext, RegisteredPlugins } from '../../'
import get from 'lodash/get'



function  PluginManager (props) {
  const { state, setState  } = React.useContext(SymbologyContext);
  const layers = useMemo(() => state.symbology?.layers ||  {}, [state])
  //console.log('layers', layers)
  const activePlugins = ['testplugin']

  return (
    <>     
      {/* ------Layer Pane ----------- */}
      <div className='min-h-20 relative'>
        Plugins wil Go here
        {Object.keys(state.activePlugins).map(d => {
          let Comp = RegisteredPlugins[d] || (() => <></>)
          return <Comp state={state} setState={setState} />

        })}
      </div>
    </>
  )
}

export default PluginManager