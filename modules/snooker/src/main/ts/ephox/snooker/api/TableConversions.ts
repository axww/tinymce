import { Arr, Optional } from '@ephox/katamari';
import { Attribute, Css, SugarElement } from '@ephox/sugar';

import * as Sizes from '../resize/Sizes';

import { redistribute } from './Sizes';
import * as TableLookup from './TableLookup';

// Remove legacy sizing attributes such as "width"
const cleanupLegacyAttributes = (element: SugarElement<HTMLElement>): void => {
  Attribute.remove(element, 'width');
  Attribute.remove(element, 'height');
};

const convertToPercentSizeWidth = (table: SugarElement<HTMLTableElement>): void => {
  const newWidth = Sizes.getPercentTableWidth(table);
  redistribute(table, Optional.some(newWidth), Optional.none());
  cleanupLegacyAttributes(table);
};

const convertToPixelSizeWidth = (table: SugarElement<HTMLTableElement>): void => {
  const newWidth = Sizes.getPixelTableWidth(table);
  redistribute(table, Optional.some(newWidth), Optional.none());
  cleanupLegacyAttributes(table);
};

const convertToPixelSizeHeight = (table: SugarElement<HTMLTableElement>): void => {
  const newHeight = Sizes.getPixelTableHeight(table);
  redistribute(table, Optional.none(), Optional.some(newHeight));
  cleanupLegacyAttributes(table);
};

const convertToNoneSizeWidth = (table: SugarElement<HTMLTableElement>): void => {
  Css.remove(table, 'width');
  const columns = TableLookup.columns(table);
  const rowElements: SugarElement<HTMLElement>[] = columns.length > 0 ? columns : TableLookup.cells(table);

  Arr.each(rowElements, (cell) => {
    Css.remove(cell, 'width');
    cleanupLegacyAttributes(cell);
  });
  cleanupLegacyAttributes(table);
};

export {
  convertToPixelSizeWidth,
  convertToPercentSizeWidth,
  convertToNoneSizeWidth,
  convertToPixelSizeHeight
};

