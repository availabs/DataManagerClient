import React from "react"

import { useLocation } from "react-router-dom"

import { sedVarsCounty } from "./sedCustom"

const Variables = Object.keys(sedVarsCounty)
  .map(key => ({
    key,
    name: sedVarsCounty[key].name
  }))

const Overview = ({ searchParams, setSearchParams }) => {
  const activeVariable = React.useMemo(() => {
    return searchParams.get("variable");
  }, [searchParams]);
  return (
    <div className="grid grid-cols-1 gap-1">
      <div className="border-b-2">Select a variable...</div>
      { Variables.map(({ key, name }) => (
          <Variable key={ key }
            variable={ key } name={ name }
            isActive={ activeVariable === key }
            setSearchParams={ setSearchParams }/>
        ))
      }
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
        px-2 py-1 rounded border hover:bg-gray-300 cursor-pointer
        ${ isActive ? "bg-gray-200" : "" }
      ` }
    >
      { name } ({ variable })
    </div>
  )
}
