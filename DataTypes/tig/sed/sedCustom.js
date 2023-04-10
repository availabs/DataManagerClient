import React, {useMemo} from 'react'
import get from 'lodash/get'

const sedVars = {
	totpop: { name: 'Total Population' },
	hhpop: { name: 'Households' },
	hhnum: { name: 'Household Population'},
	hhsize: { name: 'Household Size'},
	hhincx: { name: 'Household Income'},
	elf: { name: 'Employed Labor Fouce'},
	emptot: { name: 'Total Employment'},
	empret: { name: 'Retail Employment'},
	empoff: { name: 'Office Employment'},
	earnwork: { name: 'Earnings'},
	unvenrol: { name: 'Universirty Enrollment'},
	k_12_etot: { name: 'School Enrollment'},
	gqpop: { name: 'Group Quarters Population' },
	gqpopins: { name: 'Group Quarters Instituional Population'},
	gqpopstr: { name: 'Group Quarters Other Population'},
	gqpopoth: { name: 'Group Quarters Homless Population'},	
}

const years = ['10','17','20','25','30','35','40','45','50','55']

const SedMapFilter = ({source, filters, setFilters}) => {
  let activeVar = useMemo(() => get(filters, 'activeVar.value',''),[filters])
  let varType = useMemo(() => typeof activeVar === 'string' ? activeVar.substring(0,activeVar.length-3) : '',[activeVar])
  let year = useMemo(() => typeof activeVar === 'string' ? activeVar.slice(-2) : '10' ,[activeVar])

  React.useEffect(() => {
    console.log('SedMapFilter', activeVar)
    if(!activeVar) {
      setFilters({
        ...filters,
        activeVar: { value: 'totpop_10'}
      })

    }
  },[])
  console.log(varType, year,activeVar)

  return (
    <div className='flex flex-1 border-blue-100'>
      <div className='py-3.5 px-2 text-sm text-gray-400'>Variable: </div>
      <div className='flex-1'>
        <select  
            className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
            value={varType}
            onChange={(e) => setFilters({
              ...filters,
              activeVar: { value: `${e.target.value}_${year}`}
            })}
          >
            <option  className="ml-2  truncate" value={null}>
              none    
            </option>
            {Object.keys(sedVars)
              .map((k,i) => (
              <option key={i} className="ml-2  truncate" value={k}>
                {sedVars[k].name}
              </option>
            ))}
        </select>
      </div>

      <div className='py-3.5 px-2 text-sm text-gray-400'>Year:</div>
      <div className=''>
        <select  
            className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
            value={year}
            onChange={(e) => setFilters({
              ...filters,
              activeVar: { value: `${varType}_${e.target.value}`}
            })}
          >
            {years
              .map((k,i) => (
              <option key={i} className="ml-2  truncate" value={k}>
                {k}
              </option>
            ))}
        </select>
      </div>
    </div>
  )
}

const SedTableFilter = ({source, filters, setFilters}) => {
  let activeVar = useMemo(() => get(filters, 'activeVar.value',''),[filters])
  console.log('SedTableFilter', filters)
  React.useEffect(() => {
    if(!get(filters, 'activeVar.value','')) {
      setFilters({
        ...filters,
        activeVar: { value: 'totpop'}
      })
    }
  },[])
  //console.log(, year,activeVar)

  return (
    <div className='flex flex-1 border-blue-100'>
      <div className='py-3.5 px-2 text-sm text-gray-400'>Variable: </div>
      <div className='flex-1'>
        <select  
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={activeVar}
          onChange={(e) => setFilters({...filters, activeVar: {value: e.target.value }})}
        >
          <option  className="ml-2  truncate" value={''}>
            none    
          </option>
          {Object.keys(sedVars)
            .map((k,i) => (
            <option key={i} className="ml-2  truncate" value={k}>
              {sedVars[k].name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}


const SedTableTransform = (tableData, attributes,filters) => {
  let activeVar = get(filters, 'activeVar.value','totpop')
  
  const columns =  [{
      Header: 'TAZ',
      accessor: 'taz'
  },
  // {
  //     Header: 'COUNTY',
  //     accessor: 'COUNTY_NAM'
  // }
  ]

  years.forEach(y => {
    columns.push({
      Header: `20${y}`,
      accessor: `${activeVar}_${y}`,
      Cell: ({ value }) => Math.round(value).toLocaleString()
    })
  })

  return {
    data: tableData,
    columns
  }
}


export {
  SedMapFilter,
  SedTableFilter,
  SedTableTransform
}