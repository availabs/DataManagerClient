import {Link, useParams} from "react-router-dom";
import React, {useContext, useEffect, useMemo, useState} from "react";
import {DamaContext} from "../../../../store/index.js";
import get from "lodash/get.js";
import {CheckCircleIcon, XCircleIcon} from "@heroicons/react/20/solid/index.js";
import { Input, Button, Modal } from "~/modules/avl-components/src"
import { DAMA_HOST } from '~/config'
const OUTPUT_FILE_TYPES = [
    "CSV",
    "ESRI Shapefile",
    "GeoJSON",
    "GPKG",
];
const INITIAL_MODAL_STATE = {
    open: false,
    loading: false,
    fileTypes: [],
    columns: [],
    enableGroupedBy: false,
    groupedByColumn: ""
}

const DownloadModalCheckbox = ({ inputName, checked, onChange }) => {
    return (
        <div className="mt-2 flex items-center">
            <input
                id={inputName}
                name={inputName}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={checked}
                onChange={() => onChange(inputName)}
            />
            <label htmlFor={inputName} className="ml-2 text-sm text-gray-900">
                {inputName}
            </label>
        </div>
    );
};

const DownloadModalGroupedBy = ({ children }) => {
    return (
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <div className="flex justify-between items-center w-1/2 text-md leading-6 text-gray-900">
                <div className="text-center h-fit">Split data files</div>
            </div>
            <div className="flex mt-2 text-sm items-center">
                Split up data based on a specified column
            </div>
            {children}
        </div>
    );
};

const DownloadModalGroupColumnSelect = ({ options, modalState, onChange }) => {
    return (
        <div className="mt-2 flex items-center">
            <div className="flex mt-2 text-sm items-center">
                Output will have 1 file per distinct value in:
            </div>
            <select
                className="w-full bg-blue-100 rounded mr-2 px-1 flex text-sm"
                value={modalState}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map((option, i) => (
                    <option key={i} className="ml-2 truncate " value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
};

const DownloadModalGroupByToggle = ({ onChange, modalState }) => {
    return (
        <div className="mt-3 text-center sm:mt-0 sm:text-left">
            <div className="mt-2 flex items-center">
                <input
                    id={"enableGroupedBy"}
                    name={"enableGroupedBy"}
                    value={true}
                    type="radio"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={modalState}
                    onChange={() => onChange(true)}
                />
                <label
                    htmlFor={"enableGroupedBy"}
                    className="ml-2 text-sm text-gray-900"
                >
                    Yes
                </label>
                <input
                    id={"disableGroupedBy"}
                    name={"disableGroupedBy"}
                    value={true}
                    type="radio"
                    className="h-4 w-4 ml-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={!modalState}
                    onChange={() => onChange(false)}
                />
                <label
                    htmlFor={"enableGroupedBy"}
                    className="ml-2 text-sm text-gray-900"
                >
                    No
                </label>
            </div>
        </div>
    );
};

const DownloadModalCheckboxGroup = ({
                                        options,
                                        modalState,
                                        onChange,
                                        title,
                                    }) => {
    return (
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left max-h-[700px] overflow-y-auto">
            <div className="flex w-full justify-between items-center p-2 w-1/2 text-md leading-6 text-gray-900">
                <div className="text-center h-fit">{title}:</div>
                <div>
                    <Button
                        themeOptions={{ size: "sm" }}
                        onClick={() => {
                            if (modalState.length === options.length) {
                                onChange([]);
                            } else {
                                onChange(options);
                            }
                        }}
                    >
                        Toggle All
                    </Button>
                </div>
            </div>
            <div className="flex mt-2 text-sm items-center">
                One or more must be selected
                {modalState.length > 0 ? (
                    <CheckCircleIcon className="ml-2 text-green-700 h-4 w-4" />
                ) : (
                    <XCircleIcon className="ml-2 text-red-700 h-4 w-4" />
                )}
            </div>
            {options?.map((option) => (
                <DownloadModalCheckbox
                    key={`${option}_checkbox`}
                    inputName={option}
                    checked={modalState.includes(option)}
                    onChange={onChange}
                />
            ))}
        </div>
    );
};

export function ViewControls ({view}) {
    const { viewId,sourceId } = useParams();
    const { pgEnv, baseUrl, user, falcorCache} = useContext(DamaContext);

    const [modalState, setModalState] = useState(INITIAL_MODAL_STATE);

    const setFileTypes = (fileType) => {
        let newFileTypes;
        if(Array.isArray(fileType)){
            newFileTypes = fileType;
        }
        else if(modalState.fileTypes.includes(fileType)){
            newFileTypes = modalState.fileTypes.filter(ft => ft !== fileType)
        }
        else{
            newFileTypes = [...modalState.fileTypes]
            newFileTypes.push(fileType);
        }

        setModalState({...modalState, fileTypes: newFileTypes});
    }
    const setColumns = (columnName) => {
        let newColumns;
        if(Array.isArray(columnName)){
            newColumns = columnName;
        }
        else if(modalState.columns.includes(columnName)){
            newColumns = modalState.columns.filter(colName => colName !== columnName)
        }
        else{
            newColumns = [...modalState.columns];
            newColumns.push(columnName);
        }

        setModalState({...modalState, columns: newColumns})
    }
    const setModalOpen = (newModalOpenVal) => setModalState({...modalState, open: newModalOpenVal});
    const setEnableGroupedBy = (newEnableValue) => setModalState({...modalState, enableGroupedBy: newEnableValue});
    const setGroupedByColumn = (newGroupColumn) => setModalState({...modalState, groupedByColumn: newGroupColumn})


    const sourceDataColumns = useMemo(() => {
        let sourceColumns = get(falcorCache, [
            "dama",
            pgEnv,
            "sources",
            "byId",
            view.source_id,
            "attributes",
            "metadata",
            "value",
        ],[]);
        // console.log('source columnns', sourceColumns, view.source_id, falcorCache)
        sourceColumns = sourceColumns?.columns ? sourceColumns.columns : sourceColumns;
        return Array.isArray(sourceColumns) ? sourceColumns.map(d => d.name) : []
        // return []
    }, [falcorCache, view]);

    //Only used after successful download creation
    const defaultModalState = useMemo(() => {
        if (sourceDataColumns) {
            return { ...INITIAL_MODAL_STATE, columns: sourceDataColumns };
        } else {
            return INITIAL_MODAL_STATE;
        }
    }, [sourceDataColumns]);

    //Initial modal state should have columns checked
    //Should only fire once, when we get the source metadata back from API
    useEffect(() => {
        if (sourceDataColumns) {
            setModalState({ ...modalState, columns: sourceDataColumns });
        }
    }, [sourceDataColumns]);

    const createDownload = () => {
        const runCreate = async () => {
            try {
                const createData = {
                    source_id: sourceId,
                    view_id: viewId,
                    fileTypes: modalState.fileTypes,
                    columns: modalState.columns,
                    user_id: user.id,
                    email: user.email,
                    groupedByColumn: modalState.groupedByColumn
                };

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
                setModalState(defaultModalState);
            } catch (err) {
                console.log(err)
                setModalState({...modalState, loading: false, open: true});
            }
        }
        runCreate();
    }

    const linkClass = 'w-full flex-1 text-center border shadow p-2 font-medium rounded-md hover:text-white'
    return (
        <div className="w-72 px-5">
            {user.authLevel >= 10 ? (
                <div className="w-full flex flex-col p-1">
                    <button
                        className={`${linkClass} bg-blue-300 hover:bg-blue-600 mb-1`}
                        onClick={() => {
                            setModalState({...modalState, open: true});
                        }}
                    >
                        <i className={'fa fa-download'}/> Create Download
                    </button>
                    <Link
                        className={`${linkClass} bg-red-300 border-red-200 hover:bg-red-600`}
                        to={`${baseUrl}/source/${sourceId}/versions/${viewId}/delete`}
                    >
                        <i className="fad fa-trash"/> Delete View
                    </Link>
                </div>
            ) : (
                ""
            )}
            <Modal
                open={modalState.open}
                setOpen={setModalOpen}
                themeOptions={{size:"large"}}
            >
                <div className="flex items-center">
                    <div
                        className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
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
                <div className={"pl-10 grid grid-cols-3"}>
                    <DownloadModalCheckboxGroup
                        title={"File Types"}
                        options={OUTPUT_FILE_TYPES}
                        modalState={modalState.fileTypes}
                        onChange={setFileTypes}
                    />
                    <DownloadModalCheckboxGroup
                        title={"Columns"}
                        options={sourceDataColumns}
                        modalState={modalState.columns}
                        onChange={setColumns}
                    />
                    <DownloadModalGroupedBy >
                        <DownloadModalGroupByToggle
                            onChange={setEnableGroupedBy}
                            modalState={modalState.enableGroupedBy}
                        />
                        {modalState.enableGroupedBy && (
                            <DownloadModalGroupColumnSelect
                                options={modalState.columns}
                                modalState={modalState.groupedByColumn}
                                onChange={setGroupedByColumn}
                            />
                        )}
                    </DownloadModalGroupedBy>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        disabled={
                            modalState.loading ||
                            modalState.fileTypes.length === 0 ||
                            modalState.columns.length === 0
                        }
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
                    >
                        Cancel
                    </button>
                </div>
            </Modal>
        </div>
    );
}