import React from "react"

import get from "lodash/get"

import { DamaContext } from "~/pages/DataManager/store"

import { useClickOutside } from "~/pages/DataManager/utils/useClickOutside"

const useSourceCategories = ({ source }) => {

  const [categories, _setCategories] = React.useState([]);

  const { pgEnv, falcor } = React.useContext(DamaContext);

  const setCategories = React.useCallback(cats => {
    falcor.set({
      paths: [
        ['dama', pgEnv, 'sources', 'byId', source.source_id, 'attributes', 'categories']
      ],
      jsonGraph: {
        dama: {
          [pgEnv]: {
            sources: {
              byId: {
                [source.source_id]: {
                  attributes : {
                    categories: JSON.stringify(cats)
                  }
                }
              }
            }
          }
        }
      }
    }).then(() => {})
  }, [pgEnv, falcor, source.source_id]);

  React.useEffect(() => {
    const cats = get(source, "categories", []);
    if (Array.isArray(cats)) {
      _setCategories(cats);
    }
    else {
      _setCategories([]);
    }
  }, [source]);

  return [categories, setCategories];
}

const SourceCategories = props => {

  const [categories, setCategories] = useSourceCategories(props);

  const addNewCategory = React.useCallback((cat, parent = -1) => {
    if (parent === -1) {
      setCategories([
        ...categories,
        [cat]
      ]);
    }
    else {
      setCategories(
        categories.reduce((a, c, i) => {
          if (i === parent) {
            a.push([...c, cat]);
          }
          else {
            a.push(c);
          }
          return a;
        }, [])
      );
    }
  }, [categories]);

  const [showList, setShowList] = React.useState(false);

  const onMouseEnter = React.useCallback(e => {
    setShowList(true);
  }, []);
  const onMouseLeave = React.useCallback(e => {
    setShowList(false);
  }, []);

  return (
    <div className="relative w-full whitespace-nowrap"
      onMouseEnter={ onMouseEnter }
      onMouseLeave={ onMouseLeave }
    >
      { !categories.length ?
        <CategoryAdder addNewCategory={ addNewCategory }>
          Add Category
        </CategoryAdder> :
        <>
          { !showList ?
            <div className="px-2 py-1 bg-gray-100">{ categories[0][0] }</div> :
            <CategoryList
              list={ categories[0] }
              addNewCategory={ addNewCategory }
              parent={ 0 }/>
          }
          { !showList ? null :
            <>
              { categories.slice(1).map((cats, i) => (
                  <CategoryList key={ i }
                    list={ cats }
                    addNewCategory={ addNewCategory }
                    parent={ i }/>
                ))
              }
              <CategoryAdder addNewCategory={ addNewCategory }>
                Add Category
              </CategoryAdder>
            </>
          }
        </>
      }
    </div>
  )
}
export default SourceCategories;

const CategoryList = props => {

  const {
    list = [],
    addNewCategory,
    parent,
    children
  } = props;

  const [showList, setShowList] = React.useState(false);

  const onMouseEnter = React.useCallback(e => {
    setShowList(true);
  }, []);
  const onMouseLeave = React.useCallback(e => {
    setShowList(false);
  }, []);

  const doAdd = React.useCallback(cat => {
    addNewCategory(cat, parent);
  }, [addNewCategory]);

  return (
    <div className="relative"
      onMouseEnter={ onMouseEnter }
      onMouseLeave={ onMouseLeave }
    >
      <ListItem>{ list[0] }</ListItem>
      { !showList ? null :
        <div className="absolute top-0 left-full">
          <ListItems list={ list.slice(1) }
            addNewCategory={ doAdd }
            isChild/>
        </div>
      }
    </div>
  )
}

const ListItems = ({ list, addNewCategory }) => {
  const hasChild = Boolean(list.length > 1);
  return (
    <div className="flex flex-col w-fit">
      { list.map((l, i) => (
          <ListItem key={ i } isChild>{ l }</ListItem>
        ))
      }
      <CategoryAdder addNewCategory={ addNewCategory }>
        Add Subcategory
      </CategoryAdder>
    </div>
  )
}

const ListItem = ({ children, isChild = false }) => {
  return (
    <div className="px-2 py-1 bg-gray-100 relative flex items-center">
      <div>{ children }</div>
      <div className="flex-1 text-right ml-8 text-blue-500">
        { isChild ?
          <span className="fas fa-arrow-down"/> :
          <span className="fas fa-arrow-right"/>
        }
      </div>
    </div>
  )
}

const Input = ({ onChange, ...props }) => {
  const doOnChange = React.useCallback(e => {
    onChange(e.target.value);
  }, [onChange]);
  const [ref, setRef] = React.useState(null);
  React.useEffect(() => {
    if (ref) {
      ref.focus();
    };
  }, [ref]);
  return (
    <input type="text" ref={ setRef } { ...props }
      className="px-2 w-full"
      onChange={ doOnChange }/>
  )
}

const CategoryAdder = ({ addNewCategory, children }) => {
  const [editing, setEditing] = React.useState(false);
  const [cat, setCat] = React.useState("");
  const startEditing = React.useCallback(e => {
    e.stopPropagation();
    setEditing(true);
    setCat("");
  }, []);
  const stopEditing = React.useCallback(e => {
    e.stopPropagation();
    setEditing(false);
    setCat("");
  }, []);
  const doAdd = React.useCallback(e => {
    e.stopPropagation();
    addNewCategory(cat);
    setEditing(false);
    setCat("");
  }, [addNewCategory, cat]);
  const onKeyDown = React.useCallback(e => {
    if ((e.key === "Enter") || (e.keyCode === 13)) {
      doAdd(e);
    }
    else if ((e.key === "Escape") || (e.keyCode === 27)) {
      stopEditing(e);
    }
  }, [doAdd, stopEditing]);
  const [ref, setRef] = React.useState(null);
  useClickOutside(ref, stopEditing);
  return (
    <div className="px-2 py-1 bg-gray-100 whitespace-nowrap"
      onClick={ startEditing }
      ref={ setRef }
    >
      { !editing ?
        <div
          className="bg-gray-200 hover:bg-gray-300 px-2 rounded cursor-pointer"
        >
          <span className="fas fa-plus mr-1 text-blue-500"/>{ children }
        </div> :
        <div className="flex flex-col">
          <div className="mb-1">
            <Input type="text"
              value={ cat }
              onChange={ setCat }
              onKeyDown={ onKeyDown }/>
          </div>
          <div className="px-2 rounded bg-gray-200 text-center">
            { !cat ? "Start typing" :
              "Enter to save"
            }
          </div>
        </div>
      }
    </div>
  )
}
