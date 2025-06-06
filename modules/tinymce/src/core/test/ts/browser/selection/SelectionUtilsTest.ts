import { describe, it } from '@ephox/bedrock-client';
import { Hierarchy, SugarElement } from '@ephox/sugar';
import { assert } from 'chai';

import * as RangeNormalizer from 'tinymce/core/selection/RangeNormalizer';
import * as SelectionUtils from 'tinymce/core/selection/SelectionUtils';

import * as ViewBlock from '../../module/test/ViewBlock';

describe('browser.tinymce.core.selection.SelectionUtilsTest', () => {
  const viewBlock = ViewBlock.bddSetup();

  const setHtml = viewBlock.update;

  const hasAllContentsSelected = (startPath: number[], startOffset: number, endPath: number[], endOffset: number) => {
    const sc = Hierarchy.follow(SugarElement.fromDom(viewBlock.get()), startPath).getOrDie();
    const ec = Hierarchy.follow(SugarElement.fromDom(viewBlock.get()), endPath).getOrDie();

    const rng = document.createRange();
    rng.setStart(sc.dom, startOffset);
    rng.setEnd(ec.dom, endOffset);

    return SelectionUtils.hasAllContentsSelected(SugarElement.fromDom(viewBlock.get()), rng);
  };

  const getSelectionRange = (startPath: number[], startOffset: number, endPath: number[], endOffset: number): Range => {
    const sc = Hierarchy.follow(SugarElement.fromDom(viewBlock.get()), startPath).getOrDie();
    const ec = Hierarchy.follow(SugarElement.fromDom(viewBlock.get()), endPath).getOrDie();

    const rng = document.createRange();
    rng.setStart(sc.dom, startOffset);
    rng.setEnd(ec.dom, endOffset);

    return RangeNormalizer.normalize(rng);
  };

  it('All text is selected in paragraph (single character)', () => {
    setHtml('<p>a</p>');
    const selected = hasAllContentsSelected([ 0, 0 ], 0, [ 0, 0 ], 1);
    assert.isTrue(selected, 'Should be true since all contents is selected');
  });

  it('All text is selected in paragraph (multiple characters)', () => {
    setHtml('<p>ab</p>');
    const selected = hasAllContentsSelected([ 0, 0 ], 0, [ 0, 0 ], 2);
    assert.isTrue(selected, 'Should be true since all contents is selected');
  });

  it('All text is selected in paragraph and sub element', () => {
    setHtml('<p>a<b>b</b></p>');
    const selected = hasAllContentsSelected([ 0, 0 ], 0, [ 0, 1, 0 ], 1);
    assert.isTrue(selected, 'Should be true since all contents is selected');
  });

  it('All text is selected in paragraph and with trailing br', () => {
    setHtml('<p>a<br></p>');
    const selected = hasAllContentsSelected([ 0, 0 ], 0, [ 0, 0 ], 1);
    assert.isTrue(selected, 'Should be true since all contents is selected');
  });

  it('Collapsed range in paragraph', () => {
    setHtml('<p>a</p>');
    const selected = hasAllContentsSelected([ 0, 0 ], 0, [ 0, 0 ], 0);
    assert.isFalse(selected, 'Should be false since only some contents is selected');
  });

  it('Partial text selection in paragraph (first character)', () => {
    setHtml('<p>ab</p>');
    const selected = hasAllContentsSelected([ 0, 0 ], 0, [ 0, 0 ], 1);
    assert.isFalse(selected, 'Should be false since only some contents is selected');
  });

  it('Partial text selection in paragraph (last character)', () => {
    setHtml('<p>ab</p>');
    const selected = hasAllContentsSelected([ 0, 0 ], 1, [ 0, 0 ], 2);
    assert.isFalse(selected, 'Should be false since only some contents is selected');
  });

  it('Partial mixed selection in paragraph', () => {
    setHtml('<p>a<b>bc</b></p>');
    const selected = hasAllContentsSelected([ 0, 0 ], 1, [ 0, 1, 0 ], 1);
    assert.isFalse(selected, 'Should be false since only some contents is selected');
  });

  it('Selection over the whole tag', () => {
    setHtml('<div><p>ab</p></div>');
    const range = getSelectionRange([ 0 ], 0, [ 0 ], 1);
    assert.isTrue(SelectionUtils.isSelectionOverWholeHTMLElement(range), 'Should be true as the whole p tag is selected');
  });

  it('Selection over part of the tag', () => {
    setHtml('<div><p>ab</p></div>');
    const range = getSelectionRange([ 0, 0 ], 0, [ 0, 0 ], 1);
    assert.isFalse(SelectionUtils.isSelectionOverWholeHTMLElement(range), 'Should be false as the whole p tag is not selected');
  });

  it('Selection over the whole anchor tag', () => {
    setHtml('<div><a>ab</a></div>');
    const range = getSelectionRange([ 0 ], 0, [ 0 ], 1);
    assert.isTrue(SelectionUtils.isSelectionOverWholeAnchor(range), 'Should be true as the whole anchor tag is selected');
  });

  it('Selection over part of the anchor tag', () => {
    setHtml('<div><a>ab</a></div>');
    const range = getSelectionRange([ 0, 0 ], 0, [ 0, 0 ], 1);
    assert.isFalse(SelectionUtils.isSelectionOverWholeAnchor(range), 'Should be false as the whole anchor tag is not selected');
  });

  it('Selection over the whole text node', () => {
    setHtml('<div><p>abcd</p></div>');
    const range = getSelectionRange([ 0, 0 ], 0, [ 0, 0 ], 1);
    assert.isTrue(SelectionUtils.isSelectionOverWholeTextNode(range), 'Should be true as the whole text node is selected');
  });

  it('Selection over part of the text node', () => {
    setHtml('<div><p>abcd</p></div>');
    const range = getSelectionRange([ 0, 0, 0 ], 0, [ 0, 0, 0 ], 3);
    assert.isFalse(SelectionUtils.isSelectionOverWholeTextNode(range), 'Should be false as the whole text node is not selected');
  });
});
