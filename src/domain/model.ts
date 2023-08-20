export interface TeamSettings {
  teamName: string;
  boardId: string;
  nameScRegExp: RegExp;
  workListRegExp: RegExp;
  doneListRegExp: RegExp;
}

// === SC ===
export interface TaskScTicketData {
  taskId: string;
  ticketNumber: string;
}

// === Trello ===
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

export interface TrelloMember {
  id: string;
  fullName: string;
  username: string;
}

export interface TrelloLabel {
  id: string;
  name: string;
  idBoard: string;
}

export interface TrelloCustomField {
  id: string;
  name: string;
}

export interface TrelloCard {
  id: string;
  idMembers: string[];
  idLabels: string[];
  idList: string;
  idBoard: string;
  name: string;
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

export interface TrelloCardCustomFieldData {
  idCustomField: string;
  value: {
    // Only supports number custom fields for now.
    number?: number;
  };
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
