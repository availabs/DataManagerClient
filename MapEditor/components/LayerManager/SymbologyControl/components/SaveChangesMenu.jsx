import { useContext, useState, useRef, useMemo } from 'react'
import { SymbologyContext } from '../../../..'
import { DamaContext } from "../../../../../store"
import { Button } from "~/modules/avl-components/src";
import { Dialog } from '@headlessui/react'
import { useParams, useNavigate } from 'react-router-dom'
import get from 'lodash/get'
import isEqual from "lodash/isEqual"
import { Modal } from '../'
import { getAttributes } from "~/pages/DataManager/Collection/attributes";
import { LOCAL_STORAGE_KEY_BASE } from '../../../../'

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


function SaveChangesModal ({ open, setOpen })  {
  const cancelButtonRef = useRef(null)
  const { pgEnv, falcor, falcorCache, baseUrl } = useContext(DamaContext)
  const { state, setState, symbologies } = useContext(SymbologyContext)
  const { symbologyId } = useParams()
  const navigate = useNavigate()

  const origSymbology = useMemo(() => {
    return symbologies.find(s => +s.symbology_id === +symbologyId);
  }, [symbologies, symbologyId]);

  const initialSaveAsName = useMemo(() => {
    if(state?.name.includes("(") && state?.name.includes(")")){
      const openParenIndex = state?.name.indexOf("(");
      const closeParenIndex = state?.name.indexOf(")");
      const oldCopyNumber = parseInt(state?.name.slice(openParenIndex+1, closeParenIndex))

      if(!isNaN(oldCopyNumber)){
        const newName = state?.name.substring(0,openParenIndex+1) + (oldCopyNumber+1) + state?.name.substring(closeParenIndex)
        return newName;
      }
      else {
        return state?.name + " (1)";
      }
    }
    else {
      return state?.name + " (1)";
    }
  }, [state.name]);

  const INITIAL_SAVE_CHANGES_MODAL_STATE = {
    action: null,
    name: initialSaveAsName
  };

  const [modalState, setModalState] = useState(INITIAL_SAVE_CHANGES_MODAL_STATE)

  async function updateData() {
    await falcor.set({
      paths: [['dama', pgEnv, 'symbologies', 'byId', +symbologyId, 'attributes', 'symbology']],
      jsonGraph: { dama: { [pgEnv]: { symbologies: { byId: { 
        [+symbologyId]: { attributes : { symbology: JSON.stringify(state.symbology) }}
      }}}}}
    })
  }

  async function updateName() {
    await falcor.set({
      paths: [['dama', pgEnv, 'symbologies', 'byId', +symbologyId, 'attributes', 'name']],
      jsonGraph: { dama: { [pgEnv]: { symbologies: { byId: { 
        [+symbologyId]: { attributes : { name: state.name }}
      }}}}}
    })
  }

  const createSymbologyMap = async () => {
    const newSymbology = {
      ...state,
      name: modalState.name
    }

    const resp = await falcor.call(
      ["dama", "symbology", "symbology", "create"],
      [pgEnv, newSymbology]
    );

    const newSymbologyId = Object.keys(get(resp, ['json','dama', pgEnv , 'symbologies' , 'byId'], {}))?.[0] || false
    const newSymb = get(resp, ['json','dama', pgEnv , 'symbologies' , 'byId'],{})?.[newSymbologyId]?.attributes
    
    if(newSymbologyId) {
      setOpen(false);
      setState(newSymb);
      navigate(`${baseUrl}/mapeditor/${newSymbologyId}`)
    }
  }

  const onSubmit = () => {
    const symbologyLocalStorageKey = LOCAL_STORAGE_KEY_BASE + `${symbologyId}`;

    if(modalState.action === 'save'){
      if(state?.symbology?.layers && origSymbology && !isEqual(state?.symbology, origSymbology?.symbology)) {
        updateData()
      }
      if(state?.name && state?.name !== origSymbology.name) {
        updateName()
      }
    } else if (modalState.action === 'discard') {
      window.localStorage.setItem(symbologyLocalStorageKey, JSON.stringify(origSymbology));
      setState(origSymbology)
    }
    else if (modalState.action === "saveas") {
      window.localStorage.setItem(symbologyLocalStorageKey, JSON.stringify(origSymbology));
      createSymbologyMap();
    }

    setOpen(false);
    setModalState(INITIAL_SAVE_CHANGES_MODAL_STATE);
  }
 
  const isSymbologyModified = useMemo(() => {
    return (
      state?.symbology?.layers && 
      origSymbology && 
      !isEqual(state?.symbology?.layers, origSymbology?.symbology?.layers)
    );
  }, [state?.symbology, origSymbology]);

  const modalButtonType = modalState.action === 'discard' ? 'danger' : 'primary';
  const modalButtonClassName = !modalState.action ? "disabled:opacity-75 " : " ";

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
          {
            !isSymbologyModified ? 
              <div className="text-sm text-green-700 italic">No pending changes</div> :
              <div className="text-sm text-red-400 font-semibold">You have unsaved changes</div>
          }
        </div>
      </div>
      <div className='flex items-center capitalize'>
        <div className="mt-4 ml-1 w-32 flex  flex-col items-start justify-items-start">
          <div className='flex items-center'>
            <input
              id={"discard"}
              name={"discard"}
              value={"discard"}
              type="radio"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={modalState.action === "discard"}
              disabled={!isSymbologyModified}
              onChange={(e) => setModalState({...modalState, action: e.target.value})}
            />
            <label
              htmlFor={"discard"}
              className="ml-2 text-sm text-gray-900"
            >
              Discard
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
              disabled={!isSymbologyModified}
              onChange={(e) => {
                setModalState({...modalState, action: e.target.value})
              }}
            />
            <label
                htmlFor={"save"}
                className="ml-2 text-sm text-gray-900"
            >
              Save
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
              Save As
            </label>
          </div>
        </div>
        {
          modalState.action === "saveas" && 
          <div className="flex mt-4 ml-4 w-full items-start justify-items-start">
            <input
              value={modalState.name}
              onChange={e => setModalState({...modalState, name: e.target.value})} 
              className='p-1 w-full bg-slate-100 ' 
              placeholder={'New Map Name'}
            />
          </div>
        }
      </div>

      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <div className="px-1">
          <Button
            themeOptions={{ size: "sm", color: modalButtonType }}
            className={modalButtonClassName + " capitalize"}
            disabled={!modalState.action}
            onClick={onSubmit}
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