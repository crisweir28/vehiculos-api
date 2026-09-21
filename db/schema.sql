-- MySQL dump 10.13  Distrib 9.4.0, for Win64 (x86_64)
--
-- Host: localhost    Database: vehilog
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `areas`
--

DROP TABLE IF EXISTS `areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `areas` (
  `id` bigint NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `citas`
--

DROP TABLE IF EXISTS `citas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `citas` (
  `id` bigint NOT NULL,
  `oficio` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estatus` enum('PENDIENTE','AGENDADA','ATENDIDA','CANCELADA','RECHAZADA') COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombres` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ap_paterno` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ap_materno` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_visitante` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_anfitrion` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `tipo` enum('visita','vehiculo') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'visita',
  `veh_placas` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `veh_marca` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `veh_modelo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `veh_color` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `docs_check` json DEFAULT NULL,
  `documentos` json DEFAULT NULL,
  `token_aprobacion` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accion_por` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `oficio` (`oficio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `config`
--

DROP TABLE IF EXISTS `config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `config` (
  `id` int NOT NULL DEFAULT '1',
  `empresa` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `app_nombre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fuente` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tamano` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_bg` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_surface` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_accent` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_text` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_header` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo` mediumtext COLLATE utf8mb4_unicode_ci,
  `logo_size` int DEFAULT '120',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `movimientos`
--

DROP TABLE IF EXISTS `movimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos` (
  `id` bigint NOT NULL,
  `vehiculo_id` bigint NOT NULL,
  `placas` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('SALIDA','COMPLETADO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `conductor` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `destino` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_salida` date DEFAULT NULL,
  `hora_salida` time DEFAULT NULL,
  `fecha_entrada` date DEFAULT NULL,
  `hora_entrada` time DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `registrado_por` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `vehiculo_id` (`vehiculo_id`),
  CONSTRAINT `movimientos_ibfk_1` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `registros`
--

DROP TABLE IF EXISTS `registros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registros` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `folio` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_entrada` date NOT NULL,
  `hora_entrada` time NOT NULL,
  `fecha_salida` date DEFAULT NULL,
  `hora_salida` time DEFAULT NULL,
  `tipo_movimiento` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ENTRADA',
  `nombre_conductor` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `empresa` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `placas` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `marca` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `oficio_cita` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `docs_verificados` json DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `observaciones_salida` text COLLATE utf8mb4_unicode_ci,
  `estatus` enum('ACTIVO','COMPLETADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVO',
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `folio` (`folio`)
) ENGINE=InnoDB AUTO_INCREMENT=132 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `resets`
--

DROP TABLE IF EXISTS `resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resets` (
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expira_en` bigint NOT NULL,
  PRIMARY KEY (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sesiones`
--

DROP TABLE IF EXISTS `sesiones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sesiones` (
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('admin','operador') COLLATE utf8mb4_unicode_ci NOT NULL,
  `creada_en` bigint NOT NULL,
  PRIMARY KEY (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` bigint NOT NULL,
  `usuario` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('admin','operador') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'operador',
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario` (`usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `v_citas_hoy`
--

DROP TABLE IF EXISTS `v_citas_hoy`;
/*!50001 DROP VIEW IF EXISTS `v_citas_hoy`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_citas_hoy` AS SELECT 
 1 AS `id`,
 1 AS `oficio`,
 1 AS `estatus`,
 1 AS `hora`,
 1 AS `nombre_completo`,
 1 AS `telefono`,
 1 AS `email_visitante`,
 1 AS `area`,
 1 AS `email_anfitrion`,
 1 AS `tipo`,
 1 AS `veh_placas`,
 1 AS `veh_marca`,
 1 AS `veh_modelo`,
 1 AS `accion_por`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_dashboard_stats`
--

DROP TABLE IF EXISTS `v_dashboard_stats`;
/*!50001 DROP VIEW IF EXISTS `v_dashboard_stats`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_dashboard_stats` AS SELECT 
 1 AS `total_registros`,
 1 AS `registros_activos`,
 1 AS `registros_completados`,
 1 AS `registros_hoy`,
 1 AS `total_citas`,
 1 AS `citas_hoy`,
 1 AS `citas_pendientes`,
 1 AS `citas_agendadas`,
 1 AS `total_vehiculos`,
 1 AS `vehiculos_disponibles`,
 1 AS `vehiculos_en_ruta`,
 1 AS `vehiculos_mantenimiento`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_registros_activos`
--

DROP TABLE IF EXISTS `v_registros_activos`;
/*!50001 DROP VIEW IF EXISTS `v_registros_activos`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_registros_activos` AS SELECT 
 1 AS `id`,
 1 AS `folio`,
 1 AS `fecha_entrada`,
 1 AS `hora_entrada`,
 1 AS `nombre_conductor`,
 1 AS `empresa`,
 1 AS `telefono`,
 1 AS `placas`,
 1 AS `marca`,
 1 AS `modelo`,
 1 AS `color`,
 1 AS `oficio_cita`,
 1 AS `observaciones`,
 1 AS `creado_en`,
 1 AS `minutos_en_sitio`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_resumen_flotilla`
--

DROP TABLE IF EXISTS `v_resumen_flotilla`;
/*!50001 DROP VIEW IF EXISTS `v_resumen_flotilla`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_resumen_flotilla` AS SELECT 
 1 AS `id`,
 1 AS `placas`,
 1 AS `marca`,
 1 AS `modelo`,
 1 AS `color`,
 1 AS `anio`,
 1 AS `num_econ`,
 1 AS `estatus`,
 1 AS `conductor_actual`,
 1 AS `destino`,
 1 AS `fecha_salida`,
 1 AS `hora_salida`,
 1 AS `obs_salida`,
 1 AS `registrado_por`,
 1 AS `minutos_en_ruta`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `vehiculos`
--

DROP TABLE IF EXISTS `vehiculos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiculos` (
  `id` bigint NOT NULL,
  `placas` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `marca` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modelo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `anio` smallint DEFAULT NULL,
  `num_econ` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estatus` enum('DISPONIBLE','EN RUTA','MANTENIMIENTO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DISPONIBLE',
  `conductor_actual` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `movimiento_id` bigint DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `creado_por` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mantenimiento` json DEFAULT NULL,
  `mantenimientos` json DEFAULT NULL,
  `actualizado_en` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `placas` (`placas`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Final view structure for view `v_citas_hoy`
--

/*!50001 DROP VIEW IF EXISTS `v_citas_hoy`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_citas_hoy` AS select `c`.`id` AS `id`,`c`.`oficio` AS `oficio`,`c`.`estatus` AS `estatus`,`c`.`hora` AS `hora`,concat(`c`.`nombres`,' ',`c`.`ap_paterno`,ifnull(concat(' ',`c`.`ap_materno`),'')) AS `nombre_completo`,`c`.`telefono` AS `telefono`,`c`.`email_visitante` AS `email_visitante`,`c`.`area` AS `area`,`c`.`email_anfitrion` AS `email_anfitrion`,`c`.`tipo` AS `tipo`,`c`.`veh_placas` AS `veh_placas`,`c`.`veh_marca` AS `veh_marca`,`c`.`veh_modelo` AS `veh_modelo`,`c`.`accion_por` AS `accion_por` from `citas` `c` where (`c`.`fecha` = curdate()) order by `c`.`hora` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_dashboard_stats`
--

/*!50001 DROP VIEW IF EXISTS `v_dashboard_stats`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_dashboard_stats` AS select (select count(0) from `registros`) AS `total_registros`,(select count(0) from `registros` where (`registros`.`estatus` = 'ACTIVO')) AS `registros_activos`,(select count(0) from `registros` where (`registros`.`estatus` = 'COMPLETADO')) AS `registros_completados`,(select count(0) from `registros` where (`registros`.`fecha_entrada` = curdate())) AS `registros_hoy`,(select count(0) from `citas`) AS `total_citas`,(select count(0) from `citas` where (`citas`.`fecha` = curdate())) AS `citas_hoy`,(select count(0) from `citas` where (`citas`.`estatus` = 'PENDIENTE')) AS `citas_pendientes`,(select count(0) from `citas` where (`citas`.`estatus` = 'AGENDADA')) AS `citas_agendadas`,(select count(0) from `vehiculos`) AS `total_vehiculos`,(select count(0) from `vehiculos` where (`vehiculos`.`estatus` = 'DISPONIBLE')) AS `vehiculos_disponibles`,(select count(0) from `vehiculos` where (`vehiculos`.`estatus` = 'EN RUTA')) AS `vehiculos_en_ruta`,(select count(0) from `vehiculos` where (`vehiculos`.`estatus` = 'MANTENIMIENTO')) AS `vehiculos_mantenimiento` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_registros_activos`
--

/*!50001 DROP VIEW IF EXISTS `v_registros_activos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_registros_activos` AS select `r`.`id` AS `id`,`r`.`folio` AS `folio`,`r`.`fecha_entrada` AS `fecha_entrada`,`r`.`hora_entrada` AS `hora_entrada`,`r`.`nombre_conductor` AS `nombre_conductor`,`r`.`empresa` AS `empresa`,`r`.`telefono` AS `telefono`,`r`.`placas` AS `placas`,`r`.`marca` AS `marca`,`r`.`modelo` AS `modelo`,`r`.`color` AS `color`,`r`.`oficio_cita` AS `oficio_cita`,`r`.`observaciones` AS `observaciones`,`r`.`creado_en` AS `creado_en`,timestampdiff(MINUTE,timestamp(`r`.`fecha_entrada`,`r`.`hora_entrada`),now()) AS `minutos_en_sitio` from `registros` `r` where (`r`.`estatus` = 'ACTIVO') order by `r`.`fecha_entrada` desc,`r`.`hora_entrada` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_resumen_flotilla`
--

/*!50001 DROP VIEW IF EXISTS `v_resumen_flotilla`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_resumen_flotilla` AS select `v`.`id` AS `id`,`v`.`placas` AS `placas`,`v`.`marca` AS `marca`,`v`.`modelo` AS `modelo`,`v`.`color` AS `color`,`v`.`anio` AS `anio`,`v`.`num_econ` AS `num_econ`,`v`.`estatus` AS `estatus`,`v`.`conductor_actual` AS `conductor_actual`,`m`.`destino` AS `destino`,`m`.`fecha_salida` AS `fecha_salida`,`m`.`hora_salida` AS `hora_salida`,`m`.`observaciones` AS `obs_salida`,`m`.`registrado_por` AS `registrado_por`,timestampdiff(MINUTE,timestamp(`m`.`fecha_salida`,`m`.`hora_salida`),now()) AS `minutos_en_ruta` from (`vehiculos` `v` left join `movimientos` `m` on((`m`.`id` = `v`.`movimiento_id`))) order by `v`.`estatus` desc,`v`.`placas` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-21 17:01:49
