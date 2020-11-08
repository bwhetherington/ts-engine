import React from 'react';
import { Component } from 'client/components/react';
import { Color, rgb, rgba, toCss } from 'core/graphics';
import {
  TextColor,
  TextComponent,
  TextComponents,
  TextMessageOutEvent,
  TextMessageInEvent,
  TextCommandEvent,
} from 'core/chat';
import { Iterator, iterator } from 'core/iterator';
import { NetworkManager } from 'core/net';
import { Event, EventManager, GameEvent, StepEvent } from 'core/event';
import { Key, KeyAction, KeyEvent } from 'core/input';

const COLOR_MAPPING: { [color in TextColor]: Color } = {
  none: rgb(1, 1, 1),
  red: rgb(1, 0.4, 0.4),
  orange: rgb(0.9, 0.6, 0.3),
  yellow: rgba(1, 1, 1, 0.75),
  green: rgb(0.3, 0.6, 0.3),
  aqua: rgb(0.3, 0.8, 1),
  blue: rgb(0.5, 0.5, 1),
  purple: rgb(0.9, 0.3, 0.9),
};

type Lines = Readonly<TextComponents[]>;

function concatLine(
  lines: Lines,
  newLine: TextComponents,
  limit: number = 5
): Lines {
  const newLines = [...lines, newLine];
  if (newLines.length > limit) {
    return newLines.slice(newLines.length - limit);
  } else {
    return newLines;
  }
}

interface ChatProps {
  lineLimit: number;
}

interface ChatState {
  lines: Lines;
  message: string;
  isFocused: boolean;
  isFresh: boolean;
  lastFlash: number;
}

function createComponentStyle(component: TextComponent): React.CSSProperties {
  const css: React.CSSProperties = {};
  if (component.style?.color) {
    css.color = toCss(COLOR_MAPPING[component.style.color]);
  }

  if (component.style?.styles?.includes('bold')) {
    css.fontWeight = 'bold';
  }
  return css;
}

interface TextItemProps {
  component: Readonly<string | null | TextComponent>;
}

function TextItem({ component }: TextItemProps): React.ReactElement {
  if (typeof component === 'string') {
    return <span>{component}</span>;
  } else if (component === null) {
    return <br />;
  } else {
    const style = createComponentStyle(component);
    return <span style={style}>{component.content}</span>;
  }
}

interface TextLineProps {
  components: Readonly<TextComponents>;
}

function TextLine({ components }: TextLineProps): React.ReactElement {
  const content = components.map((component, index) => (
    <TextItem component={component} key={index} />
  ));
  return <div style={LINE_STYLE}>{content}</div>;
}

function splitWords(str: string): string[] {
  const words = [];
  let word = '';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '"') {
      if (word.length > 0) {
        words.push(word);
        word = '';
      }

      let j = i + 1;
      for (; j < str.length; j++) {
        if (str[j] === '"') {
          words.push(word);
          word = '';
          break;
        }
        word += str[j];
      }
      i = j;
    } else if (/\s/.test(ch)) {
      if (word.length > 0) {
        words.push(word);
        word = '';
      }
    } else {
      word += ch;
    }
  }

  if (word.length > 0) {
    words.push(word);
  }

  return words;
}

const LINE_STYLE: React.CSSProperties = {};

const CONTAINER_STYLE: React.CSSProperties = {
  height: '22vh',
  width: '22vw',
  minWidth: '400px',
  minHeight: '200px',
  wordWrap: 'break-word',
  overflowY: 'auto',
};

const FORM_STYLE: React.CSSProperties = {
  display: 'flex',
};

const INPUT_STYLE: React.CSSProperties = {
  flexGrow: 1,
  pointerEvents: 'auto',
};

export class Chat extends Component<ChatProps, ChatState> {
  private endRef = React.createRef<HTMLDivElement>();
  private inputRef = React.createRef<HTMLInputElement>();

  public constructor(props: ChatProps) {
    super(props, {
      lines: [],
      message: '',
      isFocused: false,
      isFresh: false,
      lastFlash: -1000,
    });
  }

  private isFocused(): boolean {
    const { isFocused, isFresh } = this.state;
    return isFocused || isFresh;
  }

  private scrollToBottom(): void {
    this.endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  public componentDidMount(): void {
    this.addListener<TextMessageOutEvent>('TextMessageOutEvent', (event) => {
      const lines = concatLine(
        this.state.lines,
        event.data.components,
        this.props.lineLimit
      );
      this.updateState({
        lines,
        lastFlash: EventManager.timeElapsed,
        isFresh: true,
      });
      this.scrollToBottom();
    });

    this.addListener<StepEvent>('StepEvent', () => {
      if (EventManager.timeElapsed - this.state.lastFlash >= 5) {
        this.updateState({
          isFresh: false,
        });
      }
    });

    this.addListener<KeyEvent>('KeyEvent', (event) => {
      const { action, key } = event.data;
      if (action === KeyAction.KeyDown && key === Key.Enter) {
        this.inputRef?.current?.focus();
      }
    });
  }

  private renderLines(): React.ReactElement[] {
    return this.state.lines.map((line, index) => (
      <TextLine components={line} key={index} />
    ));
  }

  private onChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.updateState({
      message: event.target.value,
    });
  };

  private onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    this.sendMessage();
  };

  private sendMessage(): void {
    // Send message
    if (this.state.message.length > 0) {
      this.handleMessage(this.state.message);
      this.updateState({
        message: '',
      });
      this.updateState({
        message: '',
      });
    }
  }

  private handleMessage(message: string): void {
    if (message.startsWith('/')) {
      // Handle command
      const [command, ...args] = splitWords(message.slice(1));
      NetworkManager.sendEvent<TextCommandEvent>({
        type: 'TextCommandEvent',
        data: {
          command,
          args,
        },
      });
    } else {
      NetworkManager.sendEvent<TextMessageInEvent>({
        type: 'TextMessageInEvent',
        data: {
          content: message,
        },
      });
    }
  }

  private onFocus = () => {
    this.updateState({
      isFocused: true,
    });
  };

  private onBlur = () => {
    this.updateState({
      isFocused: false,
    });
  };

  public render(): React.ReactElement {
    const backgroundStyle: React.CSSProperties = {
      backgroundColor: this.isFocused()
        ? CONTAINER_STYLE.backgroundColor
        : 'rgba(0, 0, 0, 0)',
      pointerEvents: this.isFocused() ? 'auto' : 'none',
    };
    return (
      <div className="dialog col" style={backgroundStyle}>
        <div style={CONTAINER_STYLE}>
          {this.isFocused() ? this.renderLines() : <div />}
          <div ref={this.endRef} />
        </div>
        <form
          spellCheck={false}
          style={FORM_STYLE}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          onSubmit={this.onSubmit}
        >
          <input
            ref={this.inputRef}
            style={INPUT_STYLE}
            placeholder="Enter message..."
            type="text"
            value={this.state.message}
            onChange={this.onChangeInput}
          />
        </form>
      </div>
    );
  }
}
