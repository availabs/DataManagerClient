import React from "react"

import { useLocation, Link } from "react-router-dom"


const Overview = ({ searchParams, setSearchParams, source, getVariables }) => {
  const variables = getVariables(source?.type)
  const activeVariable = React.useMemo(() => {
    return searchParams.get("variable") || variables[0].key;
  }, [searchParams]);

  

  const buttons = [
    {name: 'Map', icon: 'fad fa-location-dot', to: `/source/${source.source_id}/map`},
    {name: 'Table', icon: 'fad fa-table', to: `/source/${source.source_id}/table`},
    {name: 'Chart', icon: 'fad fa-bar-chart', to: `/source/${source.source_id}/chart`},
    {name: 'View Metadata', icon: 'fad fa-info-circle', to: `/source/${source.source_id}/metadata`},  
  ]


  return (
    <div className='flex md:flex-row flex-col '>
      <div className="grid grid-cols-1 gap-1 w-full md:w-[600px] border-b-2 border-tigGreen-100 pb-4" >
        <div className="border-b border-gray-800 p-4 text-sm">{source?.description || 'Source description'}</div>
        <div className='pl-2 text-lg font-semibold'>{source.name}</div>
        { variables.map(({ key, name }) => (
            <Variable key={ key }
              variable={ key } name={ name }
              isActive={ activeVariable === key }
              setSearchParams={ setSearchParams }/>
          ))
        }
      </div>
      <div className='flex-1' />
      <div className='w-full md:w-[300px]'>
        <div className='text-sm font-medium pl-2'>Actions for:</div>
        <div className='text-sm font-thin pl-2'>{variables.filter(d => d.key === activeVariable)?.[0]?.name || ''}</div>
        {
          buttons.map(b => {
            return (
              <Link 
                to={`${b.to}${activeVariable ? `?variable=${activeVariable}` : ''}`} 
                className='w-full mx-2 font-light hover:font-medium rounded text-gray-700 bg-tigGreen-50 hover:bg-tigGreen-100 px-5 py-1 block text-center my-2 '>
                <div><i className={`${b.icon} px-2`}/>{b.name}</div>
              </Link>
            )
          })

        }

      </div>
    </div>
  )
}
export default Overview

const Variable = ({ name, variable, isActive, setSearchParams }) => {
  const onClick = React.useCallback(() => {
    setSearchParams(`variable=${ variable }`);
  }, [setSearchParams, variable]);
  return (
    <div onClick={ onClick }
      className={ `
        px-4 py-0.5 font-light rounded hover:bg-gray-100 cursor-pointer text-sm
        ${ isActive ? "bg-tigGreen-50 hover:bg-tigGreen-50" : "" }
      ` }
    >
      { name }
    </div>
  )
}
