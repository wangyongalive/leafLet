<script setup lang="ts">
import { onMounted } from 'vue'
import { MapManager } from '../js/map-manager'
import { globalDataInst } from '../js/global-data'
import FilterHeader from '@/components/FilterHeader.vue'
import FilterMain from '@/components/FilterMain.vue'
import LocationBtn from '@/components/LocationBtn.vue'
import SelectedArea from '@/components/SelectedArea.vue'
import { getMapAnchorList } from '@/js/api'
import { useHomeStore } from '@/stores/home'
import GuideMarkerUI from '@/components/GuideMarkerUI.vue'

const store = useHomeStore()
const { setMapAnchorList } = store

onMounted(() => {
  init()
})

async function initMapAnchorList() {
  let res = await getMapAnchorList()
  setMapAnchorList(res.data)
}

async function init() {
  await initMapAnchorList() // 获取地图坐标列表
  globalDataInst.mapManager = new MapManager('map')
  globalDataInst.mapManager.setMapAnchorList(store.mapAnchorList)
  globalDataInst.mapManager.enableClickDebug()
  globalDataInst.mapManager.renderAreaNames()
}
</script>

<template>
  <div class="home-view">
    <div class="map-layer" id="map"></div>
    <div class="ui-layer">
      <div class="filter-container">
        <div class="filter-content">
          <div class="close-btn">
            <div class="close-icon"></div>
          </div>
          <LocationBtn />
          <SelectedArea />
          <FilterHeader />
          <div class="search-container">
            <div class="search-icon"></div>
            <div class="search-tip">搜索</div>
          </div>
          <FilterMain />
        </div>
      </div>
      <GuideMarkerUI />
    </div>
  </div>
</template>

<style lang="less" scoped>
.home-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  .map-layer {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  .ui-layer {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    z-index: 2;
    .filter-container {
      position: absolute;
      left: 0;
      top: 0;
      z-index: 3;
      width: 415px;
      height: 100%;
      padding: 20px;
      .filter-content {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        border-radius: 12px;
        background-color: #3b4354;
        overflow: hidden; // 防止内容溢出,导致圆角不显示
        .close-btn {
          position: absolute;
          top: 32px;
          right: -44px;
          width: 64px;
          height: 40px;
          background-image: url('../assets/images/ui/close-bg.png');
          background-size: cover;
          display: flex;
          align-items: center;
          box-sizing: border-box;
          padding-left: 18px;
          .close-icon {
            width: 24px;
            height: 24px;
            background-image: url('../assets/images/ui/close-icon.png');
            background-size: cover;
          }
        }
        .search-container {
          width: 355px;
          height: 32px;
          display: flex;
          align-items: center;
          border-radius: 22px;
          background-color: #323947;
          color: #9b9c9f;
          font-size: 12px;
          cursor: pointer;
          box-sizing: border-box;
          padding-left: 10px;
          margin: 10px auto;
          .search-icon {
            margin-right: 5px;
            width: 16px;
            height: 16px;
            background-image: url('../assets/images/ui/search-icon.png');
            background-size: cover;
          }
        }
      }
    }
  }
}
</style>
