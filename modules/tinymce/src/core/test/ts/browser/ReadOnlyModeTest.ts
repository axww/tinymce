import { ApproxStructure, Mouse, UiFinder, Clipboard } from '@ephox/agar';
import { describe, it } from '@ephox/bedrock-client';
import { PlatformDetection } from '@ephox/sand';
import { Attribute, Class, Css, Scroll, SelectorFind, SugarBody, Traverse } from '@ephox/sugar';
import { TinyAssertions, TinyContentActions, TinyDom, TinyHooks, TinySelections } from '@ephox/wrap-mcagar';
import { assert } from 'chai';

import Editor from 'tinymce/core/api/Editor';
import AnchorPlugin from 'tinymce/plugins/anchor/Plugin';
import LinkPlugin from 'tinymce/plugins/link/Plugin';
import TablePlugin from 'tinymce/plugins/table/Plugin';

describe('browser.tinymce.core.ReadOnlyModeTest', () => {
  const hook = TinyHooks.bddSetup<Editor>({
    base_url: '/project/tinymce/js/tinymce',
    toolbar: 'bold',
    plugins: 'table anchor link',
    statusbar: false,
  }, [ AnchorPlugin, LinkPlugin, TablePlugin ]);

  const setMode = (editor: Editor, mode: string) => {
    editor.mode.set(mode);
  };

  const setInitialContentWithReadOnly = (editor: Editor) => {
    editor.setContent('<p>Initial content</p>');
    setMode(editor, 'readonly');
  };

  const assertNestedContentEditableTrueDisabled = (editor: Editor, state: boolean, offscreen: boolean) => TinyAssertions.assertContentStructure(editor,
    ApproxStructure.build((s, str, _arr) => {
      const attrs = state ? {
        'contenteditable': str.is('false'),
        'data-mce-contenteditable': str.is('true')
      } : {
        'contenteditable': str.is('true'),
        'data-mce-contenteditable': str.none()
      };

      return s.element('body', {
        children: [
          s.element('div', {
            attrs: {
              contenteditable: str.is('false')
            },
            children: [
              s.text(str.is('a')),
              s.element('span', {
                attrs
              }),
              s.text(str.is('c'))
            ]
          }),
          ...offscreen ? [ s.element('div', {}) ] : [] // Offscreen cef clone
        ]
      });
    })
  );

  const assertFakeSelection = (editor: Editor, expectedState: boolean) => {
    assert.equal(editor.selection.getNode().hasAttribute('data-mce-selected'), expectedState, 'Selected element should have expected state');
  };

  const assertResizeBars = (editor: Editor, expectedState: boolean) => {
    SelectorFind.descendant(Traverse.documentElement(TinyDom.document(editor)), '.ephox-snooker-resizer-bar').fold(
      () => {
        assert.isFalse(expectedState, 'Was expecting to find resize bars');
      },
      (bar) => {
        const actualDisplay = Css.get(bar, 'display');
        const expectedDisplay = expectedState ? 'block' : 'none';
        assert.equal(actualDisplay, expectedDisplay, 'Should be expected display state on resize bar');
      }
    );
  };

  const mouseOverTable = (editor: Editor) => {
    const table = UiFinder.findIn(TinyDom.body(editor), 'table').getOrDie();
    Mouse.mouseOver(table);
  };

  const assertToolbarButtonDisabled = (expectedState: boolean) => {
    const elm = UiFinder.findIn(SugarBody.body(), 'button[data-mce-name="bold"]').getOrDie();
    assert.equal(Class.has(elm, 'tox-tbtn--disabled'), expectedState, 'Button should have expected disabled state');
  };

  const assertToolbarDisabled = (expectedState: boolean) => {
    const elm = UiFinder.findIn(SugarBody.body(), '.tox-toolbar-overlord').getOrDie();
    assert.equal(Class.has(elm, 'tox-tbtn--disabled'), expectedState, 'Toolbar should have expected disabled state');
    assert.equal(Attribute.get(elm, 'aria-disabled'), expectedState.toString(), 'Toolbar should have expected disabled state');
  };

  const simulateIMEInput = (editor: Editor, events: Array<{ type: string; data?: string; key?: string; code?: string; keyCode?: number }>) => {
    const body = editor.getBody();
    events.forEach((event) => {
      if (event.type === ('compositionupdate')) {
        // Make a direct DOM change that will trigger mutation observer, by typing the text
        TinySelections.setCursor(editor, [], 0);
        TinyContentActions.type(editor, 'test');
      } else if (event.type.startsWith('composition')) {
        const e = new window.CompositionEvent(event.type);
        body.dispatchEvent(e);
      } else if (event.type.startsWith('key')) {
        const e = new KeyboardEvent(event.type, { key: event.key, code: event.code, keyCode: event.keyCode });
        body.dispatchEvent(e);
      }
    });
  };

  it('TBA: Switching to readonly mode while having cef selection should remove fake selection', () => {
    const editor = hook.editor();
    setMode(editor, 'design');
    editor.setContent('<div contenteditable="false">CEF</div>');
    TinySelections.select(editor, 'div[contenteditable="false"]', []);
    assertFakeSelection(editor, true);
    setMode(editor, 'readonly');
    assertFakeSelection(editor, false);
    setMode(editor, 'design');
    assertFakeSelection(editor, true);
  });

  it('TBA: Selecting cef element should add fake selection in all modes', () => {
    const editor = hook.editor();
    setMode(editor, 'design');
    editor.setContent('<div contenteditable="false">CEF</div>');
    TinySelections.select(editor, 'div[contenteditable="false"]', []);
    assertFakeSelection(editor, true);
    setMode(editor, 'readonly');
    TinySelections.select(editor, 'div[contenteditable="false"]', []);
    assertFakeSelection(editor, true);
    setMode(editor, 'design');
    TinySelections.select(editor, 'div[contenteditable="false"]', []);
    assertFakeSelection(editor, true);
  });

  it('TBA: Setting caret before cef in editor while in readonly mode should still render fake caret', () => {
    const visualCaret = ApproxStructure.build((s, str, arr) => {
      return s.element('body', {
        children: [
          s.element('p', {
            attrs: {
              'data-mce-caret': str.is('before'),
              'data-mce-bogus': str.is('all')
            },
            children: [
              s.element('br', {})
            ]
          }),
          s.element('div', {
            attrs: {
              contenteditable: str.is('false')
            },
            children: [
              s.text(str.is('CEF'))
            ]
          }),
          s.element('div', {
            attrs: {
              'data-mce-bogus': str.is('all')
            },
            classes: [ arr.has('mce-visual-caret'), arr.has('mce-visual-caret-before') ]
          })
        ]
      });
    });
    const editor = hook.editor();
    setMode(editor, 'design');
    editor.setContent('<div contenteditable="false">CEF</div>');
    setMode(editor, 'readonly');
    TinySelections.setCursor(editor, [], 0);
    TinyAssertions.assertContentStructure(editor, visualCaret);
    setMode(editor, 'design');
    TinyAssertions.assertContentStructure(editor, visualCaret);
  });

  it('TBA: Switching to readonly mode on content with nested contenteditable=true should toggle them to contenteditable=false', () => {
    const editor = hook.editor();
    setMode(editor, 'design');
    editor.setContent('<div contenteditable="false">a<span contenteditable="true">b</span>c</div>');
    TinySelections.select(editor, 'div[contenteditable="false"]', []);
    assertFakeSelection(editor, true);
    setMode(editor, 'readonly');
    assertNestedContentEditableTrueDisabled(editor, false, true);
    TinyAssertions.assertContent(editor, '<div contenteditable="false">a<span contenteditable="true">b</span>c</div>');
    assertFakeSelection(editor, false);
    setMode(editor, 'design');
    TinyAssertions.assertContent(editor, '<div contenteditable="false">a<span contenteditable="true">b</span>c</div>');
    assertNestedContentEditableTrueDisabled(editor, false, true);
  });

  it('TBA: Setting contents with contenteditable=true should switch them to contenteditable=false while in readonly mode', () => {
    const editor = hook.editor();
    setMode(editor, 'readonly');
    editor.setContent('<div contenteditable="false">a<span contenteditable="true">b</span>c</div>');
    assertNestedContentEditableTrueDisabled(editor, false, false);
    TinyAssertions.assertContent(editor, '<div contenteditable="false">a<span contenteditable="true">b</span>c</div>');
    setMode(editor, 'design');
    TinyAssertions.assertContent(editor, '<div contenteditable="false">a<span contenteditable="true">b</span>c</div>');
    TinySelections.select(editor, 'div[contenteditable="false"]', []);
    assertNestedContentEditableTrueDisabled(editor, false, true);
    editor.setContent('<div contenteditable="false">a<span contenteditable="true">b</span>c</div>');
    TinySelections.select(editor, 'div[contenteditable="false"]', []);
    assertNestedContentEditableTrueDisabled(editor, false, true);
  });

  it('TBA: Resize bars for tables should be hidden while in readonly mode', () => {
    const editor = hook.editor();
    setMode(editor, 'design');
    editor.setContent('<table><tbody><tr><td>a</td></tr></tbody></table>');
    TinySelections.setCursor(editor, [ 0, 0, 0, 0, 0 ], 0);
    mouseOverTable(editor);
    assertResizeBars(editor, true);
    setMode(editor, 'readonly');
    assertResizeBars(editor, false);
    mouseOverTable(editor);
    assertResizeBars(editor, false);
    setMode(editor, 'design');
    mouseOverTable(editor);
    assertResizeBars(editor, true);
  });

  it('TBA: Context toolbar should hide in readonly mode', async () => {
    const editor = hook.editor();
    editor.focus();
    setMode(editor, 'design');
    editor.setContent('<table><tbody><tr><td>a</td></tr></tbody></table>');
    TinySelections.setCursor(editor, [ 0, 0, 0, 0, 0 ], 0);
    await UiFinder.pWaitFor('Waited for context toolbar', SugarBody.body(), '.tox-pop');
    setMode(editor, 'readonly');
    UiFinder.notExists(SugarBody.body(), '.tox-pop');
    setMode(editor, 'design');
    editor.setContent('<table><tbody><tr><td>a</td></tr></tbody></table>');
    TinySelections.setCursor(editor, [ 0, 0, 0, 0, 0 ], 0);
    UiFinder.sWaitFor('Waited for context toolbar', SugarBody.body(), '.tox-pop');
  });

  it('TBA: Main toolbar should not be disabled even when switching to readonly mode', () => {
    const editor = hook.editor();
    setMode(editor, 'design');
    assertToolbarButtonDisabled(false);
    assertToolbarDisabled(false);
    setMode(editor, 'readonly');
    assertToolbarButtonDisabled(true);
    assertToolbarDisabled(false);
    setMode(editor, 'design');
    assertToolbarButtonDisabled(false);
    assertToolbarDisabled(false);
    setMode(editor, 'readonly');
    assertToolbarButtonDisabled(true);
    assertToolbarDisabled(false);
    setMode(editor, 'design');
    assertToolbarButtonDisabled(false);
    assertToolbarDisabled(false);
  });

  it('TBA: Menus should close when switching to readonly mode', () => {
    const editor = hook.editor();
    setMode(editor, 'design');
    const fileMenu = UiFinder.findIn(SugarBody.body(), '.tox-mbtn:contains("File")').getOrDie();
    Mouse.click(fileMenu);
    UiFinder.sWaitFor('Waited for menu', SugarBody.body(), '.tox-menu');
    setMode(editor, 'readonly');
    UiFinder.sNotExists(SugarBody.body(), '.tox-menu');
  });

  const metaKey = PlatformDetection.detect().os.isMacOS() ? { metaKey: true } : { ctrlKey: true };

  it('TINY-6248: processReadonlyEvents should scroll to bookmark with id', () => {
    const editor = hook.editor();
    setMode(editor, 'design');
    editor.resetContent();
    setMode(editor, 'readonly');
    editor.setContent('<p><a href="#someBookmark">internal bookmark</a></p><div style="padding-top: 2000px;"></div><p><a id="someBookmark"></a></p>');

    const body = TinyDom.body(editor);
    const doc = TinyDom.document(editor);
    const yPos = Scroll.get(doc).top;
    const anchor = UiFinder.findIn(body, 'a[href="#someBookmark"]').getOrDie();
    Mouse.click(anchor, metaKey);
    const newPos = Scroll.get(doc).top;
    assert.notEqual(newPos, yPos, 'assert yPos has changed i.e. has scrolled');
  });

  it('TINY-6248: processReadonlyEvents should scroll to bookmark with name', () => {
    const editor = hook.editor();
    setMode(editor, 'design');
    editor.resetContent();
    setMode(editor, 'readonly');
    editor.setContent('<p><a href="#someBookmark">internal bookmark</a></p><div style="padding-top: 2000px;"></div><p><a name="someBookmark"></a></p>');

    const body = TinyDom.body(editor);
    const doc = TinyDom.document(editor);
    const yPos = Scroll.get(doc).top;
    const anchor = UiFinder.findIn(body, 'a[href="#someBookmark"]').getOrDie();
    Mouse.click(anchor, metaKey);
    const newPos = Scroll.get(doc).top;
    assert.notEqual(newPos, yPos, 'assert yPos has changed i.e. has scrolled');
  });

  it('TINY-6800: even in readonly mode copy event should be dispatched', () => {
    const editor = hook.editor();

    let copyEventCount = 0;
    const copyHandler = () => copyEventCount++;
    editor.on('copy', copyHandler);

    Clipboard.copy(TinyDom.body(editor));
    assert.equal(copyEventCount, 1, 'copy event should be fired');
    editor.off('copy', copyHandler);
  });

  it('TINY-11363: IME composition events should be blocked in readonly mode', () => {
    const editor = hook.editor();
    setInitialContentWithReadOnly(editor);

    simulateIMEInput(editor, [
      { type: 'compositionstart' },
      { type: 'compositionupdate' },
      { type: 'compositionend' }
    ]);

    TinyAssertions.assertContent(editor, '<p>Initial content</p>');
  });

  // it('TINY-11363: IME input with keyboard events should be blocked in readonly mode', () => {
  //   const editor = hook.editor();
  //   setInitialContentWithReadOnly(editor);

  //   simulateIMEInput(editor, [
  //     // { type: 'keydown', key: 'i', code: 'KeyI', keyCode: 73 },
  //     { type: 'compositionstart' },
  //     { type: 'compositionupdate' },
  //     // { type: 'keydown', key: 'n', code: 'KeyN', keyCode: 78 },
  //     { type: 'compositionupdate' },
  //     // { type: 'keydown', key: 'Enter', code: 'Enter', keyCode: 13 },
  //     { type: 'compositionupdate' },
  //     { type: 'compositionend' },
  //     { type: 'keyup', key: 'Enter', code: 'Enter', keyCode: 13 }
  //   ]);

  //   TinyAssertions.assertContent(editor, '<p>Initial content</p>');
  // });

  it('TINY-11363: IME input with space key should be blocked in readonly mode', () => {
    const editor = hook.editor();
    setInitialContentWithReadOnly(editor);

    simulateIMEInput(editor, [
      { type: 'keydown', key: ' ', code: 'Space', keyCode: 32 },
      { type: 'compositionstart' },
      { type: 'compositionupdate' },
      { type: 'compositionend' },
      { type: 'keyup', key: ' ', code: 'Space', keyCode: 32 }
    ]);

    TinyAssertions.assertContent(editor, '<p>Initial content</p>');
  });

  it('TINY-11363: IME input with enter key should be blocked in readonly mode', () => {
    const editor = hook.editor();
    setInitialContentWithReadOnly(editor);

    simulateIMEInput(editor, [
      { type: 'keydown', key: 'Enter', code: 'Enter', keyCode: 13 },
      { type: 'compositionstart' },
      { type: 'compositionupdate' },
      { type: 'compositionend' },
      { type: 'keyup', key: 'Enter', code: 'Enter', keyCode: 13 }
    ]);

    TinyAssertions.assertContent(editor, '<p>Initial content</p>');
  });

  it('TINY-11363: Input events should be blocked in readonly mode', () => {
    const editor = hook.editor();
    setMode(editor, 'readonly');

    const body = editor.getBody();
    const inputEvent = new InputEvent('input', { data: 'new content' });
    body.dispatchEvent(inputEvent);

    TinyAssertions.assertContent(editor, '<p>Initial content</p>');
  });

  it('TINY-11363: Undo/Redo should be disabled in readonly mode', () => {
    const editor = hook.editor();
    setInitialContentWithReadOnly(editor);
    editor.undoManager.add();
    editor.setContent('<p>Modified content</p>');
    editor.undoManager.add();
    setMode(editor, 'readonly');

    editor.execCommand('Undo');
    TinyAssertions.assertContent(editor, '<p>Modified content</p>');

    editor.execCommand('Redo');
    TinyAssertions.assertContent(editor, '<p>Modified content</p>');
  });

  it('TINY-11363: Mutation observer should clear undo stack after reverting changes in readonly mode', () => {
    const editor = hook.editor();

    // Set up initial state with some undo history
    setInitialContentWithReadOnly(editor);
    editor.undoManager.add();
    editor.setContent('<p>Modified content</p>');
    editor.undoManager.add();

    // Verify we have undo/redo capability before readonly
    assert.isTrue(editor.undoManager.hasUndo(), 'Should have undo levels before readonly');

    setMode(editor, 'readonly');

    // Start composition and make a mutation that should be caught by observer
    editor.getBody().dispatchEvent(new window.CompositionEvent('compositionstart'));

    // Make a direct DOM change that will trigger mutation observer
    const firstPara = editor.getBody().firstChild;
    if (firstPara) {
      firstPara.textContent = 'Changed during composition';
    }

    // End composition which will process the mutations
    editor.getBody().dispatchEvent(new window.CompositionEvent('compositionend'));

    // Verify content is reverted
    TinyAssertions.assertContent(editor, '<p>Modified content</p>');

    // Verify undo stack is cleared
    assert.isFalse(editor.undoManager.hasUndo(), 'Should not have undo levels after mutation revert');
    assert.isFalse(editor.undoManager.hasRedo(), 'Should not have redo levels after mutation revert');
  });
});
