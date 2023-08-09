export const API_OPTIONS_TOKEN = Symbol('API_OPTIONS_TOKEN');
export interface ApiOptions {
  url: string;
  key: string;
  token: string;
}
