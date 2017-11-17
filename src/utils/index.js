import evaluator from './evaluator'

/**
 * Translate MOLGENIS attribute types to HTML field types
 *
 * @private
 * @param fieldType Attribute type e.g. STRING, XREF etc...
 * @returns String HTML type e.g. text, number, select etc...
 */
const getHtmlFieldType = (fieldType) => {
  switch (fieldType) {
    case 'BOOL':
    case 'CATEGORICAL':
    case 'ENUM':
      return 'radios'
    case 'XREF':
    case 'MREF':
    case 'ONETOMANY':
      return 'select'
    case 'INT':
    case 'DECIMAL':
    case 'LONG':
      return 'number'
    case 'TEXT':
    case 'SCRIPT':
    case 'HTML':
      return 'text-area'
    case 'DATE':
      return 'date'
    case 'DATE_TIME':
      return 'date-time'
    case 'CATEGORICAL_MREF':
      return 'checkboxes'
    case 'STRING':
      return 'text'
    case 'HYPERLINK':
      return 'url'
    case 'EMAIL':
      return 'email'
    case 'FILE':
      return 'file'
  }
}

/**
 * Return an options array consisting of objects containing id, value, and label
 * For asynchronous option retrieval return an object containing URI, id, and label of the referencing table
 *
 * // TODO redesign this part
 *
 * @private
 * @param attribute
 */
const getOptions = (attribute) => {
  switch (attribute.fieldType) {
    case 'XREF':
    case 'ONETOMANY':
      return {
        uri: attribute.refEntity.hrefCollection,
        id: attribute.refEntity.idAttribute,
        label: attribute.refEntity.labelAttribute,
        multiple: false
      }
    case 'MREF':
      return {
        uri: attribute.refEntity.hrefCollection,
        id: attribute.refEntity.idAttribute,
        label: attribute.refEntity.labelAttribute,
        multiple: true
      }
    case 'CATEGORICAL':
    case 'CATEGORICAL_MREF':
      // use api.get(attribute.refEntity.hrefCollection to imediately retrieve the categorical options
      return {
        uri: attribute.refEntity.hrefCollection,
        id: attribute.refEntity.idAttribute,
        label: attribute.refEntity.labelAttribute
      }
    case 'ENUM':
      return attribute.enumOptions.map(option => {
        return {
          id: option,
          value: option,
          label: option
        }
      })
    case 'BOOL':
      return attribute.nillable ? [
        {id: 'true', value: true, label: 'True'},
        {id: 'false', value: false, label: 'False'},
        {id: 'null', value: 'null', label: 'N/A'}
      ] : [
        {id: 'true', value: true, label: 'True'},
        {id: 'false', value: false, label: 'False'}
      ]
    default:
      return []
  }
}

/**
 * If there is a visible expression present, return a function which evaluates said expression.
 * Else return the visible value from the attribute
 */
const isVisible = (attribute) => {
  const expression = attribute.visibleExpression
  return expression ? (data) => evaluator(expression, data) : attribute.visible
}

/**
 * If there is a nullable expression present, return a function which evaluates said expression.
 * Else return the !nillable value from the attribute
 */
const isNillable = (attribute) => {
  const expression = attribute.nullableExpression
  return expression ? (data) => evaluator(expression, data) : !attribute.nillable
}

const isValid = (attribute) => {
  const expression = attribute.validationExpression
  return expression ? (data) => evaluator(expression, data) : true
}

/**
 * Generate a schema field object suitable for the forms
 *
 * @private
 * @param attribute Attribute metadata from an EntityType V2 response
 * @returns {{type: String, id, label, description, required: boolean, disabled, visible, options: ({uri, id, label, multiple}|{uri, id, label})}}
 */
const generateFormSchemaField = (attribute) => {
  const validators = [isValid]

  return {
    type: getHtmlFieldType(attribute.fieldType),
    id: attribute.name,
    label: attribute.label,
    description: attribute.description,
    required: isNillable(attribute),
    disabled: attribute.readOnly,
    readOnly: attribute.readOnly,
    visible: isVisible(attribute),
    options: getOptions(attribute),
    validators: validators
  }
}

/**
 * Generates a data object suitable for the forms
 *
 * @param fields an array of field identifiers
 * @param data a data object containing everything a EntityType V2 response has in its item list
 * @returns a {fieldId: value} object
 */
const generateFormData = (fields, data) => fields.reduce((accumulator, field) => {
  accumulator[field] = data[field]
  return accumulator
}, {})

/**
 * Generates a schema object suitable for the forms
 *
 * @param schema an object containing the metadata from an EntityType V2 response
 * @returns a {fieldId: {Field}} object
 */
const generateFormSchema = (schema) => schema.attributes.reduce((accumulator, attribute) => {
  accumulator[attribute.name] = generateFormSchemaField(attribute)
  return accumulator
}, {})

export default {
  generateFormSchema,
  generateFormData
}