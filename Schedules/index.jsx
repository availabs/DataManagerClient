import React, { useState, useEffect, useContext, useMemo } from "react";
import { get } from "lodash";
import {
    Dialog,
    DialogPanel,
    DialogTitle,
} from "@headlessui/react";

import { DamaContext } from "~/pages/DataManager/store";
import { useFalcor } from "~/modules/avl-components/src";
import { ScalableLoading } from "~/modules/avl-components/src";
import { DAMA_HOST } from "~/config";
import { formatDate } from "../utils/macros.jsx";

const scheduleAttributes = {
    name: "name",
    cron: "cron",
    timezone: "timezone",
    data: "data",
    options: "options",
    created_on: "created_on",
    updated_on: "updated_on",
};

function cronToHumanReadable(cron) {
    const [minute, hour, dayOfMonth, month, dayOfWeek] = cron.trim().split(' ');

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    function describePart(value, type) {
        if (value === '*') return `every ${type}`;
        if (value.includes('/')) {
            const [start, step] = value.split('/');
            return `every ${step} ${type}${step > 1 ? 's' : ''}${start !== '*' ? ` starting at ${start}` : ''}`;
        }
        if (value.includes(',')) {
            const parts = value.split(',').map(v => type === 'month' ? monthNames[+v - 1] :
                type === 'day of week' ? dayNames[+v % 7] :
                    v);
            return parts.join(', ');
        }
        if (type === 'month') return monthNames[+value - 1];
        if (type === 'day of week') return dayNames[+value % 7];
        return value;
    }

    const minuteDesc = describePart(minute, 'minute');
    const hourDesc = describePart(hour, 'hour');
    const domDesc = describePart(dayOfMonth, 'day');
    const monthDesc = describePart(month, 'month');
    const dowDesc = describePart(dayOfWeek, 'day of week');

    let timeDesc = (minute === '*' && hour === '*') ? 'every minute' :
        (hour === '*' ? `at minute ${minute} past every hour` :
            (minute === '*' ? `every minute during hour ${hour}` :
                `at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`));

    let dateDesc = '';
    if (dayOfMonth !== '*' && dayOfWeek !== '*') {
        dateDesc = `on the ${domDesc} of the month and every ${dowDesc}`;
    } else if (dayOfMonth !== '*') {
        dateDesc = `on the ${domDesc} of the month`;
    } else if (dayOfWeek !== '*') {
        dateDesc = `every ${dowDesc}`;
    } else {
        dateDesc = 'every day';
    }

    if (month !== '*') {
        dateDesc += ` in ${monthDesc}`;
    }

    return `${timeDesc}, ${dateDesc}`;
}

const types = ["npmrds_raw", "transcom"];
function ListSchedules({
}) {
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [removeDamaQueueName, setRemoveDamaQueueName] = React.useState(null);
    const { pgEnv, falcor, falcorCache } = useContext(DamaContext);

    const [schedules, setSchedules] = useState([]);

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

    useEffect(() => {
        const derivedSchedules = types.reduce((acc, cur) => {
            acc.push(...Object.values(get(falcorCache, [
                "dama", pgEnv, "schedule", "type", cur, "dataByIndex"
            ], {})).map(v => {
                return Object.entries(v).reduce((out, [k, v]) => {
                    out[k] = typeof v.value !== 'undefined' ? v.value : v;
                    return out;
                }, {});
            }));
            return acc;
        }, []);
        setSchedules(derivedSchedules);
    }, [falcorCache, pgEnv]);

    const headers = ['name', 'label', 'type', 'cron', 'timezone', 'options', 'created_on', " "];

    const removeSchedule = async (removeDamaQueueName, pgEnv) => {
        const publishData = {
            dama_task_queue_name: removeDamaQueueName,
            pgEnv
        };

        setLoading(true);
        try {
            const res = await fetch(
                `${DAMA_HOST}/dama-admin/${pgEnv}/unschedule`,
                {
                    method: "POST",
                    body: JSON.stringify(publishData),
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            const publishFinalEvent = await res.json();
            if (publishFinalEvent && publishFinalEvent.isUnScheduled) {
                // refresh logic here
                setSchedules(schedules.filter(s => s.name !== removeDamaQueueName));
            }
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    };

    const removeQueueLabel = useMemo(() => {
      const schedToRemove = schedules.find(
        (sched) => sched.name === removeDamaQueueName
      );
      return (
        schedToRemove?.data?.initial_event?.payload?.name || removeDamaQueueName
      );
    }, [removeDamaQueueName]);
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

                            {schedules.map((item, index) => {
                                const itemLabel = item?.data?.initial_event?.payload?.name || "N/A";
                                return (
                                <tr key={index}>
                                    <td
                                        key={`${item?.name}`}
                                        className="py-2 px-4 border-b"
                                    >
                                        {item?.name && item?.name.split(':')[1]}
                                    </td>
                                    <td
                                        key={`item_label_${index}`}
                                        className="py-2 px-4 border-b"
                                    >
                                        {itemLabel}
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
                                        {cronToHumanReadable(item?.cron)}
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
                                        {/*{moment(item?.created_on).format('YYYY-MM-DD HH:mm:ss')}*/}
                                        {formatDate(item?.created_on)}
                                    </td>

                                    <td
                                        key={`${Math.random()}`}
                                        className="py-2 px-4 border-b"
                                    >
                                        <button
                                            className="cursor-pointer relative align-middle select-none font-sans font-medium text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none w-10 max-w-[40px] h-10 max-h-[40px] rounded-lg text-xs bg-red-500 text-white shadow-md shadow-red-900/10 hover:shadow-lg hover:shadow-red-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                                            type="button"
                                            onClick={() => {
                                                setRemoveDamaQueueName(item?.name);
                                                setShowDeleteModal(true);
                                            }}
                                        >
                                            <span className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                                                <i
                                                    className="fad fa-trash"
                                                    aria-hidden="true"
                                                ></i>
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                            )})}
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

            <Dialog
                as="div"
                className="relative z-50"
                open={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
            >
                <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                    <span
                        className="inline-block h-screen align-middle"
                        aria-hidden="true"
                    >
                        &#8203;
                    </span>
                    <DialogPanel>
                        <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                            <DialogTitle
                                as="h3"
                                className="text-lg font-medium leading-6 text-gray-900"
                            >
                                Remove Schedule
                            </DialogTitle>

                            <div className="relative p-2 flex-auto">
                                <div className="p-4 text-sm" role="alert">
                                    <span className="font-medium">
                                        Are you sure you want to remove {removeQueueLabel}?
                                    </span>
                                </div>
                            </div>
                            <div className="">
                                <button
                                    type="button"
                                    className="cursor-pointer inline-flex justify-center px-4 py-2 text-sm text-red-900 bg-red-100 border border-transparent rounded-md hover:bg-red-200 duration-300"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="cursor-pointer ml-3 inline-flex justify-center px-4 py-2 text-sm text-green-900 bg-green-100 border border-transparent rounded-md hover:bg-green-200 duration-300"
                                    onClick={async () => {
                                        await removeSchedule(removeDamaQueueName, pgEnv);
                                        setShowDeleteModal(false);
                                    }}
                                >
                                    {loading ? (
                                        <div style={{ display: "flex" }}>
                                            <div className="mr-2">Deleting...</div>
                                            <ScalableLoading scale={0.25} color={"#fefefe"} />
                                        </div>
                                    ) : (
                                        "Yes"
                                    )}
                                </button>
                            </div>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
}

export default ListSchedules;
