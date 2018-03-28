const API_HOST = "http://wxcs.liantuo.com/api/apiJsConfig.do"
function getData(url, parmas) {
    return new Promise((data) => {
        wx.request({
            url: "https://opentest.liantuobank.com/api/" + url + '.htm?json=' + JSON.stringify(parmas),
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
}
function request(url, parmas, rtype) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: "https://opentest.liantuobank.com/api/" + url+'.htm',
            data: parmas,
            method: rtype || 'GET',
            success: function (res) {
                resolve(res)
            },
            fail:function(error){
                console.log(error)
            }
        })
    })
}
let links = {}
let Api = {}
//获取用户Session
links.WECHAT_APP_SESSION = "wechatAppSession"
//获取用户信息
links.WECHAT_APP_USER_INFO = "wechatAppUserInfo"
//获取优惠券分类列表
links.WECHAT_APP_COUPON_CATEGORY = "wechatAppCouponCategory"
//获取会员卡模板
links.MEMBER_CARD_TEMPLATE = "memberCardTemplate"
//领取优惠券
links.MEMBER_CARD_INFO = "memberCardInfo"
//获取用户优惠券列表
links.COUPON_LIST = "couponList"
//领取优惠券
links.COUPON_GET = "couponGet"
//领取优惠券
links.COUPON_DETAIL = "couponDetail"

for( let i in links){
    Api[links[i]] = function (parmas){
        return request(links[i], parmas)
    }
}
console.log(Api)
module.exports = {
    Get:function(){
        console.log("sss")
    },
    wechatAppSession:function(parmas,callback) {
        return request(WECHAT_APP_SESSION,parmas)
    }
}