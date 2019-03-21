//app.js
App({
  globalData: {
    isIPhoneX: wx.getSystemInfoSync().model.substring(0, 8) =='iPhone X',//手机型号
    loginState: false,//登录状态(仅限于本地)
    isCodeLogin: false,//是否进行code登录
    categoryData: [],//全局分类数据
    userInfo: null,//微信用户信息
    saveInfo: {},//后台用户信息
    token: null,//永久保存的token
    code: null,//获取code
    cartNum: '',//购物车数量
    servicePhone: '',//服务电话
    httpUrl: 'https://www.tastong.com/webapp/index.php?m=mini',//主体路径，其余只改变控制器和方法名
    httpUser: 'https://www.tastong.com/',//主域名用于图片路径（*index中的图片路径需要单独修改）
    imageHost: 'http://images.3c2p.com',
  },
  onLaunch: function () {
    //调用API从本地缓存中获取数据
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    let userInfo = wx.getStorageSync('userInfo');
    this.globalData.loginState = !userInfo?false:true;
    this.login();
  },
  getUserInfo: function (cb) {
    let that = this
    if (this.globalData.userInfo) {
      typeof cb == "function" && cb(this.globalData.userInfo)
    } else {
      //调用登录接口
      wx.getUserInfo({
        withCredentials: false,
        success: (res => {
          that.globalData.userInfo = res.userInfo
          typeof cb == "function" && cb(that.globalData.userInfo)
        })
      })
    }
  },
  //登录
  login: function () {
    let that = this
    wx.login({
      success: (ret => {
        if (ret.code) {
          that.globalData.code = ret.code;
          //获取用户信息的头像
          that.getUserInfo(function (data) {
            that.globalData.saveInfo.avatarUrl = data.avatarUrl;
          });
          let params = {
            url: `${that.globalData.httpUrl}&c=user&a=code_login`,
            datas: {
              code: ret.code,
            }
          }
          that.POST(params, res => {
            if (res.errMsg == 'request:fail request:fail') {//网络连接失败
              wx.showLoading({
                title: '网络连接失败!',
                mask: true
              })
            } else {
              //登录成功
              if (res.data.status == "1") {
                that.globalData.saveInfo.token = res.data.token;
                that.globalData.saveInfo.userName = res.data.username;
                that.globalData.saveInfo.code = that.globalData.code;
                that.globalData.saveInfo.info = res.data.info;
                that.globalData.loginState = true;
              }
              that.globalData.isCodeLogin = true;
              that.globalData.token = res.data.token;
            }
          });
        } else {
          wx.showLoading({
            title: 'code获取失败!',
            mask: true
          })
        }
      }),
      fail: (res => {
        wx.showLoading({
          title: '网络连接失败!',
          mask: true
        })
      })
    })
  },
  //重新登录
  reLogin: function() {
    let that = this;
    wx.showLoading({
      title: '重新登录中...',
      mask: true
    })
    let params = {
      url: `${that.globalData.httpUrl}&c=user&a=code_login`,
      datas: {
        code: that.globalData.code,
        token: that.globalData.saveInfo.token
      }
    }
    that.POST(params, res => {
      //console.log(res);
      if (res.errMsg == 'request:fail request:fail') {//网络连接失败
        wx.showLoading({
          title: '网络连接失败!',
          mask: true
        })
      } else {
        wx.hideLoading();
        //登录成功
        if (res.data.status == "1") {
          that.globalData.saveInfo.token = res.data.token;
          that.globalData.saveInfo.userName = res.data.username;
          that.globalData.saveInfo.code = that.globalData.code;
          that.globalData.saveInfo.info = res.data.info;
          that.globalData.loginState = true;
          wx.startPullDownRefresh();
        }else {
          that.globalData.cartNum = 0;
          wx.removeTabBarBadge({
            index: 2,
          })
          that.globalData.token = that.globalData.saveInfo.token;
          that.globalData.saveInfo = {
            avatarUrl: that.globalData.userInfo.avatarUrl
          };
          that.globalData.loginState = false;
        }
      }
    });
  },
  //获取购物车数量
  fetchCart: function (fn) {
    let that = this;
    that.POST({
      url: `${that.globalData.httpUrl}&c=flow&a=mini_getGoodsNumber`,
      datas: {
        token: that.globalData.saveInfo.token
      }
    }, fn?fn: (res) => {
      if (res.statusCode == 200) {
        if(res.data.status === "001") {
          that.globalData.cartNum = '';
          return;
        }
        that.globalData.cartNum = res.data.cart_number == '' ? '0' : res.data.cart_number;
      }
    });
  },
  //post请求
  POST: function (params, fn, failFn) {
    wx.request({
      url: params.url,
      method: 'post',
      data: params.datas,
      header: { 'content-type': 'application/x-www-form-urlencoded' },
      success: fn,
      fail: failFn?failFn: (error) => {
        wx.hideLoading();
        wx.showModal({
          title: '提示',
          content: '网络不给力哦！',
          showCancel: false,
          success: (res) => {
            if(res.confirm) {
              wx.stopPullDownRefresh();
              wx.hideNavigationBarLoading();
            } 
          }
        })
      }
    })
  },
  //get请求
  GET: function (params, fn, failFn) {
    wx.request({
      url: params.url,
      method: 'get',
      data: params.datas,
      header: { 'content-type': 'application/json' },
      success: fn,
      fail: failFn ? failFn : (error) => {
        wx.hideLoading();
        wx.showModal({
          title: '提示',
          content: '网络不给力哦！',
          showCancel: false,
          success: (res) => {
            if (res.confirm) {
              wx.stopPullDownRefresh();
              wx.hideNavigationBarLoading();
            }
          }
        })
      }
    })
  }
})