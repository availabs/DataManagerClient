import { useNavigate } from 'react-router-dom';

const ListUploads = ({ uploads = [] }) => {
  const navigate = useNavigate();
  return (
    <div className="w-full p-4 bg-white shadow mb-4">
      {uploads && uploads.length ? (
        <>
          <div className="py-4 sm:py-2 mt-2 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6 border-b-2">
            {["Id", "Status", "Last Updated"].map((key) => (
              <dt key={key} className="text-sm font-medium text-gray-600">
                {key}
              </dt>
            ))}
          </div>
          <dl className="sm:divide-y sm:divide-gray-200 odd:bg-white even:bg-slate-50">
            {(uploads || []).map((d, i) => (
              <div
                key={`${i}_0`}
                className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6 cursor-pointer hover:bg-slate-200"
                onClick={() => navigate(`/source/${d?.etl_context?.source_id}/uploads/${d?.etl_context?.etl_context_id}`)}
              >
                <dd
                  key={`${i}_1`}
                  className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle"
                >
                  {d?.etl_context?.etl_context_id}
                </dd>

                <dd
                  key={`${i}_2`}
                  className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle"
                >
                  {d?.etl_context?.etl_status}
                </dd>

                <dd
                  key={`${i}_3`}
                  className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle"
                >
                  {d?.etl_context?.modified_timestamp}
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <div className="text-center">{"No Uploads found"}</div>
      )}
    </div>
  );
};

export default ListUploads;
