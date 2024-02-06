import React, { useEffect, useMemo, useState } from 'react';

import { /*useFalcor,*//*TopNav,*/ Input /*withAuth, Input, Button*/ } from '~/modules/avl-components/src'

import get from 'lodash/get'
// import { useParams } from 'react-router-dom'
import { damaDataTypes } from '../DataTypes'

import CollectionsLayout from './layout'

import {CollectionAttributes} from './attributes'
    
import { DamaContext } from "../store";

const CollectionCreate = ({baseUrl}) => {
  const [ collection, setCollection ] = useState( 
    Object.keys(CollectionAttributes)
      .filter(d => !['collection_id', 'metadata','statistics'].includes(d))
      .reduce((out,current) => {
        out[current] = ''
        return out
      }, {})
  )

  const [dataTypes, setDataTypes] = useState(null);

  const {pgEnv} = React.useContext(DamaContext)

  useEffect(() => {
    (async () => {
      const filteredDataTypeKeys = (
        await Promise.all(
          Object.keys(damaDataTypes).map(async (dt) => {
            

            if (damaDataTypes[dt].getIsAlreadyCreated) {
              const exclude = await damaDataTypes[dt].getIsAlreadyCreated(pgEnv);

              if (exclude) {
                return null;
              }
            }

            return dt;
          })
        )
      ).filter(Boolean);

      const filteredDataTypes = filteredDataTypeKeys.reduce((acc, dt) => {
        acc[dt] = damaDataTypes[dt];
        return acc;
      }, {});
      //console.log('testing',filteredDataTypes)
      setDataTypes(filteredDataTypes);
    })();
  }, [pgEnv]);
  
  const REQUIRED_FIELDS = ['name'];

  return (
    <div>
      {/*<div className='fixed right-0 top-[170px] w-64 '>
          <pre>
            {JSON.stringify(source,null,3)}
          </pre>
      </div>*/}
      <CollectionsLayout>
        
      <div className='p-4 font-medium'> Create New Collection </div>
      
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          {Object.keys(CollectionAttributes)
            .filter(d => !['collection_id',  "metadata",  "categories",  "source_dependencies",  "user_id",  "_created_timestamp",  "_modified_timestamp",
          ].includes(d))
            .map((attr,i) => {
              // let val = typeof source[attr] === 'object' ? JSON.stringify(source[attr]) : source[attr]
              return (
                <div key={i} className='flex justify-between group'>
                  <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 py-5 capitalize">
                      {attr} {REQUIRED_FIELDS.includes(attr) && <span style={{color:'red', verticalAlign:'super'}}>*</span>}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <div className='pt-3 pr-8'>
                          <Input
                            className='w-full p-2 flex-1 px-2 shadow bg-grey-50 focus:bg-blue-100  border-gray-300 ' 
                            value={get(collection, attr, '')} 
                            onChange={e => {
                              //console.log('hello', e, attr, {[attr]: e, ...source})
                              setCollection({ ...collection, [attr]: e,})
                            }}/>
                        </div> 
                    </dd>
                  </div>
                </div>
              )
            })
          }
        </dl>
      </div>
  </CollectionsLayout>
</div>
  )
}





export default CollectionCreate;
