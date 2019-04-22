import passport from 'koa-passport'
import LocalStrategy from 'passport-local'
import UserModel from '../../dbs/models/users'

//这个函数有三个参数，done是回调函数。
passport.use(new LocalStrategy(async function(username,password,done){
  let where = {
    username
  };
  let result = await UserModel.findOne(where)
  if(result!=null){
    if(result.password===password){
      return done(null,result)
    }else{
      return done(null,false,'密码错误')
    }
  }else{
    return done(null,false,'用户不存在')
  }
}))
//如果想让用户每次进来都自动利用session去做验证，我们需要通过序列化去做
//在每次请求的时候会从session中去读取用户对象。 序列化是 我查到了这个用户登录验证成功之后，我会把用户的信息存到session中。
passport.serializeUser(function(user,done){
  done(null,user)
})
//对应上一条 反序列化。
passport.deserializeUser(function(user,done){
  return done(null,user)
})

export default passport
