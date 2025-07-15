import React, { useContext , useMemo, useCallback, Fragment, useRef} from 'react'
import { SymbologyContext } from '../../'
import get from 'lodash/get'

const PluginLibrary = {
  'testplugin': ({state,setState}) => {
    console.log('test plugin state', state)
    React.useEffect(() => {},[])
    return <div>Test</div>
  }
}

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
        {activePlugins.map(d => {
          let Comp = PluginLibrary[d] || (() => <></>)
          return <Comp state={state} setState={setState} />

        })}
      </div>
    </>
  )
}

export default PluginManager