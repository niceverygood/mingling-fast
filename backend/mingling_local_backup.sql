-- MySQL dump 10.13  Distrib 9.3.0, for macos14.7 (x86_64)
--
-- Host: localhost    Database: mingling_local
-- ------------------------------------------------------
-- Server version	9.3.0

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
-- Table structure for table `characters`
--

DROP TABLE IF EXISTS `characters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `characters` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `age` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `avatarUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `personality` text COLLATE utf8mb4_unicode_ci,
  `isPublic` tinyint(1) NOT NULL DEFAULT '1',
  `characterType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `background` text COLLATE utf8mb4_unicode_ci,
  `mbti` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `height` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `likes` text COLLATE utf8mb4_unicode_ci,
  `dislikes` text COLLATE utf8mb4_unicode_ci,
  `hashtags` json DEFAULT NULL,
  `gender` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `firstImpression` text COLLATE utf8mb4_unicode_ci,
  `basicSetting` text COLLATE utf8mb4_unicode_ci,
  `weapons` json DEFAULT NULL,
  `isCommercial` tinyint(1) NOT NULL DEFAULT '0',
  `allowViolence` tinyint(1) NOT NULL DEFAULT '0',
  `backupChats` tinyint(1) NOT NULL DEFAULT '1',
  `hashtagCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `characters_userId_fkey` (`userId`),
  CONSTRAINT `characters_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `characters`
--

LOCK TABLES `characters` WRITE;
/*!40000 ALTER TABLE `characters` DISABLE KEYS */;
INSERT INTO `characters` VALUES ('cmclwko030001cae5iqogbrgv','로컬테스트캐릭터','25','로컬 환경 테스트용',NULL,NULL,1,'순수창작 캐릭터',NULL,NULL,NULL,NULL,NULL,NULL,'female',NULL,NULL,NULL,0,0,1,NULL,'2025-07-02 11:58:19.780','2025-07-02 11:58:19.780','local-test-user-001');
/*!40000 ALTER TABLE `characters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chats`
--

DROP TABLE IF EXISTS `chats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chats` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastMessage` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastMessageAt` datetime(3) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `characterId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `personaId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chats_userId_characterId_key` (`userId`,`characterId`),
  KEY `chats_characterId_fkey` (`characterId`),
  KEY `chats_personaId_fkey` (`personaId`),
  CONSTRAINT `chats_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chats_personaId_fkey` FOREIGN KEY (`personaId`) REFERENCES `personas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chats_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chats`
--

LOCK TABLES `chats` WRITE;
/*!40000 ALTER TABLE `chats` DISABLE KEYS */;
INSERT INTO `chats` VALUES ('cmclwl60b0005cae5xzin0f9u','정말 좋은 질문이에요!','2025-07-02 12:01:54.617',1,'2025-07-02 11:58:43.115','2025-07-02 12:01:54.617','local-test-user-001','cmclwko030001cae5iqogbrgv','cmclwky9r0003cae54x0tnjdd');
/*!40000 ALTER TABLE `chats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `heart_transactions`
--

DROP TABLE IF EXISTS `heart_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `heart_transactions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` int NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `heart_transactions_userId_fkey` (`userId`),
  CONSTRAINT `heart_transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `heart_transactions`
--

LOCK TABLES `heart_transactions` WRITE;
/*!40000 ALTER TABLE `heart_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `heart_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `isFromUser` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `chatId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `messages_chatId_fkey` (`chatId`),
  KEY `messages_userId_fkey` (`userId`),
  CONSTRAINT `messages_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `chats` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `messages_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES ('cmclwlf5z0007cae53gmsr6ar','안녕하세요! 처음 뵙겠습니다. 오늘 날씨가 정말 좋네요!',1,'2025-07-02 11:58:54.984','cmclwl60b0005cae5xzin0f9u','local-test-user-001'),('cmclwlidv0009cae5bvsborw3','더 자세히 이야기해 주세요.',0,'2025-07-02 11:58:59.154','cmclwl60b0005cae5xzin0f9u','local-test-user-001'),('cmclwmty9000bcae5wl6mm6ec','안녕!',1,'2025-07-02 12:00:00.802','cmclwl60b0005cae5xzin0f9u','local-test-user-001'),('cmclwmwc0000dcae5iij789mw','더 자세히 이야기해 주세요.',0,'2025-07-02 12:00:03.889','cmclwl60b0005cae5xzin0f9u','local-test-user-001'),('cmclwoyax0001camz33p78v07','안녕하세요! 오늘 뭐하고 계셨나요?',1,'2025-07-02 12:01:39.754','cmclwl60b0005cae5xzin0f9u','local-test-user-001'),('cmclwozut0003camzjv9ehmdf','정말 흥미로운 이야기네요!',0,'2025-07-02 12:01:41.766','cmclwl60b0005cae5xzin0f9u','local-test-user-001'),('cmclwp7wz0005camzvoik9yic','테스트',1,'2025-07-02 12:01:52.211','cmclwl60b0005cae5xzin0f9u','local-test-user-001'),('cmclwp9rp0007camzn3grmvrv','정말 좋은 질문이에요!',0,'2025-07-02 12:01:54.613','cmclwl60b0005cae5xzin0f9u','local-test-user-001');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personas`
--

DROP TABLE IF EXISTS `personas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personas` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `age` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `job` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatarUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `basicInfo` text COLLATE utf8mb4_unicode_ci,
  `habits` text COLLATE utf8mb4_unicode_ci,
  `appearance` text COLLATE utf8mb4_unicode_ci,
  `personality` text COLLATE utf8mb4_unicode_ci,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `personas_userId_fkey` (`userId`),
  CONSTRAINT `personas_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personas`
--

LOCK TABLES `personas` WRITE;
/*!40000 ALTER TABLE `personas` DISABLE KEYS */;
INSERT INTO `personas` VALUES ('cmclwky9r0003cae54x0tnjdd','로컬테스트페르소나','30','male','개발자',NULL,'친근한 개발자',NULL,NULL,'활발하고 유머러스함',1,'2025-07-02 11:58:33.088','2025-07-02 11:58:33.088','local-test-user-001');
/*!40000 ALTER TABLE `personas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatarUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hearts` int NOT NULL DEFAULT '150',
  `joinedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  UNIQUE KEY `users_username_key` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('local-test-user-001','localtest@example.com','localtest_1751457438543',NULL,150,'2025-07-02 11:57:18.546','2025-07-02 11:57:18.546','2025-07-02 11:57:18.546'),('test-user-001','test@example.com','test_1751457313415',NULL,150,'2025-07-02 11:55:13.417','2025-07-02 11:55:13.417','2025-07-02 11:55:13.417'),('test-user-002','test002@example.com','test002_1751457377017',NULL,150,'2025-07-02 11:56:17.018','2025-07-02 11:56:17.018','2025-07-02 11:56:17.018');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-02 21:02:13
