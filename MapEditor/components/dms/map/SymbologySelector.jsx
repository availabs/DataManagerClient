import React, {useContext, useEffect, useMemo, useState} from "react";
import {get} from "lodash-es";
import {getAttributes, SymbologyAttributes} from "./utils.js";
import FilterableSearch from "./tmp-cache-files/FilterableSearch.jsx";
import {MapContext} from "./MapComponent.jsx";

export const SymbologySelector = () => {
    const { state, setState, falcor, pgEnv } = useContext(MapContext);
    const [falcorCache, setFalcorCache] = useState(falcor.getCache());
    useEffect(() => {
        async function fetchData() {
            const lengthPath = ["dama", pgEnv, "symbologies", "length"];
            const resp = await falcor.get(lengthPath);

            await falcor.get([
                "dama", pgEnv, "symbologies", "byIndex",
                { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
                "attributes", Object.values(SymbologyAttributes)
            ]);
            setFalcorCache(falcor.getCache());
        }
        fetchData();
    }, [falcor, pgEnv]);

    const symbologies = useMemo(() => {
        return Object.values(get(falcorCache, ["dama", pgEnv, "symbologies", "byIndex"], {}))
            .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
    }, [falcorCache?.dama, pgEnv]);

    const activeSym = Object.values(state?.symbologies)[0]?.symbology_id;
    // useEffect(() => {
    //     const activeSymbology = state.symbologies?.[activeSym];
    //     const existingSym = symbologies.find(d => +d.symbology_id === +activeSym);
    //     console.log('?????????????????/', activeSymbology, existingSym)
    //     if(existingSym && !isEqual(activeSymbology, existingSym)){
    //         setState(draft => {
    //             draft.symbologies = {[activeSym.symbology_id]: {...existingSym, isVisible: true}}
    //         })
    //     }
    // }, [symbologies]);

    const symOptions = symbologies.map(sym => ({label: sym.name, key: sym.symbology_id}));
    const layerOptions = Object.values(state.symbologies?.[activeSym]?.symbology?.layers || {}).map((layer, i) => ({label: layer.name?.length && layer.name !== ' ' ? layer.name : `layer - ${i+1}`, key: layer.id}));

    return (
        <div className={'flex w-full bg-white items-center'}>
            <label className={'p-1'}>Symbology: </label>
            <div className={'w-1/2'}>
                <FilterableSearch
                    className={'flex-row-reverse'}
                    placeholder={'Search...'}
                    options={symOptions}
                    value={activeSym}
                    onChange={e => {
                        const sym = symbologies.find(f => +f.symbology_id === +e) || {};
                        if(!sym?.symbology_id) return;
                        console.log('[sym', sym, e, symOptions)
                        setState(draft => {
                            draft.symbologies = {[e]: {...sym, isVisible: true}}
                        })
                    }}
                />
            </div>
            <label className={'p-1'}>Layer: </label>
            <div className={'w-1/2'}>
                <FilterableSearch
                    className={'flex-row-reverse'}
                    placeholder={'Search...'}
                    options={layerOptions}
                    value={state.symbologies?.[activeSym]?.symbology?.activeLayer}
                    onChange={e => {
                        const currLayer = state.symbologies?.[activeSym].symbology[e] || {};
                        console.log('currView', state.symbologies, e)
                        if(currLayer) {
                            setState(draft => {
                                draft.symbologies[activeSym].symbology.activeLayer = e;
                            })
                        }
                    }}
                />
            </div>
        </div>
    )
}