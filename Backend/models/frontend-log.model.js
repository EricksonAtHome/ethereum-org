const { query } = require("../config/db");

const FrontendLog = {
  async create(log) {
    await query(
      `INSERT INTO frontend_logs (url, path, params, formatted_timestamp)
       VALUES ($1,$2,$3::jsonb,$4)`,
      [
        log.url,
        log.path,
        JSON.stringify(log.params || null),
        log.formattedTimestamp,
      ]
    );
  },
};

module.exports = FrontendLog;
