import { FieldSchema, StructureSchema, ValueType } from '@ephox/boulder';
import { Optional, Result } from '@ephox/katamari';

import * as ComponentSchema from '../../core/ComponentSchema';

import { FormComponentWithLabel, formComponentWithLabelFields, FormComponentWithLabelSpec } from './FormComponent';

export interface TextAreaSpec extends FormComponentWithLabelSpec {
  type: 'textarea';
  placeholder?: string;
  maximized?: boolean;
  enabled?: boolean;
  context?: string;
}

export interface TextArea extends FormComponentWithLabel {
  type: 'textarea';
  maximized: boolean;
  placeholder: Optional<string>;
  enabled: boolean;
  context: string;
}

const textAreaFields = formComponentWithLabelFields.concat([
  FieldSchema.optionString('placeholder'),
  FieldSchema.defaultedBoolean('maximized', false),
  ComponentSchema.enabled,
  FieldSchema.defaultedString('context', 'mode:design'),
]);

export const textAreaSchema = StructureSchema.objOf(textAreaFields);

export const textAreaDataProcessor = ValueType.string;

export const createTextArea = (spec: TextAreaSpec): Result<TextArea, StructureSchema.SchemaError<any>> =>
  StructureSchema.asRaw<TextArea>('textarea', textAreaSchema, spec);
