import React, {useContext, useState} from "react";
import {DamaContext} from "../../../../store/index.js";
import {Link} from "react-router";
import get from "lodash/get.js";

export const RenderDependents = ({ dependents = [], viewId, srcMeta, viewMeta }) => {
    const [show, setShow] = useState(false);
    const { baseUrl } = useContext(DamaContext);
    return (
        <div className="w-full my-2">
            <div className={"w-full bg-blue-100 hover:bg-blue-200 text-lg rounded-md p-2"}
                 onClick={e => setShow(!show)}>
                <i className={`fa fa-angle-${show ? 'down' : 'right'}`}/> Dependents
            </div>

            <div className={show ? 'block shadow' : 'hidden'}>
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
                <div className="sm:divide-y sm:divide-gray-200">
                    {
                        dependents
                            .map((d, i) => (
                                    <div key={`${i}_0`} className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                                        <div key={`${i}_1`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-midivle">
                                            <Link to={`${baseUrl}/source/${d.source_id}/overview`}>
                                                {get(srcMeta, [d.source_id, "attributes", "name"])}
                                            </Link>
                                        </div>

                                        <div key={`${i}_2`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-midivle">
                                            <Link to={`${baseUrl}/source/${d.source_id}/overview`}>
                                                {get(srcMeta, [d.source_id, "attributes", "type"])}
                                            </Link>
                                        </div>

                                        <div key={`${i}_3`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-midivle">
                                            <Link to={`${baseUrl}/source/${d.source_id}/versions/${d.view_id}`}>
                                                {get(viewMeta, [d.view_id, "attributes", "version"])}
                                            </Link>
                                        </div>

                                        <div key={`${i}_4`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-midivle">
                                            <Link to={`${baseUrl}/source/${d.source_id}/versions/${d.view_id}`}>
                                                {typeof get(viewMeta, [d.view_id, "attributes", "_modified_timestamp", "value"]) === "object" ? "" :
                                                    get(viewMeta, [d.view_id, "attributes", "_modified_timestamp", "value"])
                                                }
                                            </Link>
                                        </div>

                                        <div key={`${i}_5`} className="mt-1 text-sm text-red-400 sm:mt-0">
                                        <span className={"float-right italic"}> {
                                            get(viewMeta, [d.view_id, "attributes", "metadata", "value", "authoritative"]) === "true" ? ""
                                                : "outdated"
                                        }</span>
                                        </div>
                                    </div>

                                )
                            )
                    }
                </div>
            </div>
        </div>
    );
};