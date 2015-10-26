var express = require('express');
var cheerio = require('cheerio');
var eventproxy = require('eventproxy');
var superagent = require('superagent');
var url = require('url');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index');
});

router.post('/search', function(req, res, next){
    superagent.get('http://www.imooc.com/index/search?words='+req.body.keyword)
        .end(function(err, sres) {
            if (err) {
                return next(err);
            }

            var $ = cheerio.load(sres.text);
            var ulList = $('#main .search-main ul li.course-item');
            var courseItem = '';

            for(var i=0;i<$(ulList).length;i++){
                courseItem += '<li class="course"><h2 class="title autowrap">'
                    + $(ulList).eq(i).find('h2.title a').text().trim()
                    + '<button class="btn btn-warning btn-xs" onclick="sendCourse($(this).val())" value="'
                    + $(ulList).eq(i).find('h2.title a').attr('href').replace(/[^0-9]/ig, "")
                    + '">\u751f\u6210\u4e0b\u8f7d\u94fe\u63a5</button></h2><div class="content"><div class="thumbnail"><img src="'
                    + $(ulList).eq(i).find('.thumbnail img').attr('src')
                    + '"></div><div class="introduction">'
                    + $('.introduction').eq(i).html()
                    + '</div></div></li>';
            }
            res.send(courseItem);
        });
});

router.post('/video', function(req, res, next) {

    superagent.get('http://www.imooc.com/learn/' + req.body.lessionId)
        .set('Cookie', '"imooc_uuid=9c93963d-36d9-4a71-b85a-fa43129d05d6; Hm_lvt_f0cfcccd7b1393990c78efdeebff3968=1442505108,1442505223; loginstate=1; apsid=JhYzNiNGU4M2ZjYTQ4NGZlMzM0MzM0ZDI3MDJkYWIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjM2NTMwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB0b29vbGJveUAxNjMuY29tAAAAAAAAAAAAAAAAAAAAADJhNWYyNGNiNWY3NmRhYjY3MTIyM2YwODI2ZDE3ZDc09uD6Vfbg%2BlU%3DZj; last_login_username=tooolboy%40163.com; cvde=55fae201600fb-6; Hm_lpvt_f0cfcccd7b1393990c78efdeebff3968=1442505266; PHPSESSID=cl4ltr2o97jc8k3gd0gl3hqi17"')
        .end(function(err, sres) {
            if (err) {
                return next(err);
            }
            var $ = cheerio.load(sres.text);

            var videoList = $('.video a');
            var temp = [];
            console.log(videoList.length);
            for (var i = 0; i < videoList.length; i++) {
                if($(videoList[i]).attr('href').substring(0, 6) === '/video') {
                    temp.push(videoList[i]);
                }
            }

            var ep = new eventproxy();
            var items = [];
            ep.after('got_video', temp.length, function(list) {
                list.forEach(function(listItem) {
                    items.push({
                        title: listItem[0],
                        href: listItem[1]
                    });
                })

                res.send(items);
            });

            temp.forEach(function(videoItem) {
                videoUrl = "http://www.imooc.com/course/ajaxmediainfo/?mid=" + $(videoItem).attr('href').replace(/[^0-9]/ig, "");
                superagent.get(videoUrl)
                    .end(function(err, res) {
                        ep.emit('got_video', [$(videoItem).text(), JSON.parse(res.text).data.result.mpath[0]]);
                    })
            })

        });
});

module.exports = router;
