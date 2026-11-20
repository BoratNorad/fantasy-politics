/** Response shapes from the API (kept close to the server routes). */
import type {
  LeagueSettingsInput,
  LeagueStatus,
  PlayerStatus,
  Position,
} from '@fp/shared';

export interface Me {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

export interface LeagueSummary {
  id: string;
  name: string;
  status: LeagueStatus;
  numTeams: number;
  teamCount: number;
  draftAt: string | null;
  isCommissioner: boolean;
  myTeam: { id: string; name: string };
}

export interface LeagueTeam {
  id: string;
  name: string;
  owner: { id: string; displayName: string };
  draftPosition: number | null;
  isCommissioner: boolean;
}

export interface LeagueDetail {
  league: {
    id: string;
    name: string;
    status: LeagueStatus;
    season: number;
    draftAt: string | null;
    draftState: 'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'COMPLETE';
    currentWeek: number;
    commissionerId: string;
    inviteCode: string | null;
    inviteUrl: string | null;
    rosterSize: number;
    settings: LeagueSettingsInput;
  };
  teams: LeagueTeam[];
  myTeamId: string | null;
  isCommissioner: boolean;
}

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface PlayerSummary {
  id: string;
  name: string;
  country: string;
  position: Position;
  officeTitle: string;
  status: PlayerStatus;
  photoUrl: string | null;
  defaultRank: number;
}

export interface PlayerEventRow {
  id: string;
  type: string;
  date: string;
  note: string | null;
  sourceUrl: string | null;
}

export interface PlayerDetail extends PlayerSummary {
  wikiTitle: string;
  nativeWikiLang: string | null;
  nativeWikiTitle: string | null;
  bio: string | null;
  needsVerification: boolean;
  adminNotes?: string | null;
  leftOfficeAt: string | null;
  replaces: { id: string; name: string } | null;
  replacedBy: { id: string; name: string } | null;
  events: PlayerEventRow[];
}

export interface AdminPlayer extends PlayerSummary {
  wikiTitle: string;
  nativeWikiLang: string | null;
  nativeWikiTitle: string | null;
  bio: string | null;
  needsVerification: boolean;
  adminNotes: string | null;
  _count: { rosterSpots: number; events: number };
  replacedBy: { id: string; name: string } | null;
}
