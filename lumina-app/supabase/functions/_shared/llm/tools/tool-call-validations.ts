import * as Converters from '../../../_shared-client/utils/conversion-utils.ts';
import { ValidationError } from '../../../_shared-client/error/ValidationError.ts';
import { type ToolEnum } from './ToolEnum.ts';

export function validateBoolParam(boolJson: unknown, paramName: string): boolean {
  if (boolJson == null) {
    throw new ValidationError(`Error: ${paramName} parameter missing`);
  }
  const boolValue = Converters.toBoolean(boolJson);
  if (boolValue == null) {
    throw new ValidationError(`Error: ${paramName} parameter not boolean`);
  }
  return boolValue;
}

export function validateNumberParam(
  numberJson: unknown,
  paramName: string,
  useInt: boolean,
  min?: number,
  max?: number,
): number {
  if (numberJson == null) {
    throw new ValidationError(`Error: ${paramName} parameter missing`);
  }
  const numValue = useInt ? Converters.toInt(numberJson) : Converters.toFloat(numberJson);
  if (numValue == null) {
    throw new ValidationError(`Error: ${paramName} parameter not ${useInt ? 'integer' : 'number'}`);
  }

  if (min != null) {
    if (max != null) {
      if (numValue < min || numValue > max) {
        throw new ValidationError(`Error: ${paramName} parameter must be between ${min} and ${max}`);
      }
    } else if (numValue < min) {
      throw new ValidationError(`Error: ${paramName} parameter must be equal or larger than ${min}`);
    }
  } else if (max != null && numValue > max) {
    throw new ValidationError(`Error: ${paramName} parameter must be equal or smaller than ${max}`);
  }

  return numValue;
}

export function validateStringParam(stringJson: unknown, paramName: string): string {
  if (stringJson == null) {
    throw new ValidationError(`Error: ${paramName} parameter missing`);
  }
  const stringValue = Converters.toString(stringJson);
  if (stringValue == null) {
    throw new ValidationError(`Error: ${paramName} parameter not a string`);
  }
  return stringValue;
}

export function validateStringArrayParam(stringArrayJson: unknown, paramName: string): string[] {
  if (stringArrayJson == null) {
    throw new ValidationError(`Error: ${paramName} parameter missing`);
  }
  const arrayValue = Array.isArray(stringArrayJson) ? stringArrayJson : undefined;
  if (arrayValue == null) {
    throw new ValidationError(`Error: ${paramName} parameter not an array of strings`);
  }
  const stringArrayValue: string[] = [];
  for (let i = 0; i < arrayValue.length; i++) {
    stringArrayValue.push(validateStringParam(arrayValue[i], `${paramName}[${i}]`));
  }
  return stringArrayValue;
}

function findEnumByName<E>(enumName: string, enums?: ToolEnum<E>[]): ToolEnum<E> | undefined {
  const nameNormalized = enumName.toLowerCase()?.trim();
  if (enums && nameNormalized) {
    for (const toolEnum of enums) {
      // TODO: add a fuzzy comparison?
      if (nameNormalized === toolEnum.name.toLowerCase()) {
        return toolEnum;
      }
    }
  }
  return undefined;
}

export function validateEnumParam<E>(stringJson: unknown, paramName: string, enums?: ToolEnum<E>[]): ToolEnum<E> {
  const enumValue = validateStringParam(stringJson, paramName);
  const toolEnum = findEnumByName(enumValue, enums);
  if (toolEnum == null) {
    throw new ValidationError(`Error: ${paramName} parameter has unknown value`);
  }
  return toolEnum;
}
