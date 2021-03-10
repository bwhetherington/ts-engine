import React from 'react';
import styled from 'styled-components';
import {Component, FormComponent} from 'client/components';
import {
  Entry,
  Form,
  FormRejectEvent,
  FormShowEvent,
  FormSubmitEvent,
  FormValidatedEvent,
} from 'core/form';
import {NetworkManager} from 'core/net';
import {UUID} from 'core/uuid';
import {EventManager} from 'core/event';
import {Iterator} from 'core/iterator';

const Background = styled.div`
  position: absolute;
  left: 0px;
  right: 0px;
  top: 0px;
  bottom: 0px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.5);
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

interface ClientForm {
  form: Form;
  id: UUID;
}

interface FormContainerState {
  forms: ClientForm[];
}

export class FormContainer extends Component<{}, FormContainerState> {
  public constructor(props: {}) {
    super(props, {
      forms: [],
    });
  }

  private showForm(form: ClientForm): void {
    let didModify = false;
    let newState = Iterator.from(this.state.forms)
      .map((oldForm) => {
        if (oldForm.id === form.id) {
          didModify = true;
          return form;
        } else {
          return oldForm;
        }
      })
      .toArray();
    const finalState = didModify ? newState : [...this.state.forms, form];

    this.updateState({
      forms: finalState,
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
          id: form.id,
          method,
        },
      });
      if (rest.length === 0) {
        // Return focus to main screen
        document.getElementById('game')?.focus();
      }

      this.streamEvents<FormValidatedEvent>('FormValidatedEvent')
        .filter((event) => event.data.id === form.id)
        .take(1)
        .forEach(async () => {
          await this.updateState({
            forms: rest,
          });
          console.log('foo');
        })
        .then(() => console.log('cleaned up'));
    }
  };

  public componentDidMount(): void {
    this.addListener<FormShowEvent>('FormShowEvent', (event) => {
      this.showForm(event.data);
    });
  }

  public render(): JSX.Element {
    const form = this.state.forms[0];
    if (form) {
      return (
        <Background className="visible">
          <Container>
            <FormComponent form={form.form} onSubmit={this.submitTopForm} />
          </Container>
        </Background>
      );
    } else {
      return <Background className="hidden" />;
    }
  }
}
