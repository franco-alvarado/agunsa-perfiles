const ZModule = require("../z-server/z-server").ZModule;

class Config extends ZModule {
    constructor() {
        super();
        this._config = null;
    }
    static get instance() {
        if (!global.configInstance) global.configInstance = new Config();
        return global.configInstance;
    }

    getConfig() {
        if (this._config) return this._config;
        this._config = JSON.parse(require("fs").readFileSync(global.confPath))
        return this._config;
    }
}

exports.Config = Config;