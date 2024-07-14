import mock from 'mockjs'
import { MainHost } from '../api/constants'
import { LabelTreeData } from './label-tree-data'
import { MapAnchorList } from './map-anchor-list'

function mockLabelTree() {
  mock.mock(new RegExp(`${MainHost}/label/tree($|\\?.*)`), {
    code: 0,
    data: LabelTreeData,
    message: '成功'
  })
}

function mockMapAnchorList() {
  mock.mock(new RegExp(`${MainHost}/map_anchor/list($|\\?.*)`), {
    code: 0,
    data: MapAnchorList,
    message: '成功'
  })
}

function mockMapPointDetail() {
  mock.mock(new RegExp(`${MainHost}/map/point/detail($|\\?.*)`), {
    code: 0,
    data: {
      correct_user_list: [
        {
          img: 'https://img-static.mihoyo.com/communityweb/upload/7537c48f03523f00c8dcb0e3297aaa1a.png',
          name: '闪电猫zyl'
        },
        {
          img: 'https://img-static.mihoyo.com/avatar/avatar1.png',
          name: '翟明旭'
        }
      ],
      info: {
        content: '七天神像（蒙德风起地）',
        img: 'https://webstatic.mihoyo.com/upload/wiki-ys-map/2021/07/15/200544245/09de2f1833a2d366f12dcfcb96c4ab1d_4069115992316936619.png'
      },
      last_update_time: '2022-04-18 10:09:07'
    },
    message: '成功'
  })
}

export function mockAllData() {
  mockLabelTree()
  mockMapAnchorList()
  mockMapPointDetail()
}
