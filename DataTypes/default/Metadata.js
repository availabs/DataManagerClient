import React from 'react';
//import { useFalcor, withAuth,TopNav, Input, Button } from 'modules/avl-components/src'
import get from 'lodash.get'


const Metadata = ({source}) => {
  const metadata = get(source,'metadata',[])
  if (!metadata || metadata.length === 0) return <div> Metadata Not Available </div> 
  return (
    <div className="overflow-hidden">
      <div className="py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b-2">
        <dt className="text-sm font-medium text-gray-600">
          Column
        </dt>
        <dd className="text-sm font-medium text-gray-600 ">
          Description
        </dd>
        <dd className="text-sm font-medium text-gray-600">
          Type
        </dd>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
         
          {metadata
            //.filter(d => !['id','metadata','description'].includes(d))
            .map((col,i) => (
            <div key={i} className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm text-gray-900">
                {col.name}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                {get(col,'desc', false) || 'No Description'}
              </dd>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                <div className='text-gray-400 italic'>{col.type}</div>
              </dd>

            </div>
          ))}
          
        </dl>
      </div>
    </div>
  )
}

export default Metadata

