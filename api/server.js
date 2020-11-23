const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');

// express 실행.
const app = express();

// 요청의 json을 파싱하는 방법
app.use(bodyParser.json());

db.pool.query(`CREATE TABLE lists (
        id INTEGER AUTO_INCREMENT,
        value TEXT,
        PRIMARY KEY (id)
)`, (err, results, fileds) => {
  console.log('results', results);
});

// 요청을 SQL Select
app.get('/api/values', function(req, res) {
  db.pool.query(`select * from lists`,
      (err, results, fileds) => {
        if (err) {
          return res.status(500).send(err);
        }
        return res.json(results);
      });
});

// 요청을 SQL create
app.post('/api/value', function(req, res, next) {
  db.pool.query(`INSERT INTO lists (value) VALUES ("${req.body.value}")`,
      (err, result, fileds) => {
        if (err) {
          return res.status(500).send(err);
        }

        return res.json({
          success: true,
          value: req.body.value,
        });
      });
});

app.listen(5000, () => {
  console.log('App에서 5000번 포트를 사용하여 실행한다.');
});
