import {Menu, Transition} from "@headlessui/react";
import {ChevronDownIcon} from "@heroicons/react/20/solid/index.js";
import React, {Fragment} from "react";
import {classNames} from "../utils.js";
import { DAMA_HOST } from '~/config'

export function VersionDownload ({view}) {
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
                    <Menu.Items  anchor={{ to: 'bottom start', gap: '4px' }} className="absolute z-20 right-0 -mr-1 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
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