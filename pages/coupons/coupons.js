// pages/coupons/coupons.js
//已作废 *********
var app = getApp()
var rgba = require('../../utils/common.js')
Page({
    data: {
        currentTab: 0,
        couponTab: ['可使用', '已使用', '已失效', '已过期'],
        currTab:0,
        tabPos:0,
        status:1,
        couponStatus: ['未生效','可使用','已使用','已失效','已过期','已删除','已锁定'],
        couponType: ['代金券','折扣券','兑换券','优惠券','团购券','单品代金券','会员卡','单品折扣','单品特价券','全场满减券'],
    },

    viewRules: function () {
        wx.navigateTo({
            url: '/pages/coupons/couponsRules',
        });
    },
    
    failureCoupons: function () {
      this.setData({
        failure: true
      });
    },

    effectiveCoupons: function () {
      this.setData({
        failure: false
      });
    },
    
    tabToggle:function(e){
        let that = this
        console.log(e)
        that.setData({
            currTab:e.target.id,
            tabPos: e.target.offsetLeft,
            status: e.target.dataset.status
        })
    },
    
    //查看优惠券详情
    couponDescription:function(e){
        let that = this
        let touchTime = that.data.touchEnd - that.data.touchStart
        let couponNo = e.currentTarget.id
        let parmas = { 
            couponNo: e.currentTarget.id, 
            superMerchantId: app.api.parmas.merchantId,
            openId: app.api.parmas.openId
        }
        var _couponList = that.data.couponList
        var _colorList = that.data.colorList
        if (touchTime > 350) {
            wx.showModal({
            title: '删除优惠券？',
            content: '',
            success:function(res){
                if (res.confirm) {
                    wx.request({
                        url: app.api.host + 'delCoupon.htm?json=' + JSON.stringify(parmas),
                        method: 'POST',
                        success: function (res) {
                            if (res.data.returnCode == 'S'){
                                _couponList.items.splice(e.currentTarget.dataset.id, 1)
                                _colorList.splice(e.currentTarget.dataset.id,1)
                                wx.showToast({
                                    title: '已删除',
                                    icon: 'success',
                                    duration: 2000
                                })
                                that.setData({
                                    couponList:_couponList,
                                    colorList: _colorList,
                                })
                                wx.clearStorageSync("COUPONS");
                            }
                        }
                    });
                    return false
                } else if (res.cancel) {
                }
            }
            })
            wx.request({
                url: app.api.host + 'delCoupon.htm?json=' + JSON.stringify(parmas),
                method: 'POST',
                success: function (res) {
                    console.log(res);
                }
            })
        }else{
            wx.navigateTo({
                url: '/pages/couponsdetail/couponsdetail?id=' + e.currentTarget.id,
            });
        }
    },

    viewCard: function () {
        app.viewCard()
    },

    onLoad: function (options) {
        var that = this
        
        wx.setNavigationBarTitle({
            title: '我的优惠券'
        })
        app.setTab()
        let couponsParmas = {
            superMerchantId:app.api.parmas.merchantId,
            memberId:app.api.parmas.memberId
        }
        app.jsData('couponList', couponsParmas)
        .then(function(res){
            console.log(res)
            var colorList = []
            var colorData = res.items
            for (let i in colorData) {
                let colors = colorData[i].cardTemplate.color
                colorList.push(colors.colorRgb())
            }
            that.setData({
                couponList:res,
                colorList: colorList
            })
        })
    },

    touchStart: function (e) {
        let that = this;
        that.setData({
            touchStart: e.timeStamp
        });
        //console.log(e.timeStamp + '- touch-start')
    },

    touchEnd: function (e) {
        let that = this;
        that.setData({
            touchEnd: e.timeStamp
        })
        //console.log(e.timeStamp + '- touch-end')
    },  
    onReady: function () {
        var that = this
        wx.hideLoading()
        // let couponsParmas = {
        //     superMerchantId: '10111174',
        //     memberId: '64153'
        // }
        // app.jsData('couponList', couponsParmas)
        // .then(function (res) {
        //     console.log(res);
        //     var colorList = [];
        //     var colorData = res.items;
        //     for (let i in colorData) {
        //         let colors = colorData[i].cardTemplate.color;
        //         colorList.push(colors.colorRgb());
        //     }
        //     that.setData({
        //         couponList: res,
        //         colorList: colorList
        //     });
        // });
    },

    onShow: function () {
        console.log('2222');
    },

    onHide: function () {

    },

    onUnload: function () {

    },

    onPullDownRefresh: function () {
        console.log('pullDownRefresh');
    },

    onReachBottom: function () {
        var that = this;
        var parmas = {};
        parmas.openId = app.api.parmas.openId;
        parmas.currentPage = 2;
        parmas.pageSize = 1;
        app.request('couponList', parmas).then(function(data){
            console.log(data);
        });
    },
    onShareAppMessage: function () {

    }
})