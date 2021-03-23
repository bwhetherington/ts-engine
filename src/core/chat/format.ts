import {Iterator} from 'core/iterator';
import {Data} from 'core/serialize';
import {
  isTextColor,
  isTextStyle,
  TextColor,
  TextComponent,
  TextComponents,
  TextStyle,
} from 'core/chat';

type ComponentFormatter = (
  input: Data
) => Iterable<TextComponent | string | null>;

type Node = TextNode | VariableNode | FormatNode;

enum NodeKind {
  TextNode,
  VariableNode,
  FormatNode,
}

interface VariableNode {
  kind: NodeKind.VariableNode;
  name: string;
}

function variableNode(name: string): VariableNode {
  return {
    kind: NodeKind.VariableNode,
    name,
  };
}

interface TextNode {
  kind: NodeKind.TextNode;
  text: string;
}

function textNode(text: string): TextNode {
  return {
    kind: NodeKind.TextNode,
    text,
  };
}

interface FormatNode {
  kind: NodeKind.FormatNode;
  color?: TextNode | VariableNode;
  styles?: (TextNode | VariableNode)[];
  content: (TextNode | VariableNode)[];
}

const VARIABLE_REGEX = /[a-zA-Z]+/;

const FORMAT_NODE_REGEX = /((style|color)=([a-z-A-Z$]+),)*((style|color)=([a-z-A-Z$]+),?)\|[^\{\}]*/;

export class FormatParser {
  private input: string;
  private index: number = 0;

  public constructor(input: string) {
    this.input = input;
  }

  private isValid(): boolean {
    return 0 <= this.index && this.index < this.input.length;
  }

  private nextChar(): string {
    const ch = this.input[this.index];
    this.index += 1;
    return ch;
  }

  private backChar(): void {
    this.index -= 1;
  }

  private readUntil(end: string): string {
    let buf = '';
    while (this.isValid()) {
      const ch = this.nextChar();
      if (ch === end) {
        return buf;
      } else {
        buf += ch;
      }
    }
    throw new Error('unclosed buffer');
  }

  private readWord(): string {
    let buf = '';
    while (this.isValid()) {
      const ch = this.nextChar();
      if (VARIABLE_REGEX.test(ch)) {
        buf += ch;
      } else {
        this.backChar();
        break;
      }
    }
    return buf;
  }

  public nextNode(): Node | undefined {
    for (const node of this.parseNodes()) {
      return node;
    }
  }

  public *parseNodes(): Iterable<Node> {
    let buf = '';
    while (this.isValid()) {
      const ch = this.nextChar();
      switch (ch) {
        case '{':
          // Flush buffer
          if (buf.length > 0) {
            yield textNode(buf);
            buf = '';
          }

          const nodeText = this.readUntil('}');
          if (nodeText) {
            yield this.parseFormatNode(nodeText);
          }
          break;
        case '$':
          // Flush buffer
          if (buf.length > 0) {
            yield textNode(buf);
            buf = '';
          }

          const name = this.readWord();
          yield variableNode(name);
          break;
        default:
          buf += ch;
          break;
      }
    }
    // Flush buffer
    if (buf.length > 0) {
      yield textNode(buf);
    }
  }

  private parseFormatNode(formatNode: string): FormatNode {
    if (FORMAT_NODE_REGEX.test(formatNode)) {
      const [metadata, content] = formatNode.split('|');
      const props = metadata.split(',');

      const propsParsed: Record<string, TextNode | VariableNode> = {};
      for (const propPair of props) {
        const [propName, propValueRaw] = propPair.split('=');

        const propNode = new FormatParser(propValueRaw).nextNode();
        if (
          propNode?.kind === NodeKind.TextNode ||
          propNode?.kind === NodeKind.VariableNode
        ) {
          propsParsed[propName] = propNode;
        }
      }

      // Parse content
      const contentParser = new FormatParser(content);
      const contentParsed = Iterator.from(contentParser.parseNodes())
        .filterMap((node) =>
          node && node.kind !== NodeKind.FormatNode ? node : undefined
        )
        .toArray();

      return {
        kind: NodeKind.FormatNode,
        color: propsParsed.color,
        styles: propsParsed.style && [propsParsed.style],
        content: contentParsed,
      };
    } else {
      throw new Error('malformed format node');
    }
  }
}

function evaluate(
  node: TextNode | VariableNode,
  input: Data
): string | undefined {
  switch (node.kind) {
    case NodeKind.TextNode:
      return node.text;
    case NodeKind.VariableNode:
      return input[node.name];
  }
}

function validateColor(color: string): TextColor {
  if (isTextColor(color)) {
    return color;
  } else {
    return 'none';
  }
}

function validateStyle(style: string): TextStyle {
  if (isTextStyle(style)) {
    return style;
  } else {
    return 'normal';
  }
}

export class TextFormatter {
  private formatters: ComponentFormatter[] = [];

  public constructor(format: string) {
    this.formatters = Iterator.from(new FormatParser(format).parseNodes())
      .map((node) => {
        switch (node.kind) {
          case NodeKind.TextNode:
            return this.createTextFormatter(node);
          case NodeKind.VariableNode:
            return this.createVariableFormatter(node);
          case NodeKind.FormatNode:
            return this.createFormatFormatter(node);
        }
      })
      .toArray();
  }

  private createTextFormatter(node: TextNode): ComponentFormatter {
    return function* () {
      if (node.text.length > 0) {
        yield node.text;
      }
    };
  }

  private createVariableFormatter(node: VariableNode): ComponentFormatter {
    return function* (input: Data) {
      const val = input[node.name];
      if (typeof val === 'string') {
        yield val;
      }
    };
  }

  private createFormatFormatter(node: FormatNode): ComponentFormatter {
    return function* (input: Data) {
      const color = validateColor(
        (node.color && evaluate(node.color, input)) ?? 'none'
      );
      const styles =
        node.styles?.map((style) =>
          validateStyle(evaluate(style, input) ?? 'normal')
        ) ?? [];
      const content = Iterator.array(node.content)
        .filterMap((node) => evaluate(node, input))
        .toArray()
        .join('');
      yield {
        style: {
          color,
          styles,
        },
        content,
      };
    };
  }

  public format(input: Data): TextComponents {
    return Iterator.array(this.formatters)
      .flatMap((formatter) => formatter(input))
      .toArray();
  }
}
