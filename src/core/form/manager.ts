import { LM as InternalLogger } from "core/log";
import { Player } from "core/player";
import { Data } from "core/serialize";
import { v1 } from "uuid";
import { EM } from "core/event";
import { FormSubmitEvent, Form, FormShowEvent } from "core/form";
import { NM } from "core/net";
import { sleep } from "core/util";

const LM = InternalLogger.forFile(__filename);

type FormResolver = (response: Data) => void;

export class FormManager {
  public initialize(): void {
    LM.debug('FormManager initialized');

    if (NM.isClient()) {
      EM.addListener<FormSubmitEvent>('FormSubmitEvent', (event) => {
        NM.send(event);
      });
    }
  }

  public sendForm(player: Player, form: Form, timeout: number = 60): Promise<Data> {
    // Send form to player
    const event = {
      type: 'FormShowEvent',
      data: <FormShowEvent>{
        form,
      },
    };
    player.send(event);

    const promise = new Promise<Data>(async (resolve, reject) => {
      const id = v1();
      EM.addListener<FormSubmitEvent>('FormSubmitEvent', event => {
        console.log(event);
        const { socket, data } = event;
        if (socket === player.socket) {
          resolve(data.data);
        }
      });
      await sleep(timeout);
      reject(new Error('Timeout'));
    });

    return promise;
  }


}