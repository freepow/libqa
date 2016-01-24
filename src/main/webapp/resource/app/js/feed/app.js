var Feed = {
    'init' : function() {
        this.bindSave();
        this.bindFileAttachment();
        this.initFileUploadModal();
        this.loadList();
    },
    'loadList' : function() {
        this._callList("/feed/list", function(html, itemSize) {
            $('#feedList').html(html);
            FeedPager.init(itemSize);
        });
    },
    'moreList' : function() {
        this._callList("/feed/list?lastFeedId=" + this.getLastFeedId(), function(html, itemSize) {
            $('#feedList').append(html);
            FeedPager.loaded(itemSize);
        });
    },
    '_callList' : function(url, resultHandleCallback) {
        $.get(url, function (response) {
            if(response.resultCode != 1) {
                alert(response.comment);
                return;
            }
            var source = $('#feed-list-hbs').html();
            var template = Handlebars.compile(source);
            var html = template(response);
            resultHandleCallback(html, response.data.length);
        });
    },
    'getId': function($target) {
        return $target.closest('.thread').data('feedId');
    },
    'bindSave' : function() {
        var me = this;
        var $frm = $('#feedForm');
        $('#feedSave').click(function(){
            if(!me.checkValidate($frm)) {
                return;
            }
            $.post('/feed/save', $frm.serialize())
                    .done(function(response){
                        if(response.resultCode != 1) {
                            alert(response.comment);
                            return;
                        }

                        me.loadList();
                        me.clearForm();
                        FeedFile.clear();
                    }).fail(function(){
                alert('Error saving feed');
            });
        });
    },
    'clearForm' : function() {
        $('#feedForm').find('textarea').val('');
    },
    'checkValidate' : function($frm) {
        if (!$frm.find('textarea[name=feedContent]').val().trim().length) {
            alert('feed를 입력해주세요!');
            return false;
        }
        return true;
    },
    "bindFileAttachment": function () {
        $('#uploadfile').change(function(){
            $('#fileAttachmentInput').val($('#uploadfile').val());

            var $feedFileForm = $("#feedFileForm");
            $.ajax({
                url: "/common/uploadFile",
                type: "POST",
                data: new FormData($feedFileForm[0]),
                enctype: 'multipart/form-data',
                processData: false,
                contentType: false,
                cache: false,
                success: function (req) {
                    FeedFile.add(req.data);
                    $('#fileUploadModal').modal('hide');
                },
                error: function () {
                    alert('업로드 중 에러가 발생했습니다. 파일 용량이 허용범위를 초과 했거나 올바르지 않은 파일 입니다.');
                }
            });
        });
    },
    'initFileUploadModal': function() {
        $('#fileUploadModal').on('show.bs.modal', function () {
            $('#fileAttachmentInput').val('');
        });
    },
    'getFeedIdByPopOver': function(el) {
        var popoverId = $(el).closest('.popover').attr('id');
        var $popOverBody =  $('.thread .config').find('[aria-describedby='+ popoverId +']');
        return this.getId($popOverBody);
    },
    'getFeedBodyByFeedId': function(feedId) {
        return $('#feedList li.thread[data-feed-id="' + feedId + '"]');
    },
    'removeItem': function(el, redirectUrl) {
        if (!confirm("FEED를 삭제하시겠습니까?")) {
            return;
        }
        var me = this;
        var feedId =  me.getFeedIdByPopOver(el);
        var $feedBody = me.getFeedBodyByFeedId(feedId);
        $.post('/feed/' + feedId + '/delete')
                .done(function (response) {
                    if (response.resultCode != 1) {
                        alert(response.comment);
                        return;
                    }
                    FeedUtil.hidePopOver();
                    $feedBody.remove();

                    if(redirectUrl) {
                        location.href = redirectUrl;
                    }
                }).fail(function () {
            alert('Error delete feed');
        });
    },
    'modifyItem' : function(el) {
        var me = this;
        var feedId =  me.getFeedIdByPopOver(el);
        var $feedBody = me.getFeedBodyByFeedId(feedId);
        var $feedContents = $feedBody.find('.feed-contents-box');
        var $modify = $feedBody.find('.feed-modify');
        var $frm = $modify.find('.feed-modify-form');

        $modify.find('.modifyBtn').off('click').on('click', function () {
            if(!me.checkValidate($frm)) {
                return;
            }
            $.post('/feed/modify', $frm.serialize())
                    .done(function (response) {
                        if (response.resultCode != 1) {
                            alert(response.comment);
                            return;
                        }
                        $modify.hide();
                        var contents = response.data.feedContent.replace(/(\r\n|\n|\r)/gm, '<br>');
                        $feedContents.html(contents).show();
                    }).fail(function () {
                alert('Error modify feed');
            });
        }).end().find('.cancelBtn').off('click').on('click', function () {
            $modify.hide();
            $feedContents.show();
        });

        $modify.show();
        $feedContents.hide();
        FeedUtil.hidePopOver();
    },
    'like': function(el) {
        $.post('/feed/' + this.getId($(el)) + '/like')
                .done(function (response) {
                    if (response.resultCode != 1) {
                        alert(response.comment);
                        return;
                    }
                    FeedUtil.toggleCount($(el), response.data.count, response.data.hasViewer);
                }).fail(function () {
            alert('Error like feed');
        });
    },
    'claim': function(el) {
        $.post('/feed/' + this.getId($(el)) + '/claim')
                .done(function (response) {
                    if (response.resultCode != 1) {
                        alert(response.comment);
                        return;
                    }
                    FeedUtil.toggleCount($(el), response.data.count, response.data.hasViewer);
                }).fail(function () {
            alert('Error claim feed');
        });
    },
    'getLastFeedId': function() {
        return $('#feedList li.thread').last().data('feedId');
    }
};

var FeedFile = {
    'add': function(fileObj) {
        this.addPreviewToForm(fileObj);
        this.addHiddenInputToForm(fileObj);
    },
    'clear': function(){
        this.removePreviewInForm();
        this.removeHiddenTagsInForm();
    },
    'addPreviewToForm': function (obj) {
        var fullPath = obj.filePath + '/' + obj.savedName;

        if(obj.fileType == 'FILE') {
            var $file = ' <a href="' + fullPath + '" target="_blank"><i class="fa fa-file-o"></i> ' + obj.realName + '</a>';
            $('#feedForm .attachmentArea .files').append($file);
        } else {
            var $image = ' <img width="190" class="img-thumbnail" src="' + fullPath + '">';
            $('#feedForm .attachmentArea .images').append($image);
        }
    },
    'addHiddenInputToForm': function (obj) {
        var idx = $('#feedForm input[name$=fileType]').size();
        var $input = $('<input />').attr('type', 'hidden');

        $('#feedForm').append($input.clone().attr('name', "feedFiles["+ idx + "].realName").val(obj.realName))
                .append($input.clone().attr('name', "feedFiles["+ idx + "].savedName").val(obj.savedName))
                .append($input.clone().attr('name', "feedFiles["+ idx + "].filePath").val(obj.filePath))
                .append($input.clone().attr('name', "feedFiles["+ idx + "].fileSize").val(obj.fileSize))
                .append($input.clone().attr('name', "feedFiles["+ idx + "].fileType").val(obj.fileType));
    },
    'removePreviewInForm': function() {
        $('#feedForm .attachmentArea .files').empty();
        $('#feedForm .attachmentArea .images').empty();
        $('#feedForm input[name^=feedFiles]').remove();
    },
    'removeHiddenTagsInForm': function() {
        $('#feedForm input[name^=feedFiles]').remove();
    }
};

var FeedReply = {
    'init' : function(){
        this.bindSave();
    },
    'getId' : function($target){
        return $target.closest('.reply-thread').data('feedReplyId');
    },
    'bindSave' : function() {
        var me = this;
        $('button[name=saveReply]').on('click',function () {
            var $frm = $(this).closest('form');
            var $replies = $(this).closest('.thread').find('.feed-replies');

            if(!me.checkValidate($frm)) {
                return;
            }
            $.post('/feed/reply/save', $frm.serialize())
                    .done(function (response) {
                        if (response.resultCode != 1) {
                            alert(response.comment);
                            return;
                        }

                        me.clearForm($frm);
                        me.loadItem($replies, response.data);
                    }).fail(function () {
                alert('Error saving feed Reply');
            });
        });
    },
    'loadItem': function($target, data){
        var source = $('#feed-reply-hbs').html();
        var template = Handlebars.compile(source);
        var html = template(data);
        $target.append(html);
    },
    'checkValidate': function($frm) {
        if (!$frm.find('input[name=feedReplyContent]').val().trim().length) {
            alert('댓글을 입력해주세요!');
            return false;
        }
        return true;
    },
    'clearForm': function($frm) {
        $frm.find('input[name=feedReplyContent]').val('');
    },
    'removeItem' : function(el) {
        if (!confirm("댓글을 삭제하시겠습니까?")) {
            return;
        }

        var feedReplyId = this.getId($(el));
        var $target = $(el).closest('.reply-thread');
        $.post('/feed/reply/' + feedReplyId + '/delete')
                .done(function (response) {
                    if (response.resultCode != 1) {
                        alert(response.comment);
                        return;
                    }
                    $target.remove();
                }).fail(function () {
            alert('Error delete feed Reply');
        });
    },
    'like' : function(el) {
        $.post('/feed/reply/' + this.getId($(el)) + '/like')
                .done(function (response) {
                    if (response.resultCode != 1) {
                        alert(response.comment);
                        return;
                    }
                    FeedUtil.toggleCount($(el), response.data.count, response.data.hasViewer);
                }).fail(function () {
            alert('Error like feed');
        });
    },
    'claim' : function(el) {
        $.post('/feed/reply/' + this.getId($(el)) + '/claim')
                .done(function (response) {
                    if (response.resultCode != 1) {
                        alert(response.comment);
                        return;
                    }
                    FeedUtil.toggleCount($(el), response.data.count, response.data.hasViewer);
                }).fail(function () {
            alert('Error claim feed');
        });
    }
};

var FeedUtil = {
    'bindPopOver': function() {
        $('.popover-config').popover({
            trigger: 'click',
            html: true,
            content: function () {
                return $('#popover-config-content').html();
            }
        });
    },
    'hidePopOver' : function() {
        $('.popover-config').popover('hide');
    },
    'toggleCount': function(el, count, hasViewer) {
        el.find('span').html('('+count+')');
        if(hasViewer) {
            el.addClass('hasViewer');
        }  else {
            el.removeClass('hasViewer');
        }
    }
};

var FeedPager = {
    '$button': $('#feedMoreBtn'),
    'lastFeedId': null,
    'PAGE_SIZE': 5,
    'init': function(itemSize) {
        if(itemSize > 0) {
            this.showBtn();
            this.bindLoading();
        } else {
            this.hideBtn();
        }
    },
    'showBtn' : function() {
        this.$button.show();
    },
    'hideBtn' : function() {
        this.$button.hide();
    },
    'toggleLoadingText': function(loading) {
        if(loading) {
            this.$button.prop('disabled', true).html('로딩 중...');
        } else {
            this.$button.prop('disabled', false).html('more');
        }
    },
    'bindLoading': function() {
        var me = this;
        this.$button.on('click', function(){
            me.toggleLoadingText(true);
            Feed.moreList();
        });
    },
    'loaded': function(itemSize) {
        this.toggleLoadingText(false);
        if(itemSize < this.PAGE_SIZE) {
            this.hideBtn();
        }
    }
};