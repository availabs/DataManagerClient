import React from "react"

import { format as d3format } from "d3-format"

import ckmeans from "~/pages/DataManager/utils/ckmeans";

import {
  MultiLevelSelect,
  Button,
  Input,
  useTheme,
  getColorRange,
  strictNaN
} from "~/modules/avl-map-2/src";

import {
  calcThresholdRange,
  calcDomain
} from "../utils"

import { getRangeAndStep } from "../SymbologyPanel/PaintPropertyItem"
import { NumberInput } from "../utils"

const RemoveDomainItemButton = ({ remove }) => {
  const [seconds, setSeconds] = React.useState(0);
  const timeout = React.useRef();

  React.useEffect(() => {
    if (seconds > 0) {
      timeout.current = setTimeout(setSeconds, 1000, seconds - 1);
    }
  }, [seconds]);

  const onClick = React.useCallback(e => {
    e.stopPropagation();
    if (seconds === 0) {
      setSeconds(3);
    }
    else {
      setSeconds(0);
      clearTimeout(timeout.current);
      remove();
    }
  }, [remove, seconds]);

  return (
    <Button className="buttonSmallDanger ml-1 relative"
      onClick={ onClick }
    >
      { !seconds ? null :
        <span className={ `
            absolute inset-0 flex items-center justify-center font-bold
            text-white hover:text-red-500
          ` }
        >
          { seconds }
        </span>
      }
      <span className="fa fa-trash"/>
    </Button>
  )
}

const DomainItem = ({ value, remove, edit, index }) => {
  const doRemove = React.useCallback(e => {
    remove(value);
  }, [remove, value]);

  const [newValue, setNewValue] = React.useState("");
  const [editing, setEditing] = React.useState(false);
  const [ref, setRef] = React.useState(null);

  const startEditing = React.useCallback(e => {
    setEditing(true);
    ref.focus();
    ref.select();
  }, [ref]);
  const stopEditing = React.useCallback(e => {
    setEditing(false);
    setNewValue("");
  }, []);

  const doEdit = React.useCallback(e => {
    edit(+newValue, index);
    setEditing(false);
    setNewValue("");
  }, [edit, newValue, index]);

  const onKeyDown = React.useCallback(e => {
    if (!newValue) return;
    if (e.key === "Enter") {
      doEdit();
    }
    else if (e.key === "Escape") {
      stopEditing();
    }
  }, [doEdit, stopEditing, newValue]);

  const valueFormat = React.useMemo(() => {
    return isInteger(value) ? integerFormat : floatFormat;
  }, [value]);

  return (
    <div className={ `
        text-sm flex items-center
        ${ editing ? "" : "rounded border px-1" }
      ` }
    >
      <div className={ editing ? "rounded border px-1 w-[120px] overflow-hidden text-ellipsis" : "flex-1" }>
        { valueFormat(value) }
      </div>
      <div className={ editing ? "rounded border flex-1 mx-[2px]" : "w-0 overflow-hidden" }>
        <NumberInput ref={ setRef }
          className="inputSmall"
          value={ newValue }
          onChange={ setNewValue }
          onKeyDown={ onKeyDown }/>
      </div>
      <div className={ editing ? "rounded border px-1 flex" : "flex" }>
        { editing ?
          <Button className="buttonSmallSuccess"
            onClick={ doEdit }
            disabled={ !newValue }
          >
            <span className="fas text-xs fa-floppy-disk"/>
          </Button> :
          <Button className="buttonSmallPrimary"
            onClick={ startEditing }
          >
            <span className="fas text-xs fa-pen-to-square"/>
          </Button>
        }
        { editing ?
          <Button className="buttonSmallDanger ml-1"
            onClick={ stopEditing }
          >
            <span className="fas text-xs fa-remove"/>
          </Button> :
          <RemoveDomainItemButton
            remove={ doRemove }/>
        }
      </div>
    </div>
  )
}

const ThresholdEditor = props => {
  const {
    domain,
    range,
    color,
    reverse,
    updateScale,
    variable,
    data,
    ppId
  } = props;

  const removeDomainItem = React.useCallback(di => {
    const newDomain = domain.filter(d => d !== di);
    const update = calcThresholdRange({ domain: newDomain, range, color, reverse });
    updateScale({ domain: newDomain, ...update });
  }, [domain, updateScale, range, color, reverse]);

  const reset = React.useCallback(() => {
    const vid = variable.variableId;
    const values = data.map(d => d[vid]).filter(Boolean);
    if (!values.length) return;
    if (ppId.includes("color")) {
      if (color === "custom") {
        updateScale({
          domain: ckmeans(values, range.length).slice(1)
        })
      }
      else {
        updateScale({
          domain: ckmeans(values, 7).slice(1),
          range: getColorRange(7, color, reverse)
        })
      }
    }
    else {
      const { range, step } = getRangeAndStep(ppId);
      updateScale({
        domain: ckmeans(values, range.length).slice(1),
        range, step
      })
    }
  }, [color, reverse, data, variable, ppId, range]);

  const [newDomainItem, setNewDomainItem] = React.useState("");

  const addDomainItem = React.useCallback(() => {
    setNewDomainItem("");
    const newDomain = [...domain, +newDomainItem].sort((a, b) => a - b);
    const update = calcThresholdRange({ domain: newDomain, range, color, reverse });
    updateScale({ domain: newDomain, ...update });
  }, [domain, newDomainItem, updateScale, range, color, reverse]);

  const editDomainItem = React.useCallback((v, i) => {
    domain.splice(i, 1, v);
    updateScale({ domain: [...domain].sort((a, b) => a - b) });
  }, [domain, updateScale]);

  const select = React.useCallback(e => {
    e.target.select();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-1">
      { domain.map((d, i) => (
          <DomainItem key={ i }
            value={ d }
            remove={ removeDomainItem }
            edit={ editDomainItem }
            index={ i }/>
        ))
      }
      <div className="flex">
        <div className="flex-1 mr-1">
          <NumberInput
            onClick={ select }
            className="inputSmall"
            value={ newDomainItem }
            onChange={ setNewDomainItem }/>
        </div>
        <Button className="buttonSmallPrimary"
          onClick={ addDomainItem }
          disabled={ !newDomainItem }
        >
          Add
        </Button>
      </div>
      <Button onClick={ reset } className="buttonSmallDanger">
        Reset with CKMeans
      </Button>
    </div>
  )
}
export default ThresholdEditor;
