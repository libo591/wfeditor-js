var nowUseNode;//当前选中的节点
var NodeCommonProp={
	"beginArrowPos":null,
	"beginArrowNode":null,
	"allLines":[],
	"allNodes":[],
	"drawingLine":null,
	"showNodeProp":function(nodeProp){
		showNodeProp(nodeProp);
	},
	"showLineProp":function(lineProp){
	},
	"designerEventHasBind":false,
	"downnow":null,
	"downnow_offx":0,
	"downnow_offy":0,
	"topOffset":0,
	"linenode":null,
	"arrowDraging":false,
	"lastnodeindex":1,
	"calcEndPoint":function(endX,endY,node,ll){
		var result = {};
		var pivalue = ll.calcRotateValue(endX,endY);
		var pivaluerect = Math.atan(node.height/node.width);
		var biaozhunwidth = node.width/2;
		var biaozhunheight = node.height/2;
		if(pivalue<(Math.PI/2)){//起始节点在结束节点左上角
			if(pivalue>pivaluerect){
				result["x"] = endX-biaozhunheight/Math.tan(pivalue);
				result["y"] = endY-biaozhunheight;
			}else{
				result["x"] = endX-biaozhunwidth;
				result["y"] = endY-biaozhunwidth*Math.tan(pivalue);
			}
		}else if(pivalue<(Math.PI)){//起始节点在结束节点右上角
			var tmp = Math.PI-pivalue;
			if(tmp>pivaluerect){
				result["x"] = endX+biaozhunheight/Math.tan(tmp);
				result["y"] = endY-biaozhunheight;
			}else{
				result["x"] = endX+biaozhunwidth;
				result["y"] = endY-biaozhunwidth*Math.tan(tmp);
			}
		}else if(pivalue<(Math.PI*3/2)){//右下
			var tmp = pivalue-Math.PI;
			if(tmp>pivaluerect){
				result["x"] = endX+biaozhunheight/Math.tan(tmp);
				result["y"] = endY+biaozhunheight;
			}else{
				result["x"] = endX+biaozhunwidth;
				result["y"] = endY+biaozhunwidth*Math.tan(tmp);
			}
		}else{//左下
			var tmp = Math.PI*2-pivalue;
			if(tmp>pivaluerect){
				result["x"] = endX-biaozhunheight/Math.tan(tmp);
				result["y"] = endY+biaozhunheight;
			}else{
				result["x"] = endX-biaozhunwidth;
				result["y"] = endY+biaozhunwidth*Math.tan(tmp);
			}
		}
		return result;
	},
	"drawAllLines":function(ctx,canvas){
		ctx.clearRect(0,0,canvas.width,canvas.height);
		if(NodeCommonProp["allLines"]){
			for(var i=0;i<NodeCommonProp["allLines"].length;i++){
				var lineobj = NodeCommonProp["allLines"][i];
				lineobj.drawLine(ctx,false);
			}
		}
		if(NodeCommonProp["drawingLine"]){
			NodeCommonProp["drawingLine"].drawLine(ctx,true);
		}
	},
	"findNode":function(nodeid){
			for(var i=0;i<NodeCommonProp["allNodes"].length;i++){
				var nodeobj = NodeCommonProp["allNodes"][i];
				if(nodeobj["nodeProp"]["id"]==nodeid){
					return nodeobj;
				}
			}
	},
	"findLine":function(lineid){
		for(var i=0;i<NodeCommonProp["allLines"].length;i++){
				var lineobj = NodeCommonProp["allLines"][i];
				if(lineobj["lineProp"]["id"]==lineid){
					return lineobj;
				}
			}
	}
};
$(document).ready(function(){
	NodeCommonProp["topOffset"] = $("#designerBoard").position().top;
	if(NodeCommonProp["topOffset"]==0){NodeCommonProp["topOffset"]=64;}
});
/**
 * 基本节点，公共属性和方法
 */
function WorkFlowNode(c){
	this.width=170;
	this.height=85;
	this.isClickLink=false;
	this.canvas=c;
	this.ctx = c.getContext("2d");
	this.outLines=[];//向外发射的线的ID数组
	this.inLines=[];//指向自己的线的ID数组
	this.hasMoved=false;
	/**
	 * 节点属性对象
	 */
	this.nodeProp={
			"name":"",//节点名称
			"type":"",//节点属性
			"approvePriv":"",//审批权限，用于前台显示
			"realApprovePriv":"",//审批权限真实值，用于后台存储
			"mode":"",
			"operatePriv":"",//操作权限
			"subInfo":"",//附属信息
			"nodeOperateJson":"",//操作设置
			"object_ParamJson":"",//附属信息
			"branchSet":"",//分支设置
			"branchType":"",//分支到达方式
			"realOperatePriv":"",//操作权限真实值
			"desc":"新增节点",//节点描述
			"resType":"1",//处理资源类型 0静态，1动态
			"res":"",//处理资源对象，用于前台显示
			"realRes":"",//处理资源对象真实值，用于后台存储
			"rollbackProcesser":"0",//回退后的处理人
			"doagainProcesser":"0",//再次经过该节点时处理人
			"duringTime":"",//处理时限
		"duringTimeType":"",//处理时限类型
		"timeoutType":"",//超期处理方式
		"alertType":"",//预警方式
		"alertCusClass":"",//预警方式自定义类
			"alertTime":"",//预警时间
		"alertTimeVal":"",//预警时间值
		"alertTimeType":"",//预警时限类型
			"containerClass":"com.runqianapp.workflow.input.InputTransaction",//节点容器类
			"listenerClass":"com.runqianapp.workflow.input.InputNodeListener",//节点监听类
			"classify":"",//分类，开始(0)，结束(1)，自动(2)，手动(3)
		"id":"",//节点的DIV ID
		"taskDesc":"",//任务关键信息描述
		"taskParam":"",//任务关键信息参数
		"isNew":false,//是否是新增
		"sendMsgType":"",//消息提醒类型，邮件提醒(1)，消息提醒(2)
		"msgTriggerType":""//消息触发类型，任务操作提醒(taskOperation)，任务完成提醒(taskArrive)
	};
	/**
	 * 创建节点的html结构，包括工具条和内容
	 * @param prop 传递的参数，json格式，其数据包括 type(开始(0)，结束(1)，自动(2)，手动(3)),name, 
	 */
	this.createSelfStuct=function(prop,isInvert){
		var result=this.htmlTmp;
		this.nodeProp["name"] = prop["name"];
		this.nodeProp["classify"] = prop["type"];
		this.nodeProp["id"] = prop["id"];
		var initProp = prop["nodeProp"];
		for(var key in initProp){
				this.nodeProp[key] = initProp[key];
		}
		if(prop["type"]=="0"){
			result = result.replace("#{node_title}#",this.beginTitle)
								.replace("#{delete_disp}#","none")
								.replace("#{content_height}#","0px")
								.replace("#{content_disp}#","none")
								.replace("#{sum_height}#","30px")
								.replace(/#{div_id}#/g,prop["id"]);
			this.height=40;
		}else if(prop["type"]=="1"){
			result = result.replace("#{node_title}#",this.endTitle)
								.replace("#{delete_disp}#","none")
								.replace("#{content_height}#","0px")
								.replace("#{content_disp}#","none")
								.replace("#{sum_height}#","30px")
								.replace(/#{div_id}#/g,prop["id"]);
			this.height=40;
		}else if(prop["type"]=="2"){
			result = result.replace("#{node_title}#",this.customTitle)
								.replace("#{delete_disp}#","block")
								.replace("#{content_height}#","40px")
								.replace("#{node_name}#",prop["name"])
								.replace("#{content_disp}#","block")
								.replace("#{sum_height}#","75px")
								.replace(/#{div_id}#/g,prop["id"]);
			this.height=85;
		}else if(prop["type"]=="3"){
			result = result.replace("#{node_title}#",this.autoTitle)
								.replace("#{delete_disp}#","block")
								.replace("#{content_height}#","40px")
								.replace("#{node_name}#",prop["name"])
								.replace("#{content_disp}#","block")
								.replace("#{sum_height}#","75px")
								.replace(/#{div_id}#/g,prop["id"]);
			this.height=85;
		}
		this.nodeProp.type=prop["type"];
		NodeCommonProp["allNodes"].push(this);
		return result;
	};
	this.initEvent = function(prop){
		var divid = prop["id"];
		var self = this;
		$("#"+divid).mousedown(function(event) {
			if(NodeCommonProp["beginArrowPos"]==null){
		  		NodeCommonProp["downnow"] = self;
		  		var t = $(event.target);
		  		var ox = event.offsetX==null?event.layerX:event.offsetX;
		  		var oy = event.offsetY==null?event.layerY:event.offsetY;
		  		while(t.attr("id")!=divid){
		  			ox+=t.position().left;
		  			oy+=t.position().top;
		  			t = t.parent();
		  		}
		  		NodeCommonProp["downnow_offx"]=ox;
				NodeCommonProp["downnow_offy"]=oy;
			}
		}).click(function(event){
			nodeClickEvent(event,this,self);
		});
		$("#"+divid+"_delete").click(function(event){
			if(NodeCommonProp["beginArrowPos"]==null){
				nodeDeleteClickEvent(event,divid,self);
			}
		});
		$("#"+divid+"_link").click(function(event){
			if(NodeCommonProp["beginArrowPos"]==null){
				NodeCommonProp["linenode"] = self;
				nodeLinkClickEvent(event,divid,self);
			}
		}).mousedown(function(event){
			event.stopPropagation();
		});
		//容器的事件只需要添加一次
		if(!NodeCommonProp["designerEventHasBind"]){
			NodeCommonProp["designerEventHasBind"] = true;
			$("#"+divid).parent().mousemove(function(event) {
			  	designerMouseMove(event,this);
			}).mouseup(function(event) {
			  	NodeCommonProp["downnow"] = null;
			}).mousedown(function(event){
				designerMouseClick(event,this,self);
			});
		}
		function designerMouseClick(event,designerobj,node){
			if(NodeCommonProp["allLines"]){
				isOnTheNode(event,designerobj,node);
				isOnTheLine(event,designerobj,node);
			}
			function isOnTheNode(event,designerobj,node){
				var isOnNode = false;
				for(var i=0;i<NodeCommonProp["allNodes"].length;i++){
					var nodeobj = NodeCommonProp["allNodes"][i];
					var currx = event.pageX+$(designerobj).scrollLeft();
					var curry = event.pageY+$(designerobj).scrollTop()-NodeCommonProp["topOffset"];
					var nodex = $("#"+nodeobj["nodeProp"]["id"]).position().left+$(designerobj).scrollLeft();
					var nodey = $("#"+nodeobj["nodeProp"]["id"]).position().top+$(designerobj).scrollTop();
					var nodewidth = nodeobj["width"];
					var nodeheight = nodeobj["height"];
					if((currx>=nodex&&currx<=nodex+nodewidth)&&(curry>=nodey&&curry<=nodey+nodeheight)){
						isOnNode = true;
						break;
					}
				}
				if(!isOnNode){
					NodeCommonProp["drawingLine"] = null;
					NodeCommonProp["beginArrowPos"] = null;
					if(NodeCommonProp["linenode"]){
						NodeCommonProp["linenode"].isClickLink = false;
					}
					NodeCommonProp["drawAllLines"](node.ctx,node.canvas);
				}
			}
			function isOnTheLine(event,designerobj,node){
				var isOnLine = false;
				var currx = event.pageX+$(designerobj).scrollLeft();
				var curry = event.pageY+$(designerobj).scrollTop()-70;
				for(var i=0;i<NodeCommonProp["allLines"].length;i++){
					var lineobj = NodeCommonProp["allLines"][i];
					if(lineobj.isPointOnLine(currx,curry)){
						NodeCommonProp["showLineProp"](lineobj["lineProp"]);
						//显示线的DIV
						showLinePropDiv(lineobj,currx,curry,node);
						isOnLine = true;
						break;
					}
				}
				if(!isOnLine){
					if($("#lineConfigDiv").length>0){
						$("#lineConfigDiv").remove();
					}
				}
			}
			function showLinePropDiv(lineobj,currx,curry,node){
				var lineId = lineobj["lineProp"]["id"];
				var lineName = lineobj["lineProp"]["branchMark"];
				var usFilter = lineobj["lineProp"]["userFilter"];
				var filter_paramsJson = lineobj["lineProp"]["filter_paramsJson"];
				filter_paramsJson = eval(filter_paramsJson);
				if($("#lineConfigDiv").length>0){
					$("#lineConfigDiv").remove();
				}
				var htmlTmp = "<div id=\"lineConfigDiv\" class=\"lineConfigDiv\" style=\"position: absolute;left:"+(currx-50)+"px;top:"+(curry+25)+"px;width: 110px;height: 30px;\
								border-radius: 5px;vertical-align: middle;line-height: 30px;font-size:12px;border:1px solid blue;\">\
								<span id=\""+lineId+"_name\" style=\"float:left;margin-left:10px;width:30px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;\" title=\""+lineName+"\">"+lineName+"</span>\
								<span id=\""+lineId+"_delete\" style=\"float:right;width:26px;height: 17px;margin-top:4px;background-image:url('images/define_delete.png');display: #{delete_disp}#;\"></span>\
								<span id=\""+lineId+"_edit\" style=\"float:right;width:26px;height: 17px;margin-top:5px;background-image:url('images/define_lineedit.png') \"></span>\
							</div>";
				$(document.body).append($(htmlTmp));
				//添加事件，修改线名称和删除线
				$("#"+lineId+"_delete").click(function(){
					linePropDeleteClick(lineobj,node);
				});
				$("#"+lineId+"_edit").click(function(){
					linePropEditClick(lineId,lineName,lineobj,usFilter,currx,curry);
				});
				//当前的线颜色加重
				NodeCommonProp["drawingLine"]=null;
				NodeCommonProp["drawAllLines"](node.ctx,node.canvas);
				NodeCommonProp["drawingLine"]=lineobj;
				NodeCommonProp["drawAllLines"](node.ctx,node.canvas);
				//设置线属性
				function linePropEditClick(lineId,lineName,lineobj,usFilter,currx,curry){
					var curLineNum = 0;
					for(var i=0;i<NodeCommonProp["allLines"].length;i++){
						if(NodeCommonProp["allLines"][i].isPointOnLine(currx,curry)){
							NodeCommonProp["showLineProp"](lineobj["lineProp"]);
							lineobj = NodeCommonProp["allLines"][i];
							lineName = lineobj["lineProp"]["branchMark"];
							usFilter = lineobj["lineProp"]["userFilter"];
                            filter_paramsJson = lineobj["lineProp"]["filter_paramsJson"];
							curLineNum = i;
							break;
						}
					}
					if(usFilter==""){
						if(lineobj.fromNode==1){
							usFilter = "com.runqianapp.workflow.filter.SameOrgUser";
						}else{
							usFilter = "com.runqianapp.workflow.filter.InputUserFilter";
						}
					}
				}

				function linePropDeleteClick(lineobj,node){
					var result = confirm("确认删除连线?");
					if(result){
						//从2个节点中，将连线对象剔除
						var fromNode = lineobj.fromNode;
						var toNode = lineobj.toNode;
						
						var ols = NodeCommonProp["findNode"](fromNode).outLines;
						for(var lIndex=0;lIndex<ols.length;lIndex++){
							if(lineId==ols[lIndex]){
								ols.splice(lIndex,1);
								break;
							}
						}
						var ils = NodeCommonProp["findNode"](toNode).inLines;
						$("#"+toNode+" font").remove();
						for(var lIndex=0;lIndex<ils.length;lIndex++){
							if(lineId==ils[lIndex]){
								ils.splice(lIndex,1);
								break;
							}
						}
						//从全局连线数组中，去除连线对象
						var als = NodeCommonProp.allLines;
						for(var lIndex=0;lIndex<als.length;lIndex++){
							if(lineId==als[lIndex]["lineProp"]["id"]){
								als.splice(lIndex,1);
								break;
							}
						}
						if($("#lineConfigDiv").length>0){
							$("#lineConfigDiv").remove();
						}
						NodeCommonProp["drawingLine"] = null;
						NodeCommonProp["drawAllLines"](node.ctx,node.canvas);
					}
				}
			}
		}
		function designerMouseMove(event,designerobj){
			var downnode = NodeCommonProp["downnow"]; 
			if(downnode){//节点div的移动
				var downnow_offx = NodeCommonProp["downnow_offx"];
				var downnow_offy = NodeCommonProp["downnow_offy"];
				var nodeleft = (event.pageX-downnow_offx)-10;
				var nodetop = (event.pageY-NodeCommonProp["topOffset"]+$(designerobj).scrollTop()-downnow_offy)-5;
		  		$("#"+downnode.nodeProp["id"]).css({"position":"absolute",
		  					"left":+nodeleft+"px",
		  					"top":+nodetop+"px"});
		  		downnode.moveNodeLines($("#"+downnode.nodeProp["id"]));
		  		NodeCommonProp["drawAllLines"](downnode.ctx,downnode.canvas);
		  		if(!downnode.hasMoved){
		  			downnode.hasMoved=true;
		  		}
		  	}else if(NodeCommonProp["beginArrowPos"]!=null){//有移出箭头时的移动
		  		NodeCommonProp["drawingLine"] = new WorkFlowLine(NodeCommonProp["beginArrowPos"][0],NodeCommonProp["beginArrowPos"][1],
		  											event.pageX+$(designerobj).scrollLeft(),event.pageY-30+$(designerobj).scrollTop());
		  		NodeCommonProp["drawAllLines"](NodeCommonProp["linenode"].ctx,NodeCommonProp["linenode"].canvas);
		  		pointMoveToNode(event.pageX+$(designerobj).scrollLeft(),event.pageY-NodeCommonProp["topOffset"]+$(designerobj).scrollTop());
		  	}
		  	function pointMoveToNode(offx,offy){
		  		var allnodes = NodeCommonProp["allNodes"];
		  		var resultnode = null;
		  		for(var i=0;i<allnodes.length;i++){
		  			var currnode = allnodes[i];
		  			if(currnode==NodeCommonProp["linenode"]){
		  				continue;
		  			}
		  			var nodehtmlobj = $("#"+currnode.nodeProp["id"]);
		  			var nodex = nodehtmlobj.position().left+nodehtmlobj.parent().scrollLeft();
		  			var nodey = nodehtmlobj.position().top+nodehtmlobj.parent().scrollTop();
		  			var nodeWidth = currnode.width;
		  			var nodeHeight = currnode.height;
		  			//window.console.log([offx,offy,nodex,nodey,nodeWidth,nodeHeight].join("----"));
		  			if((offx>=nodex&&offx<=nodex+nodeWidth)&&(offy>=nodey&&offy<=nodey+nodeHeight)){
		  				resultnode=currnode;
		  			}
		  			currnode.deselFunc();
		  		}
		  		if(resultnode){
		  			resultnode.moveInFunc();
		  		}
		  	}
		}
		
		function nodeClickEvent(event,nodediv,node){
			if(!node.isClickLink){
				if(NodeCommonProp["beginArrowPos"]!=null){//点击了开始箭头
					var lineID = "L"+NodeCommonProp["beginArrowNode"].nodeProp["id"]+"_"+node.nodeProp["id"]
					//先查找2个节点间是否已经存在连线
					for(var i=0;i<NodeCommonProp["allLines"].length;i++){
						var curLine = NodeCommonProp["allLines"][i];
						if(curLine["lineProp"]["id"]==lineID){
							return;
						}
					}
					//如果没有，则进行添加
					var bx = NodeCommonProp["beginArrowPos"][0];
					var by = NodeCommonProp["beginArrowPos"][1];
					var ex = $(nodediv).position().left+$(nodediv).parent().scrollLeft()+node.width*0.5;
					var ey = $(nodediv).position().top+$(nodediv).parent().scrollTop()+node.height*0.5;
					var ll = new WorkFlowLine(bx,by,ex,ey);
					var p = NodeCommonProp["calcEndPoint"](ex,ey,node,ll);
		  			ll.endX = p["x"];
		  			ll.endY = p["y"];
					NodeCommonProp["allLines"].push(ll);
					node.inLines.push(lineID);
					NodeCommonProp["beginArrowNode"].outLines.push(lineID);
					ll.fromNode = NodeCommonProp["beginArrowNode"]["nodeProp"]["id"];
					ll.toNode = node["nodeProp"]["id"];  
					ll["lineProp"]["name"]="";
		  			ll["lineProp"]["id"]  = lineID;
					NodeCommonProp["drawingLine"] = null;
					NodeCommonProp["beginArrowPos"] = null;
					NodeCommonProp["linenode"].isClickLink = false;
					NodeCommonProp["drawAllLines"](node.ctx,node.canvas);
					node.deselFunc();
					NodeCommonProp["beginArrowNode"].selFunc();
				}else{//普通的选择了节点
					if(self.nodeProp["classify"]=="0"||self.nodeProp["classify"]=="1"){//开始和结束节点
						NodeCommonProp["showNodeProp"](null);
					}else{//其他节点
						$("#button").show();
						NodeCommonProp["showNodeProp"](self.nodeProp);
						nowUseNode = node;
					}
					//边框加粗等选中效果
					var nodearr = NodeCommonProp["allNodes"];
					for(var nodeindex=0;nodeindex<nodearr.length;nodeindex++){
						nodearr[nodeindex].deselFunc();
					}
					self.selFunc();
				}
			}
		}
		function nodeDeleteClickEvent(event,divid,node){
			var result = confirm("是否删除节点?删除节点将删除节点上的所有连线!");
			if(result){
				//将入线和出线所在的相连节点中的相关数据删除
				for(var m=0;m<node.inLines.length;m++){
					var currInlineId = node.inLines[m];
					var lineobj = NodeCommonProp["findLine"](currInlineId);
					var nodeobj = NodeCommonProp["findNode"](lineobj.fromNode);
					for(var n=0;n<nodeobj.outLines.length;n++){
							if(currInlineId==nodeobj.outLines[n]){
								nodeobj.outLines.splice(n,1);
								break;
							}
					}
				}
				
				for(var m=0;m<node.outLines.length;m++){
					var currInlineId = node.outLines[m];
					var lineobj = NodeCommonProp["findLine"](currInlineId);
					var nodeobj = NodeCommonProp["findNode"](lineobj.toNode);
					for(var n=0;n<nodeobj.inLines.length;n++){
							if(currInlineId==nodeobj.inLines[n]){
								nodeobj.inLines.splice(n,1);
								break;
							}
					}
				}
				
				//将线对象从全局线数组中删除
				var lines = NodeCommonProp["allLines"];
				var deleteArray = [];
				for(var lineIndex=0;lineIndex<lines.length;lineIndex++){
					var currLine = lines[lineIndex];
					for(var m=0;m<node.inLines.length;m++){
						if(node.inLines[m]==currLine["lineProp"]["id"]){
							deleteArray.push(lineIndex);
						}
					}
					
					for(var m=0;m<node.outLines.length;m++){
						if(node.outLines[m]==currLine["lineProp"]["id"]){
							deleteArray.push(lineIndex);
						}
					}
				}
				for(var lineIndex=deleteArray.length-1;lineIndex>=0;lineIndex--){
					lines.splice(deleteArray[lineIndex],1);
				}
				$("#"+divid).remove();
				NodeCommonProp["drawAllLines"](node.ctx,node.canvas);
				var nodearr = NodeCommonProp["allNodes"];
				for(var i=0;i<nodearr.length;i++){
					if(nodearr[i].nodeProp["id"]==divid){
						nodearr.splice(i,1);
						break;
					}
				}
			}
			_clearNodeData();
		}
		function nodeLinkClickEvent(event,divid,node){
			var block = $("#"+divid);
			var blockParent = block.parent();
			NodeCommonProp["beginArrowPos"] = [block.position().left+block.width()*0.5+blockParent.scrollLeft(),
									block.position().top+block.height()*0.5+blockParent.scrollTop()];
			NodeCommonProp["beginArrowNode"] = node; 
			node.isClickLink = true;
		}
	};
	this.selFunc=function(){
		//$("#"+this.nodeProp["id"]).css({"border":"5px solid rgba(56,98,150,1)"});
		$("#"+this.nodeProp["id"]).css({"background-clip":"padding-box"});
        $("#"+this.nodeProp["id"]).addClass("workflow_nodeDivSelected");
		$("#"+this.nodeProp["id"]).removeClass("workflow_nodeDivDefault");
		$("#"+this.nodeProp["id"]).removeClass("workflow_nodeDivHover");
        
		//选择节点后按钮样式设置为可用
        $("button:not(#setStaticRes)").removeAttr("disabled");
		$("button:not(#setStaticRes)").removeClass("ui-state-disabled");
		$("button:not(#setStaticRes)").removeClass("ui-button-disabled");
		$("button:not(#setStaticRes)").attr("aria-disabled","false"); 
	};
	this.deselFunc=function(){
		//$("#"+this.nodeProp["id"]).css({"border":"5px solid rgba(238,238,238,1)"});
		$("#"+this.nodeProp["id"]).css({"background-clip":"padding-box"});
		$("#"+this.nodeProp["id"]).addClass("workflow_nodeDivDefault");
		$("#"+this.nodeProp["id"]).removeClass("workflow_nodeDivSelected");
		$("#"+this.nodeProp["id"]).removeClass("workflow_nodeDivHover");
 
		//释放节点后按钮样式设置为不可用
        $("button:not(#setStaticRes)").attr("disabled","disabled");
		$("button:not(#setStaticRes)").addClass("ui-state-disabled");
		$("button:not(#setStaticRes)").addClass("ui-button-disabled");
		$("button:not(#setStaticRes)").attr("aria-disabled","true"); 
	};
	this.moveInFunc=function(){
		//$("#"+this.nodeProp["id"]).css({"border":"5px solid rgba(0,167,60,1)"});
		$("#"+this.nodeProp["id"]).css({"background-clip":"padding-box"});
		$("#"+this.nodeProp["id"]).addClass("workflow_nodeDivHover");
		$("#"+this.nodeProp["id"]).removeClass("workflow_nodeDivSelected");
		$("#"+this.nodeProp["id"]).removeClass("workflow_nodeDivSelected");
	};
	this.moveNodeLines = function(nodeDiv){
		for(var i=0;i<this.inLines.length;i++){
			var linid = this.inLines[i];
			var lin = NodeCommonProp["findLine"](linid);
			var endX = nodeDiv.position().left+nodeDiv.parent().scrollLeft()+this.width/2;
			var endY = nodeDiv.position().top+nodeDiv.parent().scrollTop()+this.height/2;
			var p = NodeCommonProp["calcEndPoint"](endX,endY,this,lin);
			lin.endX = p["x"];
			lin.endY = p["y"];
		}
		for(var i=0;i<this.outLines.length;i++){
			var loutid = this.outLines[i];
			var lout = NodeCommonProp["findLine"](loutid);
			lout.beginX = nodeDiv.position().left+nodeDiv.width()*0.5+nodeDiv.parent().scrollLeft();
			lout.beginY = nodeDiv.position().top+nodeDiv.height()*0.5+nodeDiv.parent().scrollTop();
			
			var endnodeid = lout.toNode;
			var endnode = NodeCommonProp["findNode"](endnodeid);
			var endnodediv = $("#"+endnode["nodeProp"]["id"]);
			var endX = endnodediv.position().left+endnodediv.parent().scrollLeft()+endnode.width/2;
			var endY = endnodediv.position().top+endnodediv.parent().scrollTop()+endnode.height/2;
			var p = NodeCommonProp["calcEndPoint"](endX,endY,endnode,lout);
			lout.endX = p["x"];
			lout.endY = p["y"];
			
		}
	};
	this.htmlTmp = "<div id=\"#{div_id}#\" class=\"workflow_nodeDivDefault\" style=\"position: absolute;width: 160px;height: #{sum_height}#;\
						background-color: #EEEEEE;background-clip:padding-box;border-radius: 5px;\
						-moz-box-shadow:-1px 1px 5px #A9A9A9, 1px -1px 5px #A9A9A9;\
						-webkit-box-shadow:-1px 1px 5px #A9A9A9, 1px -1px 5px #A9A9A9;\
						box-shadow:-1px 1px 5px #A9A9A9, 1px -1px 5px #A9A9A9;\">\
						<div style=\"width: 140px;height: 30px;margin-left:10px;margin-right:10px;\">\
							#{node_title}#\
							<span id=\"#{div_id}#_delete\" style=\"float:right;width:26px;height: 17px;margin-top:4px;background-image:url('images/define_delete.png');display: #{delete_disp}#;\"></span>\
							<span id=\"#{div_id}#_link\" style=\"float:right;width:26px;height: 17px;margin-top:5px;background-image:url('images/define_link.png') \"></span>\
						</div>\
						<div name=\"node_name\" style=\"width: 150px;display: block;overflow: hidden;white-space: nowrap;text-overflow: ellipsis;height: #{content_height}#;background-color: #FFFFFF;margin-left: 5px;\
							border: #CCCCCC 1px solid;border-radius: 5px;\
							text-align: center;vertical-align: middle;line-height: 40px;\
							font-size:14px;display:#{content_disp}#\">\
							#{node_name}#\
						</div>\
					</div>";
	this.beginTitle =	"<span class=\"startNode\" style=\"float:left;width:38px;height: 28px;\
							text-align: center;vertical-align: middle;line-height: 28px;\
							font-size:14px;font-weight: bold;\">\
								开始\
							</span>";
	this.endTitle   =	"<span class=\"endNode\" style=\"float:left;width:38px;height: 28px;\
							text-align: center;vertical-align: middle;line-height: 28px;\
							font-size:14px;font-weight: bold;\">\
								结束\
							</span>";
	this.titleTmp=	"<span style=\"float:left;width:68px;height: 28px;\
								background-image:url('images/#{node_type_img}#') ;\
								text-align: center;vertical-align: middle;line-height: 28px;\
								font-size:14px;color: #FFFFFF;\">\
								#{node_type}#\
							</span>";
	this.customTitle = this.titleTmp.replace("#{node_type_img}#","define_nodetype_custom.png").replace("#{node_type}#","手动");	
	this.autoTitle = this.titleTmp.replace("#{node_type_img}#","define_nodetype_auto.png").replace("#{node_type}#","自动");
}
/**
 * 开始节点，无名称部分，无删除按钮
 */
function WorkFlowStartNode(prop){
	this.show = function(parentContainer,x,y){
		var node = new WorkFlowNode(prop["canvas"]);
		var nodehtml = node.createSelfStuct({"type":"0","id":"1"});
       	$(parentContainer).append($(nodehtml));
       	$("#1").css({"position":"absolute","left":(x+"px"),"top":(y+"px")});
       	node.initEvent({"id":"1"});
	};
}
/**
 * 结束节点，无名称部分，无删除按钮
 */
function WorkFlowEndNode(prop){
	this.show = function(parentContainer,x,y){
		var node = new WorkFlowNode(prop["canvas"]);
		var nodehtml = node.createSelfStuct({"type":"1","id":"2"});
       	$(parentContainer).append($(nodehtml));
       	$("#2").css({"position":"absolute","left":(x+"px"),"top":(y+"px")});
       	node.initEvent({"id":"2"});
	};
}
/**
 * 流程节点，有名称部分，有删除按钮
 */
function WorkFlowProcNode(prop){
	this.type = prop["type"];
	this.name = prop["name"];
	this.id = prop["id"];
	this.isNew = prop["isNew"];
	this.show = function(parentContainer,x,y,isInvert){
		if(isInvert){
			y = y;
		}else{
			y = findNewY(y);
		}
		var node = new WorkFlowNode(prop["canvas"]);
		node.nodeProp["isNew"] = true;
		NodeCommonProp["lastnodeindex"]++;
		var num = NodeCommonProp["lastnodeindex"];
		var nodehtml = node.createSelfStuct(prop);
       	$(parentContainer).append($(nodehtml));
       	$("#"+this.id).css({"position":"absolute","left":(x+"px"),"top":(y+"px")});
       	node.initEvent({"id":this.id});
       	
       	function findNewY(y){
       		var arr = NodeCommonProp["allNodes"];
       		var newy = -1;
       		for(var i=arr.length-1;i>=0;i--){
       			var n = arr[i];
       			if(n["nodeProp"]["classify"]!=0
       					&&n["nodeProp"]["classify"]!=1
       					&&(!n.hasMoved)){
       				var nodediv = $("#"+n["nodeProp"]["id"]); 
       				newy = nodediv.position().top+nodediv.parent().scrollTop()+NodeCommonProp["topOffset"];
       				break;
       			}
       		}
       		if(newy==-1){
       			newy=y;
       		}
       		return newy;
       	}
	};
}
