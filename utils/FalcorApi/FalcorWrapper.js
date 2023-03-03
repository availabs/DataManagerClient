import { falcorGraph } from "store/falcorGraph";
import get from "lodash/get";

class FalcorWrapper {
  costructor() {
    this._refreshCache();
  }

  _refreshCache() {
    this.cache = falcorGraph.getCache();
  }

  async get(path) {
    await falcorGraph.get(path);

    await new Promise((resolve) => {
      setTimeout(() => {
        this._refreshCache();
        resolve();
      });
    });
  }

  async getValue(path, _default = null) {
    await this.get(path);

    let v = get(this.cache, path, undefined);

    if (v && v.$type === "atom") {
      v = v.value;
    }

    if (v === undefined) {
      v = _default;
    }

    return v;
  }

  async invalidate(path) {
    falcorGraph.invalidate(path);

    await new Promise((resolve) => {
      setTimeout(() => {
        this._refreshCache();
        resolve();
      });
    });
  }
}

export default new FalcorWrapper();
