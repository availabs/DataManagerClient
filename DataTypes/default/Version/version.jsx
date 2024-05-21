import React, { Fragment, useEffect, useState, useContext, useRef, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import get from 'lodash/get'
import { DamaContext } from "../../../store";
import { ChevronDownIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/20/solid'
import { DAMA_HOST } from '~/config'
import { Menu, Transition } from '@headlessui/react'
import {getData, classNames} from "./utils.js";
import {RenderDeps} from "./components/RenderDeps.jsx";
import {RenderDependents} from "./components/RenderDependents.jsx";
import {Edit} from "./components/Edit.jsx";
import {ViewControls} from "./components/ViewControls.jsx";
import {VersionEditor} from "./components/VersionEditor.jsx";


export default function Version() {
  const { viewId,sourceId } = useParams();
  const { pgEnv, baseUrl, falcor, falcorCache} = useContext(DamaContext);

  useEffect(() => {
    getData({ falcor, pgEnv, viewId });
  }, [viewId, pgEnv, falcor]);

  const dependencies = get(falcorCache, ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", viewId, "value"], { dependencies: [] }),
    dependents = get(falcorCache, ["dama", pgEnv, "views", "byId", viewId, "dependents", "value"], []),
    srcMeta = get(falcorCache, ["dama", pgEnv, "sources", "byId"], {}),
    viewMeta = get(falcorCache, ["dama", pgEnv, "views", "byId"], {}),
    view = get(falcorCache, ["dama", pgEnv, "views", "byId", viewId, 'attributes'], {}),
      srcName = get(falcorCache, ["dama", pgEnv, "sources", "byId", sourceId, "attributes", "name"], '');

  const version = typeof view?.['version'] === 'object' ? null : view?.['version']

  return (
    <div className="overflow-hidden flex flex-col md:flex-row">
        <div className='flex-1'>
          <div className='flex justify-between'>
            <div  className="flex-1 sm:px-6">
              <div className="flex flex-col sm:flex-row justify-between overflow-hidden sm:mt-0 sm:col-span-3">
                <div className='py-2 px-2 text-2xl text-gray-700 font-medium '>{ srcName } - { version || viewId}</div>
              </div>

              <div>
                <VersionEditor view={view} baseUrl={baseUrl} showControls={true} />

                {dependencies?.dependencies && dependencies?.dependencies?.length > 0 ?
                <RenderDeps
                  viewId={viewId}
                  dependencies={dependencies}
                  srcMeta={srcMeta}
                  viewMeta={viewMeta}
                  baseUrl={baseUrl}
                /> : ''}

                {dependents && dependents.length > 0 ?
                <RenderDependents
                  viewId={viewId}
                  dependents={dependents}
                  srcMeta={srcMeta}
                  viewMeta={viewMeta}
                  baseUrl={baseUrl}
                /> : ''}
              </div>
          </div>

        </div>
      </div>
    </div>
  );
}
