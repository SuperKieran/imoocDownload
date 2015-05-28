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
            var ulList = $('#main .search-course ul li.course');
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
        .end(function(err, sres) {
            if (err) {
                return next(err);
            }
            var $ = cheerio.load(sres.text);
            var videoList = $('#main .course_chapter_list ul.video li a');

            var ep = new eventproxy();
            var items = [];
            ep.after('got_video', videoList.length, function(list) {
                list.forEach(function(listItem) {
                    items.push({
                        title: listItem[0],
                        href: listItem[1]
                    });
                })

                res.send(items);
            });

            videoList.each(function(idx, videoItem) {
                videoUrl = "http://www.imooc.com/course/ajaxmediainfo/?mid=" + $(videoItem).attr('href').replace(/[^0-9]/ig, "");
                superagent.get(videoUrl)
                    .end(function(err, res) {
                        ep.emit('got_video', [$(videoItem).text(), JSON.parse(res.text).data.result.mpath[0]]);
                    })
            })

        });
});

module.exports = router;
