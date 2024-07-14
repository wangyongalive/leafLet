import L from 'leaflet'
import { getMapPointDetail } from './api'
import { EventManager } from './event-manager'

interface AreaNameConfig {
  lat: number
  lng: number
  name: string
  children: AreaNameConfig[]
}

interface PointConfig {
  lat: number
  lng: number
  pointId: number
  name: string
  icon: string
}

interface Vector {
  x: number
  y: number
}

export interface GuideUIItem {
  lat: number
  lng: number
  icon: string
  angle: number
}

export class MapManager {
  private map: L.Map
  private areaNameLayerGroup: L.LayerGroup | undefined
  private pointLayerGroup: L.LayerGroup | undefined
  private mapAnchorList: AreaNameConfig[] = []
  private prevZoom = 0
  private lastActivePointId = -1
  private pointList: PointConfig[] = []

  constructor(domId: string) {
    //  图片的默认大小在使用gdal2tiles就可以设置，这里设置的只是leaflet的默认大小
    // 也可以通过点击左上角和右下角的来查看图片的实际大小
    const bounds = L.latLngBounds(L.latLng(0, 0), L.latLng(-256, 256))
    this.map = L.map(domId, {
      center: [-102, 148], // 初始中心点
      maxBounds: bounds,
      crs: L.CRS.Simple,
      attributionControl: false,
      zoomControl: false,
      maxZoom: 7, // 最大缩放级别
      minZoom: 4, // 最小缩放级别
      zoom: 5 // 初始缩放级别
    })

    this.prevZoom = this.map.getZoom()

    // @ts-ignore
    this.map.addControl(new L.Control.Zoomslider({ position: 'bottomright', stepHeight: 30, knobHeight: 20 }))
    L.tileLayer('images/map/{z}/{x}/{y}.png', {
      minZoom: 4,
      maxZoom: 7,
      bounds, // 限制范围大小
      noWrap: true
    }).addTo(this.map)

    this.map.on('zoom', () => {
      const prevRenderFlag = this.prevZoom >= 6
      const curRenderFlag = this.map.getZoom() >= 6
      if (prevRenderFlag !== curRenderFlag) {
        this.renderAreaNames()
      }
      this.prevZoom = this.map.getZoom()
    })

    this.map.on('click', this.onMapClick.bind(this))
    this.map.on('moveend', this.onMapMoveEnd.bind(this))
  }

  onMapClick() {
    // 把激活态清除
    const lastActivePoint = document.getElementById(`mapPointItem${this.lastActivePointId}`)
    lastActivePoint?.classList.remove('active')
    this.lastActivePointId = -1
  }

  onMapMoveEnd() {
    this.calcOutScreenPoints()
  }

  setMapAnchorList(configList: AreaNameConfig[]) {
    this.mapAnchorList = configList
  }

  renderAreaNames() {
    this.areaNameLayerGroup?.clearLayers()
    let markers: L.Marker[] = []

    if (this.map.getZoom() >= 6) {
      this.mapAnchorList.forEach((val) => {
        let childrenList: L.Marker[] = []
        childrenList = val.children.map(this.getAreaNameMarkerItem)
        markers = markers.concat(childrenList)
      })
    } else {
      markers = this.mapAnchorList.map(this.getAreaNameMarkerItem)
    }

    // 图标放到一组layer上，方便控制显示隐藏
    this.areaNameLayerGroup = L.layerGroup(markers)
    this.areaNameLayerGroup.addTo(this.map)
  }

  getAreaNameMarkerItem(config: AreaNameConfig) {
    const { lat = 0, lng = 0, name } = config
    return L.marker(L.latLng(lat, lng), {
      icon: L.divIcon({
        className: 'map-mark-item',
        html: `<div class="area-mark-item">${name}</div>`
      })
    })
  }

  renderPoints(pointList: PointConfig[]) {
    this.pointList = pointList
    this.pointLayerGroup?.clearLayers()

    const pointerMarkers = pointList.map((val) => {
      const { lat, lng, icon, pointId, name } = val
      const marker = L.marker(L.latLng(lat, lng), {
        icon: L.divIcon({
          className: 'map-point-item',
          html: `<div class="point-item-container" id="mapPointItem${pointId}">
            <div class="point-pic" style="background-image: url(${icon});"></div>
            <div class="arrow-icon lt"></div>
            <div class="arrow-icon lb"></div>
            <div class="arrow-icon rb"></div>
            <div class="arrow-icon rt"></div>
          </div>`,
          iconSize: [37, 40],
          iconAnchor: [19, 20] // 图标的哪个点将与图标对应的地理坐标对齐
        })
      })

      marker.bindPopup(
        L.popup({
          content: this.calcPopupContent({ info: {}, correct_user_list: [], last_update_time: '', name: '' })
        })
      )

      marker.on('popupopen', async () => {
        const res = await getMapPointDetail(pointId)
        const popupData = { ...res.data, name }
        marker.setPopupContent(this.calcPopupContent(popupData))
      })

      marker.on('click', () => {
        if (this.lastActivePointId === pointId) return
        const lastActivePoint = document.getElementById(`mapPointItem${this.lastActivePointId}`)
        lastActivePoint?.classList.remove('active')

        const curPoint = document.getElementById(`mapPointItem${pointId}`)
        curPoint?.classList.add('active') // 添加激活的样式

        this.lastActivePointId = pointId
      })
      return marker
    })

    this.pointLayerGroup = L.featureGroup(pointerMarkers)
    this.pointLayerGroup.addTo(this.map)

    this.calcOutScreenPoints()
  }

  calcPopupContent(popupData: any) {
    const { correct_user_list, info, last_update_time, name } = popupData
    const avatarElmStr = correct_user_list.map((val: any) => {
      return `<div class="avatar-item" style="background-image: url(${val.img})"></div>`
    })
    return `<div class="point-popup-container">
    <div class="popup-title">${name}</div>
    <div class="popup-pic" style="background-image: url(${info.img})"></div>
    <div class="point-name">${info.content}</div>
    <div class="contributor-container">
      <div class="contributor-label">贡献者：</div>
      <div class="avatar-container">
        ${avatarElmStr}
      </div>
    </div>
    <div class="point-time">更新时间：${last_update_time}</div>
  </div>`
  }
  // 确定哪些点在当前地图视图外，以便生成一些指引 UI 元素，帮助用户了解屏幕外重要点的位置和方向
  /**
   * 计算屏幕外的点
   */
  calcOutScreenPoints() {
    const guideUIAry: GuideUIItem[] = [] // 用于存储需要显示的指引 UI 项
    const calcPointMap: { [key: string]: any } = {} // 用于存储计算中的点信息
    const center = this.map.getCenter() // 获取当前地图的中心点

    // 遍历所有点，计算每个点是否在屏幕内
    for (let i = 0; i < this.pointList.length; i++) {
      const pointItem = this.pointList[i]
      const { name } = pointItem
      if (!calcPointMap[name]) {
        calcPointMap[name] = {}
      }

      // 如果点已经在屏幕内，跳过后续计算
      if (calcPointMap[name].inScreen) {
        continue
      }

      // 检查点是否在地图视图边界内
      const isContain = this.map.getBounds().contains(pointItem)
      if (!isContain) {
        const dist = center.distanceTo(pointItem) // 计算点到地图中心的距离
        if (!calcPointMap[name].pointItem) {
          calcPointMap[name] = { dist, pointItem, inScreen: false }
        } else {
          const curDist = calcPointMap[name].dist
          if (dist < curDist) {
            calcPointMap[name] = { dist, pointItem, inScreen: false }
          }
        }
      } else {
        calcPointMap[name].inScreen = true
      }
    }

    // 处理屏幕外的点，生成指引 UI 项
    for (const key in calcPointMap) {
      const { inScreen, pointItem } = calcPointMap[key]
      if (!inScreen) {
        const { lat, lng, icon } = pointItem
        const directionVector = { x: lng - center.lng, y: lat - center.lat } // 计算方向向量
        const xVector = { x: 1, y: 0 } // X轴正方向向量
        const angle = calcVectorAngle(xVector, directionVector) // 计算指引箭头的角度
        guideUIAry.push({ angle, icon, lat, lng }) // 将指引信息添加到数组中
      }
    }

    // 触发事件，通知外部渲染指引 UI
    EventManager.emit('RenderMapGuideUI', guideUIAry)
  }

  flyTo(latlng: L.LatLngExpression, zoom?: number) {
    this.map.flyTo(latlng, zoom)
  }

  enableClickDebug() {
    this.map.on('click', (workingLayer) => {
      const cordinate = workingLayer.latlng
      console.log('cordinate', cordinate)
      // let curPointId = parseInt(localStorage.getItem('curPointId') || '1')
      // let curPointText = localStorage.getItem('curPointText') || ''
      // const text = `{lat: ${cordinate.lat},lng:${cordinate.lng},pointId:${curPointId}},`
      // curPointText += text
      // curPointId++
      // localStorage.setItem('curPointId', curPointId.toString())
      // localStorage.setItem('curPointText', curPointText)
      // navigator.clipboard.writeText(text)
      // function onTestClick() {
      //   const curPointText = localStorage.getItem('curPointText') || ''
      //   console.log('cuuu', curPointText)
      //   navigator.clipboard.writeText(curPointText)
      // }
      // const testNode = document.querySelector('.header-name')
      // testNode?.removeEventListener('click', onTestClick)
      // testNode?.addEventListener('click', onTestClick)
    })
  }
}

function calcVectorAngle(vectorA: Vector, vectorB: Vector) {
  const dotProduct = vectorA.x * vectorB.x + vectorA.y * vectorB.y
  const magnitudeA = Math.sqrt(vectorA.x * vectorA.x + vectorA.y * vectorA.y)
  const magnitudeB = Math.sqrt(vectorB.x * vectorB.x + vectorB.y * vectorB.y)

  const cosTheta = dotProduct / (magnitudeA * magnitudeB)
  const theta = Math.acos(cosTheta)

  const crossProduct = vectorA.x * vectorB.y - vectorA.y * vectorB.x
  const direction = crossProduct > 0 ? 1 : -1

  return direction * theta
}
