import React, { useEffect, /*useMemo,*/ useState } from 'react';
import { withAuth, Input, Button } from "~/modules/avl-components/src"
import get from 'lodash/get'
import { SourceAttributes } from '~/pages/DataManager/components/attributes'
import { DamaContext } from "~/pages/DataManager/store"
import { useParams, Link } from "react-router-dom";






const OverviewEdit = withAuth(({source, views, activeViewId, user}) => {
  const [editing, setEditing] = React.useState(null)
  const {pgEnv, baseUrl} = React.useContext(DamaContext);

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
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <Link 
                className={"bg-red-100 border w-64 border-red-200 shadow hover:bg-red-400 hover:text-white p-4"}
                to={`${baseUrl}/delete/source/${source.source_id}`}> 
                  Delete <i className='fad fa-trash' />
              </Link>
          </dl>
          
          {/*<div className='py-10 px-2'>
            <div className='text-gray-500 py-8 px-5'>Metadata</div>
            <div className=''>
              <Metadata source={source} />
            </div>
          </div>*/}
        </div>

      </div>
      <div className='py-10 px-2'>
        Bottom   
      </div>
    </div>
  )
})


export default OverviewEdit    
