//index.js
//获取应用实例
const app = getApp()
import observe from '../../utils/oba.js';
Page({
  data: {
    pwd_info: '',
    isHandle: false
  },
  onLoad: function() {
    //监听登录状态
    observe(app.globalData, ["loginState"], (name, value, old) => {
      if (!value) {
        wx.switchTab({
          url: '/pages/mine/index',
        })
      }
    });
  },
  //修改密码
  modifySubmit: function(e) {
    let that = this;
    let data = e.detail.value;
    if (data.oldPwd.indexOf(" ") != -1||data.oldPwd.replace(/\s+/g, "").length < 6) {
      wx.showToast({
        title: '密码最少六位字符,且不能为空格!',
        icon: 'none'
      })
      return;
    }
    if (data.newPwd.indexOf(" ") != -1 ||data.newPwd.replace(/\s+/g, "").length < 6) {
      wx.showToast({
        title: '新密码最少六位字符,且不能为空格!',
        icon: 'none'
      })
      return;
    }
    if (data.confirmPwd != data.newPwd) {
      wx.showToast({
        title: '两次密码输入不一致!',
        icon: 'none'
      })
      return;
    }
    that.setData({ isHandle:true}, () => {
      app.POST({
        url: `${app.globalData.httpUrl}&c=user&a=edit_password_json`,
        datas: {
          token: app.globalData.saveInfo.token,
          old_password: data.oldPwd,
          new_password: data.newPwd
        }
      }, (res) => {
        //console.log(res);
        that.setData({ isHandle:false});
        if (res.statusCode == 200) {
          if (res.data.status === '001') {
            app.reLogin();
            return;
          }
          if (res.data.status == 1) {
            app.globalData.cartNum = 0;
            wx.removeTabBarBadge({
              index: 2,
            })
            app.globalData.token = app.globalData.saveInfo.token;
            app.globalData.saveInfo = {
              avatarUrl: app.globalData.saveInfo.avatarUrl
            };
            app.globalData.loginState = false;
            wx.showModal({
              title: '提示',
              content: '修改成功,重新登录!',
              success: (res) => {
                if (res.confirm) {
                  wx.navigateTo({
                    url: '/pages/login/index'
                  })
                }
              }
            })
            return;
          }
          wx.showToast({
            title: res.data.msg,
            icon: 'none'
          })
        } else {
          wx.showToast({
            title: '修改失败!',
            icon: 'none'
          })
        }
      })
    })
  },
  //下拉刷新
  onPullDownRefresh: function () {
    let that = this;
    if (app.globalData.loginState) {
      that.setData({ pwd_info: ''});
      wx.stopPullDownRefresh();
    } else {
      wx.switchTab({
        url: '/pages/mine/index',
      })
    }
  }
})
