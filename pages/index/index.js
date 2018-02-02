// pages/index/index.js
let app = getApp()
//let apiHost = "http://wxcs.liantuo.com/api/apiJsConfig.do"
Page({
    data: {
        indicatorDots: false,
        autoplay: false,
        interval: 5000,
        duration: 1000,
        receiveStatus: ['卡券失效', '超过总领取限制', '已领取', '已领完', '超过单日领取限制'],
        couponType: ['代金券','折扣券','兑换券','优惠券','团购券','单品代金券','会员卡','单品折扣','单品特价券','全场满减券'],
        banner: null,
        regStat: true,
        menuPos: false,
        errorMessage: '系统繁忙',
        pageloading:false
    },

    onLoad: function (options) {
        var that = this
        
        app.setTab()//加载tabBar菜单
        
        try {
            var memberCardInfo = wx.getStorageSync('memberCardInfo')
            
            if (memberCardInfo) {
                app.getAuthKey()
                    .then(function (sessionKey) {
                        //分类和 首页banner
                        let parmas = {
                            merchantId: app.api.parmas.merchantId
                        }
                        return app.jsData('wechatAppCouponCategory', parmas)
                            .then(function (data) {
                                let setData = {
                                    categoryList: data.categoryList
                                }
                                if (data.bannerList.length != 0) {
                                    setData.banner = data.bannerList
                                }
                                that.setData(setData)
                            })
                            .then(function(){
                                that.couponLoad({ catId: that.data.categoryList[0].categoryId })
                            })
                            .catch(function (error) {
                                console.log(error)
                            })
                    })
                    .catch(function (err) {
                        console.log(err)
                    })
                this.setData({
                    address: app.weChatUserInfo.address
                });
            }
        } catch (e) {
            console.log(e)
        }
    },

    couponLoad: function (e) {
        let that = this
        //分类的优惠券
        let params = {
            categoryId: e.catId || e.target.dataset.id,//e.target.dataset.id,
            memberId: app.api.parmas.memberId
        }
        let currId = (e.catId)?"0":e.currentTarget.id
        app.jsData('wechatAppCouponByCategory', params)
        .then(function (coupon) {
            console.log(coupon)
            that.setData({
                couponList: coupon,
                currMenu: currId,
                pageloading: true,
            })
            that.getMember()
            setTimeout(function(){
                wx.createSelectorQuery().select('#banner').boundingClientRect(function (rect) {
                    that.setData({
                        bannerHeight: rect.height
                    })
                }).exec()
            }.bind(this),100)   
        })
    },
    onPageScroll: function (e) {
        let that = this
        //分类位置
        var query = wx.createSelectorQuery()
        let bannerHeight = that.data.bannerHeight
        query.select('#container').boundingClientRect(function (rect) {
            console.log(rect.top)
            let _menuPos = (rect.top > -bannerHeight) ? false : true
            //console.log(_menuPos)
            that.setData({
                menuPos: _menuPos
            })
        }).exec()
    },

    //领取优惠券
    getCoupon: function (e) {
        var that = this
        var parmas = {
            cardIds: e.target.dataset.id,
            openId: app.api.parmas.openId,
            merchantId: app.api.parmas.merchantId,
            memberId: app.api.parmas.memberId
        }
        let couponIndex = e.target.dataset.index
        app.jsData('couponGet', parmas)
        .then(function(res){
            if(res.returnCode === 'S'){
                wx.showToast({
                    title: '领取成功',
                    icon: 'success',
                    duration: 2000
                })
                let _couponList = that.data.couponList
                _couponList.items[couponIndex].receive = false
                that.setData({
                    couponList:_couponList
                })
            }

            //var cid = res.data.coupons[0].cardId;
            //var cids = res.data.coupons[0].wechatCardId;
            // var _parmas = {
            //     //cardNo: res.data.coupons[0].couponNo,
            //     cardId: 'pL - pRuAHc1AJ_gMfP2 - 3ZVNzqA9k',//cids,
            //     merchantId: app.api.parmas.merchantId
            // }
            // //同步到微信接口
            // wx.request({
            //     url: apiHost,
            //     method: 'POST',
            //     data: _parmas,
            //     header: {
            //         'content-type': 'application/x-www-form-urlencoded'
            //     },
            //     success: function (data) {
            //         console.log(data.data);
            //         var result = data.data.result;
            //         if (data.data.code == 0) {
            //             wx.addCard({
            //                 cardList: [{
            //                     cardId: 'pL - pRuAHc1AJ_gMfP2 - 3ZVNzqA9k',
            //                     cardExt: result
            //                 }],
            //                 success: function (res) {
            //                     console.log(res);
            //                 },
            //                 cancel: function (res) {
            //                     console.log(res);
            //                 }
            //             });
            //         } else {
            //             wx.showToast({
            //                 title: '同步到微信卡包失败',
            //             });
            //         }
            //     }
            // });
            
            // console.log(app.api.parmas);
            // app.getData('cardTemplateList', 'INDEX_COUPONS', app.api.parmas).then(function (res) {
            //     that.setData({
            //         couponlist: res
            //     });
            // });
            // wx.removeStorageSync('INDEX_COUPONS')
            // wx.removeStorageSync('COUPONS')
        })
        
        // wx.request({
        //     url: app.api.host + 'couponGet.htm?json=' + _parmas,
        //     method: 'POST',
        //     success: function (res) {
                // console.log(res);
                // //var cid = res.data.coupons[0].cardId;
                // //var cids = res.data.coupons[0].wechatCardId;
                // var _parmas = {
                //     //cardNo: res.data.coupons[0].couponNo,
                //     cardId: 'pL - pRuAHc1AJ_gMfP2 - 3ZVNzqA9k',//cids,
                //     merchantId: app.api.parmas.merchantId
                // }
                // //同步到微信接口
                // wx.request({
                //     url: apiHost,
                //     method: 'POST',
                //     data: _parmas,
                //     header: {
                //         'content-type': 'application/x-www-form-urlencoded'
                //     },
                //     success: function (data) {
                //         console.log(data.data);
                //         var result = data.data.result;
                //         if (data.data.code == 0) {
                //             wx.addCard({
                //                 cardList: [{
                //                     cardId: 'pL - pRuAHc1AJ_gMfP2 - 3ZVNzqA9k',
                //                     cardExt: result
                //                 }],
                //                 success: function (res) {
                //                     console.log(res);
                //                 },
                //                 cancel: function (res) {
                //                     console.log(res);
                //                 }
                //             });
                //         } else {
                //             wx.showToast({
                //                 title: '同步到微信卡包失败',
                //             });
                //         }
                //     }
                // });
                // wx.showToast({
                //     title: '领取成功',
                //     icon: 'success',
                //     duration: 2000
                // });
                // console.log(app.api.parmas);
                // app.getData('cardTemplateList', 'INDEX_COUPONS', app.api.parmas).then(function (res) {
                //     that.setData({
                //         couponlist: res
                //     });
                // });
                // wx.removeStorageSync('INDEX_COUPONS')
                // wx.removeStorageSync('COUPONS')
        //     }
        // });
    },
    viewCard: function () {
        app.viewCard()
    },
    onReady: function () {
        let that = this
        that.getMember()
    },
    getMember:function(){
        let that = this
        try {
            let sessionKey = wx.getStorageSync('sessionKey')
            if (sessionKey) {
                let parmas = {
                    merchantId: app.api.parmas.merchantId,
                    unionId: sessionKey.unionid
                }
                //获取用户信息
                app.jsData('memberCardInfo', parmas).then(function (memberInfo) {
                    console.log(memberInfo)
                    let res = memberInfo
                    let regStat = (res.returnCode === "S") ? true : false
                    app.globalData['member'] = memberInfo
                    app.api.parmas.memberId = memberInfo.memberId
                    console.log(app.api)
                    wx.setStorage({
                        key: 'memberCardInfo',
                        data: memberInfo,
                    })
                    that.setData({
                        regStat: regStat
                    })
                })
            }else{
                
            }
        } catch (e) {
            console.log(e)
        }
    },
    onShow: function () {
        let that = this
        that.getMember()
    }
})