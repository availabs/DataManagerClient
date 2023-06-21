import React from 'react';
import { useParams, useNavigate } from 'react-router-dom'
import { DamaContext } from '~/pages/DataManager/store'




const ViewSelector = ({views}) => {
  const { viewId, sourceId, page } = useParams()
  const navigate = useNavigate()
  const {baseUrl} = React.useContext(DamaContext)
  
  console.log('ViewSelector', baseUrl)

  return (
    <div className='flex flex-1'>
      <div className='py-3.5 px-2 text-sm text-gray-400'>Version : </div>
      <div className='flex-1'>
        <select  
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={viewId}
          onChange={(e) => navigate(`${baseUrl}/source/${sourceId}/${page}/${e.target.value}`)}
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

export default ViewSelector