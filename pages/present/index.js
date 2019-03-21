//index.js
//获取应用实例
const app = getApp()
import observe from '../../utils/oba.js';
Page({
  data: {
    isHandle: false,
    isPass: 0,
  },
  onLoad: function () {
    //监听登录状态
    observe(app.globalData, ["loginState"], (name, value, old) => {
      if (!value) {
        wx.switchTab({
          url: '/pages/mine/index',
        })
      }
    });
  },
  //提交
  presentSubmit: function(e) {
    let that = this;
    let data = e.detail.value;
    if (data.present_integral.replace(/(^\s*)|(\s*$)/g, "") == '') {
      wx.showToast({
        title: '积分不能为空!',
        icon: 'none'
      })
      return;
    }
    if (data.bank_no.replace(/(^\s*)|(\s*$)/g, "") == '') {
      wx.showToast({
        title: '银行账号不能为空!',
        icon: 'none'
      })
      return;
    }
    if (data.no_name.replace(/(^\s*)|(\s*$)/g, "") == '') {
      wx.showToast({
        title: '账户名称不能为空!',
        icon: 'none'
      })
      return;
    }
    if (data.bank_name.replace(/(^\s*)|(\s*$)/g, "") == '') {
      wx.showToast({
        title: '银行名称不能为空!',
        icon: 'none'
      })
      return;
    }
    that.setData({ isHandle: true}, () => {
      app.POST({
        url: `${app.globalData.httpUrl}&c=user&a=integral_withdraw_json`,
        datas: {
          token: app.globalData.saveInfo.token,
          integral: data.present_integral,
          'type': 3,
          account: data.bank_no,
          name: data.no_name,
          bank: data.bank_name
        }
      }, (res) => {
        that.setData({ isHandle: false });
        if (res.statusCode == 200) {
            //console.log(res);
            if(res.data.status == 401) {
              wx.showToast({
                title: '积分格式有误！',
                icon: 'none'
              })
              return;
            }
            if (res.data.status == 402) {
              wx.showToast({
                title: '账号错误！',
                icon: 'none'
              })
              return;
            }
            if (res.data.status == 403) {
              wx.showToast({
                title: '积分提现暂时关闭！',
                icon: 'none'
              })
              return;
            }
            if (res.data.status == 404) {
              wx.showToast({
                title: '积分提现不能为0！',
                icon: 'none'
              })
              return;
            }
            if (res.data.status == 405) {
              wx.showToast({
                title: '积分提现不在限额之内！',
                icon: 'none'
              })
              return;
            }
            if (res.data.status == 406) {
              wx.showToast({
                title: '提现积分不足！',
                icon: 'none'
              })
              return;
            }
            if (res.data.status == 1) {
              app.globalData.saveInfo.info ? app.globalData.saveInfo.info.integral = res.data.integral:null;
              that.setData({ isPass: 1 }, () => {
                wx.showModal({
                  title: '提示',
                  showCancel: false,
                  content: '提现订单已生成，请等待处理...',
                  success: (res) => {
                    if (res.confirm) {
                      wx.navigateBack({
                        delta: 1
                      })
                    }
                  }
                })
              })
            }
        } else {
          wx.showToast({
            title: '操作失败!',
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
      wx.stopPullDownRefresh();
    } else {
      wx.switchTab({
        url: '/pages/mine/index',
      })
    }
  },
  //是否返回
  onUnload: function() {
    let that = this;
    if (that.data.isPass) {
      let pages = getCurrentPages();
      let prevPage = pages[pages.length - 2];//上一个页面
      prevPage.setData({isPass: 1});
    }
  }
})
