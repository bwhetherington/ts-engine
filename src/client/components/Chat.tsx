import React from 'react';
import styled from 'styled-components';
import {Component, Props} from 'client/components';
import {COLOR_MAPPING, toCss} from 'core/graphics';
import {
  TextColor,
  TextComponent,
  TextComponents,
  TextMessageOutEvent,
  TextMessageInEvent,
  TextCommandEvent,
} from 'core/chat';
import {NetworkManager} from 'core/net';
import {EventManager, StepEvent} from 'core/event';
import {Key, KeyAction, KeyEvent} from 'core/input';
import {Column, PanelContainer, StringInput} from 'client/components/common';
import {clamp} from 'core/util';

type Lines = Readonly<TextComponents[]>;

function concatLine<T>(
  lines: Readonly<T[]>,
  newLine: T,
  limit: number = 5
): T[] {
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
  linesOut: string[];
  cursorIndex: number;
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

function TextItem({component}: TextItemProps): JSX.Element {
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

function TextLine({components}: TextLineProps): JSX.Element {
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

interface ChatContainerProps {
  isHidden?: boolean;
}

const ChatPanelContainer = styled(PanelContainer)<ChatContainerProps>`
  backdrop-filter: ${(props) => props.isHidden ? 'none' : 'auto'};
  pointer-events: ${(props) => (props.isHidden ? 'none' : 'auto')};
  background: ${(props) => (props.isHidden ? 'transparent' : 'auto')};
`;

const ChatContainer = styled.div<ChatContainerProps>`
  height: 22vh;
  width: 22vh;
  min-width: 400px;
  min-height: 200px;
  word-wrap: break-word;
  overflow-y: auto;
  user-select: auto;
  pointer-events: ${(props) => (props.isHidden ? 'none' : 'auto')};
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
      linesOut: [],
      cursorIndex: 0,
      message: '',
      isFocused: false,
      isFresh: false,
      lastFlash: -1000,
    });
  }

  private isFocused(): boolean {
    const {isFocused, isFresh} = this.state;
    return isFocused || isFresh;
  }

  private scrollToBottom(): void {
    this.endRef.current?.scrollIntoView({behavior: 'auto'});
  }

  public componentDidMount(): void {
    this.streamEvents<TextMessageOutEvent>('TextMessageOutEvent').forEach(
      ({data: {components}}) => {
        const lines = concatLine(
          this.state.lines,
          components as TextComponents,
          this.props.lineLimit
        );
        this.updateState({
          lines,
          lastFlash: EventManager.timeElapsed,
          isFresh: true,
        }).then(() => this.scrollToBottom());
      }
    );

    this.streamInterval(1)
      .filter(() => EventManager.timeElapsed - this.state.lastFlash >= 5)
      .forEach(() => this.updateState({isFresh: false}));

    this.streamEvents<KeyEvent>('KeyEvent')
      .filter(
        ({data: {action, key}}) =>
          action === KeyAction.KeyDown && key === Key.Enter
      )
      .forEach(() => this.inputRef?.current?.focus());
  }

  private renderLines(): JSX.Element[] {
    return this.state.lines.map((line, index) => (
      <TextLine components={line} key={index} />
    ));
  }

  private async onChangeInput(value: string): Promise<void> {
    await this.updateState({
      message: value,
    });
  }

  private async scrollSaved(amount: number): Promise<void> {
    const nextIndex = clamp(
      (this.state.cursorIndex ?? -1) + amount,
      -1,
      this.state.linesOut.length
    );
    if (nextIndex === -1) {
      await this.updateState({
        cursorIndex: -1,
        message: '',
      });
    } else if (0 <= nextIndex && nextIndex < this.state.linesOut.length) {
      const actualIndex = this.state.linesOut.length - nextIndex - 1;
      const line = this.state.linesOut[actualIndex];
      await this.updateState({
        cursorIndex: nextIndex,
        message: line,
      });
      this.fixCursor();
    }
  }

  private async scrollUpSaved(): Promise<void> {
    await this.scrollSaved(1);
  }

  private async scrollDownSaved(): Promise<void> {
    await this.scrollSaved(-1);
  }

  private async onKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>
  ): Promise<void> {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        await this.scrollUpSaved();
        break;
      case 'ArrowDown':
        e.preventDefault();
        await this.scrollDownSaved();
        break;
    }
  }

  private async onSubmit(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    await this.sendMessage();
  }

  private async clearInput(): Promise<void> {
    await this.updateState({
      message: '',
    });
  }

  private async sendMessage(): Promise<void> {
    // Send message
    if (this.state.message.length > 0) {
      await this.handleMessage(this.state.message);
      await this.clearInput();
    }
  }

  private async handleMessage(message: string): Promise<void> {
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
    await this.updateState({
      linesOut: concatLine(this.state.linesOut, message, 10),
      cursorIndex: -1,
    });
  }

  private async onFocus(): Promise<void> {
    await this.updateState({
      isFocused: true,
    });
    this.scrollToBottom();
  }

  private async onBlur(): Promise<void> {
    await this.updateState({
      isFocused: false,
    });
  }

  private fixCursor(): void {
    const input = this.inputRef?.current;
    if (input) {
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }

  public render(): JSX.Element {
    // const panelStyle: React.CSSProperties = this.isFocused()
    //   ? {}
    //   : {
    //       backgroundColor: 'transparent',
    //       background: 'black',
    //       pointerEvents: 'none',
    //     };
    return (
      <ChatPanelContainer isHidden={!this.isFocused()}>
        <Column>
          <ChatContainer isHidden={!this.isFocused()}>
            {this.isFocused() ? this.renderLines() : <div />}
            <div ref={this.endRef} />
          </ChatContainer>
          <ChatForm
            spellCheck={false}
            onFocus={this.onFocus.bind(this)}
            onBlur={this.onBlur.bind(this)}
            onSubmit={this.onSubmit.bind(this)}
          >
            <StringInput
              ref={this.inputRef}
              placeholder="Enter message..."
              value={this.state.message}
              onChange={this.onChangeInput.bind(this)}
              onKeyDown={this.onKeyDown.bind(this)}
            />
          </ChatForm>
        </Column>
      </ChatPanelContainer>
    );
  }
}
