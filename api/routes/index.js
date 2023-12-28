var express = require('express');
var router = express.Router();
var db = require('../db');

/* GET home page. */
router.get('/', async function (req, res, next) {

  const conn = await db.mysql.createConnection(db.dsn);

  try {
    
    const [rows] = await conn.execute('SELECT * FROM Courts');

    const courts = rows.map(element => {
      return {
        courtName: element.name,
      }
    });
    res.render('index', { title: 'Bienvenue sur mybad.fr', 'courts': courts });

  } catch (error) {
    console.error('Error connecting: ' + error.stack);
    res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard." });

  }
});

module.exports = router;
