const express = require('express');
const {
  createRecord,
  getRecords,
  getRecordsByDate,
  updateRecord,
  deleteRecord
} = require('../controllers/timeRecordController');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

router.post('/', createRecord);
router.get('/', getRecords);
router.get('/date/:date', getRecordsByDate);
router.put('/:id', updateRecord);
router.delete('/:id', deleteRecord);

module.exports = router;