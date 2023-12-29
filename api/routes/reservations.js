const express = require('express');
const router = express.Router();
const db = require('../db');
const hal = require('../hal');
const { getDay, getHours, getISOWeek, format } = require('date-fns');

/**
 * Routing des ressources liées aux réservations de terrains de badminton
 */

/**
 * Réservation d'un terrain de badminton
 * Effectuer une réservation pour un terrain : POST /terrains/:id/reservations
 */
router.post('/terrains/:id/reservations', async function (req, res, next) {

  // Définition du format des dates : Y-m-dTH:i
  const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

  // Vérification des données requises
  if (!req.body.pseudo || !req.body.start_time || !req.body.end_time || !dateRegex.test(req.body.start_time) || !dateRegex.test(req.body.end_time)) {
    res.status(400).json({ "msg": "Merci de fournir toutes les données requises pour effectuer une réservation : votre pseudo ainsi que le créneau souhaité au format Y-m-dTH:i (exemple : 2024-01-01T10:00)." });
    return
  }

  try {
    const conn = await db.mysql.createConnection(db.dsn);

    // Récupérer l'utilisateur identifié par le pseudo
    let [users] = await conn.execute(`SELECT id_user FROM User WHERE pseudo = ?`, [req.body.pseudo]);

    // Vérifier si l'utilisateur existe
    if (users.length === 0) {
      res.status(403).json({ "msg": "Impossible de vous identifier, vous ne pouvez gérer vos réservations." });
      return
    }

    const userId = users[0].id_user;

    // Récupérer le terrain demandé par l'id donné dans les paramètres de l'URL
    let [court] = await conn.execute(
      `SELECT * FROM Courts WHERE id_court = ?`,
      [req.params.id]
    );
    
    // Vérifier si le terrain demandé existe
    if (court.length === 0) {
      res.status(400).json({ "msg": "Le terrain demandé n'existe pas." });
      return
    }

    // Vérifier si le terrain demandé est disponible
    if (court[0].availability === 0) {
      res.status(400).json({ "msg": "Le terrain demandé n'est pas disponible." });
      return
    }

    // Conversion des dates au format Y-m-d H:i au fuseau horaire de Paris (UTC+1)
    const currentDate = new Date();
    const parisTime = new Date(currentDate.toLocaleString("en-US", { timeZone: "Europe/Paris" }));

    const formattedToday = parisTime.toISOString().slice(0, 16).replace('T', ' ');
    const startTime = new Date(req.body.start_time).toISOString().slice(0, 16).replace('T', ' ');
    const endTime = new Date(req.body.end_time).toISOString().slice(0, 16).replace('T', ' ');

    // Obtenir le numéro de semaine
    const weekNumber = getISOWeek(startTime);

    // Obtenir le jour de la semaine
    const dayOfWeek = getDay(startTime);

    // Obtenir l'heure
    const hour = getHours(startTime);

    // Vérifier si la réservation est pour la semaine en cours
    if (weekNumber !== getISOWeek(formattedToday)) {
      res.status(400).json({ "msg": "Vous ne pouvez réserver que pour la semaine en cours." });
      return
    }

    // Vérifier si le jour est entre lundi et samedi
    if (dayOfWeek < 1 || dayOfWeek > 6) {
      res.status(400).json({ "msg": "Vous ne pouvez réserver que du lundi au samedi." });
      return
    }

    // Vérifier si l'heure est entre 10h et 22h (maximum 21h15 pour des réservations de 45 minutes)
    if (
      (hour < 10 || hour >= 22) || // En dehors des heures permises
      (hour === 21 && startTime.slice(11, 16) > '21:15') // Au-delà de 21h15
    ) {
      res.status(400).json({ "msg": "Vous ne pouvez réserver qu'entre 10h et 21h15 pour des créneaux de 45 minutes." });
      return
    }

    // Vérifier si startTime est identique à endTime
    if (startTime === endTime) {
      res.status(400).json({ "msg": "La date de début et de fin ne peuvent pas être identiques." });
      return
    }
    
    // Vérifier si la date de début est postérieure à la date actuelle
    if (startTime < formattedToday) {
      res.status(400).json({ "msg": "La date de début doit être postérieure à la date actuelle." });
      return
    }

    // Vérifier si la date de fin est postérieure à la date de début
    if (endTime < startTime) {
      res.status(400).json({ "msg": "La date de fin doit être postérieure à la date de début." });
      return
    }

    // Vérifier si la durée de réservation est de 45 minutes
    const diffInMinutes = (new Date(endTime) - new Date(startTime)) / (1000 * 60);
    if (diffInMinutes !== 45) {
      res.status(400).json({ "msg": "Vous ne pouvez réserver que des créneaux de 45 minutes." });
      return
    }

    // Vérifier si le terrain est disponible pour le créneau demandé
    let [existingReservations] = await conn.execute(
      `SELECT * FROM Booking 
      WHERE id_court = ? AND start_time < ? AND end_time > ?`,
      [req.params.id, endTime, startTime]
    );

    if (existingReservations.length > 0) {
      res.status(400).json({ "msg": "Nous sommes désolés, ce créneau pour le terrain demandé est déjà réservé." });
      return
    }
    
    // Définir la date du jour où la réservation a été effectué (format Y-m-d), au fuseau horaire de Paris (UTC+1)
    const dateBooking = new Date(parisTime).toISOString().split('T')[0];

    // Insérer la réservation dans la base de données
    let [rows3] = await conn.execute(`
    INSERT INTO Booking (id_user, id_court, start_time, end_time, date_booking, status)
    VALUES (?, ?, ?, ?, ?, 'confirmed')`,
    [userId, req.params.id, startTime, endTime, dateBooking]);

    const formattedStartDate = format(startTime, "d'/'MM'/'yyyy 'à' HH'h");
    const formattedEndDate = format(endTime, "d'/'MM'/'yyyy 'à' HH'h");

    // Répondre avec les données de réservation au format HAL
    res.set('Content-Type', 'application/hal+json');
    res.status(201);
    res.json({
      "_links": [{
        "self": hal.halLinkObject(`/terrains/${req.params.id}/reservations`, 'string'),
        "terrain": hal.halLinkObject(`/terrains/${req.params.id}`, 'string')
      }],
      "dateBooking": dateBooking,
      "for": req.body.pseudo,
      "status": `Réservation confirmée pour le terrain ${court[0].name} du ${formattedStartDate} au ${formattedEndDate}.`
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard."});
  }
});

/**
 * Réservation d'un terrain de badminton
 * Variation de la ressource avec les paramètres de requête d’URL (query)
 * Ajout pseudo dans les paramètres de la requête pour que ça soit accessible qu’au propriétaire de la réservation
 * Liste des réservations d'un terrain selon le statut (confirmed ou cancelled) : GET /terrains/:id/reservations/:pseudo?status={status}
 */
router.get('/terrains/:id/reservations/:pseudo', async function (req, res, next){

  const { status } = req.query;
  const { pseudo } = req.params;

  try {
    const conn = await db.mysql.createConnection(db.dsn); 

    // Récupérer l'utilisateur identifié par le pseudo
    let [users] = await conn.execute(`SELECT id_user FROM User WHERE pseudo = ?`, [pseudo]);
    
    // Vérifier si l'utilisateur existe
    if (users.length === 0) {
      res.status(403).json({ "msg": "Impossible de vous identifier, vous ne pouvez gérer vos réservations." });
      return
    } 

    const userId = users[0].id_user;
  
    // Récupérer la reservation demandée liée à l'id du terrain donné dans les paramètres de l'URL
    let query = 'SELECT * from Booking WHERE id_court = ?';
    const params = [req.params.id];

    // Ajouter la partie query de l’URL (si présent) à la requête SQL
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    let [rows] = await conn.execute(query, params);

    if (rows.length === 0) {
      res.status(404).json({ "msg": "Il n'existe aucune réservation pour ce terrain ou avec ce statut."});
      return
    }

    // Vérifier si l'utilisateur qui tente d'accéder à la ressource est le bon
    if (rows[0].id_user !== userId) {
      res.status(400).json({ "msg": "Vous n'avez pas les droits pour accéder à la réservation mentionnée." });
      return
    }

    // Répondre avec les données de réservation au format HAL
    res.status(200).json({
      "_links": {
        "self": { "href": `/terrains/${req.params.id}/reservations/${pseudo}`},
        "terrain": { "href": `/terrains/${req.params.id}`}
      },
      "_embedded": {
        "reservations": rows.map(row => hal.mapReservationToResourceObject(row, req.baseUrl)),
      },
      "nbReservations": rows.length
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard." });
  }
});

/**
 * Réservation d'un terrain de badminton
 * Annuler la réservation d'un terrain : DELETE /terrains/:id/reservations
 */
router.delete('/terrains/:id/reservations', async function (req, res, next) {

  const { pseudo, bookingId } = req.body;

  // Vérification des données requises
  if (!pseudo || !bookingId) {
    res.status(400).json({ "msg": "Merci de fournir toutes les données requises pour annuler une réservation : votre pseudo, et l'identifiant de réservation."});
    return
  }

  try {
    const conn = await db.mysql.createConnection(db.dsn);

    // Récupérer l'utilisateur identifié par le pseudo
    let [users] = await conn.execute(`SELECT id_user FROM User WHERE pseudo = ?`, [pseudo]);
    
    // Vérifier si l'utilisateur existe
    if (users.length === 0) {
      res.status(403).json({ "msg": "Impossible de vous identifier, vous ne pouvez gérer vos réservations." });
      return
    }

    const userId = users[0].id_user;

    // Récupérer la réservation demandée par l'id donné dans le corps de la requête et liée à l'id du terrain donné dans les paramètres de l'URL
    let [rows] = await conn.execute(`SELECT * FROM Booking WHERE id_booking = ? AND id_court = ?`, [bookingId, req.params.id]);

    // Vérifier si la réservation existe et/ou correspond au bon terrain
    if (rows.length === 0) {
      res.status(400).json({ "msg": "Impossible de trouver la réservation mentionnée. Réservation inexistante ou terrain incorrecte." });
      return
    } 

    // Vérifier si l'utilisateur qui tente d'accéder à la ressource est le bon
    if (rows[0].id_user !== users[0].id_user) {
      res.status(400).json({ "msg": "Vous n'avez pas les droits pour accéder à la réservation mentionnée." });
      return
    }
    
    // Annuler la réservation dans la base de données
    let [updateRows] = await conn.execute(`
      UPDATE Booking
      SET status='cancelled'
      WHERE id_booking = ? AND id_court = ? AND id_user = ? AND status = 'confirmed'
    `, [bookingId, req.params.id, userId]);

    // Vérifier si la réservation n'est pas déjà annulée
    if (updateRows.affectedRows === 0) {
      res.status(400).json({ "msg": "Vous ne pouvez pas annuler cette réservation pour ce terrain car elle est déjà annulée." });
      return
    }

    // Répondre avec les données de réservation au format HAL
    res.set('Content-Type', 'application/hal+json');
    res.status(201).json({
      "_links": [{
        "self": hal.halLinkObject(`/terrains/${req.params.id}/reservations`, 'string'),
        "terrain": hal.halLinkObject(`/terrains/${req.params.id}`, 'string'),
      }],
      "from": pseudo,
      "status": `La réservation numéro ${bookingId} associée au terrain ${req.params.id} a bien été annulée.`
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard." });
  }
});

module.exports = router;