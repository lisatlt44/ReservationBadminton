# Évaluation 2/2 - Développement API : système de réservations de terrains de badminton via une API *RESTful* avec Node.js, Express.js, MySQL et Adminer.

Un *projet* dockerisé de gestion des réservations de terrains de badminton via une API RESTful. Cette API est accompagnée d'un service de base de données relationnelles (MySQL) et d'un client graphique (Adminer).

- [Prérequis](#prérequis)
- [Lancer le projet avec Compose](#lancer-le-projet-avec-compose)
- [Tester](#tester)
  - [Erreur connue au démarrage](#erreur-connue-au-démarrage)
  - [API](#api)
  - [Base de données](#base-de-données)
  - [Client graphique Adminer pour la base de données MySQL](#client-graphique-adminer-pour-la-base-de-données-mysql)
- [Base de données](#base-de-données-1)
  - [Importation des données dans Adminer](#importation-des-données-dans-adminer)
- [Déboguer lors du développement](#déboguer-lors-du-développement)
  - [En ligne de commande avec docker](#en-ligne-de-commande-avec-docker)
  - [Avec Visual Studio Code](#avec-visual-studio-code)
- [Installer et servir de nouvelles dépendances](#installer-et-servir-de-nouvelles-dépendances)
- [Arrêter le projet](#arrêter-le-projet)
- [Conseils pour visualiser les requêtes](#conseils-pour-visualiser-les-requêtes)
- [Dépendances utilisées au sein de ce projet](#dépendances-utilisées-au-sein-de-ce-projet)
- [Conception](#conception)
  - [Dictionnaire des données](#dictionnaire-des-données)
- [Remarques](#remarques)
- [Références](#références)
  - [Docker](#docker)
  - [Express](#express)
  - [SGBDR](#sgbdr)
  - [Adminer](#adminer)

## Prérequis

Pour initialiser et exécuter ce projet, vous aurez besoin des éléments suivants :

- Node.js : Assurez-vous d'avoir Node.js installé localement. Vous pouvez le télécharger et l'installer depuis [nodejs.org](https://nodejs.org/en).
- Docker et Docker Compose :  Installez Docker et Docker Compose sur votre machine. Ces outils permettent de gérer les conteneurs pour ce projet. Vous pouvez les obtenir sur [docker.com](https://www.docker.com/get-started/).

Clonage du dépôt
- N'oubliez pas de cloner le dépôt du projet sur votre machine locale, puis de vous placer à la racine du projet :

~~~
git clone <URL_DU_DÉPÔT>
cd nom_du_dépôt
~~~

> Attention, si vous désirez créer votre propre dépôt à partir des sources, n'oubliez pas de supprimer le dossier `.git` en utilisant les commandes suivantes :

~~~
rm -R .git
git init
~~~

## Lancer le projet avec Compose

Fichiers d'environnement
- Dupliquez le fichier d'environnement `.env.dist` fourni dans le dépôt et renommez-le en `.env` :

~~~
cp .env.dist .env
~~~

> Vous pouvez modifier les variables d'environnement si vous le souhaitez (des valeurs par défaut sont fournies).

Installation des dépendances
- Installez toutes les dépendances nécessaires pour le projet en exécutant la commande suivante :

~~~
npm install
~~~

> Avant d'exécuter la commande, assurez-vous d'être positionné correctement dans le répertoire */api* :

~~~
cd /api
~~~

Base de données
- Assurez-vous d'importer la base de données fournie pour garantir le bon fonctionnement du projet. Pour ce faire, suivez les étapes d'importation disponibles [ici](#importation-des-données-dans-adminer).

Démarrer le projet

~~~
docker-compose up -d
~~~

## Tester

### Erreur connue au démarrage

**Il se peut que le serveur MySQl mette un peu de temps à démarrer, résultant en une erreur (`ECONNREFUSED`) de la tentative de connexion de l'application node qui est déjà active. Il suffit de sauvegarder un fichier source js (par exemple `app.js`) pour réinitialiser l'état de l'application et de la connexion à MySQL.**

### API

Pour accéder à l'API du projet, rendez-vous à l'URL [localhost:5001](http://localhost:5001) dans votre navigateur ou testez-la à l'aide d'un outil comme [Hoppscotch](https://hoppscotch.io/) ou [curl](https://curl.se/).

> L'utilisation de Hoppscotch est détaillée [ici](#conseils-pour-visualiser-les-requêtes)

Exemple avec `curl` :

~~~
# Web humain (HTML)
curl --include localhost:5001
# API (JSON)
curl --include localhost:5001/users
~~~

### Base de données

Pour interagir avec la base de données, vous pouvez utiliser différents outils. Voici comment vous connecter via la ligne de commande avec MySQL : 

~~~
mysql -uroot -proot -Dmydb -h127.0.0.1 -P5002
~~~

Dans la session MySQL ouverte, vous pouvez exécuter des requêtes SQL pour obtenir des informations spécifiques, telles que la liste des utilisateurs :

~~~SQL
-- Liste des utilisateurs MySQL
SELECT user FROM mysql.user;

-- Liste des utilisateurs dans la base de départ
SELECT * FROM User;
~~~

Pour exécuter un script SQL en mode *Batch* :

~~~bash
mysql -uroot -p -Dmydb -h127.0.0.1 -P5002 < script.sql
~~~

> Assurez-vous de modifier la valeur du port si vous l'avez changée dans le fichier `.env`.

> *Machine hôte* : Cela fait référence à la machine sur laquelle s’exécutent les conteneurs Docker, c'est-à-dire votre propre machine.

### Client graphique Adminer pour la base de données MySQL

Le starterpack vient avec [Adminer](https://www.adminer.org/), un gestionnaire de base de données à interface graphique, simple et puissant.

Se rendre sur l'URL [http://localhost:5003](http://localhost:5003) (par défaut) et se connecter avec les credentials *root* (login *root* et mot de passe *root* par défaut), ou ceux de l'utilisateur (`user` et `password` par défaut).

## Base de données

La configuration de la base de données comprend deux utilisateurs par défaut :

- `root` (administrateur), mot de passe : `root`
- `user` (utilisateur lambda), mot de passe : `password`

Pour accéder à la base de données :

- *Depuis un autre conteneur* (Node.js, Adminer) : `host` est défini comme `db`, qui est le nom du service dans le réseau Docker.
- *Depuis votre machine hôte* (une application node, PHP exécuté sur votre machine, etc.) : `host` est `localhost` ou `127.0.0.1`. **Préférer utiliser l'adresse IP `127.0.0.1` plutôt que son alias `localhost`** pour faire référence à votre machine afin d'éviter des potentiels conflits de configuration avec le fichier [socket](https://www.jetbrains.com/help/datagrip/how-to-connect-to-mysql-with-unix-sockets.html) (interface de connexion sous forme de fichier sur les systèmes UNIX) du serveur MySQL installé sur votre machine hôte (si applicable).

### Importation des données dans Adminer

Pour utiliser les tables et les données préexistantes dans le projet, importez le fichier SQL fourni dans votre interface Adminer :

1. Lancez Adminer en accédant à [http://localhost:5003](http://localhost:5003) dans votre navigateur.
2. Connectez-vous en utilisant les identifiants mentionnés ci-dessus (root ou user).
3. Accédez à la section d'importation dans l'interface Adminer et importez le fichier `mydb.sql` présent dans le projet.

Cela créera les tables et chargera les données prêtes à être utilisées dans le projet.

## Déboguer lors du développement

Inspecter les *logs* du conteneur Docker qui contiennent tout ce qui est écrit sur la sortie standard (avec `console.log()`). Les sources de l'application Node.js sont *watchées*, donc à chaque modification d'un fichier source l'application redémarre pour les prendre en compte automatiquement.

> Si l'application ne se redémarre pas automatiquement suite à une modification, bien que cela soit contraignant, veillez à redémarrer manuellement le conteneur Docker à chaque changement, ou utilisez la commande suivante : 

~~~
docker-compose up -d
~~~

### En ligne de commande avec docker

~~~bash
#Suivi en temps réel des logs
docker logs -f rest-api-api 
~~~

### Avec Visual Studio Code

- Installer l'[extension officielle Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker).
- Clic droit sur le conteneur `rest-api-api` qui héberge l'application Node.js,  puis `View Logs`.

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

## Dépendances utilisées au sein de ce projet

- **cookie-parser** (`~1.4.4`) : Middleware pour analyser les cookies des requêtes HTTP. Utile pour gérer les cookies dans l'application Express.

- **date-fns** (`^3.0.6`) : Bibliothèque utilitaire pour manipuler les dates en JavaScript. Offre des fonctions pour faciliter la manipulation, le formatage et la comparaison des dates.

- **debug** (`~2.6.9`) : Outil de débogage pour les applications Node.js. Permet d'inclure des informations de débogage dans les logs de l'application.

- **express** (`~4.16.1`) : Framework minimaliste pour créer des applications web avec Node.js. Simplifie la gestion des routes, des middlewares et des requêtes HTTP.

- **http-errors** (`~1.6.3`) : Utilitaire pour créer des erreurs HTTP avec des messages et des codes d'état. Utile pour générer des erreurs HTTP de manière simple et cohérente.

- **jsonwebtoken** (`^9.0.2`) : Implémentation JavaScript des JSON Web Tokens (JWT). Permet de créer, signer et vérifier les tokens d'authentification dans l'application.

- **morgan** (`~1.9.1`) : Middleware de logging des requêtes HTTP pour Express. Enregistre les détails des requêtes (URL, méthodes HTTP, codes de statut) dans les logs de l'application.

- **mysql** (`^2.18.1`) : Client MySQL pour Node.js. Établit des connexions à une base de données MySQL, exécute des requêtes et récupère les résultats.

- **mysql2** (`^3.6.2`) : Client MySQL amélioré pour Node.js utilisant l'API des promesses. Offre des fonctionnalités similaires à `mysql` mais utilise les promesses pour les opérations asynchrones.

- **pug** (`2.0.0-beta11`) : Moteur de templates JavaScript pour Express. Crée des vues HTML dynamiques en utilisant la syntaxe simplifiée de Pug (anciennement connu sous le nom de Jade).

Chacune de ces dépendances a joué un rôle essentiel dans le développement de l'API, contribuant ainsi au bon fonctionnement général du projet.

## Conception

### Dictionnaire des données

Légende :
- `AN` : **Alphanumérique**
- `N` : **Numérique**
- `A` : **Alphabétique**
- `D` : **Date (et DateTime)**
- `B` : **Booléen**


| Code                  | Désignation                                          | Type | Taille | Remarque                                    | Obligatoire |
|-----------------------|-------------------------------------------------------|------|--------|---------------------------------------------|-------------|
| `id_court`               | Identifiant du terrain                               | N    |    Entier encodé sur 64 bits    | Identifiant unique                           | Oui         |
| `name`                   | Nom du terrain                                       | A    |    1    | Chaîne de caractères représentant le nom du terrain | Oui         |
| `availability`           | Disponibilité du terrain                             | B    |    1    | Booléen indiquant la disponibilité (1 = true = disponible, 0 = false = indisponible)           | Oui         |
| `start_date_unavailable` | Date de début de l'indisponibilité temporaire        | D    |    20    | Date au format YYYY-mm-dd HH:mm:ss           | Non         |
| `end_date_unavailable`   | Date de fin de l'indisponibilité temporaire          | D    |    20    | Date au format YYYY-mm-dd HH:mm:ss           | Non         |
| `id_booking`             | Identifiant de la réservation                        | N    |    Entier encodé sur 64 bits    | Identifiant unique          | Oui         |
| `start_time`             | Date de début de réservation                         | D    |    20    | Date au format YYYY-mm-dd HH:mm:ss                     | Oui         |
| `end_time`               | Date de fin de réservation                           | D    |    20    | Date au format YYYY-mm-dd HH:mm:ss                     | Oui         |
| `date_booking`           | Date de quand la réservation est effectuée           | D    |    20    | Date au format YYYY-mm-dd            | Oui         |
| `statut`*                | Statut de la réservation                             | A    |    10    | Statut de la réservation (Confirmée, Annulée) | Oui    |
| `id_user`                | Identifiant de l'utilisateur                         | N    |    Entier encodé sur 64 bits    | Identifiant unique          | Oui         |
| `pseudo`                 | Nom de l'utilisateur                                 | AN   |    20    | Chaîne de caractères représentant le nom d'utilisateur | Oui         |
| `password`               | Mot de passe de l'utilisateur                        | AN   |   20     | Mot de passe de l'utilisateur                | Non         |
| `is_admin`               | Détermine si l'utilisateur est administrateur        | B    |    1    | Booléen indiquant le statut administrateur   | Oui         |


>* Le mot *status* est un mot-clef réservé par MySQL. On utilise donc le mot français *statut* ici.

## Remarques

Pendant le développement de ce projet, même en ayant suivi le modèle de départ du `starterpack-api-nodejs`, j'ai rencontré quelques difficultés avec la configuration initiale de Docker Compose, notamment pour jongler entre les conteneurs et leurs interactions. Mais en m'appuyant sur les guides et en faisant quelques ajustements dans les fichiers d'environnement, j'ai réussi à rapidement régler ces problèmes. A mes yeux, ça a été un projet assez long et demandant une certaine logique et minutie, mais il s'est avéré être une super occasion pour approfondir mes connaissances et compétences dans le développement d'API.

## Références

<!-- ### Docker

- [Image Docker Node](https://hub.docker.com/_/node)
- [Image Docker MySQL](https://hub.docker.com/_/mysql)
- [Image Docker Adminer](https://hub.docker.com/_/adminer/)
- [Dockerizing a Node.js web app](https://nodejs.org/en/docs/guides/nodejs-docker-webapp)

### Express

- [Générateur d’applications Express](https://expressjs.com/fr/starter/generator.html), générer un projet pour démarrer.
- [Routage](https://expressjs.com/fr/guide/routing.html), la documentation sur le routage d'Express.
- [Pug](https://pugjs.org/api/getting-started.html), moteur de templates javascript installé par défaut avec Express.
- [API JSON Web Token Authentication (JWT) sur Express.js](https://etienner.github.io/api-json-web-token-authentication-jwt-sur-express-js/), un bon tutoriel pour mettre en place des routes protégées par Json Web Token.

### SGBDR

- [mysql2](https://www.npmjs.com/package/mysql2), le driver node.js pour le SGBDR MySQL qui implémente l'API des promesses (contrairement à [mysql](https://www.npmjs.com/package/mysql))

### Adminer

- [Adminer](https://www.adminer.org/) -->
