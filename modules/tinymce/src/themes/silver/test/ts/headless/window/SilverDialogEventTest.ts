import { Mouse, TestStore, UiFinder, Waiter } from '@ephox/agar';
import { AlloyComponent, Behaviour, GuiFactory, ModalDialog, Positioning, TooltippingTypes } from '@ephox/alloy';
import { before, beforeEach, describe, it } from '@ephox/bedrock-client';
import { ValueType } from '@ephox/boulder';
import { DialogManager } from '@ephox/bridge';
import { Fun, Optional, Result } from '@ephox/katamari';
import { SugarBody } from '@ephox/sugar';

import I18n from 'tinymce/core/api/util/I18n';
import { UiFactoryBackstage, UiFactoryBackstageProviders } from 'tinymce/themes/silver/backstage/Backstage';
import { renderDialog } from 'tinymce/themes/silver/ui/window/SilverDialog';

import * as GuiSetup from '../../module/GuiSetup';

describe('headless.tinymce.themes.silver.window.SilverDialogEventTest', () => {
  const hook = GuiSetup.bddSetup(() =>
    // Build the sink for the component
    GuiFactory.build({
      dom: {
        tag: 'div'
      },
      behaviours: Behaviour.derive([
        Positioning.config({})
      ])
    })
  );

  const dialogSpec = (store: TestStore): DialogManager.DialogInit<{}> => ({
    internalDialog: {
      title: 'test dialog',
      size: 'normal',
      body: {
        type: 'panel',
        items: [],
        classes: []
      },
      buttons: [
        {
          context: 'any',
          type: 'cancel',
          name: 'cancel',
          text: 'Cancel',
          align: 'end',
          primary: false,
          buttonType: Optional.some('secondary'),
          enabled: true,
          icon: Optional.none()
        },
        {
          context: 'any',
          type: 'submit',
          name: 'save',
          text: 'Save',
          align: 'end',
          primary: true,
          buttonType: Optional.some('primary'),
          enabled: true,
          icon: Optional.none()
        }
      ],
      initialData: {},
      onChange: Fun.noop,
      onAction: Fun.noop,
      onTabChange: Fun.noop,
      onSubmit: (api) => {
        store.adder('onSubmit')();
        api.close();
      },
      onClose: store.adder('onClose'),
      onCancel: store.adder('onCancel')
    },
    initialData: {},
    dataValidator: ValueType.anyValue()
  });

  let dialog: AlloyComponent;
  before(() => {
    const getTooltipComponents = () => [
      {
        dom: {
          tag: 'div',
        },
        components: [
          GuiFactory.text('Test')
        ]
      }
    ];

    const store = hook.store();
    const sink = hook.component();
    const dialogStuff = renderDialog(
      // Build the component
      dialogSpec(store),
      {
        redial: () => dialogSpec(store),
        closeWindow: () => store.adder('closeWindow')
      },
      {
        shared: {
          getSink: () => Result.value(sink),
          providers: {
            checkUiComponentContext: Fun.constant({ contextType: 'any', shouldDisable: false }),
            icons: () => ({}),
            menuItems: () => ({}),
            translate: I18n.translate,
            isDisabled: Fun.never,
            getOption: (_settingName: string) => undefined,
            tooltips: {
              getConfig: (): TooltippingTypes.TooltippingConfigSpec => {
                return {
                  lazySink: () => Result.value(hook.component()),
                  tooltipDom: { tag: 'div' },
                  tooltipComponents: getTooltipComponents()
                };
              },
              getComponents: getTooltipComponents,
            }
          } as UiFactoryBackstageProviders
        },
        dialog: {
          isDraggableModal: Fun.never
        }
      } as UiFactoryBackstage
    );

    dialog = dialogStuff.dialog;
  });

  beforeEach(() => {
    hook.store().clear();
  });

  const pOpenDialogAndClick = async (selector: string, expectedSequence: string[]) => {
    const store = hook.store();
    const sink = hook.component();
    ModalDialog.show(dialog);
    await Waiter.pTryUntil(
      'Waiting for blocker to disappear after clicking close', () => UiFinder.exists(SugarBody.body(), '.tox-dialog-wrap')
    );
    Mouse.clickOn(sink.element, selector);
    store.assertEq('Check event sequence', expectedSequence);
    ModalDialog.hide(dialog);
  };

  it('Test events for the Submit button', () => pOpenDialogAndClick('button.tox-button:contains(Save)', [ 'onSubmit', 'onClose' ]));

  it('Test events for the Cancel button', () => pOpenDialogAndClick('button.tox-button:contains(Cancel)', [ 'onCancel', 'onClose' ]));

  it('Test events for the X button', () => pOpenDialogAndClick('[aria-label="Close"]', [ 'onCancel', 'onClose' ]));
});
