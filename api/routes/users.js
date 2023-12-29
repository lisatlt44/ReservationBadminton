var express = require('express');
var router = express.Router();
var db = require('../db')
var hal = require('../hal')

/**
 * Routing des ressources liées aux utilisateurs
 * Aucune requête GET pour les utilisateurs car ce ne sont pas des informations exposées par le système !
 */

/* Ajouter un utilisateur non admin : POST /users */
router.post('/users', async function (req, res, next) {

  // Vérifier les données requises
  if (!req.body.pseudo) {
    res.status(400).json({ "msg": "Merci de fournir un pseudo pour ajouter un nouvel utilisateur." });
    return
  }

  try {
    const conn = await db.mysql.createConnection(db.dsn);

    // Insérer l'utilisateur dans la base de données
    let [rows] = await conn.execute(`
    INSERT INTO User (pseudo, is_admin)
    VALUES (?, 0)`,
    [req.body.pseudo]);

    // Récupérer l'utilisateur identifié par le pseudo
    let [users] = await conn.execute(`SELECT id_user FROM User WHERE pseudo = ?`, [req.body.pseudo]);

    // Vérifier si l'utilisateur s'est correctement ajouté
    if (users.length === 0) {
      res.status(403).json({ "msg": "Une erreur est survenue lors de l'ajout de l'utilisateur. Veuillez réessayer." });
      return
    }

    const userId = users[0].id_user;

    // Répondre avec les données de l'utilisateur au format HAL
    res.set('Content-Type', 'application/hal+json');
    res.status(201);
    res.json({
      "_links": [{
        "self": hal.halLinkObject(`/users`, 'string'),
        "utilisateur": hal.halLinkObject(`/users/${userId}`, 'string')
      }],
      "status": `L'utilisateur ${req.body.pseudo} a bien été ajouté à la liste des utilisateurs.`
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard."});
  }
});

module.exports = router;