import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { globalDataInst } from '@/js/global-data'

export const useHomeStore = defineStore('home', () => {
  const filterTree = ref<any[]>([])
  const selectedFilterItems = ref<any[]>([])
  const mapAnchorList = ref<any[]>([])

  watch(
    filterTree,
    () => {
      calcSelectedFilterItems()
    },
    { deep: true }
  )

  function setFilterTree(data: any[]) {
    filterTree.value = data
  }

  function setMapAnchorList(data: any[]) {
    mapAnchorList.value = data
  }

  function calcSelectedFilterItems() {
    let res: any[] = []
    let pointList: any[] = []
    for (let i = 0; i < filterTree.value.length; i++) {
      const item = filterTree.value[i]
      const activeItems = item.children.filter((child: any) => {
        return child.active
      })

      activeItems.forEach((element: any) => {
        const points: any = element.children.map((val: any) => {
          return { ...val, icon: element.icon, name: element.name }
        })
        pointList = pointList.concat(points)
      })
      res = res.concat(activeItems)
    }

    selectedFilterItems.value = res

    if (globalDataInst.mapManager) {
      globalDataInst.mapManager.renderPoints(pointList)
    }
  }

  return { filterTree, setFilterTree, selectedFilterItems, mapAnchorList, setMapAnchorList }
})
