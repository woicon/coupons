function formatTime(time) {

    var time = time.replace(/-/g, ':').replace(' ', ':')
    var time = time.split(':')
    var date = new Date(time[0], (time[1] - 1), time[2], time[3], time[4], time[5])

    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()
    var hour = date.getHours()
    var minute = date.getMinutes()
    var second = date.getSeconds()
    //return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
    return [year, month, day].map(formatNumber).join('-')
}
function formatNumber(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
}
module.exports = {
    formatTime: formatTime
}
