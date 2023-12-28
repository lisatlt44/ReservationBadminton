# Développement API 2/2 : *RESTful* système de réservation de terrains de badminton avec Node.js, Express.js, MySQL et Adminer

Un *starter pack* dockerisé d'une application web node.js pour développer une web API RESTful. L'API vient avec un service de base de données relationnelles (MySQL) et un client graphique (Adminer).

- [Starter pack: *RESTful* web API avec Node.js, Express.js, MySQL et Adminer](#starter-pack-restful-web-api-avec-nodejs-expressjs-mysql-et-adminer)
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

- installer [node.js](https://nodejs.org/en)
- installer [Docker](https://www.docker.com/get-started/) et [Compose](https://docs.docker.com/compose/)
- clôner le dépôt et se placer à la racine du projet

>N'oubliez pas de supprimer le dossier `.git` si vous désirez créer votre propre dépôt à partir des sources

~~~
rm -R .git
git init
~~~

## Lancer le projet avec Compose

Dupliquer le fichier `.env.dist`

~~~
cp .env.dist .env
~~~

> Vous pouvez modifier les variables d'environnement si vous le souhaitez (des valeurs par défaut sont fournies)

Installer les dépendances de l'application node et générer la doc swagger

~~~
pushd api
npm install
npm run swagger-autogen
popd
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

<!-- 
Depuis un script PHP sur la machine hote : 

- new PDO('mysql:host=localhost:5002;dbname=mydb', $user, $pass); OK
- new PDO('mysql:host=127.0.0.1:5002;dbname=mydb', $user, $pass); OK
- new PDO('mysql:host=127.0.0.1;dbname=mydb;port=5002', $user, $pass); OK
- new PDO('mysql:host=localhost;dbname=mydb;port=5002', $user, $pass); ERREUR ! Ici le port est ignoré et la connexion se fait par le socket de l'installation de mysql sur ma machine hote. Donc, le script PHP ne requête pas le serveur MySQL sur le conteneur mais celui sur ma machine hote. Cela se voit si on arrete le service MySQL sur la machine hote (systemctl stop/restart mysql)
~~~php
//Exemple en PHP
<?php
$user='root';
$pass='root';
$dbh = new PDO('mysql:host=127.0.0.1;port=5002;dbname=mydb', $user, $pass);
$ps = $dbh->query('SELECT * FROM User;');
$users = $ps->fetchAll();
var_dump($users);
~~~

Différence entre utiliser 127.0.0.1 et localhost :

Lorsque vous utilisez l'hôte "localhost", PDO essaie de se connecter à MySQL en utilisant un socket local plutôt que par TCP/IP. Le chemin du socket varie en fonction de la configuration de MySQL et de votre système.

Lorsque vous utilisez "127.0.0.1" comme hôte, PDO se connecte à MySQL en utilisant TCP/IP sur le port par défaut (généralement 3306) au lieu d'utiliser un socket local, sauf si le port est spécifié dans le DSN. Cela peut contourner les problèmes liés à la résolution du nom de socket local.

En conclusion : préférer utiliser 127.0.0.1 plutot que localhost pout s'épargner des conflits de configuration et être sûr de requêter le serveur MySQL conteneurisé.
 -->

### ORM

Pour interagir avec la base de données SQL, nous pouvons utiliser l'ORM [Sequelize](https://sequelize.org)

## Debuger lors du développement

Inspecter les *logs* du conteneur Docker qui contiennent tout ce qui est écrit sur la sortie standard (avec `console.log()`). Les sources de l'application Node.js sont *watchées*, donc à chaque modification d'un fichier source l'application redémarre pour les prendre en compte automatiquement

### En ligne de commande avec docker

~~~bash
#Suivi en temps réel des logs
docker logs -f demo-rest-api-api 
~~~

### Avec Visual Studio Code

- Installer l'[extension officielle Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)
- Click droit sur le conteneur `demo-rest-api-api` qui héberge l'application Node.js,  puis `View Logs`

## Documentation de l'API avec Swagger

Générer automatiquement la documentation de vos routes avec le module Swagger

Placez-vous dans le dossier `api` puis

~~~
node swagger.js
~~~

ou

~~~
npm run swagger-autogen
~~~

Se rendre à l'URL `/doc` pour accéder à l'UI de Swagger

## Installer et servir de nouvelles dépendances

A la racine de l'application, installer les dépendances désirées *via* `npm`

~~~
pushd api
npm install <votre paquet>
popd
~~~

## Arrêter le projet

~~~
docker-compose down
~~~

## Améliorations

Se débarrasser des étapes *avant* la dockerisation du projet (installation des dépendances). Le problème réside dans le fait que le volume monté *écrase* les fichiers lors de la construction de l'image. On ne peut donc pas en l'état simplement les déplacer dans l'image Docker.

## Conseils pour le développement

- Ouvrez une connexion MySQL pendant votre développement pour tester vos requêtes *avant* de les intégrer dans voter code
- Utiliser cURL pour tester rapidement vos requêtes HTTP. Ouvrez par exemple deux terminaux, l'un avec cURL et l'autre avec les logs de l'API pour débuger facilement votre système
- Installer le module `dotenv` pour placer le DSN (informations de connexion à la base) en dehors du code
- Pour tester des enchaînements de requêtes, écrivez un script SQL capable de remettre la base dans un état initial et contenant les requêtes à tester et un autre script pour effectuer les requêtes HTTP, et exécuter le tout en *une commande*

## Modules Node.Js notables

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

### Swagger

- [Swagger UI](https://github.com/swagger-api/swagger-ui), documenter une web API RESTful (même si elle devrait être *par définition* auto-documentée et *auto-descriptive*)
- [Swagger UI Express](https://www.npmjs.com/package/swagger-ui-express), module node.js pour générer la documentation de l'API avec Express
- [Swagger auto-gen](https://www.npmjs.com/package/swagger-autogen), module de génération *automatique* de la documentation de l'API dans une application node.js/Express. Voir notamment la documentation pour documenter automatiquement les endpoints (résumé, description, paramètres)
- [Swagger auto-gen: décrire des paramètres de formulaire POST](https://www.npmjs.com/package/swagger-autogen#parameters)
- [OpenAPI Specification](https://github.com/OAI/OpenAPI-Specification), un standard de description d'une web API comptabile avec REST

### SGBDR

- [MySQL Docker Image, quick reference](https://hub.docker.com/_/mysql/)
- [mysql2](https://www.npmjs.com/package/mysql2), le driver node.js pour le SGBDR MySQL qui implémente l'API des promesses (contrairement à [mysql](https://www.npmjs.com/package/mysql))
- [Sequelize, Getting Started](https://sequelize.org/docs/v6/getting-started/), Sequelize, un ORM pour Node.js

### Adminer

- [Adminer](https://www.adminer.org/)
