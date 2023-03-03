import React from 'react';
import { Dropdown, withAuth } from 'modules/avl-components/src'
import { useSelector } from "react-redux";
import { Item } from 'pages/Auth/AuthMenu'
import { selectPgEnv } from "pages/DataManager/store"
import Breadcrumbs from './Breadcrumbs'


const SourcesLayout = ({children}) => {
  return (
    <div>
      <div className=''>
        <Breadcrumbs />
      </div>
      <div className='flex'>
        <div className='flex-1 '>
          {children}
        </div>
      </div>
    </div>
  )
}

export const DataManagerHeader = withAuth(({user}) => {
  const pgEnv = useSelector(selectPgEnv);

  return (
    <div className='pt-[2px]'>
      { user.authLevel >= 5 ? 
        (
          <div className=' h-full'>
            <Dropdown control={
              <div className='px-2 flex text-lg'>
                <div className=' font-medium text-gray-800'> Data Manager</div> 
                <div className='fal fa-angle-down px-3 mt-[6px] '/>
                <div style={{color: 'red', paddingLeft: '15px', fontWeight: 'bold' }}>{pgEnv}</div>
              </div>} 
              className={`text-gray-800 group`} openType='click'
            >
              <div className='p-1 bg-blue-500 text-base'>
                <div className='py-1 '> 
                    {Item('/datasources/create/source', 'fa fa-file-plus flex-shrink-0  pr-1', 'Add New Datasource')}
                </div>
                <div className='py-1 '> 
                    {Item('/datasources/settings', 'fa fa-cog flex-shrink-0  pr-1', 'Datamanager Settings')}
                </div>
              </div>          
            </Dropdown>
          </div>
        ) 
        : <div/>
      }
    </div>
  )
})


export default SourcesLayout
