//index.js
//获取应用实例
const app = getApp()
var interval = null //倒计时函数
Page({
  data: {
    disabledPhone: true,//是否禁用手机号输入
    isSendCode: false,//是否开始发送验证码
    time: '获取验证码',//倒计时
    currentTime: 60,//验证码时间
    userName: '',//用户名
    phone: '',
    isHandle: false//是否操作中
  },
  onLoad: function() {
  },
  //发送验证码
  tapSendCode: function() {
    this.getCode();
  },
  inputPhone: function(e) {
    this.setData({
      phone: e.detail.value.replace(/(^\s*)|(\s*$)/g, "")
    });
  },
  //获取验证码
  getCode: function () {
    let that = this;
    if (that.data.phone == '') {
      wx.showToast({
        title: '请输入手机号码!',
        icon: 'none'
      })
      return;
    } 
    if (that.data.disabledPhone && !(/^1[3|4|5|7|8]\d{9}$/).test(that.data.phone.phone)) {
      wx.showToast({
        title: '手机号码格式不正确!',
        icon: 'none'
      })
      return;
    }
    that.setData({
      isSendCode: true
    }, () => {
      let currentTime = that.data.currentTime;
      interval = setInterval(() => {
        currentTime--;
        that.setData({
          time: currentTime + '秒'
        })
        if (currentTime <= 0) {
          clearInterval(interval)
          that.setData({
            time: '重新发送',
            currentTime: 60,
            isSendCode: false
          })
        }
      }, 1000);
      app.GET({
        url: `${app.globalData.httpUser}lite_user.php?act=mini_get_password`,
        datas: {
          username: that.data.userName,
          phoneumber: that.data.phone
        }
      }, (res) => {
        if(res.statusCode == 200) {
          if(res.data.msg[0].status == 1) {
            //console.log("发送成功!");
          }
        }
      });
    });
  },
  //用户名输入
  inputUserName: function(e) {
    this.setData({
      userName: e.detail.value.replace(/(^\s*)|(\s*$)/g, "")
    });
  },
  //用户名比对
  blurUserName: function() {
    let that = this;
    let userName = that.data.userName;
    if (userName.replace(/(^\s*)|(\s*$)/g, "") == '') {
      wx.showToast({
        title: '用户名不能为空!',
        icon: 'none'
      })
      return;
    }
    app.POST({
      url: `${app.globalData.httpUser}lite_user.php?act=check_username`,
      datas: {
        username: userName
      }
    }, (res) => {
      if (res.statusCode == 200) {
        //console.log(res);
        if(res.data.msg[0].status == 201) {
          that.setData({
            phone: res.data.data[0].phone,
            disabledPhone: true
          });
        } else if (res.data.msg[0].status == 402) {
          wx.showToast({
            title: res.data.msg[0].msg,
            icon: 'none'
          })
        } else {
          that.setData({
            phone: '',
            disabledPhone: false
          });
        }
      }else {
        wx.showToast({
          title: '获取手机号信息失败!',
          icon: 'none'
        })
      }
    });
  },
  //提交
  forgetSave: function(e) {
    let that = this;
    let data = e.detail.value;
    if (data.userName.replace(/(^\s*)|(\s*$)/g, "") == '') {
      wx.showToast({
        title: '用户名不能为空!',
        icon: 'none'
      })
    } else if (data.phone == '') {
      wx.showToast({
        title: '请输入手机号码!',
        icon: 'none'
      })
    } else if (!that.data.disabledPhone && !(/^1[3|4|5|7|8]\d{9}$/).test(data.phone)) {
      wx.showToast({
        title: '手机号码格式不正确!',
        icon: 'none'
      })
    } else if (data.pwd.indexOf(" ") != -1 || data.pwd.replace(/\s+/g, "").length < 6) {
      wx.showToast({
        title: '密码最少六位字符,且不能为空字符串!',
        icon: 'none'
      })
    } else if (data.confirmPwd != data.pwd) {
      wx.showToast({
        title: '两次密码输入不一致!',
        icon: 'none'
      })
    } else if (data.code == '') {
      wx.showToast({
        title: '请输入验证码!',
        icon: 'none'
      })
    } else {
      that.setData({ isHandle:true}, () => {
        app.GET({
          url: `${app.globalData.httpUser}lite_user.php?act=mini_get_password`,
          datas: {
            username: data.userName,
            phoneNumber: data.phone,
            code: data.code,
            newPassword: data.pwd,
            definePassword: data.confirmPwd,
            update: 1
          }
        }, (res) => {
          that.setData({ isHandle:false});
          if (res.statusCode == 200) {
            //console.log(res);
            if (res.data.msg[0].status == 1) {
              wx.showModal({
                title: '提示',
                content: '设置成功,进行登录!',
                showCancel: false,
                success: (res) => {
                  if (res.confirm) {
                    wx.navigateBack({
                      delta: 1
                    })
                  }
                }
              })
            } else {
              wx.showToast({
                title: res.data.msg[0].msg,
                icon: 'none'
              })
            }
          } else {
            wx.showToast({
              title: '操作失败!',
              icon: 'none'
            })
          }
        });
      })
    }
  }
})
