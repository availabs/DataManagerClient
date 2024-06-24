import { useContext, useState, Fragment, useRef } from 'react'
import { SymbologyContext } from '../../../..'
import { DamaContext } from "../../../../../store"

import { Menu, Transition, Tab, Dialog } from '@headlessui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { MenuDots , Plus} from '../../../icons'

import { SelectSymbology } from '../../SymbologySelector';
import get from 'lodash/get'


export function SymbologyControlMenu({ button }) {
  const { state, setState  } = useContext(SymbologyContext);

  return (
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button>
          {button}
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
          <Menu.Items className='absolute right-0 w-36 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none'>
            <div className=" py-1 ">
              {/*<Menu.Item>
                {({ active }) => (
                  <div className={`${
                      active ? 'bg-blue-50 ' : ''
                    } group flex w-full items-center text-slate-600 rounded-md px-2 py-2 text-sm`}>Zoom to Fit</div>
                )}
              </Menu.Item>*/}
              <Menu.Item>
                {({ active }) => (
                  <div 
                    className={`${
                      active ? 'bg-pink-50 ' : ''
                    } group flex w-full items-center text-red-400 rounded-md px-2 py-2 text-sm`}
                    onClick={() => {
                      // setState(draft => {
                      //   delete draft.symbology.layers[layer.id]
                      //   Object.values(draft.symbology.layers)
                      //     .sort((a, b) => a.order - b.order)
                      //     .forEach((l,i) => l.order = i)
                      // })
                    }}
                  >Delete</div>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
  )
} 