import React, { useMemo } from "react";

export default function View({
    source,
    activeViewId
}) {
    return (
        <div className="w-full p-5">
            <div className="flex m-3">
                <div className="justify-start w-full md:w-1/2 px-3 mb-6 md:mb-0">
                    <label className="block uppercase tracking-wide text-gray-700 text-xl font-bold mb-2">
                        Analytics Source
                    </label>
                </div>
            </div>

            <div class="relative overflow-x-auto shadow-sm sm:rounded-lg">
                <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" class="px-6 py-3">
                                Source Id
                            </th>
                            <th scope="col" class="px-6 py-3">
                                View Id
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <th scope="row" class="px-6 py-4 ">
                                {source?.source_id}
                            </th>
                            <td class="px-6 py-4">
                                {activeViewId}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
    );
}
