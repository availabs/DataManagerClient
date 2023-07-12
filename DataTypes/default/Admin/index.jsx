import React, { useEffect, /*useMemo,*/ useState } from 'react';
import { Button } from "~/modules/avl-components/src"
import { DamaContext } from "~/pages/DataManager/store"
import { useParams, Link } from "react-router-dom";

import Uploads from '../Uploads'


const AdminPage = ({source, views, activeViewId, }) => {
  const [editing, setEditing] = React.useState(null)
  const { sourceId } = useParams()
  const {pgEnv, baseUrl, user} = React.useContext(DamaContext);

  return (
    <div>
      <div className=" flex flex-col md:flex-row">
        <div className='flex-1'>
          <div className='flex justify-between group'>
            <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              {/*<dt className="text-sm font-medium text-gray-500 py-5">name</dt>*/}
              <dd className="mt-1 text-2xl text-gray-700 font-medium overflow-hidden sm:mt-0 sm:col-span-3">
                Admin
              </dd>
            </div>
          </div>
          <div className="w-full pl-4 py-6 hover:py-6 sm:pl-6 flex justify-between group">
            Access Controls
          </div>
        </div>
        <div className="w-72 ">
          <div> Admin Actions </div>
          <div className="w-full p-1 flex">
            <Link 
                className={"w-full flex-1 text-center border shadow hover:bg-blue-100 p-4"}
                to={`${baseUrl}/source/${source.source_id}/add_version`}> 
                  Add Version <i className='fad fa-upload' />
            </Link>
          </div>
          <div className='flex w-full p-1'>
            <div className='flex-1 text-center shadow p-4 border'>
              Visibility 
            </div>
          </div>
          <div className="w-full p-1 flex">
            <Link 
                className={"w-full flex-1 text-center bg-red-100 border border-red-200 shadow hover:bg-red-400 hover:text-white p-4"}
                to={`${baseUrl}/delete/source/${source.source_id}`}> 
                  Delete <i className='fad fa-trash' />
            </Link>
          </div>
          
          
          
        </div>

      </div>
      <div className='py-10 px-2'>
        <Uploads sourceId={sourceId} />  
      </div>
    </div>
  )
}


export default AdminPage    
