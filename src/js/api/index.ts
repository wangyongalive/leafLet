import { mainRequest } from './base-request'

export function getMapFilterTree() {
  return mainRequest.sendRequest('get', '/label/tree')
}

export function getMapAnchorList() {
  return mainRequest.sendRequest('get', '/map_anchor/list')
}

export function getMapPointDetail(pointId: number) {
  return mainRequest.sendRequest('get', '/map/point/detail', { pointId })
}
