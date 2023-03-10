import get from "lodash.get";

export const formatDate = (dateString) => {
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  };
  return dateString ? new Date(dateString).toLocaleDateString(undefined, options) : ``;
};
export const RenderVersions = ({value, setValue, versions, type}) => {
  console.log('versions', versions)
  return (
    <div  className='flex justify-between group'>
      <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt className="text-sm font-medium text-gray-500 py-5">Select {type} version: </dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          <div className='pt-3 pr-8'>
            <select
              className='w-full bg-white p-3 flex-1 shadow bg-grey-50 focus:bg-blue-100  border-gray-300'
              value={value || ''}
              onChange={e => {
                setValue(e.target.value)
              }}>
              <option value="" disabled >Select your option</option>
              {(versions.views || versions)
                .map(v =>
                  <option
                    key={v.view_id}
                    value={v.view_id} className={`p-2 ${get(v, ['metadata', 'authoritative']) === 'true' ? `font-bold` : ``}`}>
                    {get((versions.sources || versions).find(s => s.source_id === v.source_id), 'name') || v}
                    {v.view_id && ` (${v.view_id || ``} ${formatDate(v._modified_timestamp)})`}
                  </option>)
              }
            </select>
          </div>


        </dd>
      </div>
    </div>
  )
}