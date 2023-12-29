var express = require('express');
var router = express.Router();
var db = require('../db')
var hal = require('../hal')
const { format } = require('date-fns');
const { checkTokenMiddleware } = require('./authentification');

/**
 * Routing des ressources liées aux terrains
 */

/* La liste des terrains disponibles : GET /terrains */
router.get('/terrains', async function (req, res, next) {

  try {
    const conn = await db.mysql.createConnection(db.dsn);

    // Récupérer la liste des terrains disponibles
    let [rows] = await conn.execute('SELECT * from Courts WHERE availability = 1');

    // Définir le resourceObject
    const resourceObject = {
      "_embedded": {
        "terrains": rows.map(row => hal.mapTerraintoResourceObject(row, req.baseUrl))
      },
      "nbTerrainsDispo": rows.length
    }

    // Répondre avec les données de terrain au format HAL
    res.set('Content-Type', 'application/hal+json');
    res.status(200);
    res.json(resourceObject);
  } catch (error) {
    console.log(error);
    res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard."});
  }
});

/* Informations sur un terrain : GET /terrains/:id */
router.get('/terrains/:id', async function (req, res, next){

  try {
    const conn = await db.mysql.createConnection(db.dsn);

    // Récupérer le terrain demandé par rapport à l'id donné dans les paramètres de l'URL
    let [rows] = await conn.execute('SELECT * from Courts where id_court = ?', [req.params.id]);

    // Vérifier si le terrain demandé existe
    if (rows.length === 0) {
      res.status(404).json({ "msg": "Terrain non existant." });
      return
    }

    // Définir le resourceObject
    const resourceObject = {
      "_embedded": {
        "terrains": hal.mapTerraintoResourceObject(rows[0], req.baseUrl)
      },
    }

    // Répondre avec les données de terrain au format HAL
    res.set('Content-type', 'application/hal+json');
    res.status(200);
    res.json(resourceObject);
  } catch (error) {
    console.log(error);
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

  // Définir le format des dates : Y-m-dTH:i
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  // Vérifier les données requises et le format des dates
  if (!req.body.dateDebutIndisponibilite || !req.body.dateFinIndisponibilite || !dateRegex.test(req.body.dateDebutIndisponibilite) || !dateRegex.test(req.body.dateFinIndisponibilite)) {
    res.status(400).json({ "msg": "Merci de fournir les données requises afin de rendre un terrain temporairement indisponible : les dates d'indisponibilité au format Y-m-d (exemple : 2024-01-01)." });
    return
  }

  // Convertir les dates au format Y-m-d H:i et au fuseau horaire de Paris (UTC+1)
  const currentDate = new Date();
  const parisTime = new Date(currentDate.toLocaleString("en-US", { timeZone: "Europe/Paris" }));

  const formattedToday = parisTime.toISOString().slice(0, 10);
  const dateDebutIndisponibilite = new Date(req.body.dateDebutIndisponibilite).toISOString().slice(0, 10);
  const dateFinIndisponibilite = new Date(req.body.dateFinIndisponibilite).toISOString().slice(0, 10);

  // Vérifier si la date de début d'indisponiblité est postérieure à la date actuelle
  if (dateDebutIndisponibilite < formattedToday) {
    res.status(400).json({ "msg": "La date de début d'indisponibilité doit être égale ou postérieure à la date du jour."});
    return
  }

  const startDate = new Date(dateDebutIndisponibilite);
  const endDate = new Date (dateFinIndisponibilite);

  // Vérifier si la durée d'indisponibilité est de 2 jours (pas +, pas -)
  const diffInDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
  if (diffInDays !== 2) {
    res.status(400).json({ "msg": "La durée d'indisponibilité du terrain doit être exactement de 2 jours."});
    return
  }

  try {
    const conn = await db.mysql.createConnection(db.dsn);

    // Récupérer le terrain demandé par l'id donné dans les paramètres de l'URL
    let [rows] = await conn.execute('SELECT * from Courts where id_court = ?', [req.params.id]);
    
    // Vérifier si le terrain demandé existe
    if (rows.length === 0) {
      res.status(404).json({ "msg": "Nous sommes désolés, le terrain demandé n'existe pas." });
      return
    }

    const currentAvailability = rows[0].availability;

    // Vérifier si le terrain demandé n'est pas déjà indisponible
    if (currentAvailability === 0) {
      res.status(400).json({ "msg": "Vous ne pouvez pas rendre temporairement indisponible ce terrain car il est déjà indisponible."});
      return
    }

    // Mettre à jour le terrain et son indisponibilité dans la base de données
    let [updateRows] = await conn.execute(
      'UPDATE Courts SET start_date_unavailable = ?, end_date_unavailable = ?, availability = 0 WHERE id_court = ? AND availability = 1',
      [dateDebutIndisponibilite, dateFinIndisponibilite, req.params.id]
    );  

    const formattedStartDate = format(dateDebutIndisponibilite, "d'/'MM'/'yyyy");
    const formattedEndDate = format(dateFinIndisponibilite, "d'/'MM'/'yyyy");

    // Répondre avec les données de terrain au format HAL
    res.set('Content-Type', 'application/hal+json');
    res.status(201);
    res.json({
      "_links": [{
        "self": hal.halLinkObject(`/terrains/${req.params.id}`, 'string')
      }],
      "status": `Le terrain ${rows[0].name} est maintenant indisponible du ${formattedStartDate} au ${formattedEndDate}.`
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard."});
  }
});

module.exports = router;