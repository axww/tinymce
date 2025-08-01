import { FieldSchema, StructureSchema } from '@ephox/boulder';
import { Optional, Result } from '@ephox/katamari';

import { ChoiceMenuItemSpec, ImageMenuItemSpec, SeparatorMenuItemSpec } from '../../api/Menu';
import * as ComponentSchema from '../../core/ComponentSchema';

// Temporarily disable separators until things are clearer
export type ToolbarSplitButtonItemTypes = ChoiceMenuItemSpec | SeparatorMenuItemSpec | ImageMenuItemSpec;
export type SuccessCallback = (menu: ToolbarSplitButtonItemTypes[]) => void;
export type SelectPredicate = (value: string) => boolean;

export type PresetTypes = 'color' | 'normal' | 'listpreview' | 'imageselector';
export type PresetItemTypes = 'color' | 'img' | 'normal';
export type ColumnTypes = number | 'auto';

export interface ToolbarSplitButtonSpec {
  type?: 'splitbutton';
  tooltip?: string;
  chevronTooltip?: string;
  icon?: string;
  text?: string;
  select?: SelectPredicate;
  presets?: PresetTypes;
  columns?: ColumnTypes;
  fetch: (success: SuccessCallback) => void;
  onSetup?: (api: ToolbarSplitButtonInstanceApi) => (api: ToolbarSplitButtonInstanceApi) => void;
  onAction: (api: ToolbarSplitButtonInstanceApi) => void;
  onItemAction: (api: ToolbarSplitButtonInstanceApi, value: string) => void;
  context?: string;
}

export interface ToolbarSplitButton {
  type: 'splitbutton';
  tooltip: Optional<string>;
  chevronTooltip: Optional<string>;
  icon: Optional<string>;
  text: Optional<string>;
  select: Optional<SelectPredicate>;
  presets: PresetTypes;
  columns: ColumnTypes;
  fetch: (success: SuccessCallback) => void;
  onSetup: (api: ToolbarSplitButtonInstanceApi) => (api: ToolbarSplitButtonInstanceApi) => void;
  onAction: (api: ToolbarSplitButtonInstanceApi) => void;
  onItemAction: (api: ToolbarSplitButtonInstanceApi, value: string) => void;
  context: string;
}

export interface ToolbarSplitButtonInstanceApi {
  isEnabled: () => boolean;
  setEnabled: (state: boolean) => void;
  setIconFill: (id: string, value: string) => void;
  isActive: () => boolean;
  setActive: (state: boolean) => void;
  setTooltip: (tooltip: string) => void;
  setText: (text: string) => void;
  setIcon: (icon: string) => void;
}

export const splitButtonSchema = StructureSchema.objOf([
  ComponentSchema.type,
  ComponentSchema.optionalTooltip,
  ComponentSchema.optionalChevronTooltip,
  ComponentSchema.optionalIcon,
  ComponentSchema.optionalText,
  ComponentSchema.optionalSelect,
  ComponentSchema.fetch,
  ComponentSchema.onSetup,
  // TODO: Validate the allowed presets
  FieldSchema.defaultedStringEnum('presets', 'normal', [ 'normal', 'color', 'listpreview' ]),
  ComponentSchema.defaultedColumns(1),
  ComponentSchema.onAction,
  ComponentSchema.onItemAction,
  FieldSchema.defaultedString('context', 'mode:design')
]);

export const isSplitButtonButton = (spec: any): spec is ToolbarSplitButton => spec.type === 'splitbutton';

export const createSplitButton = (spec: ToolbarSplitButtonSpec): Result<ToolbarSplitButton, StructureSchema.SchemaError<any>> =>
  StructureSchema.asRaw<ToolbarSplitButton>('SplitButton', splitButtonSchema, spec);
