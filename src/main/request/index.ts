import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

export default function request(url: string, options: AxiosRequestConfig): Promise<AxiosResponse> {
  return axios.get(url, options)
}
