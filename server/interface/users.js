import Router from 'koa-router';
import Redis from 'koa-redis'
import nodeMailer from 'nodemailer'
import User from '../dbs/models/users'
import Passport from './utils/passport'
import Email from '../dbs/config'
import axios from './utils/axios'

//创建一个路由对象，先定义一个前缀。
let router = new Router({prefix: '/users'})

//先获取redis的客户端。
let Store = new Redis().client

router.post('/signup', async (ctx) => {
  //获取用户在这个接口上传的几个数据。获取的方式是ctx.request.body
  const {username, password, email, code} = ctx.request.body;
//拿到数据后我们要去做校验，我们要从redis去存（这种说法不严谨）  严谨的说法是要从redis去获取，在nodemailer去发验证码的时候，会在redis去存一下然后在这里要把存的那个东西再拿出来，然后才能做对比。
  if (code) {
    //`nodemail:${username}`, 'code' 之所以加一个前缀，是因为我们redis是采取key :value的方式进行存储的，
    const saveCode = await Store.hget(`nodemail:${username}`, 'code')
    const saveExpire = await Store.hget(`nodemail:${username}`, 'expire')
    if (code === saveCode) {
      if (new Date().getTime() - saveExpire > 0) {
        ctx.body = {
          code: -1,
          msg: '验证码已过期，请重新尝试'
        }
        return false
      }
    } else {
      ctx.body = {
        code: -1,
        msg: '请填写正确的验证码'
      }
    }
  } else {
    ctx.body = {
      code: -1,
      msg: '请填写验证码'
    }
  }
  let user = await User.find({username})
  if (user.length) {
    ctx.body = {
      code: -1,
      msg: '已被注册'
    }
    return
  }
  //在验证码无误的情况下，并且用户名没有被注册过，我们就要进行一个写库的操作
  let nuser = await User.create({username, password, email})
  
  if (nuser) {
    let res = await axios.post('/users/signin', {username, password})
    if (res.data && res.data.code === 0) {
      ctx.body = {
        code: 0,
        msg: '注册成功',
        user: res.data.user
      }
    } else {
      ctx.body = {
        code: -1,
        msg: 'error'
      }
    }
  } else {
    ctx.body = {
      code: -1,
      msg: '注册失败'
    }
  }
})
//创建一个登录的动作。
router.post('/signin', async (ctx, next) => {
  //因为我们写passport时 使用了passport-local策略，所以这里调用local策略
  return Passport.authenticate('local', function(err, user, info, status) {
    if (err) {
      ctx.body = {
        code: -1,
        msg: err
      }
    } else {
      if (user) {
        ctx.body = {
          code: 0,
          msg: '登录成功',
          user
        }
        //做一个登陆的动作
        return ctx.login(user)
      } else {
        //返回具体的错误信息
        ctx.body = {
          code: 1,
          msg: info
        }
      }
    }
  })(ctx, next)//因为使用的时authenticate 这里是一个固定的用法。传递给api里面。
})

//验证码接口
router.post('/verify', async (ctx, next) => {
  //先获取到username
  let username = ctx.request.body.username
  //获取验证码的过期时间。
  const saveExpire = await Store.hget(`nodemail:${username}`, 'expire')
  //判断过期时间是否存在，，如果存在是否超过了过期时间，避免重复去刷验证码
  if (saveExpire && new Date().getTime() - saveExpire < 0) {
    ctx.body = {
      code: -1,
      msg: '验证请求过于频繁，1分钟内1次'
    }
    return false
  }
  //这个是和发邮件非常紧密相关的功能，
  let transporter = nodeMailer.createTransport({
    service: 'qq',
    auth: {
      user: Email.smtp.user,
      pass: Email.smtp.pass
    }
  })
  //对外发送哪些信息，以及接收方是谁。
  let ko = {
    code: Email.smtp.code(),
    expire: Email.smtp.expire(),
    email: ctx.request.body.email,//给谁发
    user: ctx.request.body.username//用户名
  }
  //邮件中要显示的内容
  let mailOptions = {
    //告诉收件方这个邮件是谁发的。
    from: `"认证邮件" <${Email.smtp.user}>`,
    to: ko.email,//接收方
    subject: '《慕课网高仿美团网全栈实战》注册码',//主题
    html: `您在《慕课网高仿美团网全栈实战》课程中注册，您的邀请码是${ko.code}`//显示的内容。
  }
  //开始要发送了。
  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error)
    } else {
      //如果成功了要存储，
      Store.hmset(`nodemail:${ko.user}`, 'code', ko.code, 'expire', ko.expire, 'email', ko.email)
    }
  })
  //发送邮件之后，响应。
  ctx.body = {
    code: 0,
    msg: '验证码已发送，可能会有延时，有效期1分钟'
  }
})

//退出接口
router.get('/exit', async (ctx, next) => {
  await ctx.logout()//执行一个退出的动作
  //ctx.isAuthenticated() 这个是用来检查现在是否为登陆状态，这一步相当于一个退出动作的二次验证。
  if (!ctx.isAuthenticated()) {
    ctx.body = {
      code: 0
    }
  } else {
    ctx.body = {
      code: -1
    }
  }
})
//获取用户名接口
router.get('/getUser', async (ctx) => {
  //检查是否是登陆的状态，isAuthenticated()是一个固定的API，是在passport的包里面。
  if (ctx.isAuthenticated()) {
    //如果是登陆的状态，因为passport会把我们的登录信息，放在session对象里，所以我们需要去session中把user取出来。
    const {username, email} = ctx.session.passport.user
    ctx.body={
      user:username,
      email
    }
  }else{
    ctx.body={
      user:'',
      email:''
    }
  }
})
// 导出路由 下一步我们需要去server/index.js中去做一些改动 ，否则依然处于未生效。
export default router
