import { ApproxStructure, Assertions, FocusTools, Keys, Mouse, StructAssert, TestStore, UiFinder, Waiter } from '@ephox/agar';
import { beforeEach, describe, it } from '@ephox/bedrock-client';
import { Arr } from '@ephox/katamari';
import { SugarBody, SugarDocument } from '@ephox/sugar';
import { TinyHooks, TinySelections, TinyUiActions } from '@ephox/wrap-mcagar';

import Editor from 'tinymce/core/api/Editor';
import { Menu } from 'tinymce/core/api/ui/Ui';
import LocalStorage from 'tinymce/core/api/util/LocalStorage';

import * as GuiSetup from '../../module/GuiSetup';

describe('browser.tinymce.themes.silver.skin.OxideColorSwatchMenuTest', () => {
  const store = TestStore();
  const hook = TinyHooks.bddSetup<Editor>({
    toolbar: 'swatch-button forecolor backcolor',
    base_url: '/project/tinymce/js/tinymce',
    setup: (ed: Editor) => {
      ed.ui.registry.addSplitButton('swatch-button', {
        type: 'splitbutton',
        presets: 'color',
        columns: 2,
        tooltip: 'swatch-button',
        fetch: (callback) => {
          const items = Arr.map([
            'green',
            'red',
            'blue',
            'black',
            'white'
          ], (c): Menu.ChoiceMenuItemSpec => ({ type: 'choiceitem', text: c, value: c }));
          callback(items.concat([
            {
              type: 'choiceitem',
              text: 'Remove',
              icon: 'fake-icon-name',
              value: 'remove'
            },
            {
              type: 'choiceitem',
              text: 'Custom',
              icon: 'fake-icon-name',
              value: 'custom'
            }
          ]));
        },
        onAction: store.adder('onAction'),
        onItemAction: store.adder('onItemAction')
      });
    },
    color_map_background: [
      '#FFFFFF', 'white',
      'rgb(224, 62, 45)', 'red',
      '#000000', 'black',
    ],
    menu: {
      color: {
        title: 'Color',
        items: 'backcolor'
      },
      forecolor: {
        title: 'Forecolor',
        items: 'forecolor'
      }
    },
    menubar: 'color forecolor'
  }, []);

  const structColor = (value: string): ApproxStructure.Builder<StructAssert> =>
    (s, str, arr) => s.element('div', {
      classes: [ arr.has('tox-swatch') ],
      styles: {
        'background-color': str.is(value)
      }
    });

  const structColors = (values: string[]): ApproxStructure.Builder<StructAssert[]> =>
    (s, str, arr) => Arr.map(values, (v) => structColor(v)(s, str, arr));

  const assertFocusIsOnColor = (expected: string) => {
    const focused = FocusTools.getFocused(SugarDocument.getDocument()).getOrDie();
    Assertions.assertStructure(
      'Checking focus is on ' + expected,
      ApproxStructure.build((s, str, arr) => structColor(expected)(s, str, arr)),
      focused
    );
  };

  const pOpenAndGetMenu = (title: string) =>
    () => {
      Mouse.clickOn(SugarBody.body(), `button[data-mce-name="${title}-chevron"]`);
      return Waiter.pTryUntil('Waiting for menu', () =>
        UiFinder.findIn(SugarBody.body(), '[role="menu"]').getOrDie()
      );
    };

  const pCloseMenu = (title: string) =>
    () => {
      Mouse.clickOn(SugarBody.body(), `button[data-mce-name="${title}-chevron"]`);
      return Waiter.pTryUntil('Waiting for menu', () =>
        UiFinder.notExists(SugarBody.body(), '[role="menu"]')
      );
    };

  const pOpenAndGetSwatchButtonMenu = pOpenAndGetMenu('swatch-button');
  const pCloseSwatchButtonMenu = pCloseMenu('swatch-button');
  const pOpenAndGetForecolorMenu = pOpenAndGetMenu('forecolor');
  const pCloseForecolorMenu = pCloseMenu('forecolor');
  const pOpenAndGetMenuColorMenu = async (editor: Editor) => {
    const mainButton = 'button:contains("Color")';
    const submenuButton = '[role="menu"] div[aria-label^="Background color"]';
    TinyUiActions.clickOnMenu(editor, mainButton);
    await TinyUiActions.pWaitForUi(editor, submenuButton);
    TinyUiActions.clickOnUi(editor, submenuButton);
    return TinyUiActions.pWaitForUi(editor, '.tox-swatches-menu');
  };
  const closeMenuColorMenu = (editor: Editor) =>
    TinyUiActions.clickOnMenu(editor, 'button:contains("Color")');

  const pOpenAndGetMenuForecolorMenu = async (editor: Editor) => {
    const mainButton = 'button:contains("Forecolor")';
    const submenuButton = '[role="menu"] div[aria-label^="Text color"]';
    TinyUiActions.clickOnMenu(editor, mainButton);
    await TinyUiActions.pWaitForUi(editor, submenuButton);
    TinyUiActions.clickOnUi(editor, submenuButton);
    return TinyUiActions.pWaitForUi(editor, '.tox-swatches-menu');
  };

  const pCloseMenuForecolorMenu = (editor: Editor) => {
    const mainButton = 'button:contains("Forecolor")';
    TinyUiActions.clickOnMenu(editor, mainButton);
    return Waiter.pTryUntil('The menu should have closed', () => UiFinder.notExists(TinyUiActions.getUiRoot(editor), '[role="menu"] div[aria-label^="Text color"]'));
  };

  const pOpenAndGetBackcolorMenu = pOpenAndGetMenu('backcolor');
  const pCloseBackcolorMenu = pCloseMenu('backcolor');

  GuiSetup.bddAddStyles(SugarDocument.getDocument(), [
    ':focus { transform: scale(0.8) }'
  ]);

  beforeEach(() => {
    LocalStorage.clear();
  });

  it('Check structure of color swatch', async () => {
    const editor = hook.editor();
    const menu = await pOpenAndGetSwatchButtonMenu();
    Assertions.assertStructure(
      'Checking menu structure for color swatches',
      ApproxStructure.build((s, str, arr) => s.element('div', {
        classes: [ arr.has('tox-menu') ],
        attrs: {
          role: str.is('menu')
        },
        children: [
          s.element('div', {
            classes: [ arr.has('tox-swatches') ],
            children: [
              s.element('div', {
                classes: [ arr.has('tox-swatches__row') ],
                children: structColors([ 'green', 'red' ])(s, str, arr)
              }),
              s.element('div', {
                classes: [ arr.has('tox-swatches__row') ],
                children: structColors([ 'blue', 'black' ])(s, str, arr)
              }),
              s.element('div', {
                classes: [ arr.has('tox-swatches__row') ],
                children: (structColors([ 'white' ])(s, str, arr)).concat([
                  s.element('div', {
                    classes: [ arr.has('tox-swatch'), arr.has('tox-swatch--remove') ],
                    children: [
                      s.element('svg', {})
                    ]
                  })
                ])
              }),
              s.element('div', {
                classes: [ arr.has('tox-swatches__row') ],
                children: [
                  s.element('button', {
                    classes: [ arr.has('tox-swatch'), arr.has('tox-swatches__picker-btn') ],
                    children: [
                      s.element('svg', {})
                    ]
                  })
                ]
              })
            ]
          })
        ]
      })),
      menu
    );

    assertFocusIsOnColor('green');
    TinyUiActions.keydown(editor, Keys.down());
    assertFocusIsOnColor('blue');
    TinyUiActions.keydown(editor, Keys.right());
    assertFocusIsOnColor('black');
    await pCloseSwatchButtonMenu();
  });

  it('TINY-9395: Check structure of menu color swatch', async () => {
    const editor = hook.editor();
    const menu = await pOpenAndGetMenuColorMenu(editor);

    Assertions.assertStructure(
      'Checking menu structure for color swatches',
      ApproxStructure.build((s, str, arr) => s.element('div', {
        classes: [ arr.has('tox-menu') ],
        attrs: {
          role: str.none('The role should not be present')
        },
        children: [
          s.element('div', {
            classes: [ arr.has('tox-swatches') ],
            children: [
              s.element('div', {
                classes: [ arr.has('tox-swatches__row') ],
                children: [
                  s.element('div', {
                    classes: [ arr.has('tox-swatch') ],
                    styles: {
                      'background-color': str.is('rgb(255, 255, 255)')
                    },
                    attrs: {
                      'aria-checked': str.is('false')
                    }
                  }),
                  s.element('div', {
                    classes: [ arr.has('tox-swatch') ],
                    styles: {
                      'background-color': str.is('rgb(224, 62, 45)')
                    },
                    attrs: {
                      'aria-checked': str.is('false')
                    }
                  }),
                  s.element('div', {
                    classes: [ arr.has('tox-swatch') ],
                    styles: {
                      'background-color': str.is('rgb(0, 0, 0)')
                    },
                    attrs: {
                      'aria-checked': str.is('true')
                    }
                  }),
                  s.element('div', {
                    classes: [ arr.has('tox-swatch') ],
                  }),
                  s.element('button', {
                    classes: [ arr.has('tox-swatch') ],
                  }),
                ]
              }),
            ]
          })
        ]
      })),
      menu
    );

    closeMenuColorMenu(editor);

    editor.setContent('<p style="background-color: rgb(224, 62, 45);">red</p>');
    TinySelections.setSelection(editor, [ 0, 0 ], 1, [ 0, 0 ], 2, true);

    await pOpenAndGetMenuColorMenu(editor);
    assertFocusIsOnColor('rgb(224, 62, 45)');
    closeMenuColorMenu(editor);
  });

  it('TINY-9283: selected color is successfully marked', async () => {
    const editor = hook.editor();
    editor.setContent('<p>black</p><p style="color: rgb(224, 62, 45);">red</p>');
    TinySelections.setSelection(editor, [ 0, 0 ], 1, [ 0, 0 ], 2, true);

    await pOpenAndGetForecolorMenu();
    assertFocusIsOnColor('rgb(0, 0, 0)');
    await pCloseForecolorMenu();

    TinySelections.setSelection(editor, [ 1, 0 ], 1, [ 1, 0 ], 2, true);

    await pOpenAndGetForecolorMenu();
    assertFocusIsOnColor('rgb(224, 62, 45)');
    await pCloseForecolorMenu();
  });

  it('TINY-9342: selected color is successfully marked even in a tree', async () => {
    const editor = hook.editor();
    editor.setContent('<pre><span style="background-color: rgb(224, 62, 45);"><b>red</b></span></pre>');

    TinySelections.setCursor(editor, [ 0, 0, 0, 0 ], 1, true);

    await pOpenAndGetBackcolorMenu();
    assertFocusIsOnColor('rgb(224, 62, 45)');
    await pCloseBackcolorMenu();
  });

  it('TINY-9497: Opening the menu with different colors should display in the menu', async () => {
    const editor = hook.editor();

    editor.setContent('<p>black</p>');
    TinySelections.setSelection(editor, [ 0, 0 ], 1, [ 0, 0 ], 2, true);
    await pOpenAndGetMenuColorMenu(editor);
    await UiFinder.pWaitFor('The color should be black in the icon', TinyUiActions.getUiRoot(editor), 'path[class="tox-icon-highlight-bg-color__color"][fill="#000000"]');
    TinyUiActions.clickOnUi(editor, '[role="menuitemradio"][aria-label="red"]');
    await pOpenAndGetMenuColorMenu(editor);
    await UiFinder.pWaitFor('The color should be red in the icon', TinyUiActions.getUiRoot(editor), 'path[class="tox-icon-highlight-bg-color__color"][fill="#E03E2D"]');
    closeMenuColorMenu(editor);
  });

  it('TINY-9439: selecting color from menubar is successfully marked', async () => {
    const editor = hook.editor();
    editor.setContent('<p>black</p><p style="color: rgb(224, 62, 45);">red</p>');
    TinySelections.setSelection(editor, [ 0, 0 ], 1, [ 0, 0 ], 2, true);
    await pOpenAndGetMenuColorMenu(editor);
    TinyUiActions.clickOnUi(editor, '[role="menuitemradio"][aria-label="red"]');

    await pOpenAndGetBackcolorMenu();
    assertFocusIsOnColor('rgb(224, 62, 45)');
    await pCloseBackcolorMenu();
    await pOpenAndGetMenuForecolorMenu(editor);
    TinyUiActions.clickOnUi(editor, '[role="menuitemradio"][aria-label="Light Gray"]');
    await pOpenAndGetForecolorMenu();
    assertFocusIsOnColor('rgb(236, 240, 241)');
    await pCloseMenuForecolorMenu(editor);
  });
});
