import React, { useEffect, /*useMemo,*/ useState } from 'react';
import { useFalcor, withAuth, Table} from 'modules/avl-components/src'
import get from 'lodash.get'
import { SourceAttributes } from 'pages/DataManager/components/attributes'
import { useSelector } from "react-redux";
import { useHistory, useParams } from "react-router-dom"
import { selectPgEnv } from "pages/DataManager/store"


const Versions = withAuth(({source, views, user}) => {
  const history = useHistory()
  const {viewId} = useParams()

  if(viewId) {
    let view = views.filter(d => d.view_id === viewId)[0] || {}
    return (
      <div className='overflow-x-hidden max-w-6xl'>
        <pre>
          {JSON.stringify(views[0], null ,3)}
        </pre>
      </div>
    )
  }
  
  return (
    <div className="">
      <Table 
        data={views}
        onRowClick={(state,rowInfo)=> {
          //console.log('rowCLick', state, rowInfo)
          console.log()
          history.push(`/source/${source.source_id}/versions/${rowInfo.cells[0].value}`)
        }}
        columns={[
          {
            Header: 'Version Id',
            accessor: 'view_id',
            align: 'left'
          },
          {
            Header: 'Version',
            accessor: 'version',
          },
          {
            Header: 'User',
            accessor: 'user_id',
          },
          {
            Header: 'Updated',
            accessor: '_modified_timestamp',
          },
          {
            Header: 'Created',
            accessor: '_created_timestamp',
          },
        ]}
      />
       
    </div>
  )
})


export default Versions    
