import {Color, isColor, WHITE} from 'core/graphics';
import {Data, Serializable} from 'core/serialize';

export interface ThemeProps {
  type: string;
  isDarkMode: boolean;
  foregroundColor: Color;
  backgroundColor: Color;
}

export class Theme implements Serializable {
  public static typeName: string = 'Theme';

  public type: string = Theme.typeName;
  public isDarkMode: boolean = false;
  public foregroundColor: Color = WHITE;
  public backgroundColor: Color = WHITE;

  public static create(props: ThemeProps) {
    const theme = new Theme();
    theme.type = props.type;
    theme.isDarkMode = props.isDarkMode;
    theme.foregroundColor = props.foregroundColor;
    theme.backgroundColor = props.backgroundColor;
    return theme;
  }

  public serialize(): Data {
    return {
      isDarkmode: this.isDarkMode,
      foregroundColor: this.foregroundColor,
      backgroundColor: this.backgroundColor,
    };
  }

  public deserialize(data: Data): void {
    const {isDarkMode, foregroundColor, backgroundColor} = data;
    if (typeof isDarkMode === 'boolean') {
      this.isDarkMode = isDarkMode;
    }
    if (isColor(foregroundColor)) {
      this.foregroundColor = foregroundColor;
    }
    if (isColor(backgroundColor)) {
      this.backgroundColor = backgroundColor;
    }
  }
}
