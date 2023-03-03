# NPMRDS Travel Times Export

NOTE: This DataType's Source page extensions render **IFF** the data\*source's
type is _"npmrds_travel_times_export_ritis"_.

## Description

This data source represents the raw data AVAIL requests and downloads from RITIS.

An export is requested using RITIS's MassiveDataDownloader form.

An export is comprised of three ZIP archives for each _"data_source"_:

- all_vehicle
- passenger_vehicle
- freight_trucks

Each zip archive includes

- a TravelTimes data CSV
- a TMC_Identification CSV

## The ETL Workflow

This DataType's main task is to

1. request a NPMRDS Travel Time Export from RITIS
2. download the export
3. transform the data
4. integrated the data into the DataManager

## Integration

After downloading the three ZIP archives,
AVAIL merges the three NpmrdsTravelTimes CSVs into a single CSV.
That single CSV is loaded into the database's npmrds table.

The TMC_Identification files for the three data_sources are identical.
They form the core of the database's tmc_metadata table.
