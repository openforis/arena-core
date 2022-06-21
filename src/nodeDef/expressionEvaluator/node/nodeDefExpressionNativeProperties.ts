import { NodeDefType } from '../../nodeDef'
import { NodeDefs } from '../../nodeDefs'

const nativeProperties: { [key: string]: string } = {
  length: 'length',
}

const jsTypeByNodeDefType: { [key in NodeDefType]?: any } = {
  [NodeDefType.code]: String,
  [NodeDefType.date]: String,
  [NodeDefType.decimal]: Number,
  [NodeDefType.integer]: Number,
  [NodeDefType.text]: String,
}

const classByObjectType: { [key: string]: any } = {
  number: Number,
  string: String,
}

const _getJsType = (nodeDefOrValue: any) => {
  if (nodeDefOrValue.uuid) {
    // the parameter is a nodeDef
    return jsTypeByNodeDefType[nodeDefOrValue.type as NodeDefType]
  }
  // the parameter is a value (number or string)
  return classByObjectType[typeof nodeDefOrValue]
}

const _hasProperty = (params: { JsType: any; propName: string }) => {
  const { JsType, propName } = params
  return Object.prototype.hasOwnProperty.call(JsType, propName)
}

const _hasFunction = (params: { JsType: any; funcName: string }) => {
  const { JsType, funcName } = params
  return Boolean(JsType.prototype[funcName])
}

const hasNativeProperty = (params: { nodeDefOrValue: any; propName: string }) => {
  const { nodeDefOrValue, propName } = params
  if (propName === nativeProperties.length && NodeDefs.isMultiple(nodeDefOrValue)) {
    return true
  }
  const JsType = _getJsType(nodeDefOrValue)
  return JsType && (_hasProperty({ JsType, propName }) || _hasFunction({ JsType, funcName: propName }))
}

const evalNodeDefProperty = (params: { nodeDefOrValue: any; propName: string }) => {
  const { nodeDefOrValue, propName } = params
  if (propName === nativeProperties.length) {
    return 0
  }
  const JsType = _getJsType(nodeDefOrValue)
  if (_hasProperty({ JsType, propName })) {
    return JsType[propName]
  }
  // return function with name "propertyName" and bind it to an instance of JsType
  return JsType.prototype[propName].bind(new JsType())
}

export const NodeNativeProperties = {
  hasNativeProperty,
  evalNodeDefProperty,
}
