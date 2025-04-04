import { UiFinder } from '@ephox/agar';
import { afterEach, describe, it } from '@ephox/bedrock-client';
import { Arr } from '@ephox/katamari';
import { SugarBody, SugarElement, SugarNode } from '@ephox/sugar';
import { TinyAssertions, TinyHooks, TinySelections, TinyState } from '@ephox/wrap-mcagar';
import { assert } from 'chai';

import Editor from 'tinymce/core/api/Editor';
import { TableModifiedEvent } from 'tinymce/core/api/EventTypes';
import { EditorEvent } from 'tinymce/core/api/util/EventDispatcher';
import Plugin from 'tinymce/plugins/table/Plugin';

import * as TableTestUtils from '../../module/test/TableTestUtils';

describe('browser.tinymce.plugins.table.TableRowDialogTest', () => {
  const hook = TinyHooks.bddSetupLight<Editor>({
    plugins: 'table',
    base_url: '/project/tinymce/js/tinymce',
    toolbar: 'tablerowprops',
    indent: false,
    valid_styles: {
      '*': 'width,height,vertical-align,text-align,float,border-color,border-style,background-color,border,padding,border-spacing,border-collapse'
    },
    setup: (editor: Editor) => {
      editor.on('TableModified', logEvent);
    }
  }, [ Plugin ], true);

  const generalLabels = {
    type: 'Row type',
    align: 'Alignment',
    height: 'Height'
  };

  let events: Array<EditorEvent<TableModifiedEvent>> = [];
  const logEvent = (event: EditorEvent<TableModifiedEvent>) => {
    events.push(event);
  };

  const clearEvents = () => events = [];

  const defaultEvents = [{ type: 'tablemodified', structure: false, style: true }];
  const assertEvents = (expectedEvents: Array<{ type: string; structure: boolean; style: boolean }> = defaultEvents) => {
    Arr.each(events, (event) => {
      const tableElm = SugarElement.fromDom(event.table);
      assert.isTrue(SugarNode.isTag('table')(tableElm), 'Expected events should have been fired');
    });

    const actualEvents = Arr.map(events, (event) => ({
      type: event.type,
      structure: event.structure,
      style: event.style,
    }));
    assert.deepEqual(actualEvents, expectedEvents, 'Expected events should have been fired');
  };

  const baseHtml = '<table style="border: 1px solid black; border-collapse: collapse;" border="1"><tr><td>X</td></tr></table>';

  const baseData = {
    height: '',
    align: '',
    type: 'body'
  };

  const advHtml = '<table style="border: 1px solid black; border-collapse: collapse;" border="1"><thead>' +
    '<tr style="height: 10px; text-align: right; border-color: red; background-color: blue"><td>X</td></tr>' +
    '</thead></table>';

  const advData = {
    align: 'right',
    height: '10px',
    type: 'header',
    backgroundcolor: 'blue',
    bordercolor: 'red',
    borderstyle: ''
  };

  afterEach(() => {
    clearEvents();
  });

  it('TBA: Table row properties dialog (get data from plain cell)', async () => {
    const editor = hook.editor();
    assertEvents([]);
    editor.options.set('table_row_advtab', false);
    editor.setContent(baseHtml);
    TinySelections.select(editor, 'td', [ 0 ]);
    await TableTestUtils.pOpenTableDialog(editor);
    TableTestUtils.assertDialogValues(baseData, false, generalLabels);
    await TableTestUtils.pClickDialogButton(editor, false);
    assertEvents([]);
  });

  it('TBA: Table row properties dialog (update all)', async () => {
    const editor = hook.editor();
    editor.setContent(baseHtml);
    TinySelections.select(editor, 'td', [ 0 ]);
    await TableTestUtils.pOpenTableDialog(editor);
    TableTestUtils.setDialogValues({
      height: '10',
      align: 'right',
      type: 'header'
    }, false, generalLabels);
    await TableTestUtils.pClickDialogButton(editor, true);
    TinyAssertions.assertContent(editor, '<table style="border: 1px solid black; border-collapse: collapse;" border="1"><thead><tr style="height: 10px; text-align: right;"><td>X</td></tr></thead></table>');
    assertEvents([{ type: 'tablemodified', structure: true, style: true }]);
  });

  it('TINY-1167: Caption should always stay the firstChild of the table', async () => {
    const editor = hook.editor();
    editor.setContent('<table><caption>CAPTION</caption><tbody><tr><td>X</td></tr><tr><td>Y</td></tr></tbody></table>');
    TinySelections.select(editor, 'td', [ 0 ]);
    await TableTestUtils.pOpenTableDialog(editor);

    TableTestUtils.setDialogValues({
      height: '',
      align: '',
      type: 'header'
    }, false, generalLabels);
    await TableTestUtils.pClickDialogButton(editor, true);
    TinyAssertions.assertContent(editor, '<table><caption>CAPTION</caption><thead><tr><td>X</td></tr></thead><tbody><tr><td>Y</td></tr></tbody></table>');
    assertEvents([{ type: 'tablemodified', structure: true, style: false }]);
  });

  it('TBA: Table row properties dialog (get data from complex row)', async () => {
    const editor = hook.editor();
    editor.options.set('table_row_advtab', true);
    editor.setContent(advHtml);
    TinySelections.select(editor, 'td', [ 0 ]);
    await TableTestUtils.pOpenTableDialog(editor);
    TableTestUtils.assertDialogValues(advData, true, generalLabels);
    await TableTestUtils.pClickDialogButton(editor, false);
    assertEvents([]);
  });

  it('TBA: Update advanced styles from row properties dialog', async () => {
    const editor = hook.editor();
    editor.setContent(
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr>' +
      '<td>a</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    );
    TinySelections.select(editor, 'td', [ 0 ]);
    await TableTestUtils.pOpenTableDialog(editor);
    TableTestUtils.setDialogValues({
      align: '',
      height: '',
      type: 'body',
      bordercolor: 'blue',
      borderstyle: 'dotted',
      backgroundcolor: '#ff0000'
    }, true, generalLabels);
    await TableTestUtils.pClickDialogButton(editor, true);
    TinyAssertions.assertContent(editor,
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr style="border-color: blue; border-style: dotted; background-color: #ff0000;">' +

      '<td>a</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    );
    assertEvents();
  });

  it('TBA: Remove all advanced styles through the style field', async () => {
    const editor = hook.editor();
    editor.setContent(advHtml);

    TinySelections.select(editor, 'tr:nth-child(1) td:nth-child(1)', [ 0 ]);
    await TableTestUtils.pOpenTableDialog(editor);
    TableTestUtils.assertDialogValues(advData, true, generalLabels);
    TableTestUtils.setDialogValues({
      align: '',
      height: '',
      type: 'body',
      backgroundcolor: '',
      bordercolor: '',
      borderstyle: ''
    }, true, generalLabels);
    await TableTestUtils.pClickDialogButton(editor, true);
    TinyAssertions.assertContent(editor,
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr>' +
      '<td>X</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    );
    assertEvents([{ type: 'tablemodified', structure: true, style: true }]);
  });

  it('TBA: Table row properties dialog update multiple rows', async () => {
    const initialHtml =
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr style="height: 20px; border-color: blue;">' +
      '<td data-mce-selected="1">a</td>' +
      '<td data-mce-selected="1">b</td>' +
      '</tr>' +
      '<tr style="height: 20px; border-color: blue;">' +
      '<td data-mce-selected="1">c</td>' +
      '<td data-mce-selected="1">d</td>' +
      '</tr>' +
      '</tbody></table>';

    const initialData = {
      align: '',
      height: '20px',
      type: 'body',
      backgroundcolor: '',
      bordercolor: 'blue',
      borderstyle: ''
    };

    const newData = {
      align: 'center',
      type: 'body',
      bordercolor: 'red',
    };

    const newHtml =
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr style="height: 20px; text-align: center; border-color: red;">' +
      '<td>a</td>' +
      '<td>b</td>' +
      '</tr>' +
      '<tr style="height: 20px; text-align: center; border-color: red;">' +
      '<td>c</td>' +
      '<td>d</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>';

    const editor = hook.editor();
    editor.setContent(initialHtml);
    TinySelections.select(editor, 'tr:nth-child(2) td:nth-child(2)', [ 0 ]);
    await TableTestUtils.pOpenTableDialog(editor);
    TableTestUtils.assertDialogValues(initialData, true, generalLabels);
    TableTestUtils.setDialogValues(newData, true, generalLabels);
    await TableTestUtils.pClickDialogButton(editor, true);
    TinyAssertions.assertContent(editor, newHtml);
    assertEvents();
  });

  it('TINY-8625: Table row properties dialog updates multiple rows, but does not override unchanged values', async () => {
    const initialHtml =
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr style="height: 20px; border-color: blue;">' +
      '<td data-mce-selected="1">a</td>' +
      '<td data-mce-selected="1">b</td>' +
      '</tr>' +
      '<tr style="height: 20px; border-color: red;">' +
      '<td data-mce-selected="1">c</td>' +
      '<td data-mce-selected="1">d</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>';

    const initialData = {
      align: '',
      height: '20px',
      type: 'body',
      backgroundcolor: '',
      bordercolor: '',
      borderstyle: ''
    };

    const newData = {
      align: 'center',
      height: '30px',
      type: 'body',
      backgroundcolor: 'red'
    };

    const newHtml =
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr style="height: 30px; text-align: center; border-color: blue; background-color: red;">' +
      '<td>a</td>' +
      '<td>b</td>' +
      '</tr>' +
      '<tr style="height: 30px; text-align: center; border-color: red; background-color: red;">' +
      '<td>c</td>' +
      '<td>d</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>';

    const editor = hook.editor();
    editor.setContent(initialHtml);
    TinySelections.select(editor, 'tr:nth-child(2) td:nth-child(2)', [ 0 ]);
    await TableTestUtils.pOpenTableDialog(editor);
    TableTestUtils.assertDialogValues(initialData, true, generalLabels);
    TableTestUtils.setDialogValues(newData, true, generalLabels);
    await TableTestUtils.pClickDialogButton(editor, true);
    TinyAssertions.assertContent(editor, newHtml);
    assertEvents();
  });

  it('TINY-8625: Table row properties dialog updates multiple rows and allows resetting values', async () => {
    const initialHtml =
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr style="height: 20px; text-align: center; border-color: blue; border-style: dotted; background-color: red;">' +
      '<td data-mce-selected="1">a</td>' +
      '<td data-mce-selected="1">b</td>' +
      '</tr>' +
      '<tr style="height: 20px; text-align: center; border-color: blue; border-style: dotted; background-color: red;">' +
      '<td data-mce-selected="1">c</td>' +
      '<td data-mce-selected="1">d</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>';

    const initialData = {
      align: 'center',
      height: '20px',
      type: 'body',
      backgroundcolor: 'red',
      bordercolor: 'blue',
      borderstyle: 'dotted'
    };

    const newData = {
      align: '',
      height: '',
      type: 'body',
      backgroundcolor: '',
      bordercolor: '',
      borderstyle: ''
    };

    const newHtml =
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr>' +
      '<td>a</td>' +
      '<td>b</td>' +
      '</tr>' +
      '<tr>' +
      '<td>c</td>' +
      '<td>d</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>';

    const editor = hook.editor();
    editor.setContent(initialHtml);
    TinySelections.select(editor, 'tr:nth-child(2) td:nth-child(2)', [ 0 ]);
    await TableTestUtils.pOpenTableDialog(editor);
    TableTestUtils.assertDialogValues(initialData, true, generalLabels);
    TableTestUtils.setDialogValues(newData, true, generalLabels);
    await TableTestUtils.pClickDialogButton(editor, true);
    TinyAssertions.assertContent(editor, newHtml);
    assertEvents();
  });

  it('TBA: Change table row type from header to body', async () => {
    const initialHtml = '<table style="border: 1px solid black; border-collapse: collapse;" border="1"><thead><tr><td>X</td></tr></thead><tbody><tr><td>Y</td></tr></tbody></table>';
    const expectedHtml = '<table style="border: 1px solid black; border-collapse: collapse;" border="1"><tbody><tr><td>X</td></tr><tr><td>Y</td></tr></tbody></table>';

    const initialData = {
      align: '',
      height: '',
      type: 'header',
      backgroundcolor: '',
      bordercolor: '',
      borderstyle: ''
    };

    const editor = hook.editor();
    editor.setContent(initialHtml);

    TinySelections.select(editor, 'tr:nth-child(1) td:nth-child(1)', [ 0 ]);
    await TableTestUtils.pOpenTableDialog(editor);
    TableTestUtils.assertDialogValues(initialData, true, generalLabels);
    TableTestUtils.setDialogValues({
      align: '',
      height: '',
      type: 'body',
      backgroundcolor: '',
      bordercolor: '',
      borderstyle: ''
    }, true, generalLabels);
    await TableTestUtils.pClickDialogButton(editor, true);
    TinyAssertions.assertContent(editor, expectedHtml);
    assertEvents([{ type: 'tablemodified', structure: true, style: false }]);
  });

  it('TINY-9459: Should not open table row properties dialog on noneditable table', () => {
    const editor = hook.editor();
    editor.setContent('<table contenteditable="false"><tbody><tr><td>x</td></tr></tbody></table>');
    TinySelections.setCursor(editor, [ 1, 0, 0, 0, 0 ], 0); // Index offset off by one due to cef fake caret
    editor.execCommand('mceTableRowProps');
    UiFinder.notExists(SugarBody.body(), '.tox-dialog');
  });

  it('TINY-9459: Should not open table row properties dialog on noneditable root', () => {
    TinyState.withNoneditableRootEditor(hook.editor(), (editor) => {
      editor.setContent('<table><tbody><tr><td>x</td></tr></tbody></table>');
      TinySelections.setCursor(editor, [ 0, 0, 0, 0, 0 ], 0);
      editor.execCommand('mceTableRowProps');
      UiFinder.notExists(SugarBody.body(), '.tox-dialog');
    });
  });

  it('TINY-10617: should not remove td/th heights when not changing height of row (single row)', async () => {
    const editor = hook.editor();
    editor.setContent(
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr>' +
      '<td style="height: 20px;">a</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    );
    TinySelections.select(editor, 'td', [ 0 ]);
    await TableTestUtils.pOpenTableDialog(editor);

    TableTestUtils.assertDialogValues({
      align: '',
      height: '',
      type: 'body',
      backgroundcolor: '',
      bordercolor: '',
      borderstyle: ''
    }, true, generalLabels);

    TableTestUtils.setDialogValues({
      align: '',
      height: '',
      type: 'body',
      bordercolor: 'blue',
      borderstyle: 'dotted',
      backgroundcolor: '#ff0000'
    }, true, generalLabels);
    await TableTestUtils.pClickDialogButton(editor, true);

    TinyAssertions.assertContent(editor,
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr style="border-color: blue; border-style: dotted; background-color: #ff0000;">' +
      '<td style="height: 20px;">a</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    );
    assertEvents();
  });

  it('TINY-10617: should not remove td/th heights when not changing height of row (multiple rows)', async () => {
    const editor = hook.editor();
    editor.setContent(
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr style="height: 20px; border-color: blue;">' +
      '<td data-mce-selected="1" style="height: 20px;">a</td>' +
      '<td data-mce-selected="1" style="height: 20px;">b</td>' +
      '</tr>' +
      '<tr style="height: 20px; border-color: red;">' +
      '<td data-mce-selected="1" style="height: 20px;">c</td>' +
      '<td data-mce-selected="1" style="height: 20px;">d</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    );
    TinySelections.select(editor, 'tr:nth-child(2) td:nth-child(2)', [ 0 ]);
    await TableTestUtils.pOpenTableDialog(editor);
    TableTestUtils.assertDialogValues({
      align: '',
      height: '20px',
      type: 'body',
      backgroundcolor: '',
      bordercolor: '',
      borderstyle: ''
    }, true, generalLabels);

    TableTestUtils.setDialogValues({
      align: 'center',
      backgroundcolor: 'red'
    }, true, generalLabels);
    await TableTestUtils.pClickDialogButton(editor, true);

    TinyAssertions.assertContent(editor,
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr style="height: 20px; text-align: center; border-color: blue; background-color: red;">' +
      '<td style="height: 20px;">a</td>' +
      '<td style="height: 20px;">b</td>' +
      '</tr>' +
      '<tr style="height: 20px; text-align: center; border-color: red; background-color: red;">' +
      '<td style="height: 20px;">c</td>' +
      '<td style="height: 20px;">d</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    );
    assertEvents();
  });

  it('TINY-10617: should remove td/th heights when changing height of row (single row)', async () => {
    const editor = hook.editor();
    editor.setContent(
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr>' +
      '<td style="height: 20px; border-color: green;">a</td>' +
      '<td style="height: 10px; border-color: yellow;">b</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    );
    TinySelections.select(editor, 'td', [ 0 ]);
    await TableTestUtils.pOpenTableDialog(editor);

    TableTestUtils.assertDialogValues({
      align: '',
      height: '',
      type: 'body',
      backgroundcolor: '',
      bordercolor: '',
      borderstyle: ''
    }, true, generalLabels);

    TableTestUtils.setDialogValues({
      align: '',
      height: '50px',
      type: 'body',
      bordercolor: 'blue',
    }, true, generalLabels);
    await TableTestUtils.pClickDialogButton(editor, true);

    TinyAssertions.assertContent(editor,
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr style="height: 50px; border-color: blue;">' +
      '<td style="border-color: green;">a</td>' +
      '<td style="border-color: yellow;">b</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    );
    assertEvents();
  });

  it('TINY-10617: should remove td/th heights when changing height of row (multiple rows)', async () => {
    const editor = hook.editor();
    editor.setContent(
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr>' +
      '<td data-mce-selected="1" style="height: 20px; border-color: green;">a</td>' +
      '<td style="height: 10px; border-color: yellow;">b</td>' +
      '</tr>' +
      '<tr style="height: 40px;">' +
      '<td data-mce-selected="1" style="height: 40px; border-color: red;">c</td>' +
      '<td style="height: 40px; border-color: blue;">d</td>' +
      '</tr>' +
      '<tr style="height: 30px;">' +
      '<td style="height: 30px; border-color: purple;">e</td>' +
      '<td style="height: 30px; border-color: pink;">f</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    );
    TinySelections.select(editor, 'tr:nth-child(2) td:nth-child(1)', [ 0 ]);
    await TableTestUtils.pOpenTableDialog(editor);

    TableTestUtils.assertDialogValues({
      align: '',
      height: '',
      type: 'body',
      backgroundcolor: '',
      bordercolor: '',
      borderstyle: ''
    }, true, generalLabels);

    TableTestUtils.setDialogValues({
      align: '',
      height: '50px',
      type: 'body',
      bordercolor: 'blue',
    }, true, generalLabels);
    await TableTestUtils.pClickDialogButton(editor, true);

    TinyAssertions.assertContent(editor,
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr style="height: 50px; border-color: blue;">' +
      '<td style="border-color: green;">a</td>' +
      '<td style="border-color: yellow;">b</td>' +
      '</tr>' +
      '<tr style="height: 50px; border-color: blue;">' +
      '<td style="border-color: red;">c</td>' +
      '<td style="border-color: blue;">d</td>' +
      '</tr>' +
      '<tr style="height: 30px;">' +
      '<td style="height: 30px; border-color: purple;">e</td>' +
      '<td style="height: 30px; border-color: pink;">f</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    );
    assertEvents();
  });

  it('TINY-10617: should remove td/th heights when changing height of row (cells with rowpan)', async () => {
    const editor = hook.editor();
    editor.setContent(
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr>' +
      '<td style="height: 20px; border-color: green;">a</td>' +
      '<td rowspan="2" style="height: 10px; border-color: yellow;">b</td>' +
      '</tr>' +
      '<tr style="height: 30px;">' +
      '<td style="height: 30px; border-color: blue;">c</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    );
    TinySelections.select(editor, 'td', [ 0 ]);
    await TableTestUtils.pOpenTableDialog(editor);

    TableTestUtils.assertDialogValues({
      align: '',
      height: '',
      type: 'body',
      backgroundcolor: '',
      bordercolor: '',
      borderstyle: ''
    }, true, generalLabels);

    TableTestUtils.setDialogValues({
      align: '',
      height: '50px',
      type: 'body',
      bordercolor: 'blue',
    }, true, generalLabels);
    await TableTestUtils.pClickDialogButton(editor, true);

    TinyAssertions.assertContent(editor,
      '<table style="border: 1px solid black; border-collapse: collapse;" border="1">' +
      '<tbody>' +
      '<tr style="height: 50px; border-color: blue;">' +
      '<td style="border-color: green;">a</td>' +
      '<td style="border-color: yellow;" rowspan="2">b</td>' +
      '</tr>' +
      '<tr style="height: 30px;">' +
      '<td style="height: 30px; border-color: blue;">c</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    );
    assertEvents();
  });

  it('TINY-11383: Changing row type from body to header on an indexed table should work', async () => {
    const editor = hook.editor();
    editor.setContent(
      '<table style="border-collapse: collapse; width: 100%;" border="1" data-snooker-col-series="numeric" data-snooker-locked-cols="0">' +
      '<colgroup>' +
      '<col style="width: 10%;"><' +
      'col style="width: 90%;">' +
      '</colgroup>' +
      '<tbody>' +
      '<tr>' +
      '<td contenteditable="false" data-mce-selected="1">1</td>' +
      '<td>&nbsp;</td>' +
      '</tr>' +
      '<tr>' +
      '<td contenteditable="false">2</td>' +
      '<td>&nbsp;</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    );
    await TableTestUtils.pOpenTableDialog(editor);
    TableTestUtils.assertDialogValues({
      type: 'body',
    }, true, generalLabels);

    TableTestUtils.setDialogValues({
      type: 'header',
    }, true, generalLabels);
    await TableTestUtils.pClickDialogButton(editor, true);

    TinyAssertions.assertContent(editor,
      '<table style="width: 100%; border-collapse: collapse;" border="1" data-snooker-col-series="numeric" data-snooker-locked-cols="0">' +
      '<colgroup>' +
      '<col style="width: 10%;">' +
      '<col style="width: 90%;">' +
      '</colgroup>' +
      '<thead>' +
      '<tr>' +
      '<td contenteditable="false">1</td>' +
      '<td>&nbsp;</td>' +
      '</tr>' +
      '</thead>' +
      '<tbody>' +
      '<tr>' +
      '<td contenteditable="false">2</td>' +
      '<td>&nbsp;</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    );
    assertEvents([{ type: 'tablemodified', structure: true, style: false }]);
  });

  it('TINY-11383: Changing row type from heander to body on an indexed table should work', async () => {
    const editor = hook.editor();
    editor.setContent(
      '<table style="width: 100%; border-collapse: collapse;" border="1" data-snooker-col-series="numeric" data-snooker-locked-cols="0">' +
      '<colgroup>' +
      '<col style="width: 10%;">' +
      '<col style="width: 90%;">' +
      '</colgroup>' +
      '<thead>' +
      '<tr>' +
      '<td contenteditable="false" data-mce-selected="1">1</td>' +
      '<td>&nbsp;</td>' +
      '</tr>' +
      '</thead>' +
      '<tbody>' +
      '<tr>' +
      '<td contenteditable="false">2</td>' +
      '<td>&nbsp;</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    );
    await TableTestUtils.pOpenTableDialog(editor);
    TableTestUtils.assertDialogValues({
      type: 'header',
    }, true, generalLabels);

    TableTestUtils.setDialogValues({
      type: 'body',
    }, true, generalLabels);
    await TableTestUtils.pClickDialogButton(editor, true);

    TinyAssertions.assertContent(editor,
      '<table style="width: 100%; border-collapse: collapse;" border="1" data-snooker-col-series="numeric" data-snooker-locked-cols="0">' +
      '<colgroup>' +
      '<col style="width: 10%;">' +
      '<col style="width: 90%;">' +
      '</colgroup>' +
      '<tbody>' +
      '<tr>' +
      '<td contenteditable="false">1</td>' +
      '<td>&nbsp;</td>' +
      '</tr>' +
      '<tr>' +
      '<td contenteditable="false">2</td>' +
      '<td>&nbsp;</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    );
    assertEvents([{ type: 'tablemodified', structure: true, style: false }]);
  });
});
