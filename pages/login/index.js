//index.js
//获取应用实例
const app = getApp()

Page({
  isShare: 0,
  data: {
    userInfo: {},
    userName: '',
    pwd: '',
    isHandle: false,
    isShare: 0,//是否通过分享进入
  },
  onLoad: function (options) {
    let that = this;
    this.isShare = options.isShare
    that.setData({ 
      userInfo: app.globalData.userInfo ? app.globalData.userInfo:{},
      userName: options.phone ? options.phone:'',
      pwd: options.pwd ? options.pwd:''
    });
  },
  //用户名
  tapUserName: function(e) {
    this.setData({ userName:e.detail.value });
  },
  //密码
  tapPwd: function(e) {
    this.setData({ pwd: e.detail.value });
  },
  //登录
  tapLogin: function () {
    let that = this;
    if (that.data.userName == '') {
      wx.showToast({
        title: '请输入用户名!',
        icon: 'none'
      })
      return;
    }
    if (that.data.pwd.indexOf(" ") != -1 || that.data.pwd.replace(/\s+/g, "").length < 6) {
      wx.showToast({
        title: '密码最少六位字符,且不能为空字符串!',
        icon: 'none'
      })
      return;
    }
    that.login();
  },
  login: function () {
    var that = this;
    if (!app.globalData.code) {
      wx.showToast({
        title: '获取code信息失败!',
      })
      return;
    }
    that.setData({ isHandle: true});
    let params = {
      url: `${app.globalData.httpUrl}&c=user&a=login_json`,
      datas: {
        code: app.globalData.code,
        username: that.data.userName,
        password: that.data.pwd,
        token: app.globalData.token
      }
    }
    app.globalData.token ? params.datas.token = app.globalData.token:null;
    app.POST(params, (res) => {
      //console.log(res);
      that.setData({ isHandle: false });
      if (res.errMsg == 'request:fail request:fail') {//网络连接失败
        wx.showLoading({
          title: '网络连接失败!',
          mask: true
        })
      } else {
        //登录成功
        if (res.data.status == "1") {
          app.globalData.saveInfo = {
            token: res.data.token,
            userName: res.data.username,
            code: app.globalData.code,
            avatarUrl: that.data.userInfo.avatarUrl,
            info: res.data.info
          }
          app.globalData.loginState = true;
          app.globalData.token = res.data.token;
          that.isShare ?wx.switchTab({
            url: '/pages/mine/index',
          }):wx.navigateBack({
            delta: 1
          });
          
        } else {
          wx.showToast({
            title: '用户名或密码错误!',
            icon: 'none'
          })
        }
      }
    });
  },
  //忘记密码
  tapForgetpwd: function () {
    wx.navigateTo({
      url: '/pages/forgetPassword/index',
    })
  },
  //立即注册
  goRegister: function () {
    wx.navigateTo({
      url: '/pages/register/index',
    })
  }
})
