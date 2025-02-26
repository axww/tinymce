import { RealMouse, UiFinder, TestStore } from '@ephox/agar';
import { after, afterEach, before, describe, it } from '@ephox/bedrock-client';
import { DomEvent, EventUnbinder, SugarBody } from '@ephox/sugar';
import { TinyHooks, TinySelections } from '@ephox/wrap-mcagar';

import Editor from 'tinymce/core/api/Editor';
import Plugin from 'tinymce/plugins/image/Plugin';

describe('webdriver.tinymce.plugins.link.OpenLinkTest', () => {
  let unbinder: EventUnbinder;
  const store = TestStore<string>();
  const hook = TinyHooks.bddSetup<Editor>({
    plugins: 'link',
    toolbar: 'link unlink openlink',
    base_url: '/project/tinymce/js/tinymce',
  }, [ Plugin ], true);

  before(() => {
    unbinder = DomEvent.bind(SugarBody.body(), 'click', (e) => {
      // prevent click event bubbling up and open a new tab which is problematic in automatic testing
      e.prevent();
      e.stop();
      store.add((e.target.dom as HTMLAnchorElement).href);
    });
  });

  after(() => {
    unbinder?.unbind();
  });

  afterEach(() => {
    store.clear();
  });

  it('TINY-11009: Open link opens right clicked link when selection is over multiple links', async () => {
    const editor = hook.editor();
    editor.setContent('<p>before <a id="first" href="https://www.exampleone.com">first</a> middle <a id="last" href="https://www.exampletwo.com">last</a> after</p>');
    // Click on the first link
    TinySelections.setSelection(editor, [ 0, 0 ], 2, [ 0, 4 ], 2);
    UiFinder.exists(SugarBody.body(), 'button[data-mce-name="openlink"]');
    await RealMouse.pRightClickOn('iframe => a#first');
    // Check button is enabled
    UiFinder.exists(SugarBody.body(), 'button[data-mce-name="openlink"][aria-disabled="false"]');
    // Check menu item exists and is enabled
    UiFinder.exists(SugarBody.body(), '.tox-collection__item[aria-label="Open link"]');
    UiFinder.exists(SugarBody.body(), '.tox-collection__item[aria-label="Open link"][aria-disabled="false"]');
    await RealMouse.pClickOn('.tox-collection__item[aria-label="Open link"]');
    store.assertEq('Should open the targeted link', [
      'https://www.exampleone.com/'
    ]);
    // Click on the second link
    await RealMouse.pRightClickOn('iframe => a#last');
    // Check button is enabled
    UiFinder.exists(SugarBody.body(), 'button[data-mce-name="openlink"][aria-disabled="false"]');
    // Check menu item exists and is enabled
    UiFinder.exists(SugarBody.body(), '.tox-collection__item[aria-label="Open link"]');
    UiFinder.exists(SugarBody.body(), '.tox-collection__item[aria-label="Open link"][aria-disabled="false"]');
    await RealMouse.pClickOn('.tox-collection__item[aria-label="Open link"]');
    store.assertEq('Should open the targeted link', [
      'https://www.exampleone.com/',
      'https://www.exampletwo.com/'
    ]);
  });
});
