const db = require('../config/database');

const TimeRecord = {};

TimeRecord.create = (record, callback) => {
  const { user_id, date, start_time, end_time, activities } = record;
  db.run(
    'INSERT INTO time_records (user_id, date, start_time, end_time, activities) VALUES (?, ?, ?, ?, ?)',
    [user_id, date, start_time, end_time, activities],
    function(err) {
      callback(err, { id: this.lastID, ...record });
    }
  );
};

TimeRecord.getByUserId = (user_id, callback) => {
  db.all(
    'SELECT * FROM time_records WHERE user_id = ? ORDER BY date DESC, start_time DESC',
    [user_id],
    callback
  );
};

TimeRecord.getByUserIdAndDate = (user_id, date, callback) => {
  db.all(
    'SELECT * FROM time_records WHERE user_id = ? AND date = ? ORDER BY start_time DESC',
    [user_id, date],
    callback
  );
};

TimeRecord.update = (id, updates, callback) => {
  const fields = [];
  const values = [];

  for (let [key, value] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  values.push(id);

  db.run(
    `UPDATE time_records SET ${fields.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      callback(err, this.changes);
    }
  );
};

TimeRecord.delete = (id, callback) => {
  db.run('DELETE FROM time_records WHERE id = ?', [id], function(err) {
    callback(err, this.changes);
  });
};

module.exports = TimeRecord;