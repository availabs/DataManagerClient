import React, { useEffect, /*useMemo,*/ useState } from 'react';
import { Input, Button } from "~/modules/avl-components/src"
import get from 'lodash/get'
import { SourceAttributes } from '~/pages/DataManager/Source/attributes'
import { DamaContext } from "~/pages/DataManager/store"
import Versions from './Version/list'
import { VersionEditor, VersionDownload } from './Version/version'

import SourceCategories from "./SourceCategories"

const Edit = ({startValue, attr, sourceId, type='text',cancel=()=>{}}) => {
  const [value, setValue] = useState('')
  //console.log('what is the value :', )
  const {pgEnv, baseUrl, falcor} = React.useContext(DamaContext);
  /*const [loading, setLoading] = useState(false)*/

  useEffect(() => {
    setValue(startValue)
  },[startValue])

  const save = (attr, value) => {
    if(sourceId) {
      falcor.set({
          paths: [
            ['dama',pgEnv,'sources','byId',sourceId,'attributes', attr ]
          ],
          jsonGraph: {
            dama:{
              [pgEnv] : {
                sources: {
                  byId:{
                    [sourceId] : {
                        attributes : {[attr]: value}
                    }
                  }
                }
              }
            }
          }
      }).then(d => {
        cancel()
      })
    }
  }

  return (
    type === 'textarea' ? (
      <div className='w-full flex flex-col h-full border border-lime-300'>
        <div>
          <textarea className='flex-1 w-full px-2 shadow bg-blue-100 min-h-[200px] focus:ring-blue-700 focus:border-blue-500  border-gray-300 rounded-none rounded-l-md' onChange={e => setValue(e.target.value)} >
            {value}
          </textarea>
        </div>
        <div className='flex py-2'>
          <div className='flex-1'/>
          <Button themeOptions={{size:'sm', color: 'primary'}} onClick={e => save(attr,value)}> Save </Button>
          <Button themeOptions={{size:'sm', color: 'cancel'}} onClick={e => cancel()}> Cancel </Button>
        </div>
      </div>) : (
      <div className='w-full flex flex-1'>
        <Input className='flex-1 px-2 shadow bg-blue-100 focus:ring-blue-700 focus:border-blue-500  border-gray-300 rounded-none rounded-l-md' value={value} onChange={e => setValue(e)}/>
        <Button themeOptions={{size:'sm', color: 'primary'}} onClick={e => save(attr,value)}> Save </Button>
        <Button themeOptions={{size:'sm', color: 'cancel'}} onClick={e => cancel()}> Cancel </Button>
      </div>
      )
  )
}



const OverviewEdit = ({source, views, activeViewId}) => {
  const [editing, setEditing] = React.useState(null);

  const stopEditing = React.useCallback(e => {
    e.stopPropagation();
    setEditing(null);
  }, []);

  // console.log("OverviewEdit::editing:", editing)

  const {pgEnv, baseUrl, user} = React.useContext(DamaContext);

  return (
    <div>
      <div className=" flex flex-col md:flex-row">
        <div className='flex-1'>
          <div className='flex justify-between group'>
            <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              {/*<dt className="text-sm font-medium text-gray-500 py-5">name</dt>*/}
              <dd className="mt-1 text-2xl text-gray-700 font-medium overflow-hidden sm:mt-0 sm:col-span-3">
                {editing === 'name' ?
                  <div className='pt-3 pr-8'>
                    <Edit
                      startValue={source['name']}
                      attr={'name'}
                      sourceId={source.source_id}
                      cancel={stopEditing}
                    />
                  </div> :
                  <div className='py-2 px-2'>{source['name']}</div>
                }
              </dd>
            </div>
            {user.authLevel > 5 ?
            <div className='hidden group-hover:block text-blue-500 cursor-pointer' onClick={e => editing === 'name' ? setEditing(null): setEditing('name')}>
              <i className="fad fa-pencil absolute -ml-12 mt-3 p-2.5 rounded hover:bg-blue-500 hover:text-white "/>
            </div> : ''}
          </div>
          <div className="w-full pl-4 py-6 hover:py-6 sm:pl-6 flex justify-between group">
            <div className="flex-1">
              <div className='mt-1 text-sm text-gray-500 pr-14'>
              {editing === 'description' ?
                <Edit
                  startValue={get(source,'description', '')}
                  attr={'description'}
                  type='textarea'
                  sourceId={source?.source_id}
                  cancel={stopEditing}/> :
                get(source,'description', false) || 'No Description'}
              </div>
            </div>
            {user.authLevel > 5 ?
            <div className='hidden group-hover:block text-blue-500 cursor-pointer' onClick={e => setEditing('description')}>
                <i className="fad fa-pencil absolute -ml-12  p-2 hover:bg-blue-500 rounded focus:bg-blue-700 hover:text-white "/>
            </div> : '' }
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            {Object.keys(SourceAttributes)
              .filter(d => !['source_id','metadata','description', 'statistics', 'category', 'display_name','name'].includes(d))
              .map((attr,i) => {
                let val = typeof source[attr] === 'object' ? JSON.stringify(source[attr]) : source[attr]
                if (attr === "categories") {
                  return (
                    <div key={attr} className='flex justify-between group'>
                      <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 py-5">{attr}</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <div className="py-5 px-2 relative">
                            <SourceCategories source={ source }
                              editingCategories={ editing === attr }
                              stopEditingCategories={ stopEditing }/>
                          </div>
                        </dd>
                      </div>
                      { user.authLevel > 5 && (editing !== attr) ?
                        <div className='hidden group-hover:block text-blue-500 cursor-pointer'
                          onClick={ e => setEditing(attr) }
                        >
                          <i className="fad fa-pencil absolute -ml-12 mt-3 p-2.5 rounded hover:bg-blue-500 hover:text-white "/>
                        </div> : null
                      }
                    </div>
                  )
                }
                return (
                  <div key={attr} className='flex justify-between group'>
                    <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500 py-5">{attr}</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {editing === attr ?
                          <div className='pt-3 pr-8'>
                            <Edit
                              startValue={val}
                              attr={attr}
                              sourceId={source.source_id}
                              cancel={stopEditing}
                            />
                          </div> :
                          <div className='py-5 px-2'>{val}</div>
                        }
                      </dd>
                    </div>
                    {user.authLevel > 5 ?
                    <div className='hidden group-hover:block text-blue-500 cursor-pointer' onClick={e => editing === attr ? setEditing(null): setEditing(attr)}>
                      <i className="fad fa-pencil absolute -ml-12 mt-3 p-2.5 rounded hover:bg-blue-500 hover:text-white "/>
                    </div> : ''}
                  </div>
                )
              })
            }
            <VersionEditor
              view={views.filter(d => d.view_id === activeViewId )?.[0] || {}}
              columns={['source_url', 'publisher','_created_timestamp']}
            />
            <div className='w-full flex p-4'>
              <div className='flex-1' />

            </div>
          </dl>

          {/*<div className='py-10 px-2'>
            <div className='text-gray-500 py-8 px-5'>Index</div>
            <div className=''>
              <Index source={source} />
            </div>
          </div>*/}
        </div>

      </div>
      <div className='py-10 px-2'>
          <div className='text-gray-500 py-8 px-5'>Versions</div>
          <div className=''>
            <Versions source={source} views={views} />
          </div>
        </div>
    </div>
  )
}


export default OverviewEdit
