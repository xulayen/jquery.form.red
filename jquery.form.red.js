/**
 * Created by Administrator on 2015/4/2.
 * 时间：2012-6-6
 作用：一对form标签下有多个（包括一个）表单需要提交时，提交当前作用域中的表单项做出相应的验证
 处理问题：一个aspx页面下只能有一个form表单（加了runat='server'）
 约定：当前body元素下可以有多个form表单：凡是class='form'的元素都视为一个表单元素，此“表单”元素下有相应的表单项
 其中包含一个含有class='check'的按钮，当点击此按钮的时候会首先验证表单项中含有class='notnull'的表单项，其次验证表单项中含有regex='/^$/'的
 表单项，如果验证失败，会抛出相应的有好提示nullmsg='不能为空' 或 logicmsg='只能是数字'。
 每个表单项验证成功之后class='check'的按钮会触发一个名为 $.GlobalCallBack.submitCallback的回调函数。继而完成和后端的交互。

 用法：
 calss='notnull' 元素不能为空、勾选（复选框）
 class='select' 必选（下拉框）
 class='nullmsg'  验证失败之后的友好提示
 regex='/^$/' 当前需要验证的正则
 logicmsg='邮箱格式错误' 当前正则验证失败之后的友好提示
 配置了指定的errorElement（错误提示元素），就会在页面上给出友好提示

 Global.submitCallback button回调函数
 Global.confirmCallback confirm回调函数;
 需要改进的地方：
 无
 作者：layen.Xu
 */
;
(function ($) {
    $.GlobalCallBack = {
        //用于.check按钮的回调
        submitCallback: null,
        //用于.confirm按钮的回调
        confirmCallback: null
    };
    $.fn.Action = function (options) {
        var defaults = {
            body: 'body',
            formElement: '.form',
            errorElement: null
        }
        var opts = $.extend({}, defaults, options);
        var operating = {
            ///e:当前事件参数 form：当前“表单” _Enter:是否点击了回车键
            main: function (e, form, _Enter) {
                var button = null;
                var action = this;
                try {
                    button = e.srcElement == null ? document.activeElement : e.srcElement;
                } catch (e) {
                    console.log(e.message)
                    button = document.activeElement;
                }
                if ($(button).is(".check") || _Enter) {
                    //alert("提交")
                    var sub = (action.checkform(form) && action.CheckInputRex(form) && action.checkselect(form) && action.checkChecked(form));
                    if (sub) {
                        // Call our callback, but using our own instance as the context
                        //GlobalCallBack.submitCallback.call(form, [e]);
                        $.GlobalCallBack.submitCallback.call(form, e);
                    } else
                        return sub;
                } else if ($(button).is(".confirm")) {
                    //alert("删除")
                    var sub = confirm($(button).attr("title"));
                    if (sub) {
                        //GlobalCallBack.confirmCallback.call(form, [e]);
                        $.GlobalCallBack.confirmCallback.call(form, e);
                    } else
                        return sub;
                } else {
                    //                    //alert("其它")
                    return true;
                }
            },
            ///检测表单为空项 form当前表单
            checkform: function (form) {
                var b = true;
                var action = this;
                $(form).find(".notnull").each(function () {
                    if ($.trim($(this).val()).length <= 0 || $.trim($(this).val()) == $.trim($(this).attr("placeholder"))) {//|| $(this).val() == this.defaultValue
                        return b = action.tip(this, 'nullmsg');
                    }
                });
                if (b == true) {
                    $(form).find(opts.errorElement).text("");
                    $(form).find(opts.errorElement).hide();
                }
                return b;
            },
            //检测表单中必选的下拉列表 form当前表单
            checkselect: function (form) {
                var b = true;
                var action = this;
                $(form).find(".select").each(function (i) {
                    var ck = $(this).find('option:selected').text();
                    if (ck.indexOf("选择") > -1) {
                        return b = action.tip(this, 'nullmsg');
                    }
                });
                if (b == true) {
                    $(form).find(opts.errorElement).text("");
                    $(form).find(opts.errorElement).hide();
                }
                return b;
            },
            //检测表单中必选的复选框 form当前表单
            checkChecked: function (form) {
                var b = true;
                var action = this;
                $(form).find(".checkboxReq").each(function (i) {
                    var ck = $(this)[0].checked;
                    if (!ck) {
                        return b = action.tip(this, 'nullmsg');
                    }
                });
                if (b == true) {
                    $(form).find(opts.errorElement).text("");
                    $(form).find(opts.errorElement).hide();
                }
                return b;
            },
            //检查是否匹配该正则表达式 value：输入的值 reg：正则 ele：当前项
            GetFlase: function (value, reg, ele) {
                var action = this;
                if (reg.test(value)) {
                    return true;
                }
                return action.tip(ele, 'logicmsg');
            },
            //检查正则 form当前表单
            CheckInputRex: function (form) {
                var action = this;
                var b = true;
                $(form).find("input[type='text']").each(function () {
                    console.log($(this).attr("regex"))
                    if (typeof ($(this).attr("regex")) == 'string') {
                        if ($.trim($(this).val()).length > 0 && $.trim($(this).val()) != $.trim($(this).attr("placeholder"))) {
                            //当前表单的值
                            var value = $(this).attr("value") || $(this).val();
                            var regx = eval($(this).attr("regex"));
                            return b = action.GetFlase(value, regx, this);
                        }
                    }
                });
                return b;
            },
            //提示
            tip: function (ele, attr) {
                if (opts.errorElement) {
                    $(ele).parents(opts.formElement).find(".error").text($(ele).attr(attr));
                    $(ele).parents(opts.formElement).find(".error").show();
                } else {
                    alert($(ele).attr(attr));
                }
                $(ele).select();
                $(ele).focus();
                return false;
            }
        };
        return $(opts.body).find(opts.formElement).each(function () {
            var form = this;
            this.onclick = function (e) {
                return operating.main(e, form);
            }
            if ($(opts.formElement).length == 1) {
                document.onkeydown = function (eve) {
                    var e = eve || window.event || arguments.callee.caller.arguments[0];
                    if (e && e.keyCode == 13) {
                        return operating.main(e, form, true);
                    }
                }
            }

        });
    }
}(jQuery));
