var p = 0, c = 0, d = 0
var app = getApp();
import observe from '../../utils/oba.js';
Page({
  data:{
    country: 1,
    provinceName:[],
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
    showMessage: false,
    messageContent: '',
    name: '',
    tel: '',
    address: '',
    editData: {},
    isEdit: false,
    id: 0,
    'type': '',
    isHandle: false,//是否操作中
  },
  onLoad:function(options) {
    let that = this;
    let title = options.type == 'add' ? '新增地址' : options.type == 'default' ? '收货人信息' : '修改地址';
    wx.setNavigationBarTitle({ title: title })
    that.setData({'type':options.type});
    //修改地址
    if (options.type == 'edit') {
      wx.showLoading({
        title: '加载中...',
        icon: 'none'
      })
      //加载编辑数据
      app.POST({
        url: `${app.globalData.httpUrl}&c=user&a=edit_address_json`,
        datas: {
          token: app.globalData.saveInfo.token,
          id: options.id
        }
      }, (res) => {
        if (res.statusCode == 200) {
          if (res.data.status === '001') {
            app.reLogin();
            return;
          }
          //重置省市区
          let province = res.data.province_list;
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
          for (let i = 0; i < province.length;i++) {
            provinceName.push(province[i].region_name);
            provinceCode.push(province[i].region_id);
            if (province[i].region_id == res.data.consignee.province)
              provinceSelIndex = i;
          }
          for (let i = 0; i < city.length;i++) {
            cityName.push(city[i].region_name);
            cityCode.push(city[i].region_id);
            if (city[i].region_id == res.data.consignee.city)
              citySelIndex = i;
          }
          for (let i = 0; i < district.length;i++) {
            districtName.push(district[i].region_name);
            districtCode.push(district[i].region_id);
            if (district[i].region_id == res.data.consignee.district)
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
            editData: res.data.consignee,
            isEdit: true,
            cityEnabled: true,
            districtEnabled: true,
            id: options.id
          });
          wx.hideLoading();
        } else {
          wx.showLoading({
            title: '数据加载失败...',
          })
        }
      });
    } else if (options.type == 'add' || options.type == 'default'){
      that.fetchAddress({}, (res) => {
        let province = res.data.regions;
        let provinceName = [];
        let provinceCode = [];
        for (let i = 0; i < province.length;i++) {
          provinceName.push(province[i].region_name);
          provinceCode.push(province[i].region_id);
        }
        that.setData({ 
          provinceName: provinceName,
          provinceCode: provinceCode
        });
      });
    }
    //监听登录状态
    observe(app.globalData, ["loginState"], (name, value, old) => {
      if (!value) {
        wx.switchTab({
          url: '/pages/mine/index',
        })
      }
    });
  },
  //请求地址
  fetchAddress: function(params, fn) {
    let that = this;
    params.type = params.type ? params.type : that.data.country;
    params.target = params.target ? params.target:2;
    params.parent = params.parent ? params.parent : that.data.country;
    app.GET({
      url: `${app.globalData.httpUrl}&c=public&a=region`,
      datas: params
    }, fn);
  },
  //设置城市数据
  fetchCity: function() {
    let that = this; 
    that.fetchAddress({
      type: 2,
      target: 3,
      parent: that.data.provinceCode[that.data.provinceSelIndex]
    }, (res) => {
      let city = res.data.regions;
      let cityName = [];
      let cityCode = [];
      for (let i=0;i < city.length;i++) {
        cityName.push(city[i].region_name);
        cityCode.push(city[i].region_id);
      }
      that.setData({
        cityName: cityName,
        cityCode: cityCode
      });
    })
  },
  //设置区域数据
  fetchArea: function() {
    let that = this;
    that.fetchAddress({
      type: 3,
      target: 4,
      parent: that.data.cityCode[that.data.citySelIndex]
    }, (res) => {
      let district = res.data.regions;
      let districtName = [];
      let districtCode = [];
      for (let i = 0; i < district.length;i++) {
        districtName.push(district[i].region_name);
        districtCode.push(district[i].region_id);
      }
      that.setData({
        districtName: districtName,
        districtCode: districtCode
      });
    })
  },
  // 选择省
  changeProvince: function(e) {
    let that = this;
    let index = e.detail.value;
    this.resetAreaData('province')
    p = e.detail.value
    this.setAreaData('province', p)
  },
  // 选择市
  changeCity: function(e) {
    this.resetAreaData()
    c = e.detail.value
    this.setAreaData('city', p, c)
  },
  // 选择区
  changeDistrict: function(e) {
    d = e.detail.value
    this.setAreaData('district', p, c, d)
  },
  //设置区域数据
  setAreaData: function(t, p, c, d){
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
  //新增地址信息
  savePersonInfo: function (e) {
    let that = this;
    let data = e.detail.value;
    let telRule = /^1[3|4|5|7|8]\d{9}$/
    if (data.name == '') {
      this.showMessage('请输入姓名!')
    } else if (data.tel == '') {
      this.showMessage('请输入手机号码!')
    } else if (!telRule.test(data.tel)) {
      this.showMessage('手机号码格式不正确!')
    } else if (data.province == '') {
      this.showMessage('请选择所在省!')
    } else if (data.city == '') {
      this.showMessage('请选择所在市!')
    } else if (that.data.cityName.length > 0 && data.district == '') {
      this.showMessage('请选择所在区!')
    } else if (data.address == '') {
      this.showMessage('请输入详细地址!')
    } else {//输入正确
      let isEdit = that.data.isEdit;
      if(that.data.type == 'default') {
        isEdit = false;
      }
      let district = that.data.districtSelIndex == '' ? '' : that.data.districtCode[that.data.districtSelIndex];
      let params = {
        token: app.globalData.saveInfo.token,
        edit: 1,
        consignee: data.name,
        mobile: data.tel,
        country: 1,
        province: that.data.provinceCode[that.data.provinceSelIndex],
        city: that.data.cityCode[that.data.citySelIndex],
        district: district,
        address: data.address
      };
      that.data.isEdit?params.address_id = that.data.id:null;
      let url = that.data.isEdit ? `${app.globalData.httpUrl}&c=user&a=edit_address_json` : `${app.globalData.httpUrl}&c=user&a=add_address_json`;
      that.setData({
        isHandle: true
      });
      app.POST({
        url: url,
        datas: params
      }, (res) => {
        //console.log(res);
        if (res.statusCode == 200) {
          if (res.data.status == '001') {
            app.reLogin();
            return;
          }
          that.setData({isHandle: false});
          if(res.data.status == 1) {
            let pages = getCurrentPages();
            let prevPage = pages[pages.length - 2]  //上一个页面
            prevPage.setData({
              isLoading: false
            })
            wx.navigateBack({
              delta: 1
            })
            return;
          }
          wx.showToast({
            title: '操作失败！',
            icon: 'none'
          })
        }else {
          wx.showToast({
            title: '操作失败！',
            icon: 'none'
          })
        }
      });
    }
  },
  //取消选择
  cancleEvent: function() {
    wx.navigateBack({
      delta: 1
    })
  },
  //删除收货地址
  deleteEvent: function() {
    var that = this;
    wx.showModal({
      title: '',
      content: '确定删除该地址吗?',
      success: (res => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
            icon: 'none'
          })
          app.POST({
            url: `${app.globalData.httpUrl}&c=user&a=del_address_list_json`,
            datas: {
              token: app.globalData.saveInfo.token,
              id: that.data.id
            }
          }, (res) => {
            wx.hideLoading();
            if (res.statusCode == 200) {
              if (res.data.status == '001') {
                app.reLogin();
                return;
              }
              if (res.data.status == 1) {
                wx.navigateBack({
                  delta: 1
                })
                return;
              }
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              })
            } else {
              wx.showToast({
                title: '删除失败!',
                icon: 'none'
              })
            }
          })
        }
      })
    })
  },
  //消息提示
  showMessage: function (text) {
    let that = this
    that.setData({
      showMessage: true,
      messageContent: text
    })
    setTimeout(function () {
      that.setData({
        showMessage: false,
        messageContent: ''
      })
    }, 3000)
  },
})