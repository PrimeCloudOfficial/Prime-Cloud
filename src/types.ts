export interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp?: number;
  glitch?: boolean;
}

export interface Command {
  name: string;
  execute: () => CommandResponse;
  hidden?: boolean;
}

export interface CommandResponse {
  output: string[];
  type?: 'output' | 'error' | 'system';
  glitch?: boolean;
  delay?: number;
}
