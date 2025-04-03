import React, { useMemo, useEffect, useContext } from "react";
import { get } from "lodash";
import moment from "moment";

import { DamaContext } from "~/pages/DataManager/store";
import { useFalcor } from "~/modules/avl-components/src";

const scheduleAttributes = {
    name: "name",
    cron: "cron",
    timezone: "timezone",
    data: "data",
    options: "options",
    created_on: "created_on",
    updated_on: "updated_on",
};

const types = ["npmrds_raw", "transcom"];
function ListSchedules({
}) {
    const { pgEnv } = useContext(DamaContext);
    const { falcor, falcorCache } = useFalcor();

    useEffect(() => {
        const fetchData = async () => {
            const lengthPath = ["dama", pgEnv, "schedule", "type", types, "length"];
            const resp = await falcor.get(lengthPath);

            types.forEach(async (t) => {
                await falcor.get([
                    "dama",
                    pgEnv,
                    "schedule",
                    "type",
                    t,
                    "dataByIndex",
                    { from: 0, to: get(resp.json, ["dama", pgEnv, "schedule", "type", t, "length"], 0) - 1 },
                    Object.values(scheduleAttributes)
                ]);
            })
        };

        fetchData();
    }, [falcor]);

    const schedules = useMemo(() => {
        return types.reduce((acc, cur) => {
            acc.push(...Object.values(get(falcorCache, [
                "dama",
                pgEnv,
                "schedule",
                "type",
                cur,
                "dataByIndex"], {}))
                .map(v =>
                    Object.entries(v).reduce((out, attr) => {
                        const [k, v] = attr
                        typeof v.value !== 'undefined' ?
                            out[k] = v?.value :
                            out[k] = v
                        return out
                    }, {})
                ))

            return acc;
        }, []);
    }, [falcorCache, pgEnv]);

    const headers = ['name', 'type', 'cron', 'timezone', 'options', 'created_on'];

    return (
        <div className="w-full p-5">
            <div className="flex m-3">
                <div className="justify-start w-full md:w-1/2 px-3 mb-6 md:mb-0">
                    <label className="block uppercase tracking-wide text-gray-700 text-xl font-bold mb-2">
                        Schedules
                    </label>
                </div>

                <div className="mr-0">
                </div>
            </div>

            {schedules.length ? (
                <div className="overflow-x-auto px-5 py-3">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr>
                                {headers.map((key) => (
                                    <th
                                        key={key}
                                        className="py-2 px-4 bg-gray-200 text-left border-b"
                                    >
                                        {key}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>

                            {schedules.map((item, index) => (
                                <tr key={index}>
                                    <td
                                        key={`${item?.name}`}
                                        className="py-2 px-4 border-b"
                                    >
                                        {item?.name}
                                    </td>
                                    <td
                                        key={`${item?.data?.type}_${index}`}
                                        className="py-2 px-4 border-b"
                                    >
                                        {item?.data?.type}
                                    </td>
                                    <td
                                        key={`${item?.cron}`}
                                        className="py-2 px-4 border-b"
                                    >
                                        {item?.cron}
                                    </td>
                                    <td
                                        key={`${item?.timezone}`}
                                        className="py-2 px-4 border-b"
                                    >
                                        {item?.timezone}
                                    </td>
                                    <td
                                        key={`${item?.options}_${index}`}
                                        className="py-2 px-4 border-b"
                                    >
                                        <pre>{JSON.stringify(item?.options, null, 3)}</pre>
                                    </td>
                                    <td
                                        key={`${item?.created_on}`}
                                        className="py-2 px-4 border-b"
                                    >
                                        {moment(item?.created_on).format('YYYY-MM-DD HH:mm:ss')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div
                    className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-red-400"
                    role="alert"
                >
                    <span className="font-medium">
                        No Schedules available
                    </span>
                </div>
            )}
        </div>
    );
}

export default ListSchedules;
