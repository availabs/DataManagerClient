import React from 'react';
import { useFalcor, withAuth, Table } from 'modules/avl-components/src'
import get from 'lodash.get'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from "react-redux";
import { selectPgEnv } from "pages/DataManager/store"
// import { SymbologyControls } from 'pages/DataManager/components/SymbologyControls'




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
const TablePage = ({ source, views, user}) => {
  const { viewId } = useParams()
  const { falcor, falcorCache } = useFalcor()
  const pgEnv = useSelector(selectPgEnv);
  
  const activeView = React.useMemo(() => {
    return get(views.filter(d => d.view_id === viewId),'[0]', views[0])
  },[views,viewId])
  const activeViewId = React.useMemo(() => get(activeView,`view_id`,null), [activeView])
  
  console.log('activeViewId', activeViewId)
  React.useEffect(() => {
    // dama[{keys:pgEnvs}].views.byId[{keys:damaViewIds}].data.length
    console.time('getviewLength')
    falcor.get(['dama',pgEnv, 'viewsbyId' ,activeViewId, 'data', 'length'])
    .then(d => {
      console.timeEnd('getviewLength')
    })
  },[pgEnv,activeViewId])

  const dataLength = React.useMemo(() => {
    return get( falcorCache,['dama',pgEnv, 'viewsbyId' ,activeViewId,'data','length'], 'No Length')
  },[pgEnv,activeViewId, falcorCache])

  const attributes = React.useMemo(() => {
    return get(source,'metadata',[])
      .filter(d => ['integer','string','number'].includes(d.type))
      .map(d => d.name)
  }, [source])

  // const metadata = get(source,'metadata',[])
  React.useEffect(() => {
    // dama[{keys:pgEnvs}].views.byId[{keys:damaViewIds}].data.length
    if(dataLength > 0) {
      console.log('dataLength', dataLength)
      let maxData = Math.min(dataLength, 10000)
      console.time('getViewData', maxData)
      falcor.chunk(['dama',pgEnv, 'viewsbyId' ,activeViewId, 'databyIndex', [...Array(maxData).keys()], attributes])
      .then(d => {
        console.timeEnd('getViewData', maxData)
      })
    }
  },[pgEnv,activeViewId,dataLength, attributes])

  const tableData = React.useMemo( () => {
    let maxData = Math.min(dataLength, 5000)
      
    let data = Object.values(
        get( 
          falcorCache, 
          ['dama',pgEnv, 'viewsbyId' ,activeViewId, 'databyIndex'], 
          []
        )
      )
      .map(d => 
        get(falcorCache, d.value, {})
      )

    //console.log('attr data from cache', data)
    
    return data
  },[pgEnv, activeViewId, falcorCache, dataLength])


  // console.log('dataLength', dataLength)

  return (
    <div > 
      <div className='flex'>
        <div className='flex-1 pl-3 pr-4 py-2'>Table View  {viewId}</div>
        <ViewSelector views={views} />
      </div>
      <div className='max-w-6xl'>
        <Table
        data={tableData}
        columns={
          attributes.map(d => ({
            Header: d,
            accessor: d
          }))
        }
      />
       {/* <pre>
          {JSON.stringify(attributes,null,3)}
        </pre>*/}
      </div>
    </div>
  ) 
}

export default withAuth(TablePage)




