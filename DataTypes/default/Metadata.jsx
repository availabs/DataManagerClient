import React from 'react';
import get from 'lodash/get'

import { DamaContext } from "~/pages/DataManager/store"

const MetadataTable = ({ source, ...props }) => {

  
  
  const { pgEnv, falcor, user } = React.useContext(DamaContext)
  const { authLevel } = user;
  const gridCols = authLevel < 5 ? "grid-cols-3" : "grid-cols-4";


  const sourceId = source.source_id;
  const [metadata, setMetadata] = React.useState([]);

  React.useEffect(() => {
    const md = JSON.parse(JSON.stringify(get(source, "metadata", [])));
    if (Array.isArray(md)) {
      const MD = md.map(d => ({
          display: "",
          ...d
        }));
      setMetadata(MD);
    }
    else {
      setMetadata([]);
    };
  }, [source]);

  const editMetadataDisplay = React.useCallback((name, display) => {
    const md = metadata.map(d => {
      if (d.name === name) {
        return {
          ...d,
          display
        }
      }
      else {
        return d;
      }
    })
    setMetadata(md);
    falcor.set({
      paths: [
        ['dama', pgEnv, 'sources', 'byId', sourceId, 'attributes', "metadata"]
      ],
      jsonGraph: {
        dama: {
          [pgEnv]: {
            sources: {
              byId: {
                [sourceId]: {
                  attributes: { metadata: JSON.stringify(md) }
                }
              }
            }
          }
        }
      }
    }).then(res => console.log("RES:", res))
  }, [falcor, pgEnv, sourceId, metadata]);

  if (!metadata ||!metadata.map || metadata.length === 0) return <div> Metadata Not Available </div>
  return (
    <div className="overflow-hidden">
      <div className={ `py-4 sm:py-2 sm:grid sm:${ gridCols } sm:gap-4 sm:px-6 border-b-2` }>
        <dt className="text-sm font-medium text-gray-600">
          Column
        </dt>
        <dd className="text-sm font-medium text-gray-600 ">
          Description
        </dd>
        <dd className="text-sm font-medium text-gray-600">
          Type
        </dd>
        { authLevel < 5 ? null :
          <dd className="text-sm font-medium text-gray-600">
            Display
          </dd>
        }
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">

          {metadata
            //.filter(d => !['id','metadata','description'].includes(d))
            .map((col,i) => (
            <div key={i} className={ `py-4 sm:py-5 sm:grid sm:${ gridCols } sm:gap-4 sm:px-6` }>
              <dt className="text-sm text-gray-900">
                {col.name}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                { get(col, 'desc') || 'No Description' }
              </dd>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                <div className='text-gray-400 italic'>{col.type}</div>
              </dd>
              { authLevel < 5 ? null :
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0">
                  <DisplaySelector { ...col }
                    editMetadataDisplay={ editMetadataDisplay }/>
                </dd>
              }
            </div>
          ))}

        </dl>
      </div>
    </div>
  )
}

const DisplaySelector = ({ name, display, editMetadataDisplay }) => {
  const onChange = React.useCallback(e => {
    editMetadataDisplay(name, e.target.value);
  }, [name, editMetadataDisplay])
  return (
    <select
      className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
      value={ display }
      onChange={ onChange }
    >
      <option value={ "" }>
        none
      </option>
      <option value="meta-variable">
        meta variable
      </option>
      <option value="data-variable">
        data variable
      </option>
      <option value="geoid-variable">
        geo variable
      </option>
    </select>
  )
}

const Metadata = ({source, views, ...props}) => {

console.log("SOURCE:", source)

  return (
    <div  className="w-full flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
      <div className='col-span-3'>
        <MetadataTable source={source} />
      </div>

    </div>
  )
}

export default Metadata
