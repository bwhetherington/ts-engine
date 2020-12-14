import { Player } from 'core/player';

export type TextColor =
  | 'none'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'aqua'
  | 'blue'
  | 'purple';

const TEXT_COLORS = [
  'none',
  'red',
  'orange',
  'yellow',
  'green',
  'aqua',
  'blue',
  'purple',
];

export function isTextColor(str: string): str is TextColor {
  return TEXT_COLORS.includes(str);
}

export type TextStyle = 'normal' | 'bold' | 'italic';

const TEXT_STYLES = ['normal', 'bold', 'italic'];

export function isTextStyle(str: string): str is TextStyle {
  return TEXT_STYLES.includes(str);
}

export interface TextComponent {
  content: string;
  style?: {
    color?: TextColor;
    styles?: TextStyle[];
    pre?: boolean;
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

export function renderMessage(
  author: string,
  content: string,
  authorColor: TextColor = 'none'
): (string | TextComponent)[] {
  return [
    {
      content: '<',
      style: {
        color: 'none',
        styles: ['bold'],
      },
    },
    {
      content: author,
      style: {
        color: authorColor,
        styles: ['bold'],
      },
    },
    {
      content: '>',
      style: {
        color: 'none',
        styles: ['bold'],
      },
    },
    ' ',
    content,
  ];
}

export function renderInfo(message: string): TextComponents {
  return [
    {
      content: '[',
      style: {
        color: 'yellow',
      },
    },
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
    {
      content: ']',
      style: {
        color: 'yellow',
      },
    },
  ];
}

export function renderWarn(message: string): TextComponents {
  return [
    {
      content: '[',
      style: {
        color: 'orange',
      },
    },
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
    {
      content: ']',
      style: {
        color: 'orange',
      },
    },
  ];
}

export function renderError(message: string): TextComponents {
  return [
    {
      content: '[',
      style: {
        color: 'red',
      },
    },
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
    {
      content: ']',
      style: {
        color: 'red',
      },
    },
  ];
}
