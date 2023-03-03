export const SourceAttributes = {
  "source_id": "source_id",
  "name": "name",
  "display_name": "display_name",
  "type": "type",
  "update_interval": "update_interval",
  "category": "category",
  "categories": "categories",
  "description": "description",
  "statistics": "statistics",
  "metadata": "metadata",
}

export const ViewAttributes = {
  "source_id": "source_id",
  "view_id": "view_id",
  "data_type": "data_type",
  "interval_version": "interval_version",
  "geography_version": "geography_version",
  "version": "version",
  "metadata": "metadata",
  "source_url": "source_url",
  "publisher": "publisher",
  "data_table": "data_table",
  "download_url": "download_url",
  "tiles_url": "tiles_url",
  "start_date": "start_date",
  "end_date": "end_date",
  "last_updated": "last_updated",
  "statistics": "statistics",
}

export const getAttributes = (data) => {
  return Object.entries(data)
    .reduce((out,attr) => {
      const [k,v] = attr
      typeof v.value !== 'undefined' ? 
        out[k] = v.value : 
        out[k] = v
      return out 
    },{})
}

export const getName = (source) => {
  return source.display_name && source.display_name.length > 0 ? 
  source.display_name : 
  source.name.split('/').pop().split('_').join(' ')
}
