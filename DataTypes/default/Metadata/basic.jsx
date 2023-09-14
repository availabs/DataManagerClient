import React from 'react';
import get from 'lodash/get';
import { DamaContext } from "~/pages/DataManager/store";
import {dmsDataTypes} from "~/modules/dms/src"

const MetadataTable = ({ source, ...props }) => {

  const { pgEnv, falcor, user } = React.useContext(DamaContext);
  const { authLevel } = user;
  const gridCols = "grid-cols-2" ;

  const sourceId = source.source_id;
  const [metadata, setMetadata] = React.useState([]);
  const Lexical = dmsDataTypes.lexical.ViewComp;

  React.useEffect(() => {
    const md = JSON.parse(JSON.stringify(get(source, "metadata", [])));

    if (Array.isArray(md)) {
      setMetadata(md.map(d => ({
          display: "",
          ...d
        }))
      );
    }
    else if (md && "columns" in md) {
      const columns = get(md, "columns", []);
      if (Array.isArray(columns)) {
        setMetadata(columns.map(d => ({
            display: "",
            ...d
          }))
        );
      }
      else {
        setMetadata([]);
      }
    }
    else {
      setMetadata([]);
    };
  }, [source]);

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
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">

          {metadata
            //.filter(d => !['id','metadata','description'].includes(d))
            .map((col,i) => (
            <div key={i} className={ `py-4 sm:py-5 sm:grid sm:${ gridCols } sm:gap-4 sm:px-6` }>
              <dt className="text-sm text-gray-900">
                <div className='pt-3 pr-8 font-light'>
                  {get(col, 'name')}
                  <span className={'italic pl-1'}>({get(col, 'type')})</span>
                </div>
                <div className='pt-3 pr-8 font-bold'>{get(col, 'display_name') || 'No Display Name'}</div>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                {
                  get(col, ['desc', 'root']) ?
                      <Lexical value={get(col, 'desc')} /> :
                      ( get(col, 'desc') || 'No Description')
                }

              </dd>
            </div>
          ))}

        </dl>
      </div>
    </div>
  )
}

const Metadata = ({source, views, ...props}) => {
  return (
    <div  className="w-full flex-1 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
      <div className='col-span-3'>
        <MetadataTable source={source} />
      </div>

    </div>
  )
}

export default Metadata
