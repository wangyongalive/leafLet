import axios, { type AxiosInstance } from 'axios'
import { MainHost } from './constants'

export class BaseRequest {
  private axiosInst: AxiosInstance

  constructor(host: string) {
    this.axiosInst = axios.create({
      baseURL: host,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    })
  }

  sendRequest(method: string, path: string, params: any = null, data: any = null): Promise<any> {
    return new Promise((resolve, reject) => {
      this.axiosInst
        .request({ method, url: path, params, data })
        .then((res) => {
          resolve(res.data)

          // let { code } = res.data
          // if (code !== 0) {
          //   toast('出现未知错误')
          // }
        })
        .catch(reject)
    })
  }
}

export const mainRequest = new BaseRequest(MainHost)
