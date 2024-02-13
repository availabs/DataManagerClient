import React from "react"

import {
  useTable,
  useFilters,
  useGlobalFilter,
  useSortBy,
  usePagination,
  useExpanded
} from 'react-table'

import { range as d3range } from "d3-array"
import { matchSorter } from 'match-sorter'

function fuzzyTextFilterFn(rows, id, filterValue) {
  return matchSorter(rows, filterValue, { keys: [row => row.values[id]] });
}

const EMPTY_ARRAY = [];

const DefaultFetchLength = indices => Promise.resolve(0);
const DefaultFetchData = indices => Promise.resolve();
const DefaultParseData = indices => EMPTY_ARRAY;

const DefaultColumnFilter = ({ column }) => {
  const {
      filterValue = "",
      setFilter
    } = column;
  return (
    <div className="w-3/4">
      <input className=""
        value={ filterValue } onChange={ e => setFilter(e.target.value) }
        onClick= { e => e.stopPropagation() }
        placeholder={ `Search...` }/>
    </div>
  )
}

const DataFetchTable = props => {
  const {
    fetchLength = DefaultFetchLength,
    fetchData = DefaultFetchData,
    parseData = DefaultParseData,
    columns = EMPTY_ARRAY,
    sortBy,
    sortOrder = "",
    initialPageSize = 20,
    disableFilters = false,
    disableSortBy = false,
    onRowClick = null
  } = props;

  const [length, setLength] = React.useState(0);
  const [data, setData] = React.useState([]);

  // const [loading, setLoading] = React.useState(0);
  // const startLoading = React.useCallback(() => {
  //   setLoading(l => l + 1);
  // }, []);
  // const stopLoading = React.useCallback(() => {
  //   setLoading(l => l - 1);
  // }, []);

  const filterTypes = React.useMemo(() => {
    return { fuzzyText: fuzzyTextFilterFn }
  }, []);

  const defaultColumn = React.useMemo(() => {
    return { Filter: DefaultColumnFilter };
  }, []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    // page,
    rows,
    preFilteredRows,
    prepareRow,
    // canPreviousPage,
    // canNextPage,
    // gotoPage,
    // previousPage,
    // nextPage,
    // pageCount,
    visibleColumns,
    toggleRowExpanded,
    // setPageSize,
    // state: {
    //   pageSize: statePageSize,
    //   pageIndex,
    //   expanded
    // }
  } = useTable(
    { columns,
      data,
      defaultColumn,
      filterTypes,
      disableFilters,
      disableSortBy,
      initialState: {
        // pageSize: initialPageSize,
        sortBy: [{ id: sortBy, desc: sortOrder.toLowerCase() === "desc" }]
      }
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    useExpanded,
    // usePagination
  );

  const [pageIndex, setPageIndex] = React.useState(0);

  const indices = React.useMemo(() => {
    return d3range(pageIndex * initialPageSize, pageIndex * initialPageSize + initialPageSize);
  }, [pageIndex, initialPageSize]);

  React.useEffect(() => {
    fetchLength()
      .then(setLength);
  }, [fetchLength]);

  React.useEffect(() => {
    fetchData(indices);
  }, [fetchData, indices]);

  React.useEffect(() => {
    setData(parseData(indices));
  }, [parseData, indices]);

  return (
    <div className="overflow-auto scrollbar-sm relative px-4">
      <table { ...getTableProps() } className="w-full mt-8">
        <thead>
          <Pagination gotoPage={ setPageIndex }
            columns={ columns.length }
            pageIndex={ pageIndex }
            pageSize={ initialPageSize }
            totalRows={ length }/>

          { headerGroups.map(headerGroup =>
              <tr { ...headerGroup.getHeaderGroupProps() }>
                { headerGroup.headers
                    .map(column =>
                      <th { ...column.getHeaderProps(column.getSortByToggleProps()) }>
                        <div className="flex justify-center border-b border-current">
                          { column.render("Header") }
                          { !column.isSorted ? null :
                            column.isSortedDesc ?
                            <span className="ml-2 fas fa-chevron-down"/> :
                            <span className="ml-2 fas fa-chevron-up"/>
                          }
                        </div>
                        { !column.canFilter ? null :
                          <div>
                            { column.render('Filter') }
                          </div>
                        }
                      </th>
                    )
                }
              </tr>
            )
          }
        </thead>
        <tbody { ...getTableBodyProps() }>
          { rows.map(row => {
              prepareRow(row);
              return (
                <TableRow { ...row.getRowProps() }
                  onClick={ onRowClick }
                  row={ row }
                >
                  { row.cells.map(cell =>
                      <td { ...cell.getCellProps() }
                        className="text-center"
                      >
                        { cell.render('Cell') }
                      </td>
                    )
                  }
                </TableRow>
              )
            })
          }
        </tbody>
      </table>
    </div>
  )
}
export default DataFetchTable;

const TableRow = ({ row, onClick, children, ...props }) => {
  const doOnClick = React.useCallback(e => {
    onClick(e, row);
  }, [onClick, row]);
  return (
    <tr { ...props }
      onClick={ typeof onClick === "function" ? doOnClick : null }
      className={
        typeof onClick === "function" ?
        "cursor-pointer hover:bg-gray-200" : null }
    >
      { children }
    </tr>
  )
}

const PaginationButton = ({ index = null, current, gotoPage, children, disabled = false }) => {
  const doGotoPage = React.useCallback(e => {
    gotoPage(index);
  }, [gotoPage, index]);
  return (
    <button className={ `
        w-20 text-center cursor-pointer hover:bg-gray-400
        disabled:opacity-50 disabled:hover:bg-gray-200
        disabled:cursor-not-allowed rounded
        ${ index === current ? "outline outline-gray-400 outline-1" : "" }
      ` }
      onClick={ doGotoPage }
      disabled={ disabled }
    >
      { children || index + 1 }
    </button>
  )
}

const Pagination = ({ pageIndex, pageSize, totalRows, columns, gotoPage }) => {
  const numPages = React.useMemo(() => {
    return Math.ceil(totalRows / pageSize);
  }, [pageSize, totalRows]);

  const pageSpread = React.useMemo(() => {
    const maxIndex = numPages - 1;

  	let low = pageIndex - 3,
  		high = pageIndex + 3;

  	if (low < 0) {
  		high += -low;
  		low = 0;
  	}
  	if (high > maxIndex) {
  		low -= (high - maxIndex);
  		high = maxIndex;
  	}
    return d3range(Math.max(0, low), Math.min(maxIndex, high) + 1);
  }, [pageIndex, numPages]);

  return (
    <tr>
      <th colSpan={ columns }>
        <div className="w-full flex pb-2">
          <div className="w-1/5 flex justify-end">
            <PaginationButton
              gotoPage={ gotoPage }
              index={ 0 }
              disabled={ pageIndex === 0 }
            >
              <span className="fas fa-angles-left"/>
            </PaginationButton>
            <div className="ml-1">
              <PaginationButton
                gotoPage={ gotoPage }
                index={ pageIndex - 1 }
                disabled={ pageIndex <= 0 }
              >
                <span className="fas fa-angle-left"/>
              </PaginationButton>
            </div>
          </div>
          <div className="flex justify-center w-3/5">
            { pageSpread.map((s, i) => (
                <div key={ s }
                  className={ i > 0 ? "ml-1" : "" }
                >
                  <PaginationButton
                    gotoPage={ gotoPage }
                    index={ s }
                    current={ pageIndex }
                    disabled={ pageIndex === s }/>
                </div>
              ))
            }
          </div>
          <div className="w-1/5 flex">
            <div className="mr-1">
              <PaginationButton
                gotoPage={ gotoPage }
                index={ pageIndex + 1 }
                disabled={ pageIndex >= numPages - 1 }
              >
                <span className="fas fa-angle-right"/>
              </PaginationButton>
            </div>
            <PaginationButton
              gotoPage={ gotoPage }
              index={ numPages - 1 }
              disabled={ pageIndex === numPages - 1 }
            >
              <span className="fas fa-angles-right"/>
            </PaginationButton>
          </div>
        </div>
      </th>
    </tr>
  )
}
