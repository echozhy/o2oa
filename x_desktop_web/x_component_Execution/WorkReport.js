MWF.xApplication.Execution = MWF.xApplication.Execution || {};

MWF.xDesktop.requireApp("Template", "Explorer", null, false);
MWF.xDesktop.requireApp("Template", "MForm", null, false);
MWF.xDesktop.requireApp("Execution","Attachment",null,false);
MWF.xDesktop.requireApp("Execution","ReportAttachment",null,false);

MWF.xApplication.Execution.WorkReport = new Class({
    Extends: MWF.xApplication.Template.Explorer.PopupForm,
    Implements: [Options, Events],
    options: {
        "style": "default",
        "width": "100%",
        "height": "100%",
        "hasTop": true,
        "hasIcon": false,
        "hasBottom": true,
        "title": "",
        "draggable": false,
        "closeAction": true,
        "isNew": false,
        "isEdited": true
    },
    initialize: function (explorer, actions, data, options) {
        this.setOptions(options);
        this.explorer = explorer;
        this.app = explorer.app;
        this.lp = this.app.lp.WorkReport;
        this.actions = this.app.restActions;
        this.path = "/x_component_Execution/$WorkReport/";
        this.cssPath = this.path + this.options.style + "/css.wcss";
        this._loadCss();

        this.options.title = this.lp.title;

        this.data = data || {};

        this.actions = actions;
    },
    load: function () {
        if (this.options.isNew) {
            this.create();
        } else if (this.options.isEdited) {
            this.edit();
        } else {
            this.open();
        }
    },
    reload:function(data){

    },
    createTopNode: function () {
        if (!this.formTopNode) {
            this.formTopNode = new Element("div.formTopNode", {
                "styles": this.css.formTopNode
            }).inject(this.formNode);

            this.formTopIconNode = new Element("div", {
                "styles": this.css.formTopIconNode
            }).inject(this.formTopNode)

            this.formTopTextNode = new Element("div.formTopTextNode", {
                "styles": this.css.formTopTextNode,
                "text": this.lp.topTitle + ( this.data.title ? ("-" + this.data.title ) : "" )
            }).inject(this.formTopNode)

            if (this.options.closeAction) {
                this.formTopCloseActionNode = new Element("div", {"styles": this.css.formTopCloseActionNode}).inject(this.formTopNode);
                this.formTopCloseActionNode.addEvent("click", function () {
                    this.close()
                }.bind(this))
            }

            this.formTopContentNode = new Element("div", {
                "styles": this.css.formTopContentNode
            }).inject(this.formTopNode)

            this._createTopContent();

        }
    },

    _createTopContent: function () {

    },
    createContent: function () {
        this.formContentNode = new Element("div.formContentNode", {
            "styles": this.css.formContentNode
        }).inject(this.formNode);



        this.formTableContainer = new Element("div.formTableContainer", {
            "styles": this.css.formTableContainer
        }).inject(this.formContentNode);


        this.formTableArea = new Element("div.formTableArea", {
            "styles": this.css.formTableArea
        }).inject(this.formTableContainer);

        this.reportLinksDiv = new Element("div.reportLinksDiv",{
            "styles":this.css.reportLinksDiv,
            "text":this.lp.reportLinks
        }).inject(this.formTableArea)
            .addEvents({
                "click":function(){
                    this.createPrevReport();
                }.bind(this)
            })

        this.titleDiv = new Element("div.titleDiv",{
            "styles":this.css.titleDiv,
            "text":this.lp.topTitle + ( this.data.title ? ("-" + this.data.title ) : "" ),
            "title":this.lp.topTitle + ( this.data.title ? ("-" + this.data.title ) : "" )
        }).inject(this.formTableArea)


        this.centerWorkDiv = new Element("div.centerWorkDiv",{"styles":this.css.centerWorkDiv}).inject(this.formTableArea);
        this.centerWorkTitleDiv = new Element("div.centerWorkTitleDiv",{
            "styles":this.css.tabTitleDiv,
            "text":this.lp.title
        }).inject(this.centerWorkDiv);

        this.tableContentDiv = new Element("div.tableContentDiv").inject(this.formTableArea);



        if(this.options.workReportId){
            this.workReportId = this.options.workReportId;
        }

        this.workId = this.data.workId;
        this.processStatus = "";
        this.processIdentity = "";
        if(this.options.from && this.options.from == "drafter"){
            this.actions.workReportDrafter(this.data.workId, function( json ){
                if(json.type && json.type=="success"){
                    this.workReportData = json.data;
                    if(json.data.id){
                        this.workReportId = json.data.id;
                    }
                    if(json.data.currentProcessorIdentity){
                        this.processIdentity = json.data.currentProcessorIdentity
                    }
                    if(json.data.processStatus){
                        this.processStatus = json.data.processStatus
                    }
                }
            }.bind(this),null,false);
        }else{ //不是草稿的 直接获取this.data信息
            this.actions.getWorkReport(this.data.workReportId,function(json){ //alert(JSON.stringify(json))
                if(json.type=="success"){
                    this.workReportData = json.data;
                    if(json.data.id){
                        this.workReportId = json.data.id
                    }
                }
            }.bind(this),null,false)

            if(this.workReportData.currentProcessorIdentity){
                this.processIdentity = this.workReportData.currentProcessorIdentity
            }
            if(this.workReportData.processStatus){
                this.processStatus = this.workReportData.processStatus
            }
        }

        //alert("workreportData="+JSON.stringify(this.workReportData))
        //获取工作信息
        if(this.data.workId){
            this.actions.getTask(this.workId, function(json){
                if(json.data){
                    this.workData = json.data;
                }
            }.bind(this),null,false)
        }
        //alert("this.workReportId="+this.workReportId)
        //alert("this.workId="+this.workId)
        //获取具体工作详细信息
        if(this.data.workId){
            this.actions.getBaseWorkDetails(this.workId, function (json) {
                this.workData.workSplitAndDescription = json.data.workDetail
                this.workData.specificActionInitiatives = json.data.progressAction
                this.workData.cityCompanyDuty = json.data.dutyDescription
                this.workData.milestoneMark = json.data.landmarkDescription
                this.workData.importantMatters = json.data.majorIssuesDescription
            }.bind(this),null,false)
        }

        this._createTableContent();

        if(this.workReportData.title){
            this.titleDiv.set("text",this.workReportData.title.length>50?this.workReportData.title.substr(0,50)+"...":this.workReportData.title)
            this.titleDiv.set("title",this.workReportData.title)
        }

        //委派记录
        if(this.workData.okrWorkAuthorizeRecords){
            this.appointContentDiv = new Element("div.appointContentDiv",{
                "styles":this.css.appointContentDiv
            }).inject(this.formTableArea)
            this.appointContentTitleDiv = new Element("div.appointContentTitleDiv",{
                "styles":this.css.tabTitleDiv,
                "text":this.lp.appointTitle
            }).inject(this.appointContentDiv);
            this.appointContentInfor = new Element("div.appointContentInfor",{
                "styles": this.css.appointContentInfor
            }).inject(this.appointContentDiv);


            this.workData.okrWorkAuthorizeRecords.each(function(d){
                var ttext = d.delegatorName+this.lp.appointFor+ d.targetName
                ttext += "("+ d.delegateDateTime+") "
                ttext += "委派意见：" + d.delegateOpinion
                this.appointRecordDiv = new Element("div.appointRecordDiv",{
                    "styles":this.css.appointRecordDiv,
                    "text": ttext
                }).inject(this.appointContentInfor)
            }.bind(this))

        }

        //判断状态 如果草稿并且当前人是拟稿人，显示contentTextarea1，contentTextarea2 编辑状态 其他只读
        //当前秘书状态、并且当前人是秘书 contentTextarea3 编辑，其他只读
        //当前领导、并且当前人领导（当前处理人）:contentTextarea4编辑 其他只读

        //拟稿人填写
        this.reportContentDiv = new Element("div.centerWorkDiv",{"styles":this.css.reportContentDiv}).inject(this.formTableArea);
        this.reportContentTitleDiv = new Element("div.reportContentTitleDiv",{
            "styles":this.css.tabTitleDiv,
            "text":this.lp.reportContentTitle
        }).inject(this.reportContentDiv);
        this.reportContentInfor = new Element("div.reportContentInfor",{
            "styles": this.css.reportContentInfor
        }).inject(this.reportContentDiv);
        this.contentTitle1 = new Element("div.contentTitle1",{
            "styles":this.css.contentTitle,
            "text":this.lp.contentTitle1 + "："
        }).inject(this.reportContentInfor);


        if(this.workReportData.processStatus == this.lp.activityName.drafter && this.workReportData.isReporter){
            this.contentTextarea1 = new Element("textarea.contentTextarea1",{
                "styles":this.css.contentTextarea,
                "text" : this.workReportData.progressDescription?this.workReportData.progressDescription:""
            }).inject(this.reportContentInfor);
        }else{
            this.contentTextStr1 = new Element("div.contentTextStr1",{
                "styles": this.css.contentTextStr,
                "text" : this.workReportData.progressDescription?this.workReportData.progressDescription:""
            }).inject(this.reportContentInfor)
        }
        this.contentTitle2 = new Element("div.contentTitle2",{
            "styles":this.css.contentTitle,
            "text":this.lp.contentTitle2 + "："
        }).inject(this.reportContentInfor);

        if(this.workReportData.processStatus == this.lp.activityName.drafter && this.workReportData.isReporter){
            this.contentTextarea2 = new Element("textarea.contentTextarea2",{
                "styles":this.css.contentTextarea,
                "text" : this.workReportData.workPlan?this.workReportData.workPlan:""
            }).inject(this.reportContentInfor);
        }else{
            this.contentTextStr2 = new Element("div.contentTextStr2",{
                "styles" : this.css.contentTextStr,
                "text" : this.workReportData.workPlan?this.workReportData.workPlan:""
            }).inject(this.reportContentInfor)
        }

        this.reportAttachment = new Element("div.reportAttachment",{
            "item":"reportAttachments"
        }).inject(this.reportContentInfor)
        this.reportAttachment.setStyles({"width":"95%"})

        var isUpload = false
        if(this.workReportData.processStatus == this.lp.activityName.drafter && this.workReportData.isReporter){
            isUpload = true
        }
        this.reportAttachmentArea = this.formTableArea.getElement("[item='reportAttachments']");
        this.loadReportAttachment( this.reportAttachmentArea,isUpload );

        //获取秘书及领导评价信息
        var opinionData = {};
        opinionData.workReportId = "";
        //this.actions.getWorkReportOpinion();

        //管理员填写
        if(this.workReportData.needAdminAudit){
            this.createAdminContent();
        }


        //领导填写,在草稿和督办员环节不显示
        if(this.workReportData && (this.workReportData.activityName != this.lp.activityName.drafter && this.workReportData.activityName != this.lp.activityName.manager)){
            this.reportContentDiv = new Element("div.centerWorkDiv",{"styles":this.css.reportContentDiv}).inject(this.formTableArea);
            this.reportContentTitleDiv = new Element("div.reportContentTitleDiv",{
                "styles":this.css.tabTitleDiv,
                "text":this.lp.leaderContentTitle
            }).inject(this.reportContentDiv);
            this.reportContentInfor = new Element("div.reportContentInfor",{
                "styles": this.css.reportContentInfor
            }).inject(this.reportContentDiv);

            this.getLeaderOpinions();

            if(this.workReportData.processStatus == this.lp.activityName.leader && this.workReportData.isReadLeader && this.processIdentity.indexOf(this.app.identity)>-1){
                this.contentTextarea4 = new Element("textarea.contentTextarea4",{
                    "styles":this.css.contentTextarea,
                    "text" : this.leaderOpinionDrafter?this.leaderOpinionDrafter:""
                }).inject(this.reportContentInfor);
            }else{
                //if(this.workReportData.reportWorkflowType && this.workReportData.reportWorkflowType == "DEPLOYER"){
                //    //一对一，上下级
                //    this.contentTextStr4 = new Element("div.contentTextStr4",{
                //        "styles": this.css.contentTextStr,
                //        "text":"意见"
                //    }).inject(this.reportContentInfor)
                //}else{
                //    this.getLeaderOpinions();
                //}

            }

        }


        //权限控制，如果已归档，则输入框去掉
        if(this.workReportData && this.workReportData.status == this.lp.statuArchive){
            if(this.contentTextarea1)this.contentTextarea1.destroy();
            if(this.contentTextarea2)this.contentTextarea2.destroy();
            if(this.contentTextarea3)this.contentTextarea3.destroy();
            if(this.contentTextarea4)this.contentTextarea4.destroy();

        }

    },
    getLeaderOpinions: function(){
        //获取领导意见
        var logs = this.workReportData.processLogs;
        this.leaderTitle = [];
        this.leaderValue = [];
        if(logs){
            logs.each(function(data){
                if(data.activityName == this.lp.activityName.leader && data.processStatus == this.lp.status.drafter && data.processorIdentity == this.app.identity){
                    this.leaderOpinionDrafter = data.opinion
                }else{
                    if(data.activityName == this.lp.activityName.leader && data.processStatus == this.lp.status.effect){
                        this.leaderTitle.push(data.processorIdentity+"("+data.processTimeStr+")");
                        this.leaderValue.push(data.opinion )
                    }
                }
            }.bind(this))
        }
        //领导意见显示区域
        this.reportLeaderOpinionsDiv = new Element("div.reportLeaderOpinionsDiv",{
            "styles":this.css.reportLeaderOpinionsDiv
        }).inject(this.reportContentInfor);
        for(var i=0;i<this.leaderTitle.length;i++){
            var reportLeaderContentDiv = new Element("div.reportLeaderContentDiv",{"styles":this.css.reportLeaderContentDiv}).inject(this.reportLeaderOpinionsDiv);
            var reportLeaderTitleDiv = new Element("div.reportLeaderTitleDiv",{
                "styles":this.css.reportLeaderTitleDiv,
                "text":this.leaderTitle[i]+":"
            }).inject(reportLeaderContentDiv);
            var reportLeaderValueDiv = new Element("div.reportLeaderValueDiv",{
                "styles":this.css.reportLeaderValueDiv,
                "text":this.leaderValue[i]
            }).inject(reportLeaderContentDiv);
        }

    },
    createPrevReport: function(){
        if(this.prevReportDiv) this.prevReportDiv.destroy();
        this.prevReportDiv = new Element("div.prevReportDiv",{
            styles:this.css.prevReportDiv
        }).inject(this.formTableContainer);

        this.prevReportTopDiv = new Element("div.prevReportTopDiv",{
            "styles":this.css.prevReportTopDiv
        }).inject(this.prevReportDiv);
        this.prevReportTopTitleDiv = new Element("div.prevReportTopTitleDiv",{
            "styles": this.css.prevReportTopTitleDiv,
            "text" : this.lp.reportLinks+"："
        }).inject(this.prevReportTopDiv);
        this.prevReportTopCloseDiv = new Element("div.prevReportTopCloseDiv",{
            "styles": this.css.prevReportTopCloseDiv
        }).inject(this.prevReportTopDiv)
            .addEvents({
                "click": function(){
                    this.prevReportDiv.destroy();
                }.bind(this)
            })
        this.prevReportListDiv = new Element("div.prevReportListDiv",{
            "styles":this.css.prevReportListDiv
        }).inject(this.prevReportDiv)

        this.actions.getWorkReportList(this.workReportData.workId, function( json ){
            if(json.type && json.type=="success" && json.data){
                json.data.each(function(data){
                    var createTimes = data.createTime.split(" ")[0]

                     var prevReportWorkId = data.id;
                     var prevReportListLi = new Element("li.prevReportListLi",{
                        "styles": this.css.prevReportListLi,
                         "id" : prevReportWorkId,
                        "text": createTimes + "-" + data.shortTitle
                    }).inject(this.prevReportListDiv)
                        .addEvents({
                            "mouseover":function(){
                                prevReportListLi.setStyle("background-color","#3c76c1");
                            }.bind(this),
                            "mouseout":function(){
                                if(prevReportWorkId != this.currentPrevReportLinkId){
                                    prevReportListLi.setStyle("background-color","");
                                }
                            }.bind(this),
                             "click" :function(){
                                 this.prevReportTopCloseDiv.setStyle("display","none");

                                this.expandWorkReportInfor(prevReportListLi);
                             }.bind(this)
                        })
                }.bind(this))
            }
        }.bind(this),null,false);

        //this.createPrevReportInfor();

    },
    createPrevReportInfor : function(workReportId){
        if(this.prevReportInforDiv) this.prevReportInforDiv.destroy();

        this.prevReportInforDiv = new Element("div.prevReportInforDiv",{
            "styles": this.css.prevReportInforDiv
        }).inject(this.formTableContainer);

        this.prevReportInforTopDiv = new Element("div.prevReportInforTopDiv",{
            "styles":this.css.prevReportInforTopDiv
        }).inject(this.prevReportInforDiv);

        this.prevReportInforTopCloseDiv = new Element("div.prevReportInforTopCloseDiv",{
            "styles": this.css.prevReportInforTopCloseDiv
        }).inject(this.prevReportInforTopDiv)
            .addEvents({
                "click": function(){
                    this.prevReportDiv.destroy();
                    this.prevReportInforDiv.destroy();
                }.bind(this)
            })
        this.prevReportInforListDiv = new Element("div.prevReportInforListDiv",{
            "styles":this.css.prevReportInforListDiv
        }).inject(this.prevReportInforDiv);

        //这里显示具体内容
        this.actions.getWorkReport(workReportId,function(json){
            //alert(JSON.stringify(json))
            if(json.type == "success"){
                var prevContentDiv = new Element("div.prevContentDiv",{
                    "styles": this.css.prevContentDiv
                }).inject(this.prevReportInforListDiv);
                var prevContentTitleDiv = new Element("div.prevContentTitleDiv",{
                    "styles" : this.css.prevContentTitleDiv,
                    "text" : this.lp.contentTitle1 + ":"
                }).inject(prevContentDiv)
                var prevContentValueDiv = new Element("div.prevContentValueDiv",{
                    "styles": this.css.prevContentValueDiv,
                    "text" : json.data.progressDescription
                }).inject(prevContentDiv);

                prevContentDiv = new Element("div.prevContentDiv",{
                    "styles": this.css.prevContentDiv
                }).inject(this.prevReportInforListDiv);
                prevContentTitleDiv = new Element("div.prevContentTitleDiv",{
                    "styles" : this.css.prevContentTitleDiv,
                    "text" : this.lp.contentTitle2 + ":"
                }).inject(prevContentDiv)
                prevContentValueDiv = new Element("div.prevContentValueDiv",{
                    "styles": this.css.prevContentValueDiv,
                    "text" : json.data.workPlan
                }).inject(prevContentDiv);

                //管理员督办
                if(json.data.needAdminAudit){
                    prevContentDiv = new Element("div.prevContentDiv",{
                        "styles": this.css.prevContentDiv
                    }).inject(this.prevReportInforListDiv);
                    prevContentTitleDiv = new Element("div.prevContentTitleDiv",{
                        "styles" : this.css.prevContentTitleDiv,
                        "text" : this.lp.adminContentTitle + ":"
                    }).inject(prevContentDiv)
                    prevContentValueDiv = new Element("div.prevContentValueDiv",{
                        "styles": this.css.prevContentValueDiv,
                        "text" : json.data.adminSuperviseInfo?json.data.adminSuperviseInfo:""
                    }).inject(prevContentDiv);
                }

                //领导评价
                prevContentDiv = new Element("div.prevContentDiv",{
                    "styles": this.css.prevContentDiv
                }).inject(this.prevReportInforListDiv);
                prevContentTitleDiv = new Element("div.prevContentTitleDiv",{
                    "styles" : this.css.prevContentTitleDiv,
                    "text" : this.lp.leaderContentTitle + ":"
                }).inject(prevContentDiv)
                prevContentValueDiv = new Element("div.prevContentValueDiv",{
                    "styles": this.css.prevContentValueDiv
                }).inject(prevContentDiv);

                var reportLeaderOpinionsDiv = new Element("div.reportLeaderOpinionsDiv",{
                    "styles":this.css.reportLeaderOpinionsDiv
                }).inject(prevContentValueDiv);


                var preLogs = json.data.processLogs;
                this.preLeaderTitle = [];
                this.preLeaderValue = [];
                if(preLogs){
                    preLogs.each(function(data){
                        if(data.activityName == this.lp.activityName.leader && data.processStatus == this.lp.status.drafter && data.processorIdentity == this.app.identity){
                            this.leaderOpinionDrafter = data.opinion
                        }else{
                            if(data.activityName == this.lp.activityName.leader && data.processStatus == this.lp.status.effect){
                                this.preLeaderTitle.push(data.processorIdentity+"("+data.processTimeStr+")");
                                this.preLeaderValue.push(data.opinion )
                            }
                        }
                    }.bind(this))
                }


                for(var i=0;i<this.preLeaderTitle.length;i++){
                    var reportLeaderContentDiv = new Element("div.reportLeaderContentDiv",{"styles":this.css.reportLeaderContentDiv}).inject(reportLeaderOpinionsDiv);
                    reportLeaderContentDiv.setStyle("border-bottom","1px dashed #3c76c1");
                    var reportLeaderTitleDiv = new Element("div.reportLeaderTitleDiv",{
                        "styles":this.css.reportLeaderTitleDiv,
                        "text":this.preLeaderTitle[i]+":"
                    }).inject(reportLeaderContentDiv);
                    var reportLeaderValueDiv = new Element("div.reportLeaderValueDiv",{
                        "styles":this.css.reportLeaderValueDiv,
                        "text":this.preLeaderValue[i]
                    }).inject(reportLeaderContentDiv);
                }


            }
        }.bind(this),null,false)
    },
    expandWorkReportInfor:function(prevReportListLi){
        this.currentPrevReportLinkId = prevReportListLi.get("id");
        var liObj = this.prevReportListDiv.getElements("li");
        liObj.setStyle("background-color","");
        prevReportListLi.setStyle("background-color","#3c76c1");
        this.createPrevReportInfor(this.currentPrevReportLinkId);
        this.prevReportInforDiv.setStyle("display","");
    },
    createAdminContent: function(){
        this.reportContentDiv = new Element("div.centerWorkDiv",{"styles":this.css.reportContentDiv}).inject(this.formTableArea);
        this.reportContentTitleDiv = new Element("div.reportContentTitleDiv",{
            "styles":this.css.tabTitleDiv,
            "text":this.lp.adminContentTitle
        }).inject(this.reportContentDiv);
        this.reportContentInfor = new Element("div.reportContentInfor",{
            "styles": this.css.reportContentInfor
        }).inject(this.reportContentDiv);


        if(this.workReportData.processStatus == this.lp.activityName.manager && this.workReportData.isWorkAdmin){
            this.contentTextarea3 = new Element("textarea.contentTextarea3",{
                "styles":this.css.contentTextarea,
                "value":this.workReportData.adminSuperviseInfo?this.workReportData.adminSuperviseInfo:""
            }).inject(this.reportContentInfor);
        }else{
            this.contentTextStr3 = new Element("div.contentTextStr3",{
                "styles": this.css.contentTextStr,
                "text" : this.workReportData.adminSuperviseInfo?this.workReportData.adminSuperviseInfo:""
            }).inject(this.reportContentInfor)
        }
    },
    _createTableContent: function () {
        var html = "<table style='width:95%; margin:10px 40px; margin-bottom: 0px;' border='0'>" +
                    "<tr>"+
                    "   <td styles='formTableTitle' lable='deployPerson' width='10%'></td>" +
                    "   <td styles='formTableValue' item='deployPerson' width='20%'></td>" +
                    "   <td styles='formTableTitle' lable='timeLimit' width='10%'></td>" +
                    "   <td styles='formTableValue' item='timeLimit' width='20%'></td>" +
                    "   <td styles='formTableTitle' lable='' width='10%'></td>" +
                    "   <td styles='formTableValue' item='' width='20%'></td>" +
                    "</tr>"+
                    "<tr>"+
                    "   <td styles='formTableTitle' lable='dutyDepartment'></td>" +
                    "   <td styles='formTableValue' item='dutyDepartment'></td>" +
                    "   <td styles='formTableTitle' lable='dutyPerson'></td>" +
                    "   <td styles='formTableValue' item='dutyPerson'></td>" +
                    "   <td styles='formTableTitle' lable='reportCycle'></td>" +
                    "   <td styles='formTableValue'><span item='reportCycle'></span><span item='reportDay'></span></td>" +
                    "</tr>"+
                    "<tr>"+
                    "   <td styles='formTableTitle' lable='secondDepartment'></td>" +
                    "   <td styles='formTableValue' item='secondDepartment'></td>" +
                    "   <td styles='formTableTitle' lable='secondPerson'></td>" +
                    "   <td styles='formTableValue' item='secondPerson'></td>" +
                    "   <td styles='formTableTitle' lable='readReader'></td>" +
                    "   <td styles='formTableValue' item='readReader'></td>" +
                    "</tr>"+
                    //"<tr>"+
                    //"   <td styles='formTableTitle' lable='subject'></td>" +
                    //"   <td styles='formTableValue' item='subject' colspan='5'></td>" +
                    //"</tr>"+
                    "</table>"+
                    "<div id='expandIcon' style='text-align: center; cursor:pointer;'><img style='width:20px;height:10px;' src='/x_component_Execution/$WorkReport/default/icon/expand.gif'></div>"+
                    "<table id='workDetails' style='width:95%; margin:0px 40px; display:none' border='0'>"+
                    "<tr>"+
                    "   <td styles='formTableTitle' lable='workSplitAndDescription' width='10%' valign='top'></td>" +
                    "   <td styles='formTableValue' item='workSplitAndDescription' colspan='5'></td>" +
                    "</tr>"+
                    "<tr>"+
                    "   <td styles='formTableTitle' lable='specificActionInitiatives' valign='top'></td>" +
                    "   <td styles='formTableValue' item='specificActionInitiatives' colspan='5'></td>" +
                    "</tr>"+
                    "<tr>"+
                    "   <td styles='formTableTitle' lable='milestoneMark' valign='top'></td>" +
                    "   <td styles='formTableValue' item='milestoneMark' colspan='5'></td>" +
                    "</tr>"+

                    "<tr>"+
                    "   <td styles='formTableValue' colspan='6'>" +
                    "       <div styles='formTableValueDiv' item='attachments'></div>"+
                    "   </td>"+
                    "<tr>"+
                    "</table>"+
                    "<div id='foldIcon' style='text-align: center; cursor:pointer;display:none;'><img style='width:20px;height:10px;' src='/x_component_Execution/$WorkReport/default/icon/fold.gif'></div>"
        this.tableContentDiv.set("html", html);

        this.expandDiv = this.tableContentDiv.getElementById("expandIcon");
        this.foldDiv = this.tableContentDiv.getElementById("foldIcon");
        this.workDetailsTab = this.tableContentDiv.getElementById("workDetails")

        if(this.expandDiv){
            this.expandDiv.addEvents({
                "click":function(){
                    if(this.workDetailsTab) this.workDetailsTab.setStyle("display","");
                    this.expandDiv.setStyle("display","none");
                    this.foldDiv.setStyle("display","");
                }.bind(this)
            })
        }

        if(this.foldDiv){
            this.foldDiv.addEvents({
                "click":function(){
                    if(this.workDetailsTab) this.workDetailsTab.setStyle("display","none");
                    this.expandDiv.setStyle("display","");
                    this.foldDiv.setStyle("display","none");
                }.bind(this)
            })
        }
       this.loadForm();
    },
    loadForm: function(){
        this.form = new MForm(this.formTableArea, this.workData, {
            style: "execution",
            isEdited: this.isEdited || this.isNew,
            itemTemplate: this.getItemTemplate(this.lp )
        },this.app);
        this.form.load();

        this.attachmentArea = this.formTableArea.getElement("[item='attachments']");
        this.loadAttachment( this.attachmentArea );
    },
    getItemTemplate: function( lp ){
        _self = this;
        return {
            workType: {
                text: lp.workType + ":",
                    selectValue: lp.workTypeValue.split(",")
            },
            workLevel: {
                text: lp.workLevel + ":",
                    type: "select",
                    notEmpty:true,
                    selectValue: lp.workLevelValue.split(",")
            },
            timeLimit: {text: lp.timeLimit + ":", tType: "date",name:"completeDateLimitStr",notEmpty:true},
            reportCycle: {
                text: lp.reportCycle + ":",
                type: "select",
                notEmpty:true,
                //selectValue: lp.reportCycleValue.split(","),
                selectText: lp.reportCycleText.split(","),
                className: "inputSelectUnformatWidth",
                event: {
                    change: function (item, ev) {
                        if (item.get("value") == lp.reportCycleText.split(",")[0]) {
                            this.form.getItem("reportDay").resetItemOptions(lp.weekDayValue.split(","),lp.weekDayText.split(","))
                        } else if (item.get("value") == lp.reportCycleText.split(",")[1]) {
                            this.form.getItem("reportDay").resetItemOptions(lp.monthDayValue.split(","),lp.monthDayText.split(","))
                        }
                    }.bind(this)
                }
            },
            reportDay: {
                type: "select",
                name:"reportDayInCycle",
                notEmpty:true,
                aa:function(){}.bind(this),
                selectValue: (!this.data.reportCycle || this.data.reportCycle==lp.reportCycleText.split(",")[0])?lp.weekDayValue.split(","):lp.monthDayValue.split(","), //lp.weekDayValue.split(","),
                selectText:  (!this.data.reportCycle || this.data.reportCycle==lp.reportCycleText.split(",")[0])?lp.weekDayText.split(","):lp.monthDayText.split(","),
                className: "inputSelectUnformatWidth"
            },
            dutyDepartment: {text: lp.dutyDepartment + ":", tType: "department",name:"responsibilityOrganizationName",notEmpty:true,event:{
                "change":function(item){
                    var department = item.getValue();
                    if( department ){
                        _self.getDepartmentLeader( department, function( leader ){
                            _self.form.getItem("dutyPerson").setValue(leader);
                        })
                    }

                }
            }},
            dutyPerson: {text: lp.dutyPerson + ":", tType: "identity",count:1,name:"responsibilityIdentity",notEmpty:true},
            secondDepartment: {text: lp.secondDepartment + ":", tType: "department",name:"cooperateOrganizationName", count: 0,event:{
                "change":function(item){
                    var deptstr = item.getValue();
                    if(deptstr){
                        var depts = deptstr.split(",");
                        var users = ""
                        for(var i=0;i<depts.length;i++){
                            if(depts[i]!=""){
                                _self.getDepartmentLeader( depts[i], function( leader ){
                                    if(users=="") users = leader
                                    else users = users + ","+leader
                                })
                            }
                        }

                        _self.form.getItem("secondPerson").setValue(users);
                    }
                }
            }},
            secondPerson: {text: lp.secondPerson + ":", tType: "identity",name:"cooperateIdentity", count: 0},
            readReader: {text: lp.readReader + ":", tType: "identity", name:"readLeaderIdentity",count: 0},
            deployPerson :{text: lp.deployPerson,name:"deployerIdentity"},
            subject: {text: lp.subject + ":",name:"title",notEmpty:true},
            workSplitAndDescription: {text: lp.workSplitAndDescription + ":", type: "textarea",name:"workDetail",notEmpty:true},
            specificActionInitiatives: {text: lp.specificActionInitiatives + ":", type: "textarea",name:"progressAction"},
            cityCompanyDuty: {text: lp.cityCompanyDuty + ":", type: "textarea",name:"dutyDescription"},
            milestoneMark: {text: lp.milestoneMark + ":", type: "textarea",name:"landmarkDescription"},
            importantMatters: {text: lp.importantMatters + ":", type: "textarea",name:"majorIssuesDescription"}
        }
    },
    loadAttachment: function( area ){
        this.attachment = new MWF.xApplication.Execution.Attachment( area, this.app, this.actions, this.app.lp, {
            documentId : this.data.workId,
            isNew : this.options.isNew,
            isEdited : this.options.isEdited
        })
        this.attachment.load();
    },

    loadReportAttachment: function( area,edit ){
        this.attachment = new MWF.xApplication.Execution.ReportAttachment( area, this.app, this.actions, this.app.lp, {
            //documentId : this.data.workId,
            documentId : this.workReportId,
            isNew : this.options.isNew,
            isEdited : edit,
            "size":this.workReportData.processStatus == this.lp.activityName.drafter ? "max":"min",
            onQueryUploadAttachment : function(){



                var saveData = {}
                saveData.workId = this.workReportData.workId;
                saveData.id = this.workReportData.id;
                if(this.workReportData.processStatus == this.lp.activityName.drafter){
                    saveData.progressDescription = this.contentTextarea1.value;
                    saveData.workPlan = this.contentTextarea2.value
                }

                this.actions.saveWorkReport( saveData, function(json){
                    if(json.type == "success"){
                        this.attachment.isQueryUploadSuccess = true;
                    }
                }.bind(this),function(xhr,text,error){
                    this.attachment.isQueryUploadSuccess = false;
                }.bind(this),false);

            }.bind(this)
        })
        this.attachment.load();
    },
    readDone: function(){
        //alert(this.data.todoId)
        this.actions.readDone(this.data.todoId,function(json){
            this.app.notice(this.lp.prompt.readDone,"success");
            this.fireEvent("reloadView", json);
            this.close();
        }.bind(this),function(xhr){}.bind(this))
    },
    save: function(){
        var saveData = {}
        saveData.workId = this.workReportData.workId;
        saveData.id = this.workReportData.id;
        if(this.workReportData.processStatus == this.lp.activityName.drafter){
            saveData.progressDescription = this.contentTextarea1.value;
            saveData.workPlan = this.contentTextarea2.value
        }else if(this.workReportData.processStatus == this.lp.activityName.manager){
            saveData.adminSuperviseInfo = this.contentTextarea3.value
        }else if(this.workReportData.processStatus == this.lp.activityName.leader){
            saveData.opinion = this.contentTextarea4.value
        }

        this.actions.saveWorkReport( saveData, function(json){
            if(json.type == "success"){
                this.app.notice(this.lp.information.saveSuccess, "success");
            }
        }.bind(this),function(xhr,text,error){
            var errorText = error;
            if (xhr) errorMessage = xhr.responseText;
            var e = JSON.parse(errorMessage);
            if(e.message){
                this.app.notice( e.message,"error");
            }else{
                this.app.notice( errorText,"error");
            }
        }.bind(this));
    },
    submit: function(){
        if(this.contentTextarea1){
            if(this.contentTextarea1.value == ""){
                this.app.notice(this.lp.contentTitle1+this.lp.checkEmpty, "error");
                return false;
            }
        }
        if(this.contentTextarea2){
            if(this.contentTextarea2.value == ""){
                this.app.notice(this.lp.contentTitle2+this.lp.checkEmpty, "error");
                return false;
            }
        }
        //if(this.contentTextarea3){
        //    if(this.contentTextarea3.value == ""){
        //        this.app.notice(this.lp.adminContentTitle+this.lp.checkEmpty, "error");
        //        return false;
        //    }
        //}
        //if(this.contentTextarea4){
        //    if(this.contentTextarea4.value == ""){
        //        this.app.notice(this.lp.leaderContentTitle+this.lp.checkEmpty, "error");
        //        return false;
        //    }
        //}

        var saveData = {}
        saveData.workId = this.workReportData.workId;
        saveData.id = this.workReportData.id;
        if(this.workReportData.processStatus == this.lp.activityName.drafter){
            saveData.progressDescription = this.contentTextarea1.value;
            saveData.workPlan = this.contentTextarea2.value
        }else if(this.workReportData.processStatus == this.lp.activityName.manager){
            saveData.adminSuperviseInfo = this.contentTextarea3.value
        }else if(this.workReportData.processStatus == this.lp.activityName.leader){
            saveData.opinion = this.contentTextarea4.value
        }

        this.actions.submitWorkReport( saveData, function(json){
            if(json.type == "success"){
                this.app.notice(this.lp.prompt.submitWorkReport,"success");
                this.fireEvent("reloadView", json);
                this.close();
            }
        }.bind(this),function(xhr,text,error){
            var errorText = error;
            if (xhr) errorMessage = xhr.responseText;
            var e = JSON.parse(errorMessage);
            if(e.message){
                this.app.notice( e.message,"error");
            }else{
                this.app.notice( errorText,"error");
            }
        }.bind(this));

    },
    _createBottomContent: function () {
        if(this.processIdentity == this.app.identity || this.processIdentity.indexOf(this.app.identity)>-1) {
            this.submitActionNode = new Element("div.submitActionNode", {
                "styles": this.css.formCancelActionNode,
                "text": this.lp.bottomAction.submit
            }).inject(this.formBottomNode)
                .addEvents({
                    "click": function () {
                        this.submit();
                    }.bind(this)
                })
        }

        if(this.processIdentity == this.app.identity || this.processIdentity.indexOf(this.app.identity)>-1) {
            this.saveActionNode = new Element("div.saveActionNode", {
                "styles": this.css.formCancelActionNode,
                "text": this.lp.bottomAction.save
            }).inject(this.formBottomNode)
                .addEvents({
                    "click": function () {
                        this.save();
                    }.bind(this)
                })
        }

        if(this.options.isRead){
            this.readActionNode = new Element("div.readActionNode", {
                "styles": this.css.formCancelActionNode,
                "text": this.lp.bottomAction.readDone
            }).inject(this.formBottomNode);
            this.readActionNode.addEvent("click", function (e) {
                this.readDone(e);
            }.bind(this));
        }

        this.cancelActionNode = new Element("div.formCancelActionNode", {
            "styles": this.css.formCancelActionNode,
            "text": this.lp.bottomAction.close
        }).inject(this.formBottomNode);
        this.cancelActionNode.addEvent("click", function (e) {
            this.cancel(e);
        }.bind(this));



        //控制按钮权限
        //如果已归档，则只留下关闭按钮
        if (this.workReportData && this.workReportData.status == this.lp.statuArchive) {
            if(this.submitActionNode)this.submitActionNode.destroy();
            if(this.saveActionNode)this.saveActionNode.destroy();
            if(this.readActionNode)this.readActionNode.destroy();

        }
    }
});

