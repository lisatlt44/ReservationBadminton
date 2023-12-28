var express = require('express');
var router = express.Router();
var db = require('../db')
var hal = require('../hal')
const { format } = require('date-fns');
const { checkTokenMiddleware } = require('./authentification');

/**
 * Routing des ressources liées aux terrains
 */

/* La liste des terrains : GET /terrains */
router.get('/terrains', async function (req, res, next) {

  try {
    const conn = await db.mysql.createConnection(db.dsn);

    let [rows] = await conn.execute('SELECT * from Courts');

    const resourceObject = {
      "_embedded": {
        "terrains": rows.map(row => hal.mapTerraintoResourceObject(row, req.baseUrl))
      },
      "nbTerrains": rows.length
    }

    res.set('Content-Type', 'application/hal+json');
    res.status(200);
    res.json(resourceObject);

  } catch (error) {
    console.error(error);
    res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard."});
  }
});

/* Informations sur un terrain : GET /terrains/:id */
router.get('/terrains/:id', async function (req, res, next){

  try {
    const conn = await db.mysql.createConnection(db.dsn);

    let [rows] = await conn.execute('SELECT * from Courts where id_court = ?', [req.params.id]);

    if (rows.length === 0) {
      res.status(404).json({ "msg": "Terrain non existant." });
      return
    }

    const resourceObject = {
      "_embedded": {
        "terrains": hal.mapTerraintoResourceObject(rows[0], req.baseUrl)
      },
    }

    res.set('Content-type', 'application/hal+json');
    res.status(200);
    res.json(resourceObject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard."});
  }
});

/**
 * Modifier l'état de disponibilité d'un terrain : PUT /terrains/:id
 * Réservé à l'administrateur du site
 * Route authentifiée par JSON Web Token (JWT)
 * La fonction middleware checkTokenMiddleware vérifie d'abord la présence et validité du token
 * avant d’exécuter la fonction middleware suivante
 */
router.put('/terrains/:id', checkTokenMiddleware, async function (req, res, next) {

  // Vérification des données requises et du format des dates
  const { dateDebutIndisponibilite, dateFinIndisponibilite } = req.body;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateDebutIndisponibilite || !dateFinIndisponibilite || !dateRegex.test(dateDebutIndisponibilite) || !dateRegex.test(dateFinIndisponibilite)) {
    res.status(400).json({ "msg": "Merci de fournir les données requises afin de rendre un terrain temporairement indisponible : les dates d'indisponibilité au format Y-m-d (exemple : 2024-01-01)." });
    return
  }

  // Vérification de la date de début
  const today = new Date().toISOString().split('T')[0];
  
  if (dateDebutIndisponibilite < today) {
    res.status(400).json({ "msg": "La date de début doit être égale ou postérieure à la date du jour."});
    return
  }

  // Vérification de la durée d'indisponibilité (obligatoirement 2 jours)
  const startDate = new Date(dateDebutIndisponibilite);
  const endDate = new Date (dateFinIndisponibilite);
  const twoDaysLater = new Date(startDate);
  twoDaysLater.setDate(twoDaysLater.getDate() + 2);

  if (endDate < twoDaysLater || endDate > twoDaysLater) {
    res.status(400).json({ "msg": "La durée d'indisponibilité du terrain ne peut être inférieur ou supérieur à 2 jours."});
    return
  }

  try {
    const conn = await db.mysql.createConnection(db.dsn);

    // Vérification si le terrain existe
    let [rows] = await conn.execute('SELECT * from Courts where id_court = ?', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ "msg": "Nous sommes désolés, le terrain demandé n'existe pas." });
      return
    }

    const currentAvailability = rows[0].availability;

    if (currentAvailability === 0) {
      res.status(400).json({ "msg": "Vous ne pouvez pas rendre temporairement indisponible ce terrain car il est déjà indisponible."});
      return
    }

    // Mettre à jour les dates d'indisponibilité du terrain
    let [updateRows] = await conn.execute(
      'UPDATE Courts SET start_date_unavailable = ?, end_date_unavailable = ?, availability = 0 WHERE id_court = ? AND availability = 1',
      [dateDebutIndisponibilite, dateFinIndisponibilite, req.params.id]
    );  

    const formattedStartDate = format(dateDebutIndisponibilite, "d'/'MM'/'yyyy");
    const formattedEndDate = format(dateFinIndisponibilite, "d'/'MM'/'yyyy");

    res.set('Content-Type', 'application/hal+json');
    res.status(201);
    res.json({
      "_links": [{
        "self": hal.halLinkObject(`/terrains/${req.params.id}`, 'string')
      }],
      "status": `Le terrain ${rows[0].name} est maintenant indisponible du ${formattedStartDate} au ${formattedEndDate}.`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard."});
  }
});

module.exports = router;