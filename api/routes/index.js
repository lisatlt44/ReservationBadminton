var express = require('express');
var router = express.Router();
var db = require('../db');

/* GET home page. */
router.get('/', async function (req, res, next) {

  const conn = await db.mysql.createConnection(db.dsn);

  try {
    
    // Récupérer la liste des terrains disponibles
    const [rows] = await conn.execute('SELECT * FROM Courts WHERE availability = 1');

    // Parcourir la liste récupérée et sélectionner le champ name
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
