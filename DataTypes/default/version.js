import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useFalcor, withAuth, Input, Button } from 'modules/avl-components/src'
import get from 'lodash.get'
import { ViewAttributes } from 'pages/DataManager/components/attributes'
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../store";

async function getData({ falcor, pgEnv, viewId }) {
  const dependenciesData = await falcor.get(["dama", pgEnv, "viewDependencySubgraphs", "byViewId", viewId]);
  const dependentsData = await falcor.get(["dama", pgEnv, "views", "byId", viewId, "dependents"]);


  // collect all dependency sources, fetch meta for them.
  const tmpSrcIds = [];
  const tmpViewIds = [];
  get(dependenciesData, ["json", "dama", pgEnv, "viewDependencySubgraphs", "byViewId", viewId, "dependencies"], [])
    .forEach(d => {
      tmpSrcIds.push(
        d.source_id
      );
      tmpViewIds.push(
        d.view_id
      );
    });

  get(dependentsData, ["json", "dama", pgEnv, "views", "byId", viewId, "dependents"], [])
    .forEach(d => {
      tmpSrcIds.push(
        d.source_id
      );
      tmpViewIds.push(
        d.view_id
      );
    });

  await falcor.get(["dama", pgEnv, "sources", "byId", tmpSrcIds, "attributes", ["type", "name"]]);

  await falcor.get(["dama", pgEnv, "views", "byId", tmpViewIds, "attributes", ["version", "metadata", "_modified_timestamp", "last_updated"]]);
}

const RenderDeps = ({ dependencies = {}, viewId, srcMeta, viewMeta, baseUrl }) => {
  const depViews = get(dependencies.dependencies.find(d => d.view_id.toString() === viewId.toString()), "view_dependencies") || [];

  return (
    <div className="w-full p-4 bg-white shadow mb-4">
      <label className={"text-lg"}>Dependencies</label>
      <div className="py-4 sm:py-2 mt-2 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6 border-b-2">
        {
          ["Source Name", "Type", "Version", "Last Updated"]
            .map(key => (
              <dt key={key} className="text-sm font-medium text-gray-600">
                {key}
              </dt>
            ))
        }
      </div>
      <dl className="sm:divide-y sm:divide-gray-200">
        {
          dependencies.dependencies
            .filter(d => depViews.includes(d.view_id))
            .map((d, i) => (
                <div key={`${i}_0`} className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                  <dd key={`${i}_1`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle">
                    <Link to={`${baseUrl}/source/${d.source_id}/overview`}>
                      {get(srcMeta, [d.source_id, "attributes", "name"])}
                    </Link>
                  </dd>

                  <dd key={`${i}_2`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle">
                    <Link to={`${baseUrl}/source/${d.source_id}/overview`}>
                      {get(srcMeta, [d.source_id, "attributes", "type"])}
                    </Link>
                  </dd>

                  <dd key={`${i}_3`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle">
                    <Link to={`${baseUrl}/source/${d.source_id}/versions/${d.view_id}`}>
                      {get(viewMeta, [d.view_id, "attributes", "version"])}
                    </Link>
                  </dd>

                  <dd key={`${i}_4`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle">
                    <Link to={`${baseUrl}/source/${d.source_id}/versions/${d.view_id}`}>
                      {typeof get(viewMeta, [d.view_id, "attributes", "_modified_timestamp", "value"]) === "object" ? "" :
                        get(viewMeta, [d.view_id, "attributes", "_modified_timestamp", "value"])
                      }
                    </Link>
                  </dd>

                  <dd key={`${i}_5`} className="mt-1 text-sm text-red-400 sm:mt-0">
                                        <span className={"float-right italic"}> {
                                          get(viewMeta, [d.view_id, "attributes", "metadata", "value", "authoritative"]) === "true" ? ""
                                            : "outdated"
                                        }</span>
                  </dd>
                </div>

              )
            )
        }
      </dl>

    </div>
  );
};

const RenderDependents = ({ dependents = [], viewId, srcMeta, viewMeta, baseUrl }) => {
  return (
    <div className="w-full p-4 bg-white shadow mb-4">
      <label className={"text-lg"}>Dependents</label>
      <div className="py-4 sm:py-2 mt-2 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6 border-b-2">
        {
          ["Source Name", "Type", "Version", "Last Updated"]
            .map(key => (
              <dt key={key} className="text-sm font-medium text-gray-600">
                {key}
              </dt>
            ))
        }
      </div>
      <dl className="sm:divide-y sm:divide-gray-200">
        {
          dependents
            .map((d, i) => (
                <div key={`${i}_0`} className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                  <dd key={`${i}_1`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle">
                    <Link to={`${baseUrl}/source/${d.source_id}/overview`}>
                      {get(srcMeta, [d.source_id, "attributes", "name"])}
                    </Link>
                  </dd>

                  <dd key={`${i}_2`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle">
                    <Link to={`${baseUrl}/source/${d.source_id}/overview`}>
                      {get(srcMeta, [d.source_id, "attributes", "type"])}
                    </Link>
                  </dd>

                  <dd key={`${i}_3`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle">
                    <Link to={`${baseUrl}/source/${d.source_id}/versions/${d.view_id}`}>
                      {get(viewMeta, [d.view_id, "attributes", "version"])}
                    </Link>
                  </dd>

                  <dd key={`${i}_4`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle">
                    <Link to={`${baseUrl}/source/${d.source_id}/versions/${d.view_id}`}>
                      {typeof get(viewMeta, [d.view_id, "attributes", "_modified_timestamp", "value"]) === "object" ? "" :
                        get(viewMeta, [d.view_id, "attributes", "_modified_timestamp", "value"])
                      }
                    </Link>
                  </dd>

                  <dd key={`${i}_5`} className="mt-1 text-sm text-red-400 sm:mt-0">
                                        <span className={"float-right italic"}> {
                                          get(viewMeta, [d.view_id, "attributes", "metadata", "value", "authoritative"]) === "true" ? ""
                                            : "outdated"
                                        }</span>
                  </dd>
                </div>

              )
            )
        }
      </dl>

    </div>
  );
};


const Edit = ({startValue, attr, viewId, cancel=()=>{}}) => {
  const { falcor } = useFalcor()
  const [value, setValue] = useState('')
  const pgEnv = useSelector(selectPgEnv);
  /*const [loading, setLoading] = useState(false)*/

  useEffect(() => {
    setValue(startValue)
  },[startValue])

  const save = (attr, value) => {
    if(viewId) {
      falcor.set({
          paths: [
            ['dama',pgEnv,'views','byId',viewId,'attributes', attr ]
          ],
          jsonGraph: {
            dama:{
              [pgEnv] : {
                views: {
                  byId:{
                    [viewId] : {
                        attributes : {[attr]: value}
                    }
                  }
                }
              }
            }
          }
      }).then(d => {
        console.log('set run', d)
        cancel()
      })
    }
  }

  return (
    <div className='w-full flex'>
      <Input className='flex-1 px-2 shadow bg-blue-100 focus:ring-blue-700 focus:border-blue-500  border-gray-300 rounded-none rounded-l-md' value={value} onChange={e => setValue(e)}/>
      <Button themeOptions={{size:'sm', color: 'primary'}} onClick={e => save(attr,value)}> Save </Button>
      <Button themeOptions={{size:'sm', color: 'cancel'}} onClick={e => cancel()}> Cancel </Button>
    </div>
  )
}

const VersionEditor = withAuth(({view, user, baseUrl='/datasources'}) => {
  const [editing, setEditing] = React.useState(null)
  
  return (
    <div className="overflow-hidden">
     {/* <pre>
        {JSON.stringify(view, null ,3)}
      </pre>*/}
      {/*<div className="pl-4 py-6 hover:py-6 sm:pl-6 flex justify-between group">
        <div className="flex-1 mt-1 max-w-2xl text-sm text-gray-500">
          {editing === 'description' ? 
            <Edit 
              startValue={get(view,'description', '')}
              attr={'description'}
              viewId={view.view_id}
              cancel={() => setEditing(null)}/> : 
            get(source,'description', false) || 'No Description'}
        </div>
        {user.authLevel > 5 ? 
        <div className='hidden group-hover:block text-blue-500 cursor-pointer' onClick={e => setEditing('description')}>
            <i className="fad fa-pencil absolute -ml-12  p-2 hover:bg-blue-500 rounded focus:bg-blue-700 hover:text-white "/>
        </div> : '' }
      </div>*/}
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          {Object.keys(ViewAttributes)
            .filter(d => !['view_id','source_id', 'metadata','description', 'statistics', 'category'].includes(d))
            .map((attr,i) => {
              let val = typeof view[attr] === 'object' ? JSON.stringify(view[attr].value) : view[attr]
              return (
                <div key={i} className='flex justify-between group'>
                  <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 py-5">{attr}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {editing === attr ? 
                        <div className='pt-3 pr-8'>
                          <Edit 
                            startValue={val} 
                            attr={attr}
                            viewId={view.view_id}
                            cancel={() => setEditing(null)}
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
        </dl>
      </div>
    </div>
  )
})

export default function Version({baseUrl}) {
  const { falcor, falcorCache } = useFalcor();
  const { viewId } = useParams();
  const pgEnv = useSelector(selectPgEnv);

  useEffect(() => {
    getData({ falcor, pgEnv, viewId });
  }, [viewId, pgEnv, falcor]);

  const dependencies = get(falcorCache, ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", viewId, "value"], { dependencies: [] }),
    dependents = get(falcorCache, ["dama", pgEnv, "views", "byId", viewId, "dependents", "value"], []),
    srcMeta = get(falcorCache, ["dama", pgEnv, "sources", "byId"], {}),
    viewMeta = get(falcorCache, ["dama", pgEnv, "views", "byId"], {}),
    view = get(falcorCache, ["dama", pgEnv, "views", "byId", viewId, 'attributes'], {});

  return (
    <div>
      <div className="text-xl font-medium overflow-hidden p-2 border-b ">
        {viewId}
      </div>
      <VersionEditor view={view} baseUrl={baseUrl} />
      {dependencies.length > 0 ? 
        <RenderDeps 
          viewId={viewId} 
          dependencies={dependencies} 
          srcMeta={srcMeta} 
          viewMeta={viewMeta} 
          baseUrl={baseUrl}
        /> : ''}
      {dependents.length > 0 ? 
        <RenderDependents 
          viewId={viewId}
          dependents={dependents}
          srcMeta={srcMeta} 
          viewMeta={viewMeta} 
          baseUrl={baseUrl}
        /> : ''}
      }
    </div>
  );
}
