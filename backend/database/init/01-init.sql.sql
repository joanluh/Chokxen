-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 10-10-2026 a las 11:50:17
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `chokxen`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `clienteId` int(11) NOT NULL,
  `codigoCliente` varchar(50) DEFAULT NULL,
  `nombreUsuario` varchar(50) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `passwordHash` varchar(255) DEFAULT NULL,
  `rol` varchar(20) DEFAULT NULL,
  `plan` varchar(20) DEFAULT NULL,
  `creditosVirtuales` decimal(10,2) DEFAULT NULL,
  `fechaRegistro` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`clienteId`, `codigoCliente`, `nombreUsuario`, `correo`, `passwordHash`, `rol`, `plan`, `creditosVirtuales`, `fechaRegistro`) VALUES
(1, NULL, 'Femboy1', 'd4ansa04@gmail.com', '$2b$12$z1usbB7K9w.b4Pa6kisC8OuRD4swEDCRsc9ck57g/Sh9rXj3MkiMC', 'Cliente', 'Premium', 0.00, '2026-10-09 11:09:58'),
(3, NULL, 'Icaro', 'goku@jk.com', '$2b$12$koSv4bPMyDzmVDuuMc/kE.AsLJ/zZMy22tDQRaR5mg1.fOsBSP8gS', 'Cliente', 'Basico', 0.00, '2026-10-09 11:21:28'),
(4, NULL, 'Juan', 'choksen@sport.com', '$2b$12$SSCjBJTVj6CuxalpzuNfPeHWyg7cw9uWxL4yb/30XqCZLX5syacZe', 'Cliente', 'Premium', 0.00, '2026-10-09 15:35:01');


CREATE TABLE `paises` (
  `idPais` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


INSERT INTO `paises` (`idPais`, `nombre`) VALUES
(1, 'México'),
(2, 'Argentina'),
(3, 'España'),
(4, 'Brasil');

CREATE TABLE `ligas` (
  `idLiga` int(11) NOT NULL,
  `paisId` int(11) NOT NULL,
  `nombreLiga` varchar(150) NOT NULL,
  `tipo` enum('liga','copa','internacional') NOT NULL,
  `temporadaActual` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


INSERT INTO `ligas` (`idLiga`, `paisId`, `nombreLiga`, `tipo`, `temporadaActual`) VALUES
(1, 1, 'Liga MX', 'liga', '2026/2027'),
(2, 2, 'Liga Profesional de Fútbol', 'liga', '2026'),
(3, 3, 'LaLiga EA Sports', 'liga', '2026/2027'),
(4, 4, 'Brasileirão Série A', 'liga', '2026');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `equipos`
--

CREATE TABLE `equipos` (
  `equipoId` int(11) NOT NULL,
  `ligaId` int(11) NOT NULL,
  `fechaFundacion` datetime NOT NULL,
  `nombreEquipo` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `equipos`
--

INSERT INTO `equipos` (`equipoId`, `ligaId`, `fechaFundacion`, `nombreEquipo`) VALUES
(1, 1, '1916-10-12 00:00:00', 'América'),
(2, 1, '1916-08-15 00:00:00', 'Atlas'),
(3, 1, '2013-05-28 00:00:00', 'Atlético de San Luis'),
(4, 1, '1927-03-22 00:00:00', 'Cruz Azul'),
(5, 1, '2006-11-06 00:00:00', 'FC Juárez'),
(6, 1, '1906-05-08 00:00:00', 'Guadalajara (Chivas)'),
(7, 1, '1944-08-20 00:00:00', 'León'),
(8, 1, '2020-06-08 00:00:00', 'Mazatlán FC'),
(9, 1, '1943-06-28 00:00:00', 'Monterrey'),
(10, 1, '1923-11-01 00:00:00', 'Necaxa'),
(11, 1, '1901-07-13 00:00:00', 'Pachuca'),
(12, 1, '1944-05-14 00:00:00', 'Puebla'),
(13, 1, '1950-11-21 00:00:00', 'Querétaro'),
(14, 1, '1983-09-04 00:00:00', 'Santos Laguna'),
(15, 1, '1960-08-25 00:00:00', 'Tigres UANL'),
(16, 1, '2007-01-10 00:00:00', 'Tijuana'),
(17, 1, '1917-02-12 00:00:00', 'Toluca'),
(18, 1, '1954-09-12 00:00:00', 'Pumas UNAM'),
(19, 2, '1904-08-15 00:00:00', 'Argentinos Juniors'),
(20, 2, '1902-09-27 00:00:00', 'Atlético Tucumán'),
(21, 2, '1896-01-21 00:00:00', 'Banfield'),
(22, 2, '1904-04-10 00:00:00', 'Barracas Central'),
(23, 2, '1905-03-19 00:00:00', 'Belgrano'),
(24, 2, '1905-04-03 00:00:00', 'Boca Juniors'),
(25, 2, '1919-06-03 00:00:00', 'Central Córdoba (SdE)'),
(26, 2, '1935-03-20 00:00:00', 'Defensa y Justicia'),
(27, 2, '1931-02-22 00:00:00', 'Deportivo Riestra'),
(28, 2, '1905-08-04 00:00:00', 'Estudiantes de La Plata'),
(29, 2, '1887-06-03 00:00:00', 'Gimnasia y Esgrima La Plata'),
(30, 2, '1921-06-01 00:00:00', 'Godoy Cruz'),
(31, 2, '1908-11-01 00:00:00', 'Huracán'),
(32, 2, '1905-03-25 00:00:00', 'Independiente'),
(33, 2, '1913-01-24 00:00:00', 'Independiente Rivadavia'),
(34, 2, '1919-08-08 00:00:00', 'Instituto'),
(35, 2, '1915-01-03 00:00:00', 'Lanús'),
(36, 2, '1903-11-03 00:00:00', 'Newells Old Boys'),
(37, 2, '1905-05-25 00:00:00', 'Platense'),
(38, 2, '1904-11-03 00:00:00', 'Racing Club'),
(39, 2, '1901-05-25 00:00:00', 'River Plate'),
(40, 2, '1889-12-24 00:00:00', 'Rosario Central'),
(41, 2, '1909-08-04 00:00:00', 'San Lorenzo'),
(42, 2, '1907-09-27 00:00:00', 'San Martín (SJ)'),
(43, 2, '1913-10-12 00:00:00', 'Talleres de Córdoba'),
(44, 2, '1902-08-02 00:00:00', 'Tigre'),
(45, 2, '1907-04-15 00:00:00', 'Unión de Santa Fe'),
(46, 2, '1910-01-01 00:00:00', 'Vélez Sarsfield'),
(47, 3, '1898-06-14 00:00:00', 'Athletic Club'),
(48, 3, '1903-04-26 00:00:00', 'Atlético de Madrid'),
(49, 3, '1920-10-24 00:00:00', 'CA Osasuna'),
(50, 3, '1921-01-23 00:00:00', 'Deportivo Alavés'),
(51, 3, '1899-11-29 00:00:00', 'FC Barcelona'),
(52, 3, '1983-07-08 00:00:00', 'Getafe CF'),
(53, 3, '1930-07-23 00:00:00', 'Girona FC'),
(54, 3, '1923-08-23 00:00:00', 'RC Celta de Vigo'),
(55, 3, '1916-03-05 00:00:00', 'RCD Mallorca'),
(56, 3, '1900-10-28 00:00:00', 'RCD Espanyol'),
(57, 3, '1924-05-29 00:00:00', 'Rayo Vallecano'),
(58, 3, '1907-09-12 00:00:00', 'Real Betis'),
(59, 3, '1902-03-06 00:00:00', 'Real Madrid'),
(60, 3, '1909-09-07 00:00:00', 'Real Sociedad'),
(61, 3, '1890-01-25 00:00:00', 'Sevilla FC'),
(62, 3, '1949-08-22 00:00:00', 'UD Las Palmas'),
(63, 3, '1919-03-18 00:00:00', 'Valencia CF'),
(64, 3, '1923-03-10 00:00:00', 'Villarreal CF'),
(65, 4, '1924-03-26 00:00:00', 'Athletico Paranaense'),
(66, 4, '1937-04-02 00:00:00', 'Atlético Goianiense'),
(67, 4, '1908-03-25 00:00:00', 'Atlético Mineiro'),
(68, 4, '1931-01-01 00:00:00', 'Bahia'),
(69, 4, '1904-07-01 00:00:00', 'Botafogo'),
(70, 4, '1910-09-01 00:00:00', 'Corinthians'),
(71, 4, '1947-05-13 00:00:00', 'Criciúma'),
(72, 4, '1921-01-02 00:00:00', 'Cruzeiro'),
(73, 4, '2001-12-12 00:00:00', 'Cuiabá'),
(74, 4, '1895-12-16 00:00:00', 'Flamengo'),
(75, 4, '1902-07-21 00:00:00', 'Fluminense'),
(76, 4, '1918-10-18 00:00:00', 'Fortaleza'),
(77, 4, '1903-09-15 00:00:00', 'Grêmio'),
(78, 4, '1909-04-04 00:00:00', 'Internacional'),
(79, 4, '1913-06-29 00:00:00', 'Juventude'),
(80, 4, '1914-08-26 00:00:00', 'Palmeiras'),
(81, 4, '1928-01-08 00:00:00', 'Red Bull Bragantino'),
(82, 4, '1930-01-25 00:00:00', 'São Paulo'),
(83, 4, '1898-08-21 00:00:00', 'Vasco da Gama'),
(84, 4, '1899-05-13 00:00:00', 'Vitória');







CREATE TABLE `preferenciasusuario` (
  `idPreferenciasUsuario` int(11) NOT NULL,
  `clienteId` int(11) NOT NULL,
  `equipoFavoritoId` int(11) NOT NULL,
  `ligaFavoritaId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `preferenciasusuario`
--

INSERT INTO `preferenciasusuario` (`idPreferenciasUsuario`, `clienteId`, `equipoFavoritoId`, `ligaFavoritaId`) VALUES
(1, 1, 18, 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`clienteId`),
  ADD UNIQUE KEY `codigoCliente` (`codigoCliente`),
  ADD UNIQUE KEY `nombreUsuario` (`nombreUsuario`),
  ADD UNIQUE KEY `correo` (`correo`),
  ADD KEY `ix_clientes_clienteId` (`clienteId`);

--
-- Indices de la tabla `equipos`
--
ALTER TABLE `equipos`
  ADD PRIMARY KEY (`equipoId`),
  ADD KEY `ligaId` (`ligaId`);

--
-- Indices de la tabla `ligas`
--
ALTER TABLE `ligas`
  ADD PRIMARY KEY (`idLiga`),
  ADD KEY `paisId` (`paisId`);

--
-- Indices de la tabla `paises`
--
ALTER TABLE `paises`
  ADD PRIMARY KEY (`idPais`);

--
-- Indices de la tabla `preferenciasusuario`
--
ALTER TABLE `preferenciasusuario`
  ADD PRIMARY KEY (`idPreferenciasUsuario`),
  ADD UNIQUE KEY `clienteId` (`clienteId`),
  ADD KEY `equipoFavoritoId` (`equipoFavoritoId`),
  ADD KEY `ligaFavoritaId` (`ligaFavoritaId`),
  ADD KEY `ix_PreferenciasUsuario_idPreferenciasUsuario` (`idPreferenciasUsuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `clienteId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `equipos`
--
ALTER TABLE `equipos`
  MODIFY `equipoId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT de la tabla `ligas`
--
ALTER TABLE `ligas`
  MODIFY `idLiga` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `paises`
--
ALTER TABLE `paises`
  MODIFY `idPais` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `preferenciasusuario`
--
ALTER TABLE `preferenciasusuario`
  MODIFY `idPreferenciasUsuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `equipos`
--
ALTER TABLE `equipos`
  ADD CONSTRAINT `equipos_ibfk_1` FOREIGN KEY (`ligaId`) REFERENCES `ligas` (`idLiga`);

--
-- Filtros para la tabla `ligas`
--
ALTER TABLE `ligas`
  ADD CONSTRAINT `ligas_ibfk_1` FOREIGN KEY (`paisId`) REFERENCES `paises` (`idPais`);

--
-- Filtros para la tabla `preferenciasusuario`
--
ALTER TABLE `preferenciasusuario`
  ADD CONSTRAINT `preferenciasusuario_ibfk_1` FOREIGN KEY (`clienteId`) REFERENCES `clientes` (`clienteId`),
  ADD CONSTRAINT `preferenciasusuario_ibfk_2` FOREIGN KEY (`equipoFavoritoId`) REFERENCES `equipos` (`equipoId`),
  ADD CONSTRAINT `preferenciasusuario_ibfk_3` FOREIGN KEY (`ligaFavoritaId`) REFERENCES `ligas` (`idLiga`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
