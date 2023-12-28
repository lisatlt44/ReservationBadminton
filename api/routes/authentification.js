var express = require('express');
var router = express.Router();
var db = require('../db');
var hal = require('../hal');
var jwt = require('jsonwebtoken');

/**
 * Secret conservé côté serveur pour signer les JWT
 */
const SECRET = 'mysecretkey'

/**
 * Récupère le bearer token
 * @param {*} headerValue 
 * @returns 
 */
const extractBearerToken = headerValue => {
  if (typeof headerValue !== 'string') {
    return false
  }

  const matches = headerValue.match(/(bearer)\s+(\S+)/i)

  return matches && matches[2]
}

/* Fonction middleware de vérification du token */
const checkTokenMiddleware = (req, res, next) => {

  // Récupération du token
  const token = req.headers.authorization && extractBearerToken(req.headers.authorization)

  // Présence d'un token
  if (!token) {
    return res.status(401).json({ "msg": "Vous n'êtes pas autorisé·e à accéder à cette ressource." })
  }

  // Véracité du token (token non modifié)
  jwt.verify(token, SECRET, (err, decodedToken) => {
    if (err) {
      res.status(401).json({ "msg": "Vous n'êtes pas autorisé·e à accéder à cette ressource. "})
    } else {
      return next()
    }
  })
}

/* Ressource "s'authentifier": fournit un JWT au client s'il s'authentifie et est un administrateur du système */
router.post('/login', async (req, res) => {

  // Pas d'information à traiter
  if (!req.body.pseudo || !req.body.password) {
    return res.status(400).json({ message: 'Impossible de vous authentifier : mauvais pseudo ou mot de passe.' })
  }

  const conn = await db.mysql.createConnection(db.dsn);

  try {
    // Identification et authentification
    const [rows] = await conn.execute(
      'SELECT pseudo FROM User WHERE pseudo = ? AND password = ? AND is_admin = 1',
      [req.body.pseudo, req.body.password]);

    user = {
      "pseudo": (rows[0]).pseudo,
      "is_admin": 1,
    }

    const token = jwt.sign({
      username: user.pseudo,
      is_admin: user.is_admin,
    }, SECRET, { expiresIn: 120 })

    return res.status(201).json({
      "_links": {
        "self": hal.halLinkObject('/login'),
        "terrains": hal.halLinkObject('/terrains'),
        "reservations": hal.halLinkObject('/terrains/{id}/reservations', 'string', 'Liste des réservations pour un terrain donné', true),
        "utilisateurs": hal.halLinkObject('/users')
      },
      "access_token": token
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({ "msg": "Nous rencontrons des difficultés, merci de réessayer plus tard." });
  }
});

module.exports = { router, checkTokenMiddleware };