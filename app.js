App({
    onLaunch: function (options) {
        var that = this
        let extConfig = wx.getExtConfigSync ? wx.getExtConfigSync() : {}
        that.api.appid = extConfig.appId
        that.api.parmas.merchantId = extConfig.merchantId
        console.log(that)
    },
    api: {
        host: 'https://opentest.liantuobank.com/api/',
        appid: 'wx13c67157a3d0a74e',
        parmas: {
            memberId: null,
            merchantId:null,
        }
    },
    getAuthKey: function () {
        let that = this
        return new Promise(function (getOpenId) {
            //用户登录
            wx.login({
                success: function (data) {
                    console.log(data)
                    //获取openid
                    getOpenId(that.request('wechatAppSession', {
                        appId: that.api.appid,
                        jsCode: data.code
                    }))
                },
                fail: function (error) {
                    console.log(error)
                }
            })
        })
        .then(function (userSession) {
            let result = userSession.data.result
            that.api.parmas.openId = result.openid
            //获取用户授权
            wx.getUserInfo({
                withCredentials: true,
                lang: 'zh_CN',
                success: function (user) {
                    if (!result.unionid) {
                        let parmas = {
                            sessionKey: result.session_key,
                            encryptedData: user.encryptedData,
                            iv: user.iv,
                            appId: that.api.appid
                        }
                        wx.request({
                            url: that.api.host + 'wechatAppUserInfo.htm',
                            data: parmas,
                            success: function (res) {
                                that.api.parmas.unionId = res.data.result.map.unionId
                                result.unionid = res.data.result.map.unionId
                                wx.setStorage({
                                    key: 'sessionKey',
                                    data: result,
                                })
                            }
                        })
                    } else {
                        that.api.parmas.unionId = result.unionid
                    }
                },
                fail: function (failData) {
                    wx.showModal({
                        title: '提示',
                        content: '您点击了拒绝授权，无法使用该小程序的功能',
                    })
                }
            })
            return result
        })

    },
    errorPage: function () {

    },
    getLocation: function (that) {
        let myLocation = new QQMapWX({
            key: 'RKABZ-R6DK6-BBSSZ-EW2BY-IFRA7-VHFU7'
        })
        wx.getLocation({
            success: function (res) {
                var latitude = res.latitude
                var longitude = res.longitude
                var speed = res.speed
                var accuracy = res.accuracy
                myLocation.reverseGeocoder({
                    location: {
                        latitude: res.latitude,
                        longitude: res.longitude
                    },
                    success: function (res) {
                        console.log(res)
                        that.address = res.result
                    },
                    fail: function (res) {
                        console.log(res);
                    },
                    complete: function (res) {
                        console.log(res);
                    }
                });
            }
        });
    },
    weChatUserInfo: {
        userInfo: null,
    },
    tabBar: [
        {
            pagePath: "/pages/index/index",
            text: "首页",
            iconPath: "home",
            selectedIconPath: "home-s",
            active: true
        },
        {
            pagePath: "/pages/coupons/coupons",
            text: "优惠券",
            iconPath: "coup",
            selectedIconPath: "coup-s",
            active: false
        },
        {
            link: 'viewCard',
            text: "会员卡",
            iconPath: "user",
            selectedIconPath: "user-s",
            active: false
        }
    ],
    setTab: function () {
        let that = this
        let _curPage = that.currPage()
        var _pagePath = _curPage.__route__
        if (_pagePath.indexOf('/') != 0) {
            _pagePath = '/' + _pagePath
        }
        let tabBar = this.tabBar
        for (var i = 0; i < tabBar.length; i++) {
            tabBar[i].active = false
            if (tabBar[i].pagePath == _pagePath) {
                tabBar[i].active = true
            }
        }
        //适配iPhone X
        wx.getSystemInfo({
            success: function (res) {
                that.globalData.isPX = (res.model.indexOf("iPhone X") != -1) ? true : false
            }
        })
        _curPage.setData({
            tabBar: tabBar,
            isPX: that.globalData.isPX
        });
    },
    currPage: function () {
        let _curPageArr = getCurrentPages()
        return _curPageArr[_curPageArr.length - 1]
    },
    getData: function (url, key, parmas) {
        var that = this;
        return new Promise(function (resolve, reject) {
            wx.getStorage({
                key: key,
                success: function (res) {
                    resolve(res.data);
                },
                fail: function () {
                    wx.request({
                        url: that.api.host + url + '.htm',
                        data: {
                            json: parmas,
                        },
                        success: function (res) {
                            wx.setStorage({
                                key: key,
                                data: res.data
                            });
                            resolve(res.data);
                        }
                    });
                }
            })
        })
    },
    jsData: function (url, parmas) {
        let that = this
        return new Promise(function (data) {
            wx.request({
                url: that.api.host + url + '.htm?json=' + JSON.stringify(parmas),
                method: 'POST',
                success: function (res) {
                    data(res.data)
                }
            });
        })
    },
    request: function (url, parmas, rtype) {
        let that = this
        return new Promise(function (resolve, reject) {
            wx.request({
                url: that.api.host + url + '.htm',
                data: parmas,
                method: rtype || 'GET',
                success: function (res) {
                    resolve(res);
                }
            })
        })
    },
    globalData: {
        userInfo: null,
        color: '#1CC16F',
    },
    onHide: function () {
        let that = this
        that.setData(function () {
            regStat: false
        })
    },
    viewCard: function () {
        let that = this
        wx.getStorage({
            key: 'memberCardInfo',
            success: function (memberData) {
                const data = memberData.data
                if (data.returnCode === 'F') {
                    //获取会员卡模板信息
                    that.jsData('memberCardTemplate', { merchantId: that.api.parmas.merchantId })
                        .then(function (memberCard) {
                            console.log(memberCard)
                            let cardData = memberCard.wechatExtraData || {}
                            wx.showLoading({
                                title: 'waiting',
                            })
                            cardData.outer_str = 'unionid_' + that.api.parmas.unionId
                            console.log(cardData)
                            //跳转到微信开卡组件
                            wx.navigateToMiniProgram({
                                appId: "wxeb490c6f9b154ef9",
                                extraData: cardData,
                                success: function (res) {
                                    console.log(res)

                                },
                                fail: function (error) {
                                    console.log(error)
                                }
                            })
                        })
                } else {
                    //打开会员卡组件参数
                    let openCard = {
                        cardId: data.wechatCardTempId,
                        code: data.wechatOriginalCardNo
                    }
                    //打开会员卡组件
                    wx.openCard({
                        cardList: [
                            openCard
                        ],
                        success: function (res) {
                            console.log(res)
                        },
                        fail: function (err) {
                            console.log(err)
                        }
                    })
                }
            },
        })
    }
});