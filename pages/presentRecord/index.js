//index.js
//获取应用实例
const app = getApp()
import observe from '../../utils/oba.js';
Page({
  pageNo: 1,//页面大小
  totalPage: 1,//总页数
  data: {
    footState: 0,//0：隐藏、1：没有更多了、2：加载中
    isLoading: true,//加载状态
    integralList: [],//订单列表
    animationNotice: {},//动画数据
    isShowNotice: false,//是否显示通知
    noticeDatas: [],//公告数据
    presentDatas: [],//提现数据
    isPass: null,//是否返回
  },
  onLoad: function () {
    let that = this;
    that.fetchNoticeDatas();
    that.fetchDatas({ isInit: true });
    //监听登录状态
    observe(app.globalData, ["loginState"], (name, value, old) => {
      if (!value) {
        wx.switchTab({
          url: '/pages/mine/index',
        })
      }
    });
  },
  onShow: function () {
    let that = this;
    if (that.data.isPass)
      that.setData({isPass: null}, () => {
        this.onPullDownRefresh();
      })
  },
  //获取公告数据
  fetchNoticeDatas: function() {
    let that = this;
    app.GET({
      url: `${app.globalData.httpUrl}&c=user&a=withdraw_info_json`
    }, (res) => {
      if (res.statusCode == 200) {
        if(res.data.status == 1) {
          let noticeDatas = [];
          for (let key in res.data.data) {
            noticeDatas.push(res.data.data[key]);
          }
          that.setData({
            noticeDatas: noticeDatas
          })
          return;
        }
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      } else {
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      }
    })
  },
  //获取提现数据
  fetchDatas: function(params) {
    let that = this;
    if ((!params || !params.isRefresh) && params.isInit)
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
    app.POST({
      url: `${app.globalData.httpUrl}&c=user&a=withdraw_log_json`,
      datas: {
        token: app.globalData.saveInfo.token,
      }
    }, (res) => {
      if ((!params || !params.isRefresh) && params.isInit)
        wx.hideLoading();
      wx.stopPullDownRefresh();
      wx.hideNavigationBarLoading();
      if (res.statusCode == 200) {
        if (res.data.status === '001') {
          app.reLogin();
          return;
        }
        if (res.data.status == 1) {
          that.setData({
            presentDatas: res.data.data,
            isLoading: false
          })
          return;
        }
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      } else {
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      }
    })
  },
  //展开公告
  tapNotice: function () {
    let that = this;
    let animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-out',
    });
    that.data.isShowNotice ? animation.translateY('-100%').opacity(0).step() : animation.translateY(0).opacity(1).step();
    that.setData({
      animationNotice: animation.export(),
      isShowNotice: !that.data.isShowNotice
    })
  },
  //提现
  tapPresent: function () {
    wx.navigateTo({
      url: '/pages/present/index',
    })
  },
  //进入详情
  tapPresentDetail: function(e) {
    let index = e.currentTarget.dataset.index;
    let params = JSON.stringify(this.data.presentDatas[index]);
    wx.navigateTo({
      url: `/pages/presentDetail/index?params=${params}`,
    })
  },
  //触发上拉加载
  onReachBottom: function () {
    let that = this;
    //如果是正在加载中或没有更多数据了，则返回
    if (that.data.footState != 0) {
      return;
    }
    //如果当前页大于或等于总页数，那就是到最后一页了，返回
    if ((that.pageNo != 1) && (that.pageNo >= that.totalPage)) {
      return;
    } else {
      that.pageNo++;
    }
    that.setData({ footState: 2 }, () => {
      that.fetchDatas({});
    })
  },
  //下拉刷新
  onPullDownRefresh: function () {
    let that = this;
    wx.showNavigationBarLoading();
    if (app.globalData.loginState) {
      that.pageNo = 1,
      that.totalPage = 1,
      that.fetchDatas({ isRefresh: true });
    } else {
      wx.switchTab({
        url: '/pages/mine/index',
      })
    }
  }
})
