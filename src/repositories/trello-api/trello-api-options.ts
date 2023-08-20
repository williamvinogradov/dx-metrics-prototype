export const TRELLO_API_OPTIONS_TOKEN = Symbol('TRELLO_API_OPTIONS_TOKEN');
export interface TrelloApiOptions {
  url: string;
  key: string;
  token: string;
}
