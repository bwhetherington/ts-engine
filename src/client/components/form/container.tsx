import React from 'react';
import styled from 'styled-components';

import {
  Entry,
  Form,
  FormShowEvent,
  FormSubmitEvent,
  FormValidatedEvent,
} from '@/core/form';
import {Iterator} from '@/core/iterator';
import {NetworkManager} from '@/core/net';
import {Empty} from '@/core/util';
import {UUID} from '@/core/uuid';

import {Background, Component, FormComponent, Props} from '@/client/components';

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

export class FormContainer extends Component<Empty, FormContainerState> {
  public constructor(props: Props<Empty>) {
    super(props, {
      forms: [],
    });
  }

  private showForm(form: ClientForm) {
    let didModify = false;
    const newState = Iterator.from(this.state.forms)
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

      this.streamEvents(FormValidatedEvent)
        .filter((event) => event.data.id === form.id)
        .take(1)
        .forEach(async () => {
          await this.updateState({
            forms: rest,
          });
        });
    }
  };

  public componentDidMount() {
    this.streamEvents(FormShowEvent).forEach((event) => {
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
