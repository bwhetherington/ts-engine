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
