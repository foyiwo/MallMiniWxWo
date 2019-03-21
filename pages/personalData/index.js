//index.js
//获取应用实例
const app = getApp()
var p = 0, c = 0, d = 0
import observe from '../../utils/oba.js';
Page({
  data: {
    country: 1,
    provinceName: [],
    provinceCode: [],
    provinceSelIndex: '',
    cityName: [],
    cityCode: [],
    citySelIndex: '',
    districtName: [],
    districtCode: [],
    districtSelIndex: '',
    cityEnabled: false,
    districtEnabled: false,
    businessLicense: {},//营业执照信息
    doorAccording: {},//门头照信息
    personData: {},//个人资料
  },
  onLoad: function() {
    let that = this;
    that.fetchData();
    //请求地址
    /*that.fetchAddress({}, (res) => {
      let province = res.data;
      let provinceName = [];
      let provinceCode = [];
      for (let i = 0; i < province.length;i++) {
        provinceName.push(province[i].name);
        provinceCode.push(province[i].areaid);
      }
      that.setData({
        provinceName: provinceName,
        provinceCode: provinceCode
      });
    });*/
    //监听登录状态
    observe(app.globalData, ["loginState"], (name, value, old) => {
      if (!value) {
        wx.switchTab({
          url: '/pages/mine/index',
        })
      }
    });
  },
  //获取个人信息数据
  fetchData: function() {
    let that = this;
    app.POST({
      url: 'https://b2b.3c2p.com/lite_user.php',
      datas: {
        token: app.globalData.saveInfo.token,
        act: 'mini_back_info'
      }
    } ,(res) => {
      //console.log(res); 
      if(res.statusCode == 200) {
        if (res.data.status === '001') {
          wx.showModal({
            title: '提示',
            content: '请先进行登录！',
            success: (res) => {
              if (res.confirm)
                wx.navigateTo({
                  url: '/pages/login/index'
                })
            }
          });
          return;
        }
        //重置省市区
        let province = res.data.provice_list;
        let provinceName = [];
        let provinceCode = [];
        let provinceSelIndex = 0;
        let city = res.data.city_list;
        let cityName = [];
        let cityCode = [];
        let citySelIndex = 0;
        let district = res.data.district_list;
        let districtName = [];
        let districtCode = [];
        let districtSelIndex = 0;
        for (let i = 0; i < province.length; i++) {
          provinceName.push(province[i].name);
          provinceCode.push(province[i].areaid);
          if (province[i].areaid == res.data.provice_id)
            provinceSelIndex = i;
        }
        for (let i = 0; i < city.length; i++) {
          cityName.push(city[i].name);
          cityCode.push(city[i].areaid);
          if (city[i].areaid == res.data.city_id)
            citySelIndex = i;
        }
        for (let i = 0; i < district.length; i++) {
          districtName.push(district[i].name);
          districtCode.push(district[i].areaid);
          if (district[i].areaid == res.data.district_id)
            districtSelIndex = i;
        }
        that.setData({
          provinceName: provinceName,
          provinceCode: provinceCode,
          provinceSelIndex: provinceSelIndex,
          cityName: cityName,
          cityCode: cityCode,
          citySelIndex: citySelIndex,
          districtName: districtName,
          districtCode: districtCode,
          districtSelIndex: districtSelIndex,
          personData: res.data
        });
      }else {
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      }
    })
  },
  //请求地址
  fetchAddress: function (params, fn) {
    let that = this;
    app.GET({
      url: `${app.globalData.httpUser}lite_user.php?act=address`,
      datas: params
    }, fn?fn: (res) => {
      //console.log(res);
    });
  },
  //设置城市数据
  fetchCity: function () {
    let that = this;
    that.fetchAddress({
      parent_id: that.data.provinceCode[that.data.provinceSelIndex]
    }, (res) => {
      let city = res.data;
      let cityName = [];
      let cityCode = [];
      for (let i = 0; i < city.length;i++) {
        cityName.push(city[i].name);
        cityCode.push(city[i].areaid);
      }
      that.setData({
        cityName: cityName,
        cityCode: cityCode
      });
    })
  },
  //设置区域数据
  fetchArea: function () {
    let that = this;
    that.fetchAddress({
      parent_id: that.data.cityCode[that.data.citySelIndex]
    }, (res) => {
      let district = res.data;
      let districtName = [];
      let districtCode = [];
      for (let i = 0; i < district.length;i++) {
        districtName.push(district[i].name);
        districtCode.push(district[i].areaid);
      }
      that.setData({
        districtName: districtName,
        districtCode: districtCode
      });
    })
  },
  // 选择省
  changeProvince: function (e) {
    let that = this;
    let index = e.detail.value;
    this.resetAreaData('province')
    p = e.detail.value
    this.setAreaData('province', p)
  },
  // 选择市
  changeCity: function (e) {
    this.resetAreaData()
    c = e.detail.value
    this.setAreaData('city', p, c)
  },
  // 选择区
  changeDistrict: function (e) {
    d = e.detail.value
    this.setAreaData('district', p, c, d)
  },
  //设置区域数据
  setAreaData: function (t, p, c, d) {
    switch (t) {
      case 'province':
        this.setData({
          provinceSelIndex: p,
          cityEnabled: true
        }, () => {
          this.fetchCity();
        })
        break;
      case 'city':
        this.setData({
          citySelIndex: c,
          districtEnabled: true
        }, () => {
          this.fetchArea();
        })
        break;
      case 'district':
        this.setData({
          districtSelIndex: d
        })
    }
  },
  // 重置数据
  resetAreaData: function (type) {
    this.setData({
      districtName: [],
      districtCode: [],
      districtSelIndex: '',
      districtEnabled: false
    })
    if (type == 'province') {
      this.setData({
        cityName: [],
        cityCode: [],
        citySelIndex: ''
      })
    }
  },
  //选择图片
  tapUpload: function(e) {
    wx.showToast({
      title: '请前往网页端上传!',
      icon: 'none'
    })
    return;
    let that = this;
    let index = e.currentTarget.dataset.index;
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      success: res => {
        if(index == 1) {
          that.setData({businessLicense: res.tempFiles[0]});
        }else if(index == 2) {
          that.setData({doorAccording: res.tempFiles[0]});
        }
      },
    })
  },
  //资料上传
  updataSave: function(e) {
    let that = this;
    let data = e.detail.value;
    if (data.province == '') {
      wx.showToast({
        title: '请选择所在省！',
        icon: 'none'
      })
      return;
    }
    if (data.city == '') {
      wx.showToast({
        title: '请选择所在市！',
        icon: 'none'
      })
      return;
    }
    if (data.district == '') {
      wx.showToast({
        title: '请选择所在区！',
        icon: 'none'
      })
      return;
    }
    let filePaths = [];
    for (let key in that.data.businessLicense) {
      filePaths.push(that.data.businessLicense['path']);
    }
    for (let key in that.data.doorAccording) {
      filePaths.push(that.data.doorAccording['path']);
    }
    let areaId = that.data.districtSelIndex == '' ? that.data.cityCode[that.data.citySelIndex] : that.data.districtCode[that.data.districtSelIndex];
    let params = {
      act: "mini_info_extend",
      token: app.globalData.saveInfo.token,
      area_id: areaId
    }
    data.company ? params.company = data.company:null;
    data.contacts ? params.contact = data.contacts : null;
    data.phone ? params.phone = data.phone : null;
    wx.showLoading({
      title: '修改中...',
      mask: true
    })
    if (filePaths.length > 0) {
      for (let i = 0; i < filePaths.length;i++) {
        wx.uploadFile({
          url: `${app.globalData.httpUser}lite_user.php`,
          filePath: filePaths[i],
          header: {
            "content-type": "multipart/form-data"
          },
          name: i == 0 ? "license_pic" : i == 1 ?"door_pic":null,
          formData: params,
          success: (res) => {
            //console.log(res);
          }
        })
      }
    }else {
      app.POST({
        url: `${app.globalData.httpUser}lite_user.php`,
        datas: params
      }, (res) => {
        console.log(res);
        wx.hideLoading();
        if(res.statusCode == 200) {
          if(res.data.msg[0].status == 1) {
            wx.showToast({
              title: '修改成功!',
              icon: 'none'
            })
            return;
          }
          wx.showToast({
            title: res.data.msg[0].msg,
            icon: 'none'
          })
        }else {
          wx.showToast({
            title: '上传失败!',
            icon: 'none'
          })
        }
      })
    }
  }
})
