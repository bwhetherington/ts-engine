import React from 'react';
import styled from 'styled-components';
import { Component, Props } from 'client/components/react';
import { Color, rgb, rgba, toCss } from 'core/graphics';
import {
  TextColor,
  TextComponent,
  TextComponents,
  TextMessageOutEvent,
  TextMessageInEvent,
  TextCommandEvent,
} from 'core/chat';
import { NetworkManager } from 'core/net';
import { EventManager, StepEvent } from 'core/event';
import { Key, KeyAction, KeyEvent } from 'core/input';
import {
  Column,
  Panel,
  PanelContainer,
  StringInput,
} from 'client/components/react/common';

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
  if (component.style?.pre) {
    return {
      display: 'block',
      whiteSpace: 'pre',
      margin: '4px',
      padding: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      borderRadius: '4px',
    };
  } else {
    if (component.style?.color) {
      css.color = toCss(COLOR_MAPPING[component.style.color]);
    }

    if (component.style?.styles?.includes('bold')) {
      css.fontWeight = 'bold';
    }
  }
  return css;
}

interface TextItemProps {
  component: Readonly<string | null | TextComponent>;
}

function TextItem({ component }: TextItemProps): JSX.Element {
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

function TextLine({ components }: TextLineProps): JSX.Element {
  const content = components.map((component, index) => (
    <TextItem component={component} key={index} />
  ));
  return <div>{content}</div>;
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

const ChatContainer = styled.div`
  height: 22vh;
  width: 22vh;
  min-width: 400px;
  min-height: 200px;
  word-wrap: break-word;
  overflow-y: auto;
  user-select: auto;
`;

const ChatForm = styled.form`
  display: flex;
`;

export class Chat extends Component<ChatProps, ChatState> {
  private endRef = React.createRef<HTMLDivElement>();
  private inputRef = React.createRef<HTMLInputElement>();

  public constructor(props: Props<ChatProps>) {
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
    this.streamEvents<TextMessageOutEvent>('TextMessageOutEvent').forEach(
      ({ data: { components } }) => {
        const lines = concatLine(
          this.state.lines,
          components,
          this.props.lineLimit
        );
        this.updateState({
          lines,
          lastFlash: EventManager.timeElapsed,
          isFresh: true,
        });
        this.scrollToBottom();
      }
    );

    this.streamInterval(1)
      .filter(() => EventManager.timeElapsed - this.state.lastFlash >= 5)
      .forEach(() => this.updateState({ isFresh: false }));

    this.streamEvents<KeyEvent>('KeyEvent')
      .filter(
        ({ data: { action, key } }) =>
          action === KeyAction.KeyDown && key === Key.Enter
      )
      .forEach(() => this.inputRef?.current?.focus());
  }

  private renderLines(): JSX.Element[] {
    return this.state.lines.map((line, index) => (
      <TextLine components={line} key={index} />
    ));
  }

  private onChangeInput = (value: string) => {
    this.updateState({
      message: value,
    });
  };

  private onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    this.sendMessage();
  };

  private clearInput(): void {
    this.updateState({
      message: '',
    });
  }

  private sendMessage(): void {
    // Send message
    if (this.state.message.length > 0) {
      this.handleMessage(this.state.message);
      this.clearInput();
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

  public render(): JSX.Element {
    const panelStyle: React.CSSProperties = this.isFocused()
      ? {}
      : {
          backgroundColor: 'transparent',
          pointerEvents: 'none',
        };
    return (
      <PanelContainer style={panelStyle}>
        <Column>
          <ChatContainer>
            {this.isFocused() ? this.renderLines() : <div />}
            <div ref={this.endRef} />
          </ChatContainer>
          <ChatForm
            spellCheck={false}
            onFocus={this.onFocus}
            onBlur={this.onBlur}
            onSubmit={this.onSubmit}
          >
            <StringInput
              ref={this.inputRef}
              placeholder="Enter message..."
              value={this.state.message}
              onChange={this.onChangeInput}
            />
          </ChatForm>
        </Column>
      </PanelContainer>
    );
  }
}
