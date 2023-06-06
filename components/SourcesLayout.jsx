import React, {useContext} from 'react';
import { Dropdown } from '~/modules/avl-components/src'
import { withAuth } from '~/modules/ams/src'
import { Item } from '~/pages/Auth/AuthMenu'
import { DamaContext } from '../store'
import Breadcrumbs from './Breadcrumbs'


const SourcesLayout = ({children }) => {
  const { baseUrl } = useContext(DamaContext)

  return (
    <div className="max-w-6xl mx-auto">
      hola
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
  //const { pgEnv } = React.useContext(DamaContext)
  //const baseUrl = '/'
  const {pgEnv, baseUrl} = React.useContext(DamaContext)
  
  return (
    <div className='pt-[2px]'>
      { user.authLevel >= 5 ? 
        (
          <div className='h-full'>
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
                    {Item(`${baseUrl}/create/source`, 'fa fa-file-plus flex-shrink-0  pr-1', 'Add New Datasource')}
                </div>
                {/*<div className='py-1 '> 
                    {Item(`${baseUrl}/settings`, 'fa fa-cog flex-shrink-0  pr-1', 'Datamanager Settings')}
                </div>*/}
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
