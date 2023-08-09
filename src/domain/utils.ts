// NOTE: Trello docs https://support.atlassian.com/trello/docs/getting-the-time-a-card-or-board-was-created/
export const getMsFromTrelloItemId = (id: string) =>
  1000 * parseInt(id.substring(0, 8), 16);
