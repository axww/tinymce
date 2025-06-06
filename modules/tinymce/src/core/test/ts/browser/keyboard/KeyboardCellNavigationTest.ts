import { Keys, Waiter } from '@ephox/agar';
import { before, describe, it } from '@ephox/bedrock-client';
import { Cell } from '@ephox/katamari';
import { PlatformDetection } from '@ephox/sand';
import { TinyAssertions, TinyContentActions, TinyHooks, TinySelections } from '@ephox/wrap-mcagar';
import { assert } from 'chai';

import Editor from 'tinymce/core/api/Editor';

describe('browser.tinymce.core.table.KeyboardCellNavigationTest', () => {
  before(function () {
    const browser = PlatformDetection.detect().browser;
    if (!browser.isChromium() && !browser.isSafari()) {
      this.skip();
    }
  });

  const hook = TinyHooks.bddSetupLight<Editor>({
    base_url: '/project/tinymce/js/tinymce',
    height: 300
  }, [], true);

  const selectionChangeState = Cell(false);

  it('TBA: Create lists within table cells and verify keyboard navigation for the cells', async () => {
    const editor = hook.editor();
    editor.setContent(
      '<table><tbody><tr><td><ul><li>a</li><li>b</li></ul></td></tr><tr><td><ul><li>c</li><li>d</li></ul></td></tr></tbody></table>'
    );
    TinySelections.setCursor(editor, [ 0, 0, 0, 0, 0, 1, 0 ], 0);
    TinyContentActions.keydown(editor, Keys.down());
    TinySelections.setCursor(editor, [ 0, 0, 1, 0, 0, 0, 0 ], 0);
    editor.on('SelectionChange', () => {
      selectionChangeState.set(true);
    });
    await Waiter.pTryUntil(
      'editor did not have correct selection',
      () => {
        assert.isTrue(selectionChangeState.get(), 'state is true');
      }
    );
    TinyAssertions.assertCursor(editor, [ 0, 0, 1, 0, 0, 0, 0 ], 0);
  });

  it('TINY-7705: Tabbing forwards should ignore cef cells', () => {
    const editor = hook.editor();
    editor.setContent(
      '<table><tbody>' +
      '<tr><td contenteditable="false">a</td><td>b</td><td>c</td></tr>' +
      '<tr><td contenteditable="false">d</td><td>e</td><td contenteditable="false">f</td></tr>' +
      '</tbody></table>'
    );
    TinySelections.setCursor(editor, [ 0, 0, 0, 1, 0 ], 0);

    // Hook up the editor to make the first cell in the row noneditable when a new row is created while tabbing
    editor.once('NewCell', (e) => {
      e.node.contentEditable = 'false';
    });

    // Move to cell "c"
    TinyContentActions.keydown(editor, Keys.tab());
    TinyAssertions.assertCursor(editor, [ 0, 0, 0, 2, 0 ], 0);
    // Move to cell "e"
    TinyContentActions.keydown(editor, Keys.tab());
    TinyAssertions.assertCursor(editor, [ 0, 0, 1, 1, 0 ], 0);
    // Inserts a new row and moves to it. It should be in the second column
    // as we made the first cell noneditable above
    TinyContentActions.keydown(editor, Keys.tab());
    TinyAssertions.assertCursor(editor, [ 0, 0, 2, 1 ], 0);
  });

  it('TINY-12018: Tabbing forwards should not create a new row if it would not be editable', () => {
    const editor = hook.editor();
    const table = '<table>\n<tbody>\n<tr>\n<td>A</td>\n<td>B</td>\n</tr>\n<tr>\n<td contenteditable="false">C</td>\n<td contenteditable="false">D</td>\n</tr>\n</tbody>\n</table>';
    editor.setContent(table );
    TinySelections.setCursor(editor, [ 0, 0, 0, 1, 0 ], 0);

    TinyContentActions.keydown(editor, Keys.tab());
    TinyAssertions.assertCursor(editor, [ 0, 0, 0, 1, 0 ], 0);
    TinyContentActions.keydown(editor, Keys.tab());
    TinyAssertions.assertCursor(editor, [ 0, 0, 0, 1, 0 ], 0);
    TinyAssertions.assertContent(editor, table);
  });

  it('TINY-12018: Tabbing forwards should create a row if the last row is editable ( Last Cell )', () => {
    const editor = hook.editor();
    const tableStart = '<table>\n<tbody>\n<tr>\n<td>A</td>\n<td>B</td>\n</tr>\n<tr>\n<td contenteditable="false">C</td>\n<td>D</td>\n</tr>\n</tbody>\n</table>';
    const tableEnd = '<table>\n<tbody>\n<tr>\n<td>A</td>\n<td>B</td>\n</tr>\n<tr>\n<td contenteditable="false">C</td>\n<td>D</td>\n</tr>\n<tr>\n<td>&nbsp;</td>\n<td>&nbsp;</td>\n</tr>\n</tbody>\n</table>';
    editor.setContent(tableStart );
    TinySelections.setCursor(editor, [ 0, 0, 0, 1, 0 ], 0);

    TinyContentActions.keydown(editor, Keys.tab());
    TinyAssertions.assertCursor(editor, [ 0, 0, 1, 1, 0 ], 0);
    TinyContentActions.keydown(editor, Keys.tab());
    TinyAssertions.assertCursor(editor, [ 0, 0, 2, 0 ], 0);
    TinyAssertions.assertContent(editor, tableEnd);

  });

  it('TINY-7705: Tabbing backwards should ignore cef cells', () => {
    const editor = hook.editor();
    editor.setContent(
      '<table><tbody>' +
      '<tr><td contenteditable="false">a</td><td>b</td><td contenteditable="false">c</td></tr>' +
      '<tr><td contenteditable="false">d</td><td>e</td><td>f</td></tr>' +
      '</tbody></table>'
    );
    TinySelections.setCursor(editor, [ 0, 0, 1, 2, 0 ], 0);
    // Move to cell "e"
    TinyContentActions.keydown(editor, Keys.tab(), { shiftKey: true });
    TinyAssertions.assertCursor(editor, [ 0, 0, 1, 1, 0 ], 0);
    // Move to cell "b"
    TinyContentActions.keydown(editor, Keys.tab(), { shiftKey: true });
    TinyAssertions.assertCursor(editor, [ 0, 0, 0, 1, 0 ], 0);
  });

  it('TINY-11797: Tabbing forwards in cef table should include cef cells with editable content', () => {
    const editor = hook.editor();
    editor.setContent('<table contenteditable="false"><tbody><tr><td contenteditable="true">cell 1</td><td><div contenteditable="true">cell 2</div></td></tr></tbody></table>');
    TinyAssertions.assertContentPresence(editor, { tr: 1, td: 2, div: 1 });
    TinySelections.setCursor(editor, [ 0, 0, 0, 0, 0 ], 0);
    TinyContentActions.keystroke(editor, Keys.tab());

    // Assert cursor is inside contenteditable div
    TinyAssertions.assertCursor(editor, [ 0, 0, 0, 1, 0, 0 ], 0);
  });

  it('TINY-11797: Tabbing backwards in cef table should include cef cells with editable content', () => {
    const editor = hook.editor();
    editor.setContent('<table contenteditable="false"><tbody><tr><td><div contenteditable="true">cell 1</div></td><td contenteditable="true">cell 2</td></tr></tbody></table>');
    TinyAssertions.assertContentPresence(editor, { tr: 1, td: 2, div: 1 });
    TinySelections.setCursor(editor, [ 0, 0, 0, 1, 0 ], 0);
    TinyContentActions.keystroke(editor, Keys.tab(), { shift: true });

    // Assert cursor is inside contenteditable div
    TinyAssertions.assertCursor(editor, [ 0, 0, 0, 0, 0, 0 ], 0);
  });
});
