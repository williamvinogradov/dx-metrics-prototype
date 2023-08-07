export interface TaskScTicketData {
  taskId: string;
  ticketNumber: string;
}

export enum TrelloListType {
  work = 0,
  done = 1,
}

export interface TrelloList {
  id: string;
  name: string;
  type: TrelloListType;
  idBoard: string;
}

export interface TrelloLabel {
  id: string;
  name: string;
  idBoard: string;
}

export interface TrelloCard {
  id: string;
  idMembers: string[];
  idLabels: string[];
  idList: string;
  idBoard: string;
  name: string;
}

export interface TrelloCardPluginData {
  score: number | null;
}

export interface TrelloCardHistoryData {
  doneTime: Date;
  durationInMinutes: number | null;
}

export interface TrelloCardFull
  extends TrelloCard,
    TrelloCardPluginData,
    TrelloCardHistoryData {}

export interface TrelloMember {
  id: string;
  fullName: string;
  username: string;
}

export interface TrelloTeamSettings {
  boardId: string;
  nameScRegExp: RegExp;
  workListRegExp: RegExp;
  doneListRegExp: RegExp;
}

export interface TrelloCardMoveAction {
  idMemberCreator: string;
  data: {
    listBefore: {
      id: string;
    };
    listAfter: {
      id: string;
    };
  };
  date: string;
}

export interface TrelloCardHistoryItem {
  cardId: string;
  listId: string;
  startTime: Date;
  endTime: Date | null;
  durationInMinutes: number | null;
}
