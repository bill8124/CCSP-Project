var mongoose = require('mongoose');
var DriverRecord = mongoose.model('DriverRecord');
var UserInfo = mongoose.model('UserInfo');
var Img = mongoose.model('Img');
var fs = require("fs");

// GET '/userRecords'
exports.listUserRecords = function(req, res){
    if (!req.user){
        return res.render('notlogin', {title: '我的檢舉記錄', messages: ['尚未登入']});
    }
    DriverRecord.find({user_id: req.user.id}, function(err, userRecords){
        if (err){
            console.error(err);
            return res.render('messages', {title: '我的檢舉記錄', messages: [err]});
        }
        res.render('userRecords', {title: '我的檢舉記錄', userRecords: userRecords});
    });
};

// GET '/driverRecords'
exports.list = function(req, res){
    DriverRecord.find({}, function(err, driverRecords){
        if (err){
            console.error(err);
            return res.render('messages', {title: '檢舉資料庫', messages: [err]});
        }
        res.render('driverRecords', {title: '檢舉資料庫', driverRecords: driverRecords});
    });
};

// POST '/driverRecords'
exports.create = function(req, res){
    if (!req.user){
        return res.render('notlogin', {title: '新檢舉案件', messages: ['尚未登入']});
    }
    var reportInfo = req.body;

    // get UserInfo
    UserInfo.find({id: req.user.id}, function(err, userInfo, count){
        if (err){
            console.error(err);
            return res.render('messages', {title: '新檢舉案件', messages: [err]});
        }
        if (count === 0){
            console.error(err);
            return res.render('messages', {title: '新檢舉案件', messages: ['請先填寫個人檔案']});
        }
        userInfo = userInfo[0];
        console.log(userInfo);

        // Fill User Data
        var newRecord = {
            user_id: userInfo.id,
        user_name: userInfo.name,
        user_email: userInfo.email,
        user_phone: userInfo.phone,
        user_address: userInfo.address
        };

        // Fill Driver Data
        newRecord.country = reportInfo.country;
        newRecord.location = reportInfo.location;
        newRecord.carNum = reportInfo.carNum;
        newRecord.happenedDate = reportInfo.date;
        newRecord.happenedTime = reportInfo.time;
        newRecord.description = reportInfo.condition;
        if (reportInfo.url)
            newRecord.url = reportInfo.url;

        var newDriverRecord = new DriverRecord(newRecord);
        newDriverRecord.save(function(err, newDriverRecord){
            if (err){
                console.error(err);
                return res.render('messages', {title: '新檢舉案件', messages: [err]});
            }
            req.session.recordid = newDriverRecord._id;
            res.redirect("/imgupload");
            //res.redirect('/driverRecords/' + newDriverRecord._id);
        });
    });
};

// GET '/driverRecords/:id'
exports.show = function(req, res){
    console.log(req.params.id);
    DriverRecord.findById(req.params.id, function(err, driverRecord){
        if (err){
            console.error(err);
            return res.render('messages', {title: '檢舉檔案', messages: [err, '（無此記錄？）']});
        }
        
        id = driverRecord.imgid;
        parts = driverRecord.imgpart;

        var imgdata = "";
        Img.find({id: id},function(err, imgs){
            
            for(var i = 0; i <= parts; i++)
            {
                for(var j = 0; j < parts; j++)
                {
                    if(imgs[j].part === i)
                    {
                        imgdata = imgdata + imgs[j].data;
                    }
                }
                if(i === parts)
                {
                    console.log(imgdata.length);
                    console.log(driverRecord);
                    if (!req.user || driverRecord.user_id !== req.user.id){
                        console.log(driverRecord);
                        return res.render('publicReportView', {title: '檢舉檔案', reportInfo: driverRecord, image: imgdata});
                    } else {
                        return res.render('reportView', {title: '檢舉檔案', reportInfo: driverRecord, image: imgdata});
                    }
                    //res.render('imgshow', {img: imgdata, title:'顯示上傳圖檔'});         
                }
            }
        });
        //return res.render('reportView', {title: '檢舉檔案', reportInfo: driverRecord});
    });
};

// POST '/driverRecords/:id'
exports.update = function(req, res){
    DriverRecord.findById(req.params.id, function(err, driverRecord){
        if (err){
            console.error(err);
            return res.render('messages', {title: '檢舉進度修改', messages: [err + '<br>（不存在此筆記錄？）']});
        }
        if (driverRecord.user_id !== req.user.id){
            return res.render('messages', {title: '檢舉進度修改', messages: ['權限不符。這是你的檢舉記錄嗎？']});
        }
        console.log(driverRecord);

        driverRecord.status = req.body.status;
        driverRecord.updated = Date.now();
        console.log(driverRecord)
        driverRecord.save(function(err, updatedDriverRecord){
            if (err){
                console.error(err);
                return res.render('messages', {title: '檢舉進度修改', messages: [err]});
            }
            res.redirect('/driverRecords/' + updatedDriverRecord._id);
        });
    });    
};

exports.imgaccept = function(req, res){
    var imgInfo = req.body;
    nowpart = parseInt(req.params.part);
    req.session.imgid = imgInfo.id;
    req.session.imgparts = parseInt(imgInfo.max)+1;

    var newImg = new Img({id: imgInfo.id, part: nowpart, data: imgInfo.data});
    newImg.save(function(err, nowimg){
        if (err){
            console.error(err);
            return;
        }
        res.end("get");
    });
};

exports.imgsend = function(req, res){

    DriverRecord.update({_id: req.session.recordid}, {imgid: req.session.imgid, imgpart: req.session.imgparts},function(err,newDriverRecord){
        res.redirect('/driverRecords/' + req.session.recordid);
        delete req.session.imgparts, req.session.recordid, req.session.imgparts;
        console.log(newDriverRecord); 
    });

};

function imgshow(id, parts){
    var imgdata = "";
    console.log(parts);
    console.log(id);

    Img.find({id: id},function(err, imgs){
        
        for(var i = 0; i <= parts; i++)
        {
            for(var j = 0; j < parts; j++)
            {
                if(imgs[j].part === i)
                {
                    imgdata = imgdata + imgs[j].data;
                }
            }
            if(i === parts)
            {
                console.log(imgdata.length);
                return imgdata;
                //res.render('imgshow', {img: imgdata, title:'顯示上傳圖檔'});         
            }
        }
    });

}
