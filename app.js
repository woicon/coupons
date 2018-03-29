
const apiHost = "https://wxcs.liantuo.com/api/apiJsConfig.do"
App({
    onLaunch: function (options) {
        var that = this
        //第三方平台获取扩展参数
        let extConfig = wx.getExtConfigSync ? wx.getExtConfigSync() : {}
        console.log("开放平台扩展参数", extConfig)
        that.api.appid = extConfig.appId
        that.api.host = extConfig.host
        that.api.merchantId = extConfig.merchantId
        let sessionKey = wx.getStorageSync("sessionKey")
        !sessionKey ? that.login() : ''
        //适配iPhone X
        wx.getSystemInfo({
            success: (res) => {
                that.globalData.isPX = (res.model.indexOf("iPhone X") != -1) ? true : false
            }
        })
    },
    api: {
        host: null,
        appid: null,
        memberId: null,
        merchantId: null,
    },
    login: function () {
        let that = this
        wx.clearStorage()
        //用户登录
        wx.login({
            success: function (res) {
                if (res.code) {
                    //获取openid
                    that.request('wechatAppSession',{
                        appId: that.api.appid,
                        jsCode: res.code
                    })
                        .then(function (appSession) {
                            let result = appSession.data.result
                            console.log(appSession)
                            that.api.openId = appSession.data.result.openid
                            if (appSession.data.code == 0) {
                                //获取用户授权
                                wx.getUserInfo({
                                    withCredentials: true,
                                    lang: 'zh_CN',
                                    success: function (user) {
                                        console.log("登录授权>>>>>>>>>>>", user)
                                        if (!result.unionid) {
                                            let parmas = {
                                                sessionKey: result.session_key,
                                                encryptedData: user.encryptedData,
                                                iv: user.iv,
                                                appId: that.api.appid
                                            }
                                            //未关注公众号 获取unionId
                                            wx.request({
                                                url: that.api.host + 'wechatAppUserInfo.htm',
                                                data: parmas,
                                                success: function (userInfo) {
                                                    console.log(userInfo)
                                                    that.api.unionId = userInfo.data.result.map.unionId
                                                    result.unionid = userInfo.data.result.map.unionId
                                                    wx.setStorageSync("sessionKey", result)
                                                    if (that.backResPage){
                                                        that.backResPage(result)
                                                    }
                                                }
                                            })
                                        } else {
                                            that.api.unionId = result.unionid
                                            wx.setStorageSync("sessionKey", result)
                                            if (that.backResPage) {
                                                that.backResPage(result)
                                            }
                                        }
                                    },
                                    fail: function (failData) {
                                        let currPage = that.currPage()
                                        currPage.setData({
                                            error: true,
                                            failUserInfo: true,
                                            pageloading: true,
                                            errorMessage: '需要您授权才能使用哦！'
                                        })

                                    }
                                })
                            } else {
                                let msg = appSession.data.message
                                that.setError(msg)
                            }
                        })
                        .catch(function (error) {
                            console.log(error)
                        })
                } else {
                    let currPage = that.currPage()
                    currPage.setData({
                        error: true,
                        pageloading: true,
                        errorMessage: '登录失败'
                    })
                }
            },
            fail: function (error) {
                console.log('登录失败', error)
            }
        })
    },
    
    currPage: function () {
        let _curPageArr = getCurrentPages()
        return _curPageArr[_curPageArr.length - 1]
    },

    setError: function (message) {
        const that = this
        let currPage = that.currPage()
        currPage.setData({
            error: true,
            pageloading: true,
            errorMessage: message,
            regStat:true
        })
    },

    jsData: function (url, parmas) {
        let that = this
        return new Promise((data) => {
            wx.request({
                url: that.api.host + url + '.htm?json=' + JSON.stringify(parmas),
                method: 'GET',
                success: function (res) {
                    data(res.data)
                },
                fail: function (error) {
                    that.setError("网络请求失败")
                    return
                }
            })
        })
    },

    request: function (url, parmas, rtype) {
        let that = this
        return new Promise((resolve, reject) => {
            wx.request({
                url: that.api.host + url + '.htm',
                data: parmas,
                method: rtype || 'GET',
                success: function (res) {
                    resolve(res)
                }
            })
        })
    },

    globalData: {
        userInfo: null,
    },
    //同步优惠券到卡包
    syncCopuonToWechat: function (parmas,callback) {
        //console.log(app.api)
        //let that = this
        this.request("wechatJsTicket", parmas).then((data) => {
            wx.hideLoading()
            let result = data.data.result[0]
            let cardExt = JSON.parse(result.cardExt)
            cardExt.outer_str = 'unionid_' + wx.getStorageSync("sessionKey").unionid
            result.cardExt = JSON.stringify(cardExt)
            if (data.data.code == 0) {
                wx.addCard({
                    cardList: [result],
                    success: function (res) {
                        
                        if (callback){
                            wx.showLoading()
                            setTimeout(function(){
                                callback()
                                
                            }.bind(this),1000)
                        }
                        wx.showToast({
                            title: '已添加到微信卡包',
                        })
                    }
                });
            } else {
                wx.showToast({
                    title: '同步到微信卡包失败',
                })
            }
        })
    },

    //领取优惠券
    getCoupon: function (e) {
        var that = this
        let currPage = that.currPage()
        var parmas = {
            cardIds: e.target.dataset.id,
            openId: that.api.openId,
            merchantId: that.api.merchantId,
            memberId: wx.getStorageSync("memberCardInfo").memberId
        }
        let couponIndex = e.target.dataset.index
        if (currPage.data.isMember) {
            that.jsData('couponGet', parmas).then((res) => {
                if (res.returnCode === 'S') {
                    wx.showModal({
                        title: '领取成功',
                        content: '微信支付即自动核销，每次支付仅限使用一张优惠券',
                        showCancel: false
                    })

                    let _couponList = currPage.data.couponList
                    _couponList.items[couponIndex].receive = false
                    _couponList.items[couponIndex].couponNo = res.coupons[0].couponNo
                    currPage.setData({
                        couponList: _couponList
                    })
                    let _parmas = {
                        cardNo: res.coupons[0].couponNo,
                        cardId: e.target.dataset.cardid,
                        merchantId: that.api.merchantId
                    }
                    that.syncCopuonToWechat(_parmas)
                }
            })
        } else {
            //不是会员的用户领取优惠券
            wx.showLoading()
            that.request("couponNo").then((res) => {
                let parmas = {
                    cardNo: res.data.couponNo,
                    cardId: e.target.dataset.cardid,
                    merchantId: that.api.merchantId
                }
                that.syncCopuonToWechat(parmas)
            })
        }
    },
    regCard: function (data){
        let cardData = data || {}
        cardData.outer_str = 'unionid_' + wx.getStorageSync("sessionKey").unionid
        wx.navigateToMiniProgram({
            appId: "wxeb490c6f9b154ef9",
            extraData: cardData,
            success: function (res) {
                console.log(res)
            },
            fail: function (error) {
                console.log('开卡错误', error)
            }
        })
    },
    getCardTemp:function(){
        //获取会员卡模板信息
        return this.jsData('memberCardTemplate', { merchantId: this.api.merchantId })
    },
    viewCard: function () {
        let that = this
        try {
            let sessionKey = wx.getStorageSync("sessionKey")
            let memberCardInfo = wx.getStorageSync("memberCardInfo")
            var currPage = that.currPage()
            if (!memberCardInfo.memberId) {
                that.getCardTemp().then( (memberCard) => {
                    console.log("memberCardTemplate", memberCard)
                    if (sessionKey.unionid) {
                        //跳转到微信开卡组件
                        if (memberCard.wechatExtraData) {
                            that.regCard(memberCard.wechatExtraData)
                        } else {
                            // wx.showModal({
                            //     title: '提示',
                            //     content: '商家未创建会员卡',
                            //     showCancel:false,
                            //     success:function(res){
                            //         if (res.confirm) {
                            //             currPage.setData({
                            //                 regStat:true
                            //             })
                            //         }
                            //     }
                            // })
                            
                            if (currPage.data.userLimit === 0){
                                wx.showModal({
                                    title: '提示',
                                    content: '商家未创建会员卡,该功能不可用',
                                    showCancel:false
                                })
                            }else{
                                that.setError("商家未创建会员卡")
                            }
                        }
                    }
                })
            } else {
                let openCard = {
                    cardId: memberCardInfo.wechatCardTempId,
                    code: memberCardInfo.wechatOriginalCardNo
                }
                console.log("打开组件", openCard);
                //打开会员卡组件
                wx.openCard({
                    cardList: [
                        openCard
                    ],
                    success: function (res) {
                        console.log(res)
                    },
                    fail: function (err) {
                        console.log('打开组件错误', err)
                    }
                })
            }
        } catch (error) {
            console.log(error)
        }
    }
})