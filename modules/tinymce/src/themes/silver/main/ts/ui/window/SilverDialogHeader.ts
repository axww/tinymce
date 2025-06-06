import {
  AlloySpec, AlloyTriggers, Behaviour, Button, Channels, Container, DomFactory, Dragging, GuiFactory, ModalDialog, Reflecting, SketchSpec, Tabstopping, Tooltipping
} from '@ephox/alloy';
import { Optional } from '@ephox/katamari';
import { SelectorFind } from '@ephox/sugar';

import { UiFactoryBackstageProviders } from '../../backstage/Backstage';
import { formCancelEvent } from '../general/FormEvents';
import * as Icons from '../icons/Icons';

import { titleChannel } from './DialogChannels';

export interface WindowHeaderSpec {
  title: string;
  draggable: boolean;
}

const renderClose = (providersBackstage: UiFactoryBackstageProviders) => Button.sketch({
  dom: {
    tag: 'button',
    classes: [ 'tox-button', 'tox-button--icon', 'tox-button--naked' ],
    attributes: {
      'type': 'button',
      'aria-label': providersBackstage.translate('Close'),
      'data-mce-name': 'close'
    }
  },
  buttonBehaviours: Behaviour.derive([
    Tabstopping.config({ }),
    Tooltipping.config(
      providersBackstage.tooltips.getConfig({
        tooltipText: providersBackstage.translate('Close')
      })
    )
  ]),
  components: [
    Icons.render('close', { tag: 'span', classes: [ 'tox-icon' ] }, providersBackstage.icons)
  ],
  action: (comp) => {
    AlloyTriggers.emit(comp, formCancelEvent);
  },
});

const renderTitle = (
  spec: WindowHeaderSpec,
  dialogId: string,
  titleId: Optional<string>,
  providersBackstage: UiFactoryBackstageProviders
): AlloySpec => {
  const renderComponents = (data: WindowHeaderSpec) => [ GuiFactory.text(providersBackstage.translate(data.title)) ];

  return {
    dom: {
      tag: 'h1',
      classes: [ 'tox-dialog__title' ],
      attributes: {
        ...titleId.map((x) => ({ id: x })).getOr({})
      }
    },
    components: [],
    behaviours: Behaviour.derive([
      Reflecting.config({
        channel: `${titleChannel}-${dialogId}`,
        initialData: spec,
        renderComponents
      })
    ])
  };
};

const renderDragHandle = () => ({
  dom: DomFactory.fromHtml('<div class="tox-dialog__draghandle"></div>')
});

const renderInlineHeader = (
  spec: WindowHeaderSpec,
  dialogId: string,
  titleId: string,
  providersBackstage: UiFactoryBackstageProviders
): SketchSpec => Container.sketch({
  dom: DomFactory.fromHtml('<div class="tox-dialog__header"></div>'),
  components: [
    renderTitle(spec, dialogId, Optional.some(titleId), providersBackstage),
    renderDragHandle(),
    renderClose(providersBackstage)
  ],
  containerBehaviours: Behaviour.derive([
    Dragging.config({
      mode: 'mouse',
      blockerClass: 'blocker',
      getTarget: (handle) => {
        return SelectorFind.closest<HTMLElement>(handle, '[role="dialog"]').getOrDie();
      },
      snaps: {
        getSnapPoints: () => [],
        leftAttr: 'data-drag-left',
        topAttr: 'data-drag-top'
      },
      onDrag: (comp, target) => {
        comp.getSystem().broadcastOn([ Channels.repositionPopups() ], { target });
      }
    })
  ])
});

const renderModalHeader = (spec: WindowHeaderSpec, dialogId: string, providersBackstage: UiFactoryBackstageProviders): AlloySpec => {
  const pTitle = ModalDialog.parts.title(
    renderTitle(spec, dialogId, Optional.none(), providersBackstage)
  );

  const pHandle = ModalDialog.parts.draghandle(
    renderDragHandle()
  );

  const pClose = ModalDialog.parts.close(
    renderClose(providersBackstage)
  );

  const components = [ pTitle ].concat(spec.draggable ? [ pHandle ] : []).concat([ pClose ]);
  return Container.sketch({
    dom: DomFactory.fromHtml('<div class="tox-dialog__header"></div>'),
    components
  });
};

export {
  renderInlineHeader,
  renderModalHeader
};
