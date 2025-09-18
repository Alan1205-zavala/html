const TimeRecord = require('../models/TimeRecord');

exports.createRecord = (req, res) => {
  const { date, start_time, end_time, activities } = req.body;
  const user_id = req.user.id;

  if (!date || !start_time) {
    return res.status(400).json({ message: 'Fecha y hora de inicio son obligatorias.' });
  }

  TimeRecord.create({ user_id, date, start_time, end_time, activities }, (err, record) => {
    if (err) {
      return res.status(500).json({ message: 'Error al crear el registro.' });
    }
    res.status(201).json({ message: 'Registro creado.', record });
  });
};

exports.getRecords = (req, res) => {
  const user_id = req.user.id;

  TimeRecord.getByUserId(user_id, (err, records) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener los registros.' });
    }
    res.json(records);
  });
};

exports.getRecordsByDate = (req, res) => {
  const user_id = req.user.id;
  const { date } = req.params;

  TimeRecord.getByUserIdAndDate(user_id, date, (err, records) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener los registros.' });
    }
    res.json(records);
  });
};

exports.updateRecord = (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  TimeRecord.update(id, updates, (err, changes) => {
    if (err) {
      return res.status(500).json({ message: 'Error al actualizar el registro.' });
    }
    if (changes === 0) {
      return res.status(404).json({ message: 'Registro no encontrado.' });
    }
    res.json({ message: 'Registro actualizado.' });
  });
};

exports.deleteRecord = (req, res) => {
  const { id } = req.params;

  TimeRecord.delete(id, (err, changes) => {
    if (err) {
      return res.status(500).json({ message: 'Error al eliminar el registro.' });
    }
    if (changes === 0) {
      return res.status(404).json({ message: 'Registro no encontrado.' });
    }
    res.json({ message: 'Registro eliminado.' });
  });
};