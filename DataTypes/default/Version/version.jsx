import { Fragment, useEffect, useState, useContext, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Input, Button, Modal } from "~/modules/avl-components/src"
import get from 'lodash/get'
import { ViewAttributes } from '~/pages/DataManager/Source/attributes'
import { DamaContext } from "../../../store";
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { DAMA_HOST } from '~/config'
import { Menu, Transition } from '@headlessui/react'


function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

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

  await falcor.get(["dama", pgEnv, "views", "byId", [viewId,...tmpViewIds], "attributes", ["version", "metadata", "_modified_timestamp", "last_updated"]]);
}

const RenderDeps = ({ dependencies = {}, viewId, srcMeta, viewMeta, baseUrl }) => {
  const depViews = get(dependencies.dependencies.find(d => d.view_id.toString() === viewId.toString()), "view_dependencies") || [];

  if(!depViews?.length) return null;

  return (
    <div className="w-full p-4 bg-white shadow mb-4">
      <label className={"text-lg"}>Dependencies</label>
      <div className="py-4 sm:py-2 mt-2 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6 border-b-2">
        {
          ["Source Name", "Type", "Version", "Last Updated"]
            .map(key => (
              <dt key={key} className="text-sm font-medium text-gray-600">
                {typeof key === 'object' ? JSON.stringify(key) : key}
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

const RenderDependents = ({ dependents = [], viewId, srcMeta, viewMeta }) => {
  const { baseUrl } = useContext(DamaContext);
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
  const [value, setValue] = useState('')
  const {pgEnv, baseUrl, falcor} = useContext(DamaContext);
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

export const VersionEditor = ({view,columns=null}) => {
  const [editing, setEditing] = useState(null)
  const {pgEnv, baseUrl, user} = useContext(DamaContext);
  //console.log(view)

  return (
    <div className="overflow-hidden">
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          {Object.keys(ViewAttributes)
            .filter(d => !columns || columns.includes(d))
            .filter(d => !['view_id','source_id','description', 'statistics', 'category', 'table_schema', 'table_name', 'data_table', 'tiles_url', 'last_updated', 'view_dependencies', 'start_date', 'end_date', 'download_url', 'user_id', 'etl_context_id'].includes(d))
            .map((attr,i) => {
              let val = typeof view[attr] === 'object' ? JSON.stringify(view[attr]?.value) : view[attr]
              //val = attr === '_created_timestamp' ? new Date(val).toLocaleString("en-US",{ dateStyle: "short" }) : val
              //console.log('val', val, typeof val)
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
}

const OUTPUT_FILE_TYPES = [
  "CSV",
  "ESRI Shapefile",
  "GeoJSON",
  "GPKG",
];
const INITIAL_MODAL_STATE = {
  open: false,
  loading: false,
  fileTypes:[]
}

function ViewControls ({view}) {
  const cancelButtonRef = useRef(null);
  const { viewId,sourceId } = useParams();
  const { pgEnv, baseUrl, user} = useContext(DamaContext);

  const [modalState, setModalState] = useState(INITIAL_MODAL_STATE);

  const setFileTypes = (fileType) => {
    let newFileTypes;
    if(modalState.fileTypes.includes(fileType)){
      newFileTypes = modalState.fileTypes.filter(ft => ft !== fileType)
    }
    else{
      newFileTypes = [...modalState.fileTypes]
      newFileTypes.push(fileType);
    }

    setModalState({...modalState, fileTypes: newFileTypes});
  }

  const setModalOpen = (newModalOpenVal) => setModalState({...modalState, open: newModalOpenVal});

  const createDownload = () => {
    const runCreate = async () => {
      try {
        const createData = {
          source_id: sourceId,
          view_id: viewId,
          fileTypes: modalState.fileTypes,
          user_id: user.id
        };

        console.log('creating download')
        setModalState({...modalState, loading: true});
        const res = await fetch(`${DAMA_HOST}/dama-admin/${pgEnv}/gis-dataset/create-download`,
        {
          method: "POST",
          body: JSON.stringify(createData),
          headers: {
            "Content-Type": "application/json",
          },
        });

         const createFinalEvent = await res.json();
         setModalState({...modalState, loading: false, open: false});
         console.log('createDownload', createFinalEvent)
      } catch (err) {
        console.error("==>", err);
        setModalState({...modalState, loading: false, open: false});
      }
    }
    runCreate();
  }
  return (
    <div className="w-72 ">
      {user.authLevel >= 10 ? (
        <div className="w-full">
          <div> Admin Actions </div>
          <div className="w-full p-1 flex">
            <Link
              className={
                "w-full flex-1 text-center border shadow hover:bg-blue-100 p-4"
              }
              onClick={() => {
                setModalState({ ...modalState, open: true });
              }}
            >
              Create Download
            </Link>
          </div>

          <div className="w-full p-1 flex">
            <Link
              className={
                "w-full flex-1 text-center bg-red-100 border border-red-200 shadow hover:bg-red-400 hover:text-white p-4"
              }
              to={`${baseUrl}/source/${sourceId}/versions/${viewId}/delete`}
            >
              Delete View <i className="fad fa-trash" />
            </Link>
          </div>
        </div>
      ) : (
        ""
      )}
      <Modal open={modalState.open} setOpen={setModalOpen} size="xlarge">
        <div className="flex items-center">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
            <i
              className="fad fa-layer-group text-blue-600"
              aria-hidden="true"
            />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
            <div className="text-lg align-center font-semibold leading-6 text-gray-900">
              Create Data Download
            </div>
          </div>
        </div>
        <div className="pl-10">
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
            <div className="text-md align-center  leading-6 text-gray-900">
              File types:
            </div>
            {OUTPUT_FILE_TYPES.map((fileType) => (
              <FileTypeInput
                key={`${fileType}_checkbox`}
                typeName={fileType}
                checked={modalState.fileTypes.includes(fileType)}
                onChange={setFileTypes}
              />
            ))}
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            disabled={modalState.loading}
            className="disabled:bg-slate-300 disabled:cursor-warning inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
            onClick={createDownload}
          >
            {modalState.loading
              ? "Sending request..."
              : "Start download creation"}
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            onClick={() => setModalOpen(false)}
            ref={cancelButtonRef}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}

const FileTypeInput = ({typeName, checked, onChange}) => {
  return (
    <div className="mt-2 flex items-center">
      <input
        id={typeName}
        name={typeName}
        type="checkbox"
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        checked={checked}
        onChange={() => onChange(typeName)}  
      />
      <label htmlFor={typeName} className="ml-2 text-sm text-gray-900">
        {typeName}
      </label>
    </div>
  )
}

export function  VersionDownload ({view}) {
  if(!view?.metadata?.download) {
    return 'Download Not Available'
  }

  return (
    <div className="inline-flex rounded-md shadow-sm">
      <button
        type="button"
        className="relative inline-flex items-center rounded-l-md bg-white px-10 py-[12px] text-md font-semibold text-blue-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
      >
        Download
      </button>
      <Menu as="div" className="absolute ml-32 block">
        <Menu.Button className="relative inline-flex items-center rounded-r-md bg-white px-2 py-3 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10">
          <span className="sr-only">Open options</span>
          <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute z-20 right-0 -mr-1 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {Object.keys(view.metadata.download).map((item,i) => (
                <Menu.Item key={i}>
                  {({ active }) => (
                    <a
                      href={view.metadata.download[item].replace('$HOST', `${DAMA_HOST}`)}
                      className={classNames(
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'block px-4 py-2 text-sm'
                      )}
                    >
                      {item}
                    </a>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}

export default function Version() {
  const { viewId,sourceId } = useParams();
  const { pgEnv, baseUrl, falcor, falcorCache} = useContext(DamaContext);

  useEffect(() => {
    getData({ falcor, pgEnv, viewId });
  }, [viewId, pgEnv, falcor]);

  const dependencies = get(falcorCache, ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", viewId, "value"], { dependencies: [] }),
    dependents = get(falcorCache, ["dama", pgEnv, "views", "byId", viewId, "dependents", "value"], []),
    srcMeta = get(falcorCache, ["dama", pgEnv, "sources", "byId", sourceId, "attributes"], {}),
    viewMeta = get(falcorCache, ["dama", pgEnv, "views", "byId"], {}),
    view = get(falcorCache, ["dama", pgEnv, "views", "byId", viewId, 'attributes'], {});

  const version = typeof view?.['version'] === 'object' ? null : view?.['version']

  //console.log('version', dependencies)

  return (
    <div className="overflow-hidden flex flex-col md:flex-row">
        <div className='flex-1'>
          <div className='flex justify-between'>
            <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              {/*<dt className="text-sm font-medium text-gray-500 py-5">name</dt>*/}
              <dd className="mt-1 text-2xl text-gray-700 font-medium overflow-hidden sm:mt-0 sm:col-span-2">
                <div className='py-2 px-2'>{srcMeta?.name } - { version || viewId}</div>
              </dd>
              <dd className = 'sm:mt-0 sm:col-span-2'>
                <VersionEditor view={view} baseUrl={baseUrl} />

{/*                {dependencies?.dependencies && dependencies?.dependencies?.length > 0 ?
                <RenderDeps
                  viewId={viewId}
                  dependencies={dependencies}
                  srcMeta={srcMeta}
                  viewMeta={viewMeta}
                  baseUrl={baseUrl}
                /> : ''}*/}
{/*
                {dependents && dependents.length > 0 ?
                <RenderDependents
                  viewId={viewId}
                  dependents={dependents}
                  srcMeta={srcMeta}
                  viewMeta={viewMeta}
                  baseUrl={baseUrl}
                /> : ''}*/}
              </dd>
              <ViewControls view={view} />
          </div>

        </div>
      </div>
    </div>
  );
}
