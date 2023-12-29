-- Adminer 4.8.1 MySQL 8.2.0 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `Booking`;
CREATE TABLE `Booking` (
  `id_booking` int NOT NULL AUTO_INCREMENT,
  `id_user` int NOT NULL,
  `id_court` int NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `date_booking` date NOT NULL,
  `status` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id_booking`),
  KEY `id_court` (`id_court`),
  KEY `id_user` (`id_user`),
  CONSTRAINT `booking_ibfk_2` FOREIGN KEY (`id_court`) REFERENCES `Courts` (`id_court`),
  CONSTRAINT `booking_ibfk_3` FOREIGN KEY (`id_user`) REFERENCES `User` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `Courts`;
CREATE TABLE `Courts` (
  `id_court` int NOT NULL AUTO_INCREMENT,
  `name` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `availability` tinyint(1) NOT NULL,
  `start_date_unavailable` date DEFAULT NULL,
  `end_date_unavailable` date DEFAULT NULL,
  PRIMARY KEY (`id_court`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `Courts` (`id_court`, `name`, `availability`, `start_date_unavailable`, `end_date_unavailable`) VALUES
(1,	'A',	1,	NULL,	NULL),
(2,	'B',	1,	NULL,	NULL),
(3,	'C',	1,	NULL,	NULL),
(4,	'D',	1,	NULL,	NULL);

DROP TABLE IF EXISTS `User`;
CREATE TABLE `User` (
  `id_user` int NOT NULL AUTO_INCREMENT,
  `pseudo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `is_admin` tinyint(1) NOT NULL,
  PRIMARY KEY (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `User` (`id_user`, `pseudo`, `password`, `is_admin`) VALUES
(1,	'Lisa',	NULL,	0),
(2,	'admybad',	'admybad',	1),
(3,	'Paul',	NULL,	0);

-- 2023-12-29 02:27:53
