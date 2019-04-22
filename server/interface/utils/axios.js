import axios from 'axios'
//创建axios实例，create方法就是为了创建一个实例。
const instance = axios.create({
  baseURL:`http://${process.env.HOST||'localhost'}:${process.env.PORT||3000}`,
  timeout:2000,
  headers:{

  }
})

export default instance
