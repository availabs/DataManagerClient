import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {Button} from '~/modules/avl-components/src'
import { DamaContext } from "../../../../store"

import { Modal } from "../SymbologyControl";
import { Dialog } from '@headlessui/react'

import { SymbologiesList } from './SymbologiesList';
import { CreateSymbologyModal } from '../SymbologyControl';

const DEFAULT_MODAL_STATE = {
  open: false,
  symbologyId: null
};

export const SelectSymbology = ({ button, className }) => {
  const { baseUrl } = React.useContext(DamaContext);
  const [modalState, setModalState] = useState(DEFAULT_MODAL_STATE);
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <div
        className={className}
        onClick={() => setModalState({ ...modalState, open: !modalState.open })}
      >
        {button}
      </div>
      <CreateSymbologyModal open={showCreate} setOpen={setShowCreate}/>
      <Modal
        open={modalState.open}
        setOpen={() => setModalState({ ...modalState, open: !modalState.open })}
        width={"w-[1200px]"}
      >
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
            <i
              className="fad fa-layer-group text-blue-600"
              aria-hidden="true"
            />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
            <Dialog.Title
              as="h3"
              className="text-base font-semibold leading-6 text-gray-900"
            >
              Select Symbology
            </Dialog.Title>
          </div>
        </div>
        <div className="mt-2 ">
          <SymbologiesList
            selectedSymbologyId={modalState.symbologyId}
            setSelectedSymbologyId= {
              (newValue) => {
                setModalState({ ...modalState, symbologyId: newValue })
              }
            }
            />
        </div>
        <div className="mt-5 sm:mt-4 sm:flex justify-end">
          <div className="mr-1">
            <Button
              type="button"
              themeOptions={{ color: "cancel" }}
              className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={() => setModalState(DEFAULT_MODAL_STATE)}
            >
              Cancel
            </Button>
          </div>
          <div>
            <Button
              type="button"
              themeOptions={
                modalState.symbologyId ? { color: "primary" } : { color: "transparent" }
              }
              disabled={!modalState.symbologyId}
              className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={() => {
                navigate(`${baseUrl}/mapeditor/${modalState.symbologyId}`)
                setModalState(DEFAULT_MODAL_STATE)
              }}
            >
              Open Symbology
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
