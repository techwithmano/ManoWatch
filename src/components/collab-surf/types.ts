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

export type PlayerState = {
  videoUrl: string;
  isPlaying: boolean;
  currentTime: number;
  lastUpdatedBy?: string; 
};
