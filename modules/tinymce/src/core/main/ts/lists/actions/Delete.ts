import { Arr, Optional, Optionals, Type } from '@ephox/katamari';
import { Compare, ContentEditable, PredicateFind, Remove, SugarElement, SugarNode } from '@ephox/sugar';

import DOMUtils from '../../api/dom/DOMUtils';
import RangeUtils from '../../api/dom/RangeUtils';
import DomTreeWalker from '../../api/dom/TreeWalker';
import Editor from '../../api/Editor';
import * as NodeStructureBookmark from '../../bookmark/NodeStructureBookmark';
import * as NodeType from '../lists/NodeType';
import * as NormalizeLists from '../lists/NormalizeLists';
import * as ListRangeUtils from '../lists/RangeUtils';
import * as Selection from '../lists/Selection';
import * as Util from '../lists/Util';

import { flattenListSelection, outdentListSelection } from './Indentation';
import * as ToggleList from './ToggleList';

const findNextCaretContainer = (editor: Editor, rng: Range, isForward: boolean, root: Node): Node | null => {
  let node: Node | null | undefined = rng.startContainer;
  const offset = rng.startOffset;

  if (NodeType.isTextNode(node) && (isForward ? offset < node.data.length : offset > 0)) {
    return node;
  }

  const nonEmptyBlocks = editor.schema.getNonEmptyElements();
  if (NodeType.isElement(node)) {
    node = RangeUtils.getNode(node, offset);
  }

  const walker = new DomTreeWalker(node, root);

  // Delete at <li>|<br></li> then jump over the bogus br
  if (isForward) {
    if (NodeType.isBogusBr(editor.dom, node)) {
      walker.next();
    }
  }

  const walkFn = isForward ? walker.next.bind(walker) : walker.prev2.bind(walker);
  while ((node = walkFn())) {
    if (node.nodeName === 'LI' && !node.hasChildNodes()) {
      return node;
    }

    if (nonEmptyBlocks[node.nodeName]) {
      return node;
    }

    if (NodeType.isTextNode(node) && node.data.length > 0) {
      return node;
    }
  }

  return null;
};

const hasOnlyOneBlockChild = (dom: DOMUtils, elm: Element): boolean => {
  const childNodes = elm.childNodes;
  return childNodes.length === 1 && !NodeType.isListNode(childNodes[0]) && dom.isBlock(childNodes[0]);
};

const isUnwrappable = (node: Node | null): node is HTMLElement =>
  Optional.from(node)
    .map(SugarElement.fromDom)
    .filter(SugarNode.isHTMLElement)
    .exists((el) => ContentEditable.isEditable(el) && !Arr.contains([ 'details' ], SugarNode.name(el)));

const unwrapSingleBlockChild = (dom: DOMUtils, elm: Element): void => {
  if (hasOnlyOneBlockChild(dom, elm) && isUnwrappable(elm.firstChild)) {
    dom.remove(elm.firstChild, true);
  }
};

const moveChildren = (dom: DOMUtils, fromElm: Element, toElm: Element): void => {
  let node;

  const targetElm = hasOnlyOneBlockChild(dom, toElm) ? toElm.firstChild as HTMLElement : toElm;
  unwrapSingleBlockChild(dom, fromElm);

  if (!NodeType.isEmpty(dom, fromElm, true)) {
    while ((node = fromElm.firstChild)) {
      targetElm.appendChild(node);
    }
  }
};

const mergeLiElements = (dom: DOMUtils, fromElm: Element, toElm: Element): void => {
  let listNode: HTMLElement | undefined;
  const ul = fromElm.parentNode as Node;

  if (!NodeType.isChildOfBody(dom, fromElm) || !NodeType.isChildOfBody(dom, toElm)) {
    return;
  }

  if (NodeType.isListNode(toElm.lastChild)) {
    listNode = toElm.lastChild;
  }

  if (ul === toElm.lastChild) {
    if (NodeType.isBr(ul.previousSibling)) {
      dom.remove(ul.previousSibling);
    }
  }

  const node = toElm.lastChild;
  if (node && NodeType.isBr(node) && fromElm.hasChildNodes()) {
    dom.remove(node);
  }

  if (NodeType.isEmpty(dom, toElm, true)) {
    Remove.empty(SugarElement.fromDom(toElm));
  }

  moveChildren(dom, fromElm, toElm);

  if (listNode) {
    toElm.appendChild(listNode);
  }

  const contains = Compare.contains(SugarElement.fromDom(toElm), SugarElement.fromDom(fromElm));

  const nestedLists = contains ? dom.getParents(fromElm, NodeType.isListNode, toElm) : [];

  dom.remove(fromElm);

  Arr.each(nestedLists, (list) => {
    if (NodeType.isEmpty(dom, list) && list !== dom.getRoot()) {
      dom.remove(list);
    }
  });
};

const mergeIntoEmptyLi = (editor: Editor, fromLi: HTMLLIElement, toLi: HTMLLIElement): void => {
  Remove.empty(SugarElement.fromDom(toLi));
  mergeLiElements(editor.dom, fromLi, toLi);
  editor.selection.setCursorLocation(toLi, 0);
};

const mergeForward = (editor: Editor, rng: Range, fromLi: HTMLLIElement, toLi: HTMLLIElement): void => {
  const dom = editor.dom;

  if (dom.isEmpty(toLi)) {
    mergeIntoEmptyLi(editor, fromLi, toLi);
  } else {
    const bookmark = NodeStructureBookmark.createBookmark(rng);
    mergeLiElements(dom, fromLi, toLi);
    editor.selection.setRng(NodeStructureBookmark.resolveBookmark(bookmark));
  }
};

const mergeBackward = (editor: Editor, rng: Range, fromLi: HTMLLIElement, toLi: HTMLLIElement): void => {
  const bookmark = NodeStructureBookmark.createBookmark(rng);
  mergeLiElements(editor.dom, fromLi, toLi);
  const resolvedBookmark = NodeStructureBookmark.resolveBookmark(bookmark);
  editor.selection.setRng(resolvedBookmark);
};

const backspaceDeleteFromListToListCaret = (editor: Editor, isForward: boolean): boolean => {
  const dom = editor.dom, selection = editor.selection;
  const selectionStartElm = selection.getStart();
  const root = Selection.getClosestEditingHost(editor, selectionStartElm);
  const li = dom.getParent(selection.getStart(), 'LI', root) as HTMLLIElement;

  if (li) {
    const ul = li.parentElement;
    if (ul === editor.getBody() && NodeType.isEmpty(dom, ul)) {
      return true;
    }

    const rng = ListRangeUtils.normalizeRange(selection.getRng());
    const otherLi = dom.getParent(findNextCaretContainer(editor, rng, isForward, root), 'LI', root) as HTMLLIElement;
    const willMergeParentIntoChild = otherLi && (isForward ? dom.isChildOf(li, otherLi) : dom.isChildOf(otherLi, li));

    if (otherLi && otherLi !== li && !willMergeParentIntoChild) {
      editor.undoManager.transact(() => {
        if (isForward) {
          mergeForward(editor, rng, otherLi, li);
        } else {
          if (NodeType.isFirstChild(li)) {
            outdentListSelection(editor);
          } else {
            mergeBackward(editor, rng, li, otherLi);
          }
        }
      });

      return true;
    } else if (willMergeParentIntoChild && !isForward && otherLi !== li) {
      const commonAncestorParent = rng.commonAncestorContainer.parentElement;
      if (!commonAncestorParent || dom.isChildOf(otherLi, commonAncestorParent)) {
        return false;
      }

      editor.undoManager.transact(() => {
        const bookmark = NodeStructureBookmark.createBookmark(rng);
        moveChildren(dom, commonAncestorParent, otherLi);
        commonAncestorParent.remove();
        const resolvedBookmark = NodeStructureBookmark.resolveBookmark(bookmark);
        editor.selection.setRng(resolvedBookmark);
      });

      return true;
    } else if (!otherLi) {
      if (!isForward && rng.startOffset === 0 && rng.endOffset === 0) {
        editor.undoManager.transact(() => {
          flattenListSelection(editor);
        });

        return true;
      }
    }
  }

  return false;
};

const removeBlock = (dom: DOMUtils, block: Element, root: Node): void => {
  const parentBlock = dom.getParent(block.parentNode, dom.isBlock, root);

  dom.remove(block);
  if (parentBlock && dom.isEmpty(parentBlock)) {
    dom.remove(parentBlock);
  }
};

const backspaceDeleteIntoListCaret = (editor: Editor, isForward: boolean): boolean => {
  const dom = editor.dom;
  const selectionStartElm = editor.selection.getStart();
  const root = Selection.getClosestEditingHost(editor, selectionStartElm);
  const block = dom.getParent(selectionStartElm, dom.isBlock, root);

  if (block && dom.isEmpty(block, undefined, { checkRootAsContent: true })) {
    const rng = ListRangeUtils.normalizeRange(editor.selection.getRng());
    const nextCaretContainer = findNextCaretContainer(editor, rng, isForward, root);
    const otherLi = dom.getParent(nextCaretContainer, 'LI', root);

    if (nextCaretContainer && otherLi) {
      const findValidElement = (element: SugarElement<Node>) => Arr.contains([ 'td', 'th', 'caption' ], SugarNode.name(element));
      const findRoot = (node: SugarElement<Node>) => node.dom === root;
      const otherLiCell = PredicateFind.closest(SugarElement.fromDom(otherLi), findValidElement, findRoot);
      const caretCell = PredicateFind.closest(SugarElement.fromDom(rng.startContainer), findValidElement, findRoot);

      if (!Optionals.equals(otherLiCell, caretCell, Compare.eq)) {
        return false;
      }

      editor.undoManager.transact(() => {
        const parentNode = otherLi.parentNode as HTMLElement;
        removeBlock(dom, block, root);
        ToggleList.mergeWithAdjacentLists(dom, parentNode);
        editor.selection.select(nextCaretContainer, true);
        editor.selection.collapse(isForward);
      });

      return true;
    }
  }

  return false;
};

const backspaceDeleteCaret = (editor: Editor, isForward: boolean): boolean => {
  return backspaceDeleteFromListToListCaret(editor, isForward) || backspaceDeleteIntoListCaret(editor, isForward);
};

const hasListSelection = (editor: Editor): boolean => {
  const selectionStartElm = editor.selection.getStart();
  const root = Selection.getClosestEditingHost(editor, selectionStartElm);
  const startListParent = editor.dom.getParent(selectionStartElm, 'LI,DT,DD', root);

  return Type.isNonNullable(startListParent) || Selection.getSelectedListItems(editor).length > 0;
};

const backspaceDeleteRange = (editor: Editor): boolean => {
  if (hasListSelection(editor)) {
    editor.undoManager.transact(() => {
      // Some delete actions may prevent the input event from being fired. If we do not detect it, we fire it ourselves.
      let shouldFireInput = true;
      const inputHandler = () => shouldFireInput = false;

      editor.on('input', inputHandler);
      editor.execCommand('Delete');
      editor.off('input', inputHandler);

      if (shouldFireInput) {
        editor.dispatch('input');
      }

      NormalizeLists.normalizeLists(editor.dom, editor.getBody());
    });

    return true;
  }

  return false;
};

const backspaceDelete = (editor: Editor, isForward: boolean): boolean => {
  const selection = editor.selection;
  return !Util.isWithinNonEditableList(editor, selection.getNode()) && (selection.isCollapsed() ?
    backspaceDeleteCaret(editor, isForward) : backspaceDeleteRange(editor)
  );
};

export {
  backspaceDelete,
  hasListSelection
};
