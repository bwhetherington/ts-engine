export type TextColor =
  | 'none'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'aqua'
  | 'blue'
  | 'purple';

export type TextStyle = 'normal' | 'bold' | 'italic';

export interface TextComponent {
  content: string;
  style?: {
    color?: TextColor;
    styles?: TextStyle[];
  };
}

export interface TextMessageInEvent {
  content: string;
}

export interface TextMessageOutEvent {
  components: (string | null | TextComponent)[];
}

export interface SetNameEvent {
  name: string;
}

export interface TextCommandEvent {
  command: string;
  args: string[];
}

export type TextComponents = (string | null | TextComponent)[];

export function renderInfo(message: string): TextComponents {
  return [
    {
      content: 'Info:',
      style: {
        color: 'yellow',
        styles: ['bold'],
      },
    },
    ' ',
    {
      content: message,
      style: {
        color: 'yellow',
      },
    },
  ];
}

export function renderWarn(message: string): TextComponents {
  return [
    {
      content: 'Warn:',
      style: {
        color: 'orange',
        styles: ['bold'],
      },
    },
    ' ',
    {
      content: message,
      style: {
        color: 'orange',
      },
    },
  ];
}

export function renderError(message: string): TextComponents {
  return [
    {
      content: 'Error:',
      style: {
        color: 'red',
        styles: ['bold'],
      },
    },
    ' ',
    {
      content: message,
      style: {
        color: 'red',
      },
    },
  ];
}
