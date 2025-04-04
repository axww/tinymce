import { Mouse, UiFinder, Waiter } from '@ephox/agar';
import { Boxes } from '@ephox/alloy';
import { Arr, Optional } from '@ephox/katamari';
import { SugarBody, Visibility } from '@ephox/sugar';
import { assert } from 'chai';

import { ToolbarMode } from 'tinymce/themes/silver/api/Options';

export interface OpenNestedMenus {
  readonly label: string;
  readonly selector: string;
}
export interface OpenMenu {
  readonly name: string;
  readonly text: string;
  readonly last?: boolean;
}

const getToolbarSelector = (type: ToolbarMode, opening: boolean) => {
  // type floating or sliding
  const slidingMode = opening ? 'growing' : 'shrinking';
  const slidingClass = `div.tox-toolbar__overflow--open:not(.tox-toolbar__overflow--${slidingMode})`;
  const floatingClass = 'div.tox-toolbar__overflow';
  return type === ToolbarMode.sliding ? slidingClass : floatingClass;
};

const pOpenMenuWithSelector = async (label: string, selector: string): Promise<void> => {
  await UiFinder.pWaitForVisible(`Waiting for button: ${selector}`, SugarBody.body(), selector);
  Mouse.clickOn(SugarBody.body(), selector);
  await UiFinder.pWaitForVisible(`Waiting for menu: ${label}`, SugarBody.body(), '[role="menu"]');
  await Waiter.pWaitBetweenUserActions();
};

const pOpenMore = async (type: ToolbarMode): Promise<void> => {
  Mouse.clickOn(SugarBody.body(), 'button[data-mce-name="overflow-button"]');
  await UiFinder.pWaitForVisible('Waiting for more drawer to open', SugarBody.body(), getToolbarSelector(type, true));
};

const pCloseMore = async (type: ToolbarMode): Promise<void> => {
  Mouse.clickOn(SugarBody.body(), 'button[data-mce-name="overflow-button"]');
  await Waiter.pTryUntil('Waiting for more drawer to close', () => UiFinder.notExists(SugarBody.body(), getToolbarSelector(type, false)));
};

const pOpenAlignMenu = (label: string): Promise<void> => {
  const selector = 'button[aria-label^="Align"].tox-tbtn--select';
  return pOpenMenuWithSelector(label, selector);
};

const pOpenMenu = async (menu: OpenMenu): Promise<void> => {
  const findMenuButton = () => {
    const buttons = UiFinder.findAllIn<HTMLElement>(SugarBody.body(), `button:contains(${menu.text})`);
    if (buttons.length === 0) {
      return Optional.none();
    }
    return Optional.from(menu.last ? buttons[buttons.length - 1] : buttons[0]);
  };

  await Waiter.pTryUntilPredicate(`Waiting for button: ${menu.text}`, () => {
    const button = findMenuButton();
    return button.isSome() && Visibility.isVisible(button.getOrDie());
  });
  Mouse.click(findMenuButton().getOrDie());
  await UiFinder.pWaitForVisible(`Waiting for menu: ${menu.name}`, SugarBody.body(), '[role="menu"]');
  await Waiter.pWaitBetweenUserActions();
};

const pOpenNestedMenus = (menus: OpenNestedMenus[]): Promise<void> =>
  Arr.foldl(menus, (p, menu) => p.then(async () => {
    await pOpenMenuWithSelector(menu.label, menu.selector);
  }), Promise.resolve());

const assertMoreDrawerInViewport = (type: ToolbarMode): void => {
  const toolbar = UiFinder.findIn<HTMLDivElement>(SugarBody.body(), getToolbarSelector(type, true)).getOrDie();
  const winBox = Boxes.win();
  const drawerBox = Boxes.box(toolbar);
  // -1 from the bottom to account for the negative margin
  const inViewport = drawerBox.x >= winBox.x && drawerBox.bottom - 1 <= winBox.bottom;
  assert.isTrue(inViewport, 'Check more drawer is shown within the viewport');
};

export {
  // generic methods
  pOpenMenuWithSelector,
  pOpenMenu,
  pOpenNestedMenus,

  // specific pre-composed
  pOpenAlignMenu,
  pOpenMore,
  pCloseMore,
  assertMoreDrawerInViewport
};
