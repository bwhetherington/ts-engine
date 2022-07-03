import React from 'react';
import styled from 'styled-components';

import {Entry, Field, Form} from '@/core/form';

import {Component, Props} from '@/client/components';
import {
  BooleanInput,
  Button,
  Column,
  FlexPadding,
  FloatInput,
  Panel,
  PanelHeader,
  Row,
  StringInput,
  UI_MARGIN,
} from '@/client/components';

const FieldContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const LabelComponent = styled.div`
  flex-grow: 1;
  font-weight: bold;
  margin: auto;
  margin-right: 5px;
`;

const ValueComponent = styled.div`
  flex-grow: 0;
`;

interface FieldProps {
  field: Field;
  entry: Entry;
  onChange(entry: Entry): void;
  isDisabled?: boolean;
}

function FieldComponent(props: FieldProps): JSX.Element {
  let valueComponent: JSX.Element | undefined;
  if (props.field.type === 'text' && props.entry.type === 'text') {
    valueComponent = (
      <StringInput
        isDisabled={props.isDisabled}
        value={props.entry.value ?? props.field.default}
        isPassword={props.field.isPassword}
        onChange={(value) => props.onChange({type: 'text', value})}
      />
    );
  } else if (props.field.type === 'number' && props.entry.type === 'number') {
    valueComponent = (
      <FloatInput
        isDisabled={props.isDisabled}
        min={props.field.min ?? 0}
        max={props.field.max ?? 100}
        value={props.entry.value ?? props.field.default}
        onChange={(value) => props.onChange({type: 'number', value})}
      />
    );
  } else if (
    props.field.type === 'checkbox' &&
    props.entry.type === 'boolean'
  ) {
    valueComponent = (
      <BooleanInput
        isDisabled={props.isDisabled}
        value={props.entry.value ?? props.field.default}
        onChange={(value) => props.onChange({type: 'boolean', value})}
      />
    );
  }
  return (
    <FieldContainer>
      <LabelComponent>{props.field.label}</LabelComponent>
      <ValueComponent>{valueComponent}</ValueComponent>
    </FieldContainer>
  );
}

const Container = styled.div`
  padding: 10px;
`;

const Section = styled.div`
  margin-top: 15px;
`;

const Message = styled.div`
  border: 1px solid;
  border-color: rgba(255, 128, 128, 0.33);
  color: rgb(255, 102, 102);
  padding: 5px 10px 5px 10px;
  border-radius: 4px;
`;

interface FormProps {
  form: Form;
  onSubmit(name: string, data: Record<string, Entry>, method: string): void;
}

interface FormState {
  entries: Record<string, Entry>;
  isSubmitted: boolean;
}

function createDefaultEntry(field: Field): Entry {
  switch (field.type) {
    case 'checkbox':
      return {type: 'boolean', value: field.default ?? false};
    case 'number':
      return {type: 'number', value: field.default ?? 0};
    case 'range':
      return {type: 'number', value: field.default};
    case 'text':
      return {type: 'text', value: field.default ?? ''};
  }
}

function createInitialState(form: Form): Record<string, Entry> {
  return form.items.reduce((data, field) => {
    data[field.name] = createDefaultEntry(field);
    return data;
  }, {} as Record<string, Entry>);
}

const Padded = styled.div`
  padding-top: ${UI_MARGIN};
  padding-bottom: ${UI_MARGIN};
`;

const Spacer = styled.div`
  content: '';
  height: ${UI_MARGIN};
`;

export class FormComponent extends Component<FormProps, FormState> {
  public constructor(props: FormProps) {
    super(props, {
      entries: createInitialState(props.form),
      isSubmitted: false,
    });
  }

  private setEntry<T extends Entry>(
    name: string,
    type: T['type'],
    value: T['value']
  ) {
    const newData = {
      entries: {
        ...this.state.entries,
        [name]: {type, value} as Entry,
      },
    };
    this.updateState(newData);
  }

  public componentDidUpdate(nextProps: Props<FormProps>) {
    if (nextProps.form.messages?.length !== this.props.form.messages?.length) {
      this.updateState({
        isSubmitted: false,
      });
    }
  }

  private renderEntries(): (JSX.Element | undefined)[] {
    return this.props.form.items.map((field, index) => {
      const entry = this.state.entries[field.name];
      if (entry) {
        return (
          <FieldComponent
            isDisabled={this.state.isSubmitted}
            key={index}
            field={field}
            entry={entry}
            onChange={(state) =>
              this.setEntry(field.name, state.type, state.value)
            }
          />
        );
      }
      return undefined;
    });
  }

  private renderMessages(): JSX.Element | undefined {
    const res = this.props.form.messages?.map((message, index) => (
      <Message key={index}>{message}</Message>
    ));
    if (res && res.length > 0) {
      return <Section>{res}</Section>;
    }
  }

  private onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
  };

  private async submit(method: string): Promise<void> {
    this.props.onSubmit(this.props.form.name, this.state.entries, method);
    await this.updateState({
      isSubmitted: true,
    });
  }

  private renderSubmitButtons(): (JSX.Element | undefined)[] {
    return (
      this.props.form.submitMethods?.map((method) => {
        return (
          <Button
            key={method.name}
            type="submit"
            onClick={() => this.submit(method.name)}
          >
            {method.label}
          </Button>
        );
      }) ?? [
        <Button
          type="submit"
          onClick={() => this.submit('submit')}
          key="submit"
        >
          Submit
        </Button>,
      ]
    );
  }

  public render(): JSX.Element {
    return (
      <Panel>
        <Container>
          <Column>
            <PanelHeader>
              <h1>{this.props.form.label}</h1>
            </PanelHeader>
            {this.props.form.description ? (
              <>
                <PanelHeader>
                  <Padded>{this.props.form.description}</Padded>
                </PanelHeader>
                <Spacer />
              </>
            ) : undefined}
            <form onSubmit={this.onSubmit}>
              <Column>{this.renderEntries()}</Column>
              {this.renderMessages()}
              <Section>
                <Row>
                  <FlexPadding />
                  {this.renderSubmitButtons()}
                </Row>
              </Section>
            </form>
          </Column>
        </Container>
      </Panel>
    );
  }
}
