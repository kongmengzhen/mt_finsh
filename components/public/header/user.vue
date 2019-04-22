<template>
  <div class="m-user">
    <template v-if="user">
      欢迎您，<span class="username">{{ user }}</span>
      [<nuxt-link to="/exit">退出</nuxt-link>]
    </template>
    <template v-else>
      <nuxt-link
        to="/login"
        class="login">立即登录</nuxt-link>
      <nuxt-link
        class="register"
        to="/register">注册</nuxt-link>
    </template>
  </div>
</template>

<script>
export default {
  data(){
    return {
      user:''
    }
  },//在interface/users.js 中有获取用户名的接口的 getUser
  //我们通过异步 去获取。使用mounted钩值函数。
  async mounted(){
    //利用解构赋值。 status：是axios最外层的一个状态 是获取http响应状态的
    //data是 interface/uaers 下getUser返回的对象  需要解构赋值data:{user}
    const {status,data:{user}} = await this.$axios.get('/users/getUser')
    if(status===200){
      this.user=user
    }
  }
}
</script>

<style lang="css">
</style>
