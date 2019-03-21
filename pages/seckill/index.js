//index.js
//获取应用实例
const app = getApp()
Page({
  data: {
    isIPhoneX: wx.getSystemInfoSync().model.substring(0, 8) == 'iPhone X',//手机型号
    httpUrl: app.globalData.httpUrl,
    isLoadComplete: false,
    oneTime: '',
    twoTime: '',
    this_periods: null,
    next_periods: null,
    this_next_periods: null,
    next_next_periods: null,
    current_periods: 0,
    isDialog: false,
    phone: '',
    secid: null,
    tdate: null
  },
  onLoad: function () {
    this.fetchData()
  },
  //获取数据
  fetchData: function() {
    let that = this;
    wx.showLoading({
      title: '加载中...',
      mask: true
    })
    app.POST({
      url: `${app.globalData.httpUrl}index.php?m=default&c=index&a=spike_json`
    }, res => {
      if (res.statusCode == 200) {
        that.setData({
          oneTime: res.data.this_time,
          twoTime: res.data.next_time,
          this_periods: res.data.this_periods && res.data.this_periods.length>0 ? res.data.this_periods:null,
          next_periods: res.data.next_periods && res.data.next_periods.length > 0 ? res.data.next_periods:null,
          this_next_periods: res.data.this_next_periods && res.data.this_next_periods.length > 0 ? res.data.this_next_periods:null,
          next_next_periods: res.data.next_next_periods && res.data.next_next_periods.length > 0 ? res.data.next_next_periods:null,
          isLoadComplete: true
        });
        wx.hideLoading();
        wx.stopPullDownRefresh();
        wx.hideNavigationBarLoading();
      } else {
        wx.showLoading({
          title: '数据加载失败...',
        })
      }
    })
  },
  //短信提醒
  handleRemind: function(e) {
    let that = this
    wx.showLoading({
      title: '设置中...',
    })
    app.POST({
      url: `${app.globalData.httpUrl}index.php?m=default&c=index&a=remind_me_json`,
      datas: {
        token: app.globalData.saveInfo.token,
        secid: e.currentTarget.dataset.secid,
        tdate: e.currentTarget.dataset.tdate
      }
    }, res => {
      if (res.statusCode == 200) {
        if(res.data == 1) {
          wx.showToast({
            title: '设置成功!',
            icon: 'none'
          })
          that.setRemind(e.currentTarget.dataset.secid)
        }
        if(res.data == 2) {
          this.setData({ 
            isDialog: true,
            secid: e.currentTarget.dataset.secid,
            tdate: e.currentTarget.dataset.tdate
          })
        }
        wx.hideLoading();
      } else {
        wx.showLoading({
          title: '数据加载失败...',
        })
      }
    })
  },
  handleCloseDialog: function() {
    this.setData({ isDialog: false})
  },
  handleInput: function(e) {
    this.setData({phone:e.detail.value})
  },
  //短信提醒
  handleRemindTrue: function() {
    let that = this
    if (this.data.phone == '') {
      wx.showToast({
        title: '请输入手机号码!',
        icon: 'none'
      })
      return
    }
    if (!(/^1[3|4|5|7|8]\d{9}$/).test(this.data.phone)) {
      wx.showToast({
        title: '手机号码格式不正确!',
        icon: 'none'
      })
      return
    }
    wx.showLoading({
      title: '设置中...',
    })
    app.POST({
      url: `${app.globalData.httpUrl}index.php?m=default&c=index&a=remind_me_json`,
      datas: {
        token: app.globalData.saveInfo.token,
        secid: that.data.secid,
        tdate: that.data.tdate,
        phone: that.data.phone
      }
    }, res => {
      if (res.statusCode == 200) {
        if(res.data == 1) {
          wx.showToast({
            title: '设置成功!',
            icon: 'none'
          })
          that.setRemind(that.data.secid)
        } else {
          wx.showToast({
            title: '设置失败!',
            icon: 'none'
          })
        }
        wx.hideLoading();
      } else {
        wx.showLoading({
          title: '数据加载失败...',
        })
      }
    })
  },
  //修改提醒状态
  setRemind: function(id) {
    let that = this
    let currentList = []
    let currentType = -1
    if (that.data.current_periods == 0) {
      currentList = that.data.this_periods ? that.data.this_periods : that.data.this_next_periods
      currentType = that.data.this_periods ? 1 : 2
    }
    if (that.data.current_periods == 1) {
      currentList = that.data.next_periods ? that.data.next_periods : that.data.next_next_periods
      currentType = that.data.this_periods ? 3 : 4
    }
    let index = currentList.findIndex(item => {
      return item.secid == id
    })
    currentList[index].isRemind = true
    currentType == 1 ? that.setData({ this_periods: currentList }) : currentType == 2 ? that.setData({ this_next_periods: currentList }) : currentType == 3 ? that.setData({ next_periods: currentList }) : currentType == 4 ? that.setData({ next_next_periods: currentList }) : null
  },
  handleTap: function(e) {
    let index = e.currentTarget.dataset.index
    this.setData({
      current_periods: index
    })
  },
  //去抢购
  beginSeckill: function(e) {
    wx.navigateTo({
      url: `/pages/detail/index?id=${e.currentTarget.dataset.gid}`
    })
  },
  //下拉刷新
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading()
    this.fetchData()
  }
})
