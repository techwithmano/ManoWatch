export type User = {
  id: string;
  name: string;
};

export type Message = {
  id: string;
  author: User;
  text: string;
  timestamp: number;
};

export type BrowserState = {
  url: string;
};
