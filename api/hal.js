/**
 * Export des fonctions helpers pour la spécification HAL
 * Voir la spécification HAL : https://stateless.group/hal_specification.html
 * Voir la spécification HAL (RFC, source) : https://datatracker.ietf.org/doc/html/draft-kelly-json-hal
 */

/**
 * Retourne un Link Object, conforme à la spécification HAL
 * @param {*} url 
 * @param {*} type 
 * @param {*} name 
 * @param {*} templated 
 * @param {*} deprecation 
 * @returns 
 */
function halLinkObject(url, type = '', name = '', templated = false, deprecation = false) {

    return {
        "href": url,
        "templated": templated,
        ...(type && { "type": type }),
        ...(name && { "name": name }),
        ...(deprecation && { "deprecation": deprecation })
    }
}

/**
 * Retourne une représentation Ressource Object (HAL) d'un terrain
 * @param {*} terrainData Données brutes d'un terrain
 * @returns un Ressource Object Terrain (spec HAL)
 */
function mapTerraintoResourceObject(terrainData, baseURL) {
    return {
        "_links": [{
            "self": halLinkObject(baseURL + '/terrains' + '/' + terrainData.id_court, 'string'),
            "reservations": halLinkObject(baseURL + '/terrains' + '/' + terrainData.id_court + '/reservations', 'string')
        }],
        "id_court": terrainData.id_court,
        "court_name": terrainData.name,
        "availability": terrainData.availability,
        "start_date_unavailable": terrainData.start_date_unavailable,
        "end_date_unavailable": terrainData.end_date_unavailable
    }
}

/**
 * Retourne une représentation Ressource Object (HAL) d'une réservation
 * @param {*} reservationData Données brutes d'une réservation
 * @returns un Ressource Object Réservation (spec HAL)
 */
function mapReservationToResourceObject(data, baseURL) {
    return {
        "_links": [{
            "self": halLinkObject(`${baseURL}/terrains/${data.id_court}/reservations`, 'string')
        }],
        "id_booking": data.id_booking,
        "id_user": data.id_user,
        "id_court": data.id_court,
        "start_time": data.start_time,
        "end_time": data.end_time,
        "booking_date": data.date_booking,
        "status": data.status
    }
}

/**
 * Retourne une représentation Ressource Object (HAL) d'un utilisateur
 * @param {*} userData Données brutes d'un utilisateur
 * @returns un Ressource Object Utilisateur (spec HAL)
 */
function mapUsertoResourceObject(data, baseURL) {
    return {
        "_links": [{
            "self": halLinkObject(`${baseURL}/users/${data.id_user}`, 'string')
        }],
        "id_user": data.id_user,
        "pseudo": data.pseudo,
        "password": data.password,
        "is_admin": data.is_admin,
    }
}

module.exports = { halLinkObject, mapTerraintoResourceObject, mapReservationToResourceObject, mapUsertoResourceObject };
