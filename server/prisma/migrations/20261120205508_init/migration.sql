-- CreateEnum
CREATE TYPE "Position" AS ENUM ('HEAD_OF_STATE', 'FINANCE', 'FOREIGN', 'GOVERNOR', 'MAYOR', 'LEGISLATIVE', 'OPPOSITION');

-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('ACTIVE', 'CAMPAIGNING', 'CARETAKER', 'LAME_DUCK', 'FACING_NO_CONFIDENCE', 'LEFT_OFFICE');

-- CreateEnum
CREATE TYPE "LeagueStatus" AS ENUM ('PRE_DRAFT', 'DRAFTING', 'IN_SEASON', 'PLAYOFFS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "DraftOrderMode" AS ENUM ('RANDOM', 'MANUAL');

-- CreateEnum
CREATE TYPE "DraftState" AS ENUM ('NOT_STARTED', 'RUNNING', 'PAUSED', 'COMPLETE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commissionerId" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "status" "LeagueStatus" NOT NULL DEFAULT 'PRE_DRAFT',
    "season" INTEGER NOT NULL DEFAULT 1,
    "numTeams" INTEGER NOT NULL DEFAULT 8,
    "lineupSlots" JSONB NOT NULL,
    "benchSize" INTEGER NOT NULL DEFAULT 4,
    "regularSeasonWeeks" INTEGER NOT NULL DEFAULT 10,
    "playoffTeams" INTEGER NOT NULL DEFAULT 4,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "scoringConfig" JSONB NOT NULL,
    "draftAt" TIMESTAMP(3),
    "draftPickSeconds" INTEGER NOT NULL DEFAULT 90,
    "draftOrderMode" "DraftOrderMode" NOT NULL DEFAULT 'RANDOM',
    "draftState" "DraftState" NOT NULL DEFAULT 'NOT_STARTED',
    "draftPickDeadline" TIMESTAMP(3),
    "draftPausedRemainingMs" INTEGER,
    "seasonStartDate" TEXT,
    "currentWeek" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "draftPosition" INTEGER,
    "waiverPriority" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "officeTitle" TEXT NOT NULL,
    "status" "PlayerStatus" NOT NULL DEFAULT 'ACTIVE',
    "wikiTitle" TEXT NOT NULL,
    "nativeWikiLang" TEXT,
    "nativeWikiTitle" TEXT,
    "photoUrl" TEXT,
    "bio" TEXT,
    "defaultRank" INTEGER NOT NULL DEFAULT 999,
    "needsVerification" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "leftOfficeAt" TIMESTAMP(3),
    "replacesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerEvent" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "note" TEXT,
    "sourceUrl" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerDailyViews" (
    "playerId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "enViews" INTEGER NOT NULL DEFAULT 0,
    "nativeViews" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlayerDailyViews_pkey" PRIMARY KEY ("playerId","date")
);

-- CreateTable
CREATE TABLE "PlayerWeekFlag" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "excludeMediaShare" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,

    CONSTRAINT "PlayerWeekFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftPick" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "pickNumber" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "isAutopick" BOOLEAN NOT NULL DEFAULT false,
    "madeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DraftPick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftQueueItem" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "DraftQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RosterSpot" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "slot" TEXT NOT NULL DEFAULT 'BENCH',
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RosterSpot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyLineup" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "starters" JSONB NOT NULL,
    "bench" JSONB NOT NULL,

    CONSTRAINT "WeeklyLineup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matchup" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT,
    "homeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "awayScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "breakdown" JSONB,
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    "isPlayoff" BOOLEAN NOT NULL DEFAULT false,
    "playoffRound" INTEGER,
    "homeSeed" INTEGER,
    "awaySeed" INTEGER,

    CONSTRAINT "Matchup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'league',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChampionRecord" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "teamId" TEXT,
    "teamName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "record" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChampionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaiverClaim" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "addPlayerId" TEXT NOT NULL,
    "dropPlayerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WaiverClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "proposerId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "proposerGives" TEXT[],
    "recipientGives" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "vetoDeadline" TIMESTAMP(3),

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE UNIQUE INDEX "League_inviteCode_key" ON "League"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "Team_leagueId_ownerId_key" ON "Team"("leagueId", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_leagueId_name_key" ON "Team"("leagueId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Player_replacesId_key" ON "Player"("replacesId");

-- CreateIndex
CREATE INDEX "Player_position_idx" ON "Player"("position");

-- CreateIndex
CREATE INDEX "Player_country_idx" ON "Player"("country");

-- CreateIndex
CREATE INDEX "PlayerEvent_playerId_date_idx" ON "PlayerEvent"("playerId", "date");

-- CreateIndex
CREATE INDEX "PlayerEvent_date_idx" ON "PlayerEvent"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerWeekFlag_playerId_weekStart_key" ON "PlayerWeekFlag"("playerId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "DraftPick_leagueId_pickNumber_key" ON "DraftPick"("leagueId", "pickNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DraftPick_leagueId_playerId_key" ON "DraftPick"("leagueId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "DraftQueueItem_teamId_playerId_key" ON "DraftQueueItem"("teamId", "playerId");

-- CreateIndex
CREATE INDEX "RosterSpot_teamId_idx" ON "RosterSpot"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "RosterSpot_leagueId_playerId_key" ON "RosterSpot"("leagueId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyLineup_teamId_week_key" ON "WeeklyLineup"("teamId", "week");

-- CreateIndex
CREATE INDEX "Matchup_leagueId_week_idx" ON "Matchup"("leagueId", "week");

-- CreateIndex
CREATE INDEX "Activity_leagueId_createdAt_idx" ON "Activity"("leagueId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_leagueId_channel_createdAt_idx" ON "ChatMessage"("leagueId", "channel", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionRecord_leagueId_season_key" ON "ChampionRecord"("leagueId", "season");

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "League" ADD CONSTRAINT "League_commissionerId_fkey" FOREIGN KEY ("commissionerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_replacesId_fkey" FOREIGN KEY ("replacesId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerEvent" ADD CONSTRAINT "PlayerEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerEvent" ADD CONSTRAINT "PlayerEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerDailyViews" ADD CONSTRAINT "PlayerDailyViews_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerWeekFlag" ADD CONSTRAINT "PlayerWeekFlag_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftQueueItem" ADD CONSTRAINT "DraftQueueItem_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftQueueItem" ADD CONSTRAINT "DraftQueueItem_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterSpot" ADD CONSTRAINT "RosterSpot_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterSpot" ADD CONSTRAINT "RosterSpot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterSpot" ADD CONSTRAINT "RosterSpot_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyLineup" ADD CONSTRAINT "WeeklyLineup_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matchup" ADD CONSTRAINT "Matchup_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matchup" ADD CONSTRAINT "Matchup_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matchup" ADD CONSTRAINT "Matchup_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionRecord" ADD CONSTRAINT "ChampionRecord_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiverClaim" ADD CONSTRAINT "WaiverClaim_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiverClaim" ADD CONSTRAINT "WaiverClaim_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_proposerId_fkey" FOREIGN KEY ("proposerId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
