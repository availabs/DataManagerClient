export const editMetadata = ({sourceId, pgEnv, falcor, metadata, setMetadata, col, value}) => {
    // value = {meta-attr: meta-value}
    const md = metadata.map(d => {
        if (d.name === col) {
            return {
                ...d, ...value
            }
        } else {
            return d;
        }
    })
    console.log('md?', value, md, metadata)
    setMetadata(md);
    falcor.set({
        paths: [['dama', pgEnv, 'sources', 'byId', sourceId, 'attributes', "metadata"]], jsonGraph: {
            dama: {
                [pgEnv]: {
                    sources: {
                        byId: {
                            [sourceId]: {
                                attributes: {metadata: JSON.stringify(md)}
                            }
                        }
                    }
                }
            }
        }
    }).then(res => console.log("RES:", res))
}