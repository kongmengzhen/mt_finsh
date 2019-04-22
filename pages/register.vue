<template>
  <div class="page-register">
    <article class="header">
      <header>
        <a
          href="/"
          class="site-logo" />
        <span class="login">
          <em class="bold">已有美团账号？</em>
          <a href="/login">
            <el-button
              type="primary"
              size="small">登录——finsh</el-button>
          </a>
        </span>
      </header>
    </article>
    <section>
      <el-form
        ref="ruleForm"
        :model="ruleForm"
        :rules="rules"
        label-width="100px"
        class="demo-ruleForm">
        <el-form-item
          label="昵称"
          prop="name">
          <el-input v-model="ruleForm.name" />
        </el-form-item>
        <el-form-item
          label="邮箱"
          prop="email">
          <el-input v-model="ruleForm.email" />
          <el-button
            size="mini"
            round
            @click="sendMsg">发送验证码</el-button>
          <span class="status">{{ statusMsg }}</span>
        </el-form-item>
        <el-form-item
          label="验证码"
          prop="code">
          <el-input
            v-model="ruleForm.code"
            maxlength="4" />
        </el-form-item>
        <el-form-item
          label="密码"
          prop="pwd">
          <el-input
            v-model="ruleForm.pwd"
            type="password" />
        </el-form-item>
        <el-form-item
          label="确认密码"
          prop="cpwd">
          <el-input
            v-model="ruleForm.cpwd"
            type="password" />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="register">同意以下协议并注册</el-button>
          <div class="error">{{ error }}</div>
        </el-form-item>
        <el-form-item>
          <a
            class="f1"
            href="http://www.meituan.com/about/terms"
            target="_blank">《美团网用户协议》</a>
        </el-form-item>
      </el-form>
    </section>
  </div>
</template>

<script>
import CryptoJS from 'crypto-js'
        export default {
          data() {
            return {
              statusMsg: '',
              error: '',
              ruleForm: {
                name: '',
                code: '',
                pwd: '',
                cpwd: '',
                email: ''
              },
              rules: {
                name: [{
                  required: true,
                  type: 'string',
                  message: '请输入昵称',
                  trigger: 'blur'
                }],
                email: [{
                  required: true,
                  type: 'email',
                  message: '请输入邮箱',
                  trigger: 'blur'
                }],
                pwd: [{
                  required: true,
                  message: '创建密码',
                  trigger: 'blur'
                }],
                cpwd: [{
                  required: true,
                  message: '确认密码',
                  trigger: 'blur'
                }, {
                  validator: (rule, value, callback) => {
                    if (value === '') {
                      callback(new Error('请再次输入密码'))
                    } else if (value !== this.ruleForm.pwd) {
                      callback(new Error('两次输入密码不一致'))
                    } else {
                      callback()
                    }
                  },
                  trigger: 'blur'
                }]
              }
            }
          },
          layout: 'blank',
          methods: {
            sendMsg: function () {
              //先保存当前的this对象
              const self = this;
              let namePass
              let emailPass

              if (self.timerid) {
                return false
              }//验证我们的用户名是否已经通过校验，我们虽然在服务器段已经验证，但是我们要在客户端。
              this.$refs['ruleForm'].validateField('name', (valid) => {
                namePass = valid
              })//清除以前的错误
              self.statusMsg = ''
              if (namePass) {
                return false
              }//检查邮箱是否有错误validateField是elementUi提供的一个文档
              this.$refs['ruleForm'].validateField('email', (valid) => {
                emailPass = valid
              })//之所以取反进行操作是因为，有值的情况下是错误的。
              if (!namePass && !emailPass) {
                //在值和邮箱都通过  再去做发送验证码的请求
                self.$axios.post('/users/verify', {
                  //username 要和后端统一， encodeURIComponent是中文编码的意思
                  username: encodeURIComponent(self.ruleForm.name),
                  email: self.ruleForm.email
                }).then(({
                  status,
                  data
                }) => {
                  if (status === 200 && data && data.code === 0) {
                    let count = 60;
                    self.statusMsg = `验证码已发送,剩余${count--}秒`
                    self.timerid = setInterval(function () {
                      self.statusMsg = `验证码已发送,剩余${count--}秒`
                      if (count === 0) {
                        clearInterval(self.timerid)
                      }
                    }, 1000)
                  } else {
                    self.statusMsg = data.msg
                  }
                })
              }
            },
            register: function () {
              let self = this;
              //先验证所有的校验是否都已经通过了
              this.$refs['ruleForm'].validate((valid) => {
                //通过之后我们要发起注册接口这个动作。
                if (valid) {
                  self.$axios.post('/users/signup', {
                    username: window.encodeURIComponent(self.ruleForm.name),
                    //密码加密 前提是安装一个密码库crypto-js 注意：使用完MD5之后我们一定要使用toString
                    //因为MD5之后返回的是数组，并不是hash的字符串等等。
                    password: CryptoJS.MD5(self.ruleForm.pwd).toString(),
                    email: self.ruleForm.email,
                    code: self.ruleForm.code
                  }).then(({
                    status,
                    data
                  }) => {
                    if (status === 200) {
                      if (data && data.code === 0) {
                        //请求正常，跳转到登录页。
                        location.href = '/login'
                      } else {
                        self.error = data.msg
                      }
                    } else {
                      self.error = `服务器出错，错误码:${status}`
                    }
                    //定时清空出错内容
                    setTimeout(function () {
                      self.error = ''
                    }, 1500)
                  })
                }
              })
            }
          }
        }
</script>

<style lang="scss">
@import "@/assets/css/register/index.scss";
</style>
