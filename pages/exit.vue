<template>
  <div class=""/>
</template>

<script>
export default {
  layout: 'blank',
  //选择中间件使用。
   middleware: async (ctx) => {
    let {status,data}=await ctx.$axios.get('/users/exit')
    if(status===200&&data&&data.code===0){
      window.location.href='/'
    }
  } 
}
</script>
