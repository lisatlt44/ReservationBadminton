# Évaluation 2/2 - Développement API : système de réservation de terrains de badminton *RESTful* avec Node.js, Express.js, MySQL et Adminer

Un *projet* dockerisé de gestion des réservations de terrains de badminton via une API RESTful. Cette API est accompagnée d'un service de base de données relationnelles (MySQL) et d'un client graphique (Adminer).

- [Évaluation 2/2 - Développement API : système de réservation de terrains de badminton *RESTful* avec Node.js, Express.js, MySQL et Adminer](#systeme-de-reservation-de-terrains-de-badminton-restful-avec-nodejs-expressjs-mysql-et-adminer)
  - [Prérequis](#prérequis)
  - [Lancer le projet avec Compose](#lancer-le-projet-avec-compose)
  - [Tester](#tester)
    - [API](#api)
    - [Base de données](#base-de-données)
    - [Client graphique Adminer pour la base de données MySQL](#client-graphique-adminer-pour-la-base-de-données-mysql)
  - [Base de données](#base-de-données-1)
    - [ORM](#orm)
  - [Debuger lors du développement](#debuger-lors-du-développement)
    - [En ligne de commande avec docker](#en-ligne-de-commande-avec-docker)
    - [Avec Visual Studio Code](#avec-visual-studio-code)
  - [Documentation de l'API avec Swagger](#documentation-de-lapi-avec-swagger)
  - [Installer et servir de nouvelles dépendances](#installer-et-servir-de-nouvelles-dépendances)
  - [Arrêter le projet](#arrêter-le-projet)
  - [Améliorations](#améliorations)
  - [Conseils pour le développement](#conseils-pour-le-développement)
  - [Modules Node.Js notables](#modules-nodejs-notables)
  - [Autorisation avec JWT](#autorisation-avec-jwt)
  - [Ressources](#ressources)
    - [Docker](#docker)
    - [Express](#express)
    - [Swagger](#swagger)
    - [SGBDR](#sgbdr)
    - [Adminer](#adminer)


## Prérequis

Pour initialiser et exécuter ce projet, vous aurez besoin des éléments suivants :

- Node.js : Assurez-vous d'avoir Node.js installé localement. Vous pouvez le télécharger et l'installer depuis [nodejs.org](https://nodejs.org/en)
- Docker et Docker Compose :  Installez Docker et Docker Compose sur votre machine. Ces outils permettent de gérer les conteneurs pour cette application. Vous pouvez les obtenir sur [docker.com](https://www.docker.com/get-started/)

Clonage du dépôt
- N'oubliez pas de cloner le dépôt du projet sur votre machine locale, puis de vous placer à la racine du projet :

~~~
git clone <URL_DU_DÉPÔT>
cd nom_du_dépôt
~~~

> Attention, si vous désirez créer votre propre dépôt à partir des sources, n'oubliez pas de supprimer le dossier `.git`.

~~~
rm -R .git
git init
~~~

## Lancer le projet avec Compose

Fichiers d'environnement
- Dupliquez le fichier d'environnement `.env.dist` fourni dans le dépôt et renommez-le en `.env`. 

~~~
cp .env.dist .env
~~~

> Vous pouvez modifier les variables d'environnement si vous le souhaitez (des valeurs par défaut sont fournies).

Installation des dépendances
- Installez toutes les dépendances nécessaires pour le projet en exécutant la commande suivante :

~~~
npm install
~~~

> Avant d'exécuter la commande, assurez-vous d'être positionné correctement dans le répertoire */api*.

~~~
cd /api
~~~

Démarrer le projet

~~~
docker-compose up -d
~~~

## Tester

### API

Se rendre à l'URL [localhost:5001](http://localhost:5001), ou tester (avec [curl](https://curl.se/))

~~~
# Web humain (HTML)
curl --include localhost:5001
# API (JSON)
curl localhost:5001
~~~

### Base de données

Avec le client mysql (depuis la machine hôte) :

~~~bash
mysql -uroot -proot -Dmydb -h127.0.0.1 -P5002
~~~

Puis, dans le repl MySQL (session ouverte avec la commande précédente)

~~~SQL
-- Lister les utilisateurs MySQL
SELECT user FROM mysql.user;
-- Lister les users dans la base de départ
SELECT * FROM User;
~~~

Pour exécuter un script SQL en *Batch mode*

~~~bash
mysql -uroot -p -Dmydb -h127.0.0.1 -P5002 < script.sql
~~~

>Penser à modifier la valeur du port si vous l'avez changé dans le `.env`

>*Machine hôte* : la machine sur laquelle s’exécute les conteneurs Docker, *votre* machine

### Client graphique Adminer pour la base de données MySQL

Le starterpack vient avec [Adminer](https://www.adminer.org/), un gestionnaire de base de données à interface graphique, simple et puissant.

Se rendre sur l'URL [http://localhost:5003](http://localhost:5003) (par défaut) et se connecter avec les credentials *root* (login *root* et mot de passe *root* par défaut), ou ceux de l'utilisateur (`user` et `password` par défaut)

## Base de données

La base de données vient avec deux utilisateurs par défaut :

- `root` (administrateur), mot de passe : `root`
- `user` (utilisateur lambda), mot de passe : `password`

Pour accéder à la base de données :

- *Depuis* un autre conteneur (Node.js, Adminer) : `host` est `db`, le nom du service sur le réseau Docker
- *Depuis* la machine hôte (une application node, PHP exécutée sur votre machine, etc.) : `host` est `localhost` ou `127.0.0.1`. **Préférer utiliser l'adresse IP `127.0.0.1` plutôt que son alias `localhost`** pour faire référence à votre machine (interface réseau qui) afin éviter des potentiels conflits de configuration avec le fichier [socket](https://www.jetbrains.com/help/datagrip/how-to-connect-to-mysql-with-unix-sockets.html) (interface de connexion sous forme de fichier sur les systèmes UNIX) du serveur MySQL installé sur votre machine hôte (si c'est le cas).

## Debuger lors du développement

Inspecter les *logs* du conteneur Docker qui contiennent tout ce qui est écrit sur la sortie standard (avec `console.log()`). Les sources de l'application Node.js sont *watchées*, donc à chaque modification d'un fichier source l'application redémarre pour les prendre en compte automatiquement.

> Si l'application ne redémarre par automatiquement après une modification, redémarrez le conteneur Docker manuellement, ou avec la commande : 

~~~
docker-compose up -d
~~~

### En ligne de commande avec docker

~~~bash
#Suivi en temps réel des logs
docker logs -f rest-api-api 
~~~

### Avec Visual Studio Code

- Installer l'[extension officielle Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)
- Click droit sur le conteneur `rest-api-api` qui héberge l'application Node.js,  puis `View Logs`

## Installer et servir de nouvelles dépendances

A la racine de l'application, installer les dépendances désirées *via* `npm` :

~~~
cd /api
npm install <votre paquet>
~~~

## Arrêter le projet

~~~
docker-compose down
~~~

## Conseils pour visualiser les requêtes

- Installez l'application Hoppscotch, une alternative à *PostMan*, à partir de [hoppscotch.io](https://hoppscotch.io/).
  
> Bien qu'une version web soit disponible, l'application pour PC offre une expérience plus conviviale et complète.

- Ajoutez l'extension `Hoppscotch Browser Extension` à votre navigateur.
  
> Par exemple, sur Google, depuis [chromewebstore.google.com](https://chromewebstore.google.com/detail/amknoiejhlmhancpahfcfcfhllgkpbld).

- Accédez à [localhost:5001](http://localhost:5001), ouvrez l'extension et ajoutez une nouvelle origine (`Enter new origin`). Généralement, l'URL de la page active est automatiquement détectée dans la liste.

> Si elle n'est pas détectée, saisissez manuellement `http://localhost:5001`, puis cliquez sur *Add*.

- Dans l'application PC, rendez-vous en bas à gauche sur l'icône du "blason" correspondant au menu *Intercepteur*. Assurez-vous que la case `Extensions: v0.30` soit cochée. Vérifiez également que le bon moteur de recherche est sélectionné dans le menu *Intercepteur* des réglages.

Ces étapes préliminaires facilitent grandement les tests des requêtes du projet, accessibles depuis l'URL `http://localhost:5001`, et permettent de les classer par ressources ou autres.

> Remarque : Les requêtes nécessitant un corps de requête doivent présenter les données attendues au format *application/json*.

## Modules Node.Js utilisés au sein de ce projet

- [bodyParser](https://www.npmjs.com/package/body-parser), un parser du corps de requête pour les applications node. On s'en sert pour parser les représentations envoyées par le client dans nos contrôleurs avec l'instruction `app.use(bodyParser.urlencoded({ extended: true }));`
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken), une implémentation javascript du standard JSON Web Token, voir [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)
- [cors](https://www.npmjs.com/package/cors), un module middleware pour gérer la politique CORS (*Cross Origin Resource Sharing*)
- [mysql2](https://www.npmjs.com/package/mysql2), un client MySQL pour Node.js qui [utilise l'API des promesses](https://www.npmjs.com/package/mysql2#using-promise-wrapper) (contrairement à son prédécesseur [mysql](https://www.npmjs.com/package/mysql))

## Autorisation avec JWT

>JSON Web Token (JWT) is a compact, URL-safe means of *representing claims to be transferred between two parties* (Source: RFC7519)

Pour **autoriser** (et donc authentifier) l'utilisateur à interagir avec les ressources, on utilise un JSON Web Token. Implémentée dans le projet avec le package [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)

## Ressources

### Docker

- [Image Docker Node](https://hub.docker.com/_/node)
- [Image Docker MySQL](https://hub.docker.com/_/mysql)
- [Image Docker Adminer](https://hub.docker.com/_/adminer/)
- [Dockerizing a Node.js web app](https://nodejs.org/en/docs/guides/nodejs-docker-webapp)

### Express

- [Générateur d’applications Express](https://expressjs.com/fr/starter/generator.html), générer un projet pour démarrer
- [Routage](https://expressjs.com/fr/guide/routing.html), la documentation sur le routage d'Express
- [Pug](https://pugjs.org/api/getting-started.html), moteur de templates javascript installé par défaut avec Express
- [API JSON Web Token Authentication (JWT) sur Express.js](https://etienner.github.io/api-json-web-token-authentication-jwt-sur-express-js/), un bon tutoriel pour mettre en place des routes protégées par Json Web Token

### SGBDR

- [MySQL Docker Image, quick reference](https://hub.docker.com/_/mysql/)
- [mysql2](https://www.npmjs.com/package/mysql2), le driver node.js pour le SGBDR MySQL qui implémente l'API des promesses (contrairement à [mysql](https://www.npmjs.com/package/mysql))
- [Sequelize, Getting Started](https://sequelize.org/docs/v6/getting-started/), Sequelize, un ORM pour Node.js

### Adminer

- [Adminer](https://www.adminer.org/)
