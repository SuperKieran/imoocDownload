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
        .set('Cookie', 'PSTM=1444951074; BIDUPSID=8FA7E6806D1D12692ED2814C59E2C034; SIGNIN_UC=70a2711cf1d3d9b1a82d2f87d633bd8a01955973477; Hm_lvt_48aa793efee45092e5be8355226433d7=1446004018; Hm_lpvt_48aa793efee45092e5be8355226433d7=1446004018; H_WISE_SIDS=100040; BAIDUID=7BD93600157DF82A51868304E3FABEC0:FG=1; BDUSS=JkZDluMmNvY21GaFB2NnhoMDAxQzIzUW13dG1tUjZVdHhlRnItLTZvakJ5VzVXQVFBQUFBJCQAAAAAAAAAAAEAAABO9pkiaW1L1tjD-8HLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAME8R1bBPEdWeW; H_PS_PSSID=11194_1423_17758_17619_13290_17900_17946_17783_17927_17970_17001_17072_15507_12124_16096_17421')
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
