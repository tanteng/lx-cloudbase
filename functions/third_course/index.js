const cloudBase = require('@cloudbase/node-sdk');

const app = cloudBase.init({
    env: process.env.ENV_ID
});
const auth = app.auth();
const db = app.database();
let user;

exports.main = async(event, context) => {
    const { userInfo } = await auth.getEndUserInfo();
    user = await db.collection("users").doc(userInfo.customUserId).get().then(function(res) {
        return res.data[0];
    });
    let func = eval(event.method)
    return func(event.attributes);
}

async function store(attributes) {
    const file_id = attributes.file_id;
    const created_at = new Date().format("yyyy-MM-dd hh:mm:ss");
    const course = await db.collection("courses").add({
        "company_id": user.company_id,
        "staff_id": user.staff_id,
        "file_id": file_id,
        "title": attributes.title,
        "content": attributes.content,
        "lx_category_id": attributes.category_id,
        "lx_category_name": attributes.category_name,
        "created_at": created_at,
        "updated_at": created_at
    });

    let lx_course = await app.callFunction({
        name: "lx_post_course",
        data: {
            "company_id": user.company_id,
            "staff_id": user.staff_id,
            "attributes": {
                "title": attributes.title,
                "content": attributes.content,
                "category_id": attributes.category_id,
                "video_link": process.env.PAGE_URL + "/courses/" + course.id + "?company_id=" + user.company_id
            }
        }
    }).then(function(response) {
        return response.result;
    });

    await db.collection("courses").doc(course.id ).update({
        "lx_id": lx_course.data.id
    });

    return {
        id: course.id
    };
}

async function show(attributes) {
    const id = attributes.id;
    return await db.collection("courses").where({
        "_id": id,
        "company_id": user.company_id
    }).get().then(function(res) {
        return res.data[0];
    });
}

async function index(attributes) {
    return await db.collection("courses").where({
        "company_id": user.company_id
    }).get().then(function(res) {
        return res.data;
    });
}

async function get_link(attributes) {
    const id = attributes.id;
    let course = await db.collection("courses").where({
        "_id": id,
        "company_id": user.company_id
    }).get().then(function(res) {
        return res.data[0];
    });
    if (course) {
        return await app.getTempFileURL({
            fileList: [course.file_id]
        })
        .then((res) => {
            // fileList 是一个有如下结构的对象数组
            // [{
            //    fileID: 'cloud://webtestjimmy-5328c3.7765-webtestjimmy-5328c3-1251059088/腾讯云.png', // 文件 ID
            //    tempFileURL: '', // 临时文件网络链接
            //    maxAge: 120 * 60 * 1000, // 有效期
            // }]
            console.log(res.fileList);
            return res.fileList[0].tempFileURL;
        });
    }
}

Date.prototype.format = function(fmt) {
    var o = {
        "M+" : this.getMonth()+1,                //月份
        "d+" : this.getDate(),                    //日
        "h+" : this.getHours(),                  //小时
        "m+" : this.getMinutes(),                //分
        "s+" : this.getSeconds(),                //秒
        "q+" : Math.floor((this.getMonth()+3)/3), //季度
        "S"  : this.getMilliseconds()            //毫秒
    };
    if(/(y+)/.test(fmt)) {
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    }
    for(var k in o) {
        if(new RegExp("("+ k +")").test(fmt)){
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        }
    }
    return fmt;
}