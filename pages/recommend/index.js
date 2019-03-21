//index.js
//获取应用实例
const app = getApp()
Page({
  data: {
    codeImage: '',
    userInfo: app.globalData.saveInfo,
  },
  onLoad: function() {
    this.fetchData();
  },
  onShow: function() {
    this.setData({ userInfo: app.globalData.saveInfo});
  },
  //获取数据
  fetchData: function () {
    let that = this;
    app.GET({
      url: `${app.globalData.httpUrl}&c=user&a=mini_qrcode_json`,
      datas: {
        token: app.globalData.saveInfo.token
      }
    }, (res) => {
      that.setData({
        codeImage: res.data
      });
      //console.log(res);
    })
  },
  //分享给好友
  onShareAppMessage: function (ops) {
    let that = this;
    if (ops.from === 'button') {
      // 来自页面内转发按钮
      //console.log(ops.target)
    }
    return {
      title: '欢迎加入我们',
      path: `/pages/register/index?isShare=1&invide_code=${app.globalData.saveInfo.info.invide_code}`,
      success: function (res) {
        // 转发成功
        //console.log("转发成功:" + JSON.stringify(res));
      },
      fail: function (res) {
        // 转发失败
        //console.log("转发取消" + JSON.stringify(res));
      }
    }

  },
  canvasFun: function() {
    let that = this;
    const myCanvas = wx.createCanvasContext('myCanvas');
    wx.canvasPutImageData({
      canvasId: 'myCanvas',
      data: that.data.codeImage,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      success: (res) => {
        console.log(res);
      },
      fail: (error) => {
        console.log(error);
      }
    })
    myCanvas.drawImage(that.data.codeImage, 0, 0, 100, 100);
    myCanvas.draw();
    /*setTimeout(() => {
      wx.canvasToTempFilePath({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        destWidth: 100,
        destHeight: 100,
        canvasId: 'myCanvas',
        success: (res) => {
          console.log(res.tempFilePath);
        },
        fail: function (res) {
          console.log(res)
        }
      })
    }, 1000)*/
  },
  //图片预览
  previewImage: function() {
    let that = this;
    wx.downloadFile({
      url: that.data.codeImage,
      success: function (res) {
        //console.log(res)
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function (res) {
            //console.log(res)
          },
          fail: function (res) {
            //console.log(res)
            //console.log('fail')
          }
        })
      },
      fail: function () {
        //console.log('fail')
      }
    })
  }
})
