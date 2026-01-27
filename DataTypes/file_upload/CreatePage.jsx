import React from "react"

import { format as d3format } from "d3-format"

import { DAMA_HOST } from "~/config";
import { DamaContext } from "~/pages/DataManager/store";

const intFormat = d3format(",d");

const CreatePage = ({ source }) => {

	console.log("SOURCE:", source)

  const { name: userName } = source;

	const [ref, setRef] = React.useState(null);

	const [file, setFile] = React.useState(null);
	const doSetFile = React.useCallback(e => {
		setFile(e.target.files[0]);
	}, []);
	const clickFileInput = React.useCallback(e => {
		ref.click();
	}, [ref]);

	return (
		<div className="max-w-xl grid grid-cols-1 gap-2">
			<input type="file"
				ref={ setRef }
				className="hidden"
				onChange={ doSetFile }/>
			<div className="flex">
				<button onClick={ clickFileInput }
					className={ `
						bg-gray-200 hover:bg-gray-300
						w-60 py-2 rounded cursor-pointer
					` }
				>
					Select a File
				</button>
			</div>
			<File file={ file }
				userName={ userName }/>
		</div>
	)
}
export default CreatePage;

const File = ({ file, userName }) => {

  const { pgEnv, baseUrl } = React.useContext(DamaContext);

  const fileName = React.useMemo(() => {
  	const fName = file?.name || "";
  	const split = fName.split(".");
  	const fileName = split.slice(0, -1).join(".");
  	const fileExt = split.at(-1);
  	return (userName.replace(/\s+/g, "_") || fileName) + (fileName ? ("." + fileExt) : "");
  }, [file, userName]);

  const [description, setDescription] = React.useState("");
  const doSetDescription = React.useCallback(e => {
  	setDescription(e.target.value);
  }, []);

  const uploadFile = React.useCallback(e => {

    const formData = new FormData();

    formData.append("name", fileName);
    formData.append("description", description);
    formData.append("type", "file_upload");
    formData.append("mime", file.type || "application/octet-stream");
    formData.append("categories", JSON.stringify([["Uploaded File"]]));
    formData.append("file", file);

    fetch(
      `${ DAMA_HOST }/dama-admin/${ pgEnv }/file_upload`,
      { method: "POST", body: formData }
    ).then(res => res.json())
      .then(json => {
        console.log("FILE UPLOAD RESPONSE:", json);
        // const { source_id, etl_context_id } = json;
        // navigate(`${ baseUrl }/source/${ source_id }/uploads/${ etl_context_id }`);
      })

  }, [pgEnv, baseUrl, file, fileName, description]);

	return !file ? null : (
		<div>
			<div className="text-xl font-extrabold border-b-3">
				{ fileName }
			</div>
			<div>
				<div className="grid grid-cols-5">
					<div className="col-span-2 font-bold">File Size:</div>
					<div className="col-span-3">{ intFormat(file.size) } bytes</div>
				</div>
				<div className="grid grid-cols-5">
					<div className="col-span-2 font-bold">File Type:</div>
					<div className="col-span-3">
						{ file.type || "application/octet-stream" }
					</div>
				</div>
				<div className="grid grid-cols-5">
					<div className="col-span-2 font-bold">Last Modified:</div>
					<div className="col-span-3">
						{ (new Date(file.lastModified)).toLocaleString() }
					</div>
				</div>
			</div>
			<div className="font-bold border-b-2 mb-1">
				Enter a description
			</div>
			<textarea value={ description }
				onChange={ doSetDescription }
				className="px-2 py-1 bg-white border rounded block w-full"
				rows="5"/>
			<div className="flex justify-end">
				<button onClick={ uploadFile }
					className={ `
						bg-green-200 hover:bg-green-300 mt-2
						w-60 py-2 rounded cursor-pointer
					` }
				>
					Upload File
				</button>
			</div>
		</div>
	)
}