/* eslint-disable no-console */
import { Merger } from '@ephox/katamari';

import { RawEditorOptions, TinyMCE } from 'tinymce/core/api/PublicApi';

declare let tinymce: TinyMCE;

export default (): void => {
  const settings: RawEditorOptions = {
    selector: 'textarea',
    license_key: 'gpl',
    setup: (ed) => {
      let isToggled = false;
      let isToggled2 = false;

      ed.ui.registry.addView('myview1', {
        buttons: [
          {
            type: 'group',
            buttons: [
              {
                type: 'togglebutton',
                tooltip: 'togglableIcon',
                icon: 'info',
                onAction: (statusApi) => {
                  isToggled = !isToggled;
                  statusApi.setIcon(isToggled ? 'fullscreen' : 'info');
                  statusApi.setActive(isToggled);
                }
              },
              {
                type: 'togglebutton',
                text: 'iconAndText',
                tooltip: 'iconAndText',
                icon: 'copy',
                borderless: true,
                onAction: () => {
                  console.log('iconAndText');
                }
              }
            ]
          },
          {
            type: 'togglebutton',
            tooltip: 'togglableIcon2',
            icon: 'info',
            onAction: (statusApi) => {
              isToggled2 = !isToggled2;
              statusApi.setIcon(isToggled2 ? 'fullscreen' : 'info');
              statusApi.setActive(isToggled2);
            }
          },
          {
            type: 'group',
            buttons: [
              {
                tooltip: 'Plus',
                type: 'togglebutton',
                icon: 'plus',
                onAction: () => {
                  console.log('Plus');
                }
              },
              {
                tooltip: 'Minus',
                type: 'togglebutton',
                icon: 'minus',
                onAction: () => {
                  console.log('Minus');
                }
              }
            ]
          },
          {
            type: 'group',
            buttons: [
              {
                type: 'button',
                text: 'Cancel',
                tooltip: 'Cancel',
                onAction: () => console.log('Cancel'),
                buttonType: 'secondary'
              },
              {
                type: 'button',
                text: 'Save Code',
                tooltip: 'Save Code',
                onAction: () => console.log('Save Code'),
                buttonType: 'primary'
              }
            ]
          }
        ],
        onShow: (api: any) => {
          api.getContainer().innerHTML = '<button>myview1</button>';
          api.getContainer().querySelector('button')?.focus();
        },
        onHide: () => console.log('hide')
      });

      ed.ui.registry.addButton('customview', {
        text: 'Custom view',
        onAction: () => {
          ed.execCommand('ToggleView', false, 'myview1');
        }
      });
    },
    init_instance_callback: (ed) => {
      ed.execCommand('ToggleView', false, 'myview1');
    },
    plugins: [],
    toolbar: 'undo redo customview',
    contextmenu: 'link linkchecker image table lists configurepermanentpen'
  };

  tinymce.init(settings);
  tinymce.init(Merger.deepMerge(settings, { inline: true, selector: 'div.tinymce' }));
};
