import api from "./api"

export interface Statistics {
  totalFosas: number
  totalPersonnel: number
  totalEquipments: number
  totalVehicles: number
  fosasByType: Array<{ type: string; count: number }>
  fosasByRegion: Array<{ region: string; count: number }>
  personnelByCategory: Array<{ category: string; count: number }>
}

class StatisticsService {
  async getOverview(): Promise<{ success: boolean; data: Statistics }> {
    const response = await api.get("/statistics/overview")
    return response.data
  }

  async getFosasByRegion(): Promise<any> {
    const response = await api.get("/statistics/fosas-by-region")
    return response.data
  }

  async getFosasByType(): Promise<any> {
    const response = await api.get("/statistics/fosas-by-type")
    return response.data
  }

  async getPersonnelByCategory(): Promise<any> {
    const response = await api.get("/statistics/personnel-by-category")
    return response.data
  }

  async getEquipmentStatus(): Promise<any> {
    const response = await api.get("/statistics/equipment-status")
    return response.data
  }
}

const statisticsService = new StatisticsService()

export { statisticsService }
export default statisticsService
