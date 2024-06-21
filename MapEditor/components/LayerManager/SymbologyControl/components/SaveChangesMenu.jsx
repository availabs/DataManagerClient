import { useContext, useState, useRef, useMemo } from 'react'
import { SymbologyContext } from '../../../..'
import { DamaContext } from "../../../../../store"
import { Button } from "~/modules/avl-components/src";
import { Dialog } from '@headlessui/react'
import { useParams, useNavigate } from 'react-router-dom'
import get from 'lodash/get'
import isEqual from "lodash/isEqual"
import {Modal} from '../'
import { getAttributes } from "~/pages/DataManager/Collection/attributes";

export function SaveChangesMenu({ button, className}) {
  const [showSaveChanges, setShowSaveChanges] = useState(false)

  return (
      <div 
        onClick={() => setShowSaveChanges(true)}
        className={className}
      >
        <SaveChangesModal open={showSaveChanges} setOpen={setShowSaveChanges}/>
        {button}
      </div>
  )
}

const INITIAL_SAVE_CHANGES_MODAL_STATE = {
  action: 'save',
  name: ''
};

//RYAN TODO -- set initial/default name of "saveas" input to be something like "Current Map (1)" or "Copy of Current Map (1)", etc.
// next -- get it to make the API call to `save`, when save is selected and confirmed
function SaveChangesModal ({ open, setOpen })  {
  const cancelButtonRef = useRef(null)
  // const submit = useSubmit()
  const { pgEnv, falcor, falcorCache, baseUrl } = useContext(DamaContext)
  const { state, setState } = useContext(SymbologyContext)
  const { symbologyId } = useParams()
  const navigate = useNavigate()
  const [modalState, setModalState] = useState(INITIAL_SAVE_CHANGES_MODAL_STATE)

  const symbologies = useMemo(() => {
    return Object.values(get(falcorCache, ["dama", pgEnv, "symbologies", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
  }, [falcorCache, pgEnv]);

  async function updateData() {
    //console.log('updating symbology to:', state.symbology)
    await falcor.set({
      paths: [['dama', pgEnv, 'symbologies', 'byId', +symbologyId, 'attributes', 'symbology']],
      jsonGraph: { dama: { [pgEnv]: { symbologies: { byId: { 
        [+symbologyId]: { attributes : { symbology: JSON.stringify(state.symbology) }}
      }}}}}
    })
    //console.timeEnd('update symbology')
    
    //console.log('resp',resp)
  }

  async function updateName() {
    await falcor.set({
      paths: [['dama', pgEnv, 'symbologies', 'byId', +symbologyId, 'attributes', 'name']],
      jsonGraph: { dama: { [pgEnv]: { symbologies: { byId: { 
        [+symbologyId]: { attributes : { name: state.name }}
      }}}}}
    })
  }
  
  const actionButtonClassName = modalState.action === 'discard' ? 'danger' : 'primary' 

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      initialFocus={cancelButtonRef}
    >
      <div className="flex items-center ">
        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
          <i className='fa-regular fa-floppy-disk text-blue-600' aria-hidden="true"/>
        </div>
        <div className="mt-3 text-center sm:ml-2 sm:mt-0 sm:text-left w-full">
          <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
            Manage Changes
          </Dialog.Title>
        </div>
      </div>
      <div className='flex items-center'>
        <div className="mt-4 ml-1 flex  flex-col items-start justify-items-start">
          <div className='flex items-center'>
            <input
              id={"discard"}
              name={"discard"}
              value={"discard"}
              type="radio"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={modalState.action === "discard"}
              onChange={(e) => setModalState({...modalState, action: e.target.value})}
            />
            <label
              htmlFor={"discard"}
              className="ml-2 text-sm text-gray-900"
            >
              discard
            </label>
          </div>
          <div className='flex items-center'>
            <input
              id={"save"}
              name={"save"}
              value={"save"}
              type="radio"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={modalState.action === "save"}
              onChange={(e) => {
                console.log(e.target.value);
                setModalState({...modalState, action: e.target.value})
              }}
            />
            <label
                htmlFor={"save"}
                className="ml-2 text-sm text-gray-900"
            >
              save
            </label>
          </div>
          <div className='flex items-center'>
            <input
              id={"saveas"}
              name={"saveas"}
              value={"saveas"}
              type="radio"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={modalState.action === "saveas"}
              onChange={(e) => setModalState({...modalState, action: e.target.value})}
            />
            <label
              htmlFor={"saveas"}
              className="ml-2 text-sm text-gray-900"
            >
              saveas
            </label>
          </div>
        </div>
        {
          modalState.action === "saveas" && 
          <div className="flex mt-4 ml-4 items-start justify-items-start">
            <input
              value={modalState.name}
              onChange={e => setModalState({...state, name: e.target.value})} 
              className='p-1 bg-slate-100 ' 
              placeholder={'New Map Name'}
            />
          </div>
        }
      </div>

      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <div className="px-1">
          <Button
            themeOptions={{ size: "sm", color: actionButtonClassName }}
            onClick={() => {
              if(modalState.action === 'save'){
                const currentData = symbologies.find(s => +s.symbology_id === +symbologyId);
                if(state?.symbology?.layers && currentData && !isEqual(state?.symbology, currentData?.symbology)) {
                  updateData()
                  //throttle(updateData,500)
                }
                if(state?.name && state?.name !== currentData.name) {
                  updateName()
                }
              }

              setOpen(false);
              setModalState(INITIAL_SAVE_CHANGES_MODAL_STATE);
            }}
          >
            {modalState.action} changes
          </Button>
        </div>
        <div className="px-1">
          <Button
            themeOptions={{ size: "sm", color: 'transparent' }}
            onClick={() => {
              setOpen(false);
              setModalState(INITIAL_SAVE_CHANGES_MODAL_STATE);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )

}