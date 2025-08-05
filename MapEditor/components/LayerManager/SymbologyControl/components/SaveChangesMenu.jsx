import { useContext, useState, useRef, useMemo, useEffect } from 'react'
import { SymbologyContext } from '../../../..'
import { DamaContext } from "../../../../../store"
import { Button } from "~/modules/avl-components/src";
import { Dialog } from '@headlessui/react'
import { useParams, useNavigate } from 'react-router'
import get from 'lodash/get'
import isEqual from "lodash/isEqual"
import { Modal } from '../'
import { LOCAL_STORAGE_KEY_BASE } from '../../../../'
//import { diff, addedDiff, deletedDiff, updatedDiff, detailedDiff } from 'deep-object-diff';
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

export const generateDefaultName = (oldName) => {
  if(oldName.includes("(") && oldName.includes(")")){
    const openParenIndex = oldName.indexOf("(");
    const closeParenIndex = oldName.indexOf(")");
    const oldCopyNumber = parseInt(oldName.slice(openParenIndex+1, closeParenIndex))

    if(!isNaN(oldCopyNumber)){
      const newName = oldName.substring(0,openParenIndex+1) + (oldCopyNumber+1) + oldName.substring(closeParenIndex)
      return newName;
    }
    else {
      return oldName + " (1)";
    }
  }
  else {
    return oldName + " (1)";
  }
}


function SaveChangesModal ({ open, setOpen })  {
  const cancelButtonRef = useRef(null)
  const { pgEnv, falcor, falcorCache, baseUrl } = useContext(DamaContext)
  const { state, setState, symbologies } = useContext(SymbologyContext)
  const { symbologyId } = useParams()
  const navigate = useNavigate()

  const dbSymbology = useMemo(() => {
    return symbologies.find(s => +s.symbology_id === +symbologyId);
  }, [symbologies, symbologyId]);

  const INITIAL_SAVE_CHANGES_MODAL_STATE = {
    action: null,
    name: generateDefaultName(state?.name)
  };

  const [modalState, setModalState] = useState(INITIAL_SAVE_CHANGES_MODAL_STATE)

  useEffect(() => {
    setModalState({...modalState, name: generateDefaultName(state?.name)})
  }, [state.name])

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
    let newSymbology = JSON.stringify({
      ...state,
      name: modalState.name
    });

    Object.keys(state.symbology.layers).forEach(oldLayerId => {
      const newLayerId = Math.random().toString(36).replace(/[^a-z]+/g, '');
      newSymbology = newSymbology.replaceAll(oldLayerId, newLayerId)
    });
    
    const resp = await falcor.call(
      ["dama", "symbology", "symbology", "create"],
      [pgEnv, JSON.parse(newSymbology)]
    );

    const newSymbologyId = Object.keys(get(resp, ['json','dama', pgEnv , 'symbologies' , 'byId'], {}))?.[0] || false
    const newSymb = get(resp, ['json','dama', pgEnv , 'symbologies' , 'byId'],{})?.[newSymbologyId]?.attributes
    
    if(newSymbologyId) {
      await falcor.invalidate(
        ["dama", pgEnv, "symbologies", "byIndex"],
        ["dama", pgEnv, "symbologies", "length"]
      );

      setOpen(false);
      setModalState({ action: null, name:'' });
      navigate(`${baseUrl}/mapeditor/${newSymbologyId}`)
      setState(newSymb);
    }
  }

  const onSubmit = () => {
    const symbologyLocalStorageKey = LOCAL_STORAGE_KEY_BASE + `${symbologyId}`;

    if(modalState.action === 'save'){
      if(state?.symbology?.layers && dbSymbology && !isEqual(state?.symbology, dbSymbology?.symbology)) {
        updateData()
      }
      if(state?.name && state?.name !== dbSymbology?.name) {
        updateName()
      }
    } else if (modalState.action === 'discard') {
      window.localStorage.setItem(symbologyLocalStorageKey, JSON.stringify(dbSymbology));
      setState(dbSymbology)
    }
    else if (modalState.action === "saveas") {
      window.localStorage.setItem(symbologyLocalStorageKey, JSON.stringify(dbSymbology));
      createSymbologyMap();
    }

    setOpen(false);
    setModalState(INITIAL_SAVE_CHANGES_MODAL_STATE);
  }
 
  const isSymbologyModified = useMemo(() => {
    // console.log("diff::",detailedDiff(state, dbSymbology));
    // console.log({state, dbSymbology})
    return (
      state?.symbology?.layers && 
      dbSymbology && 
      !isEqual(state?.symbology?.layers, dbSymbology?.symbology?.layers)
    ) || state?.name !== dbSymbology?.name;
  }, [state, dbSymbology]);

  const modalButtonType = !modalState.action
    ? "white"
    : modalState.action === "discard"
    ? "danger"
    : "primary";
  const modalButtonClassName = !modalState.action ? "disabled:opacity-75 pointer-events-none	" : " ";

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
            className={modalButtonClassName}
            disabled={!modalState.action}
            onClick={onSubmit}
          >
            {SAVE_CHANGES_BUTTON_LABEL[modalState.action] ?? 'Save ...'}
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

const SAVE_CHANGES_BUTTON_LABEL = {
  'save': "Save Changes",
  'saveas': "Save and Open",
  'discard': "Discard Changes"
}