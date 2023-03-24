import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useFalcor, withAuth, Button } from 'modules/avl-components/src'
import get from 'lodash.get'
import { useParams, useNavigate } from 'react-router-dom'
import GISDatasetLayer from './Layer'
import { AvlMap } from "modules/avl-maplibre/src"
import { useSelector } from "react-redux";
import { selectPgEnv } from "pages/DataManager/store"
import config from 'config.json'
// import { SymbologyControls } from 'pages/DataManager/components/SymbologyControls'


const TILEHOST = 'https://dama-dev.availabs.org/tiles'


const ViewSelector = ({views}) => {
  const { viewId, sourceId, page } = useParams()
  const navigate = useNavigate()
  
  return (
    <div className='flex flex-1'>
      <div className='py-3.5 px-2 text-sm text-gray-400'>Version : </div>
      <div className='flex-1'>
        <select  
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={viewId}
          onChange={(e) => navigate(`/source/${sourceId}/${page}/${e.target.value}`)}
        >
          {views
            .sort((a,b) => b.view_id - a.view_id)
            .map((v,i) => (
            <option key={i} className="ml-2  truncate" value={v.view_id}>
              {v.version ? v.version : v.view_id}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
// import { getAttributes } from 'pages/DataManager/components/attributes'
const DefaultMapFilter = ({source, activeVar, setActiveVar}) => {
  const variables = get(source,'metadata',[])
    .filter(d => ['number'].includes(d.type))
    .sort((a,b) => a.name - b.name)
    .map(d => d.name)

  return (
    <div className='flex flex-1'>
      <div className='py-3.5 px-2 text-sm text-gray-400'>Variable : </div>
      <div className='flex-1'>
        <select  
            className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
            value={activeVar}
            onChange={(e) => setActiveVar(e.target.value)}
          >
            <option  className="ml-2  truncate" value={null}>
              none    
            </option>
            {variables
              .map((v,i) => (
              <option key={i} className="ml-2  truncate" value={v}>
                {v}
              </option>
            ))}
        </select>
      </div>
    </div>
  )
}

const MapPage = ({source,views, user}) => {
  const { /*sourceId,*/ viewId } = useParams()
  const pgEnv = useSelector(selectPgEnv);
  
  //const { falcor } = useFalcor()
  const [ editing, setEditing ] = React.useState(null)
  const [ activeVar, setActiveVar] = React.useState(null)
  const activeView = React.useMemo(() => {
    return get(views.filter(d => d.view_id === +viewId),'[0]', views[0])
  },[views,viewId])
  const mapData = useMemo(() => {
    let out = get(activeView,`metadata.tiles`,{sources:[], layers:[]})
    out.sources.forEach(s => s.source.url = s.source.url.replace('$HOST', TILEHOST))
    return out
  }, [activeView])
  const activeViewId = React.useMemo(() => get(activeView,`view_id`,null), [viewId])
  const layer = React.useMemo(() => {
      return {
            name: source.name,
            pgEnv,
            source: source,
            activeView: activeView,
            activeVariable: activeVar,

            attributes: get(source,'metadata',[])
              .filter(d => ['integer','string','number'].includes(d.type))
              .map(d => d.name),
            activeViewId: activeViewId,
            sources: get(mapData,'sources',[]), 
            layers: get(mapData,'layers',[]),
            symbology: get(mapData, `symbology`, [])
      }
  },[source, views, mapData, activeViewId,activeVar])

  //console.log('layer mappage', layer)

  return (
    <div> 
      <div className='flex'>
        <div className='flex-1 pl-3 pr-4 py-2'>Map View  {viewId}</div>{/*{get(activeView,'id','')}*/}
        <DefaultMapFilter 
          source={source} 
          activeView={activeVar} 
          setActiveVar={setActiveVar}
        />
        <ViewSelector views={views} />
      </div>
      <div className='w-ful h-[900px]'>
        <Map layers={[layer]}  />
      </div>
      {user.authLevel >= 5 ? 
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        {/*<SymbologyControls 
          layer={layer} 
          onChange={(v) => save('symbology',v)}
        />*/}
        <dl className="sm:divide-y sm:divide-gray-200">
          {['sources','layers','symbology']
            .map((attr,i) => {
              let val = JSON.stringify(get(mapData,attr,[]),null,3)
              return (
                <div key={i} className='flex justify-between group'>
                  <div  className="flex-1 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 py-5">{attr}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                      {editing === attr ? 
                        <div className='pt-3 pr-8'>
                          <Edit 
                            startValue={val} 
                            attr={attr}
                            viewId={activeViewId}
                            parentData={get(activeView,`metadata`,{tiles:{}})}
                            cancel={() => setEditing(null)}
                          />
                        </div> :  
                        <div className='py-3 pl-2 pr-8'>
                          <pre className='bg-gray-100 tracking-tighter overflow-auto scrollbar-xs'>
                            {val}
                          </pre>
                        </div> 
                      }
                    </dd>
                  </div>

                  <div className='hidden group-hover:block text-blue-500 cursor-pointer' onClick={e => editing === attr ? setEditing(null): setEditing(attr)}>
                    <i className="fad fa-pencil absolute -ml-12 mt-3 p-2.5 rounded hover:bg-blue-500 hover:text-white "/>
                  </div>
                </div>
              )
            })
          }
        </dl>
      </div> : ''}
    </div>
  ) 
}

export default withAuth(MapPage)

const Map = ({layers}) => {
  const mounted = React.useRef(false);
  const { falcor } = useFalcor()
  const [layerData, setLayerData] = React.useState([])
  const  currentLayerIds = React.useMemo(() => {
    console.log('update', layers)
    return 
  },[layers])

  React.useEffect( () => {
    const updateLayers = async () => {      
      if(mounted.current) {
        setLayerData(l => {
            // use functional setState
            // to get info about previous layerData (l)
            let activeLayerIds = l.map(d => d.activeViewId).filter(d => d)
            //console.log('updatelayers', currentLayerIds, l, layers)
            
            let output = layers
                .filter(d => d)
                .filter(d => !activeLayerIds.includes(d.activeViewId))
                .map(l => GISDatasetLayer(l))

            //console.log('updatelayers2', output)

            return [
              // remove layers not in list anymore
              ...l.filter(d => l.map(x => x.activeViewId).includes(d.activeViewId)), 
              // add newly initialized layers
              ...output
            ]
        })
      }
    }
    updateLayers()
  },[ currentLayerIds ])

  const layerProps = React.useMemo(()=>{
    console.log('update layers', layers)
    let inputViewIds = layers.map(d => d.activeViewId)
    return layerData.reduce((out, cur) => {
      //console.log('s', inputViewIds, cur.activeViewId)
      if(inputViewIds.indexOf(cur.activeViewId) !== -1) {
        out[cur.id] = layers[inputViewIds.indexOf(cur.activeViewId)]
      }
      return out
    },{})
  },[layers, layerData])

  return (
      
      <div className='w-full h-full' ref={mounted}>   
        <AvlMap
          accessToken={ config.MAPBOX_TOKEN }
          falcor={falcor}
          mapOptions={{
            zoom: 6.2,
            center: [
                -75.95,
               42.89
            ],
            styles: [
                { name: "Streets", style: "https://api.maptiler.com/maps/streets-v2/style.json?key=mU28JQ6HchrQdneiq6k9"},
                { name: "Light", style: "https://api.maptiler.com/maps/dataviz-light/style.json?key=mU28JQ6HchrQdneiq6k9" },
                { name: "Dark", style: "https://api.maptiler.com/maps/dataviz-dark/style.json?key=mU28JQ6HchrQdneiq6k9" },
                   
            ]
          }}
          layers={layerData}
          layerProps={layerProps}
          CustomSidebar={() => <div/>}
        />
      </div>
     
  )
}



const Edit = ({startValue, attr, viewId, parentData, cancel=()=>{}}) => {
  const { falcor } = useFalcor()
  const [value, setValue] = useState('')
  const pgEnv = useSelector(selectPgEnv);
  const inputEl = useRef(null);

  useEffect(() => {
    setValue(startValue)
    inputEl.current.focus();
  },[startValue])

  useEffect(() => {
    inputEl.current.style.height = 'inherit';
    inputEl.current.style.height = `${inputEl.current.scrollHeight}px`; 
  },[value])

  const save = async (attr, value) => {
    //console.log('click save 222', attr, value)
    if(viewId) {
      try{
        let update = JSON.parse(value)
        let val = parentData || {tiles:{}}
        val.tiles[attr] = update
        console.log('out value', val)
        let response = await falcor.set({
            paths: [
              ['dama',pgEnv,'views','byId',viewId,'attributes', 'metadata' ]
            ],
            jsonGraph: {
              dama:{
                [pgEnv]:{
                  views: {
                    byId:{
                      [viewId] : {
                        attributes : { 
                          metadata: JSON.stringify(val)
                        }
                      }
                    }
                  }
                }
              }
            }
        })
        console.log('set run response', response)
        cancel()
      } catch (error) {
        console.log('error stuff',error,value, parentData);
      }
    }
  }

  return (
    <div className='w-full'>
      <div className='w-full flex'>
        <textarea
          ref={inputEl} 
          className='flex-1 px-2 shadow text-base bg-blue-100 focus:ring-blue-700 focus:border-blue-500  border-gray-300 rounded-none rounded-l-md' 
          value={value} 
          onChange={e => setValue(e.target.value)}
        />
      </div>
      <div>
        <Button themeOptions={{size:'sm', color: 'primary'}} onClick={e => save(attr,value)}> Save </Button>
        <Button themeOptions={{size:'sm', color: 'cancel'}} onClick={e => cancel()}> Cancel </Button>
      </div>
    </div>
  )
}