import React from 'react';
import styled from 'styled-components';
import { Component } from 'client/components/react';
import { FormComponent } from 'client/components/react/form';
import { Entry, Form, FormShowEvent, FormSubmitEvent } from 'core/form';
import { NetworkManager } from 'core/net';

const Background = styled.div`
  position: absolute;
  left: 0px;
  right: 0px;
  top: 0px;
  bottom: 0px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;

  &.hidden {
    visibility: hidden;
    opacity: 0%;
    transition: visibility 0s 0.25s, opacity 0.25s ease-out;
  }

  &.visible {
    visibility: visible;
    opacity: 100%;
    transition: opacity 0.25s ease-in;
  }
`;

const Container = styled.div`
  pointer-events: auto;
  width: 400px;
`;

interface FormContainerState {
  forms: Form[];
}

export class FormContainer extends Component<{}, FormContainerState> {
  public constructor(props: {}) {
    super(props, {
      forms: [],
    });
  }

  private showForm(form: Form): void {
    this.updateState({
      forms: [...this.state.forms, form],
    });
  }

  private submitTopForm = (
    name: string,
    data: Record<string, Entry>,
    method: string = 'submit'
  ) => {
    const [form, ...rest] = this.state.forms;
    if (form) {
      NetworkManager.sendEvent<FormSubmitEvent>({
        type: 'FormSubmitEvent',
        data: {
          name,
          data,
          method,
        },
      });
      if (rest.length === 0) {
        // Return focus to main screen
        document.getElementById('game')?.focus();
      }
      this.updateState({
        forms: rest,
      });
    }
  };

  public componentDidMount(): void {
    this.addListener<FormShowEvent>('FormShowEvent', (event) => {
      this.showForm(event.data.form);
    });
  }

  public render(): React.ReactElement {
    const form = this.state.forms[0];
    if (form) {
      return (
        <Background className="visible">
          <Container>
            <FormComponent form={form} onSubmit={this.submitTopForm} />
          </Container>
        </Background>
      );
    } else {
      return <Background className="hidden" />;
    }
  }
}
