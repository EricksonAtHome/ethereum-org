const { query } = require("../config/db");

const BackendLog = {
  async create(log) {
    await query(
      `INSERT INTO backend_logs (method, url, path, status, response_time, content_length, formatted_timestamp)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        log.method,
        log.url,
        log.path,
        log.status,
        log.responseTime,
        log.contentLength,
        log.formattedTimestamp,
      ]
    );
  },
};

module.exports = BackendLog;
