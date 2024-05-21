import get from "lodash/get.js";

export const getValue = value => typeof value === 'object' ? (value?.value ? getValue(value.value) : 'N/A') : value;

export function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export async function getData({ falcor, pgEnv, viewId }) {
    const dependenciesData = await falcor.get(["dama", pgEnv, "viewDependencySubgraphs", "byViewId", viewId]);
    const dependentsData = await falcor.get(["dama", pgEnv, "views", "byId", viewId, "dependents"]);


    // collect all dependency sources, fetch meta for them.
    const tmpSrcIds = [];
    const tmpViewIds = [];
    get(dependenciesData, ["json", "dama", pgEnv, "viewDependencySubgraphs", "byViewId", viewId, "dependencies"], [])
        .forEach(d => {
            tmpSrcIds.push(
                d.source_id
            );
            tmpViewIds.push(
                d.view_id
            );
        });

    get(dependentsData, ["json", "dama", pgEnv, "views", "byId", viewId, "dependents"], [])
        .forEach(d => {
            tmpSrcIds.push(
                d.source_id
            );
            tmpViewIds.push(
                d.view_id
            );
        });

    await falcor.get(["dama", pgEnv, "sources", "byId", tmpSrcIds, "attributes", ["type", "name"]]);

    await falcor.get(["dama", pgEnv, "views", "byId", [viewId,...tmpViewIds], "attributes", ["version", "metadata", "_modified_timestamp", "last_updated"]]);
}