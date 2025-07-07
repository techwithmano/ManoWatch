export type User = {
  name: string;
};

export type Message = {
  id: string;
  author: string;
  text: string;
  timestamp: number;
};

export type BrowserState = {
  url: string;
};

export type Participant = {
    id: string;
    name: string;
}
