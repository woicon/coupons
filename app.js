App({
    onLaunch: function (options) {
        var that = this
        //第三方平台获取扩展参数
        let extConfig = wx.getExtConfigSync ? wx.getExtConfigSync() : {}
        console.log("开放平台扩展参数", extConfig)
        that.api.appid = extConfig.appId
        that.api.host = extConfig.host
        that.api.parmas.merchantId = extConfig.merchantId
        let sessionKey = wx.getStorageSync("sessionKey")
        !sessionKey?that.login():''
        //that.login()
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
        parmas: {
            memberId: null,
            merchantId: null,
        }
    },
    login: function () {
        let that = this
        wx.clearStorage()
        //用户登录
        wx.login({
            success: function (res) {
                if (res.code) {
                    //获取openid
                    that.request('wechatAppSession', {
                        appId: that.api.appid,
                        jsCode: res.code
                    })
                        .then(function (appSession) {
                            let result = appSession.data.result
                            console.log(appSession)
                            if (appSession.data.code == 0) {
                                //获取用户授权
                                wx.getUserInfo({
                                    withCredentials: true,
                                    lang: 'zh_CN',
                                    success: function (user) {
                                        console.log(user);
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
                                                    that.api.parmas.unionId = userInfo.data.result.map.unionId
                                                    result.unionid = userInfo.data.result.map.unionId
                                                    wx.setStorageSync("sessionKey", result)
                                                    //that.getMember(result)
                                                }
                                            })
                                        } else {
                                            that.api.parmas.unionId = result.unionid
                                            wx.setStorageSync("sessionKey", result)
                                            that.getMember(result)
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
    //获取用户信息
    getMember: function (sessionKey) {
        let that = this
        let parmas = {
            merchantId: that.api.parmas.merchantId,
            unionId: sessionKey.unionid
        }
        that.jsData('memberCardInfo', parmas).then((memberInfo) => {
            console.log('获取会员信息', memberInfo)
            let _curPage = that.currPage()
            that.api.parmas.memberId = memberInfo.memberId
            console.log('获取用户信息参数', that.api)
            _curPage.setData({
                regStat: (memberInfo.returnCode === "S") ? true : false,
                error: false,
                failUserInfo: false,
            })
            
            wx.setStorageSync("memberCardInfo", memberInfo)
            
            if (that.backGetMember) {
                that.backGetMember(memberInfo)
            }
            if (that.backGetMemberCoupons) {
                that.backGetMemberCoupons(memberInfo)
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
            errorMessage: message
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
                fail:function(error){
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

    viewCard: function () {
        let that = this
        try {
            let sessionKey = wx.getStorageSync("sessionKey")
            let memberCardInfo = wx.getStorageSync("memberCardInfo")
            const data = memberCardInfo
            if (memberCardInfo.returnCode === 'F') {
                //获取会员卡模板信息
                that.jsData('memberCardTemplate', { merchantId: that.api.parmas.merchantId })
                    .then(function (memberCard) {
                        console.log(memberCard)
                        if (sessionKey.unionid) {
                            let cardData = memberCard.wechatExtraData || {}
                            cardData.outer_str = 'unionid_' + sessionKey.unionid
                            console.log("开卡信息", cardData)
                            //跳转到微信开卡组件
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
                        }
                    })
            } else {
                //打开会员卡组件参数
                let openCard = {
                    cardId: data.wechatCardTempId,
                    code: data.wechatOriginalCardNo
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