const { Pool } = require('pg')
const Cursor = require('pg-cursor')
const config = require("./Config").Config.instance;

class PgSQL {
    constructor() {
        this.poolCMMS = new Pool(config.getConfig().pgCMMS);
        this.pool = new Pool(config.getConfig().pgPERFILES);
    }

    static get instance() {
        if (!global.pgSQLInstance) global.pgSQLInstance = new PgSQL();
        return global.pgSQLInstance;
    }

    async getClient() {
        try {
            return await this.pool.connect();
        } catch(error) {
            console.error(error);
            throw error;
        }
    }
    releaseClient(client) {
        client.release();
    }

    async executeSQL(sql, values) {
        try {
            let res = await this.pool.query(sql, values);
            return res.rows;
        } catch(error) {
            console.error(error);
            throw error;
        }
    }
}

exports.PgSQL = PgSQL;