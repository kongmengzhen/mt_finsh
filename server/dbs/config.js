export default {
  //这里是mongoDB的配置文件
    dbs:'mongodb://127.0.0.1:27017/student',
    //redis的连接方式
    redis:{
      get host(){
        return '127.0.0.1'
      },
      get port(){
        return 6379
      }
    },
    //smtp服务，我们使用的是qq邮箱。
    smtp:{
      get host(){
        return 'smtp.qq.com'
      },
      get user(){
        return '993686326@qq.com'
      },
      get pass(){
        return 'drfsuohtwpctbcbd'
      },
      //生成验证码，只要每次调用我就给你生成新的四位验证码。
      get code(){
        return ()=>{
          return Math.random().toString(16).slice(2,6).toUpperCase()
        }
      },
      get expire(){
        return ()=>{
          return new Date().getTime()+60*60*1000
        }
      }
    }
  }
  