import { Assertions } from '@ephox/agar';
import { describe, it } from '@ephox/bedrock-client';
import { SelectorFind, SugarBody, Traverse } from '@ephox/sugar';
import { TinyAssertions, TinyDom, TinyHooks } from '@ephox/wrap-mcagar';
import { assert } from 'chai';

import Editor from 'tinymce/core/api/Editor';

describe('browser.tinymce.core.init.InitEditorNoThemeInlineTest', () => {
  const hook = TinyHooks.bddSetup<Editor>({
    theme: false,
    inline: true,
    base_url: '/project/tinymce/js/tinymce',
    init_instance_callback: (editor: Editor) => {
      editor.dispatch('SkinLoaded');
    }
  }, []);

  it('Tests if the editor is responsive after setting theme to false', () => {
    const editor = hook.editor();
    editor.setContent('<p>a</p>');
    TinyAssertions.assertContent(editor, '<p>a</p>');
  });

  it('Editor element properties', () => {
    const editor = hook.editor();
    const body = SugarBody.body();
    const targetElement = SelectorFind.descendant(body, '#' + editor.id).getOrDie('No elm');

    // TODO FIXME this seems like an odd exception
    assert.isNull(editor.getContainer(), 'Should be null since inline without a theme does not set editorContainer');
    Assertions.assertDomEq('Should be expected editor body element', targetElement, TinyDom.body(editor));
    Assertions.assertDomEq('Should be expected editor target element', targetElement, TinyDom.targetElement(editor));
    Assertions.assertDomEq('Editor.contentAreaContainer should equal target element', targetElement, TinyDom.contentAreaContainer(editor));

    assert.lengthOf(Traverse.nextSiblings(targetElement), 0, 'There should be no element added next to inline editor');
  });
});
