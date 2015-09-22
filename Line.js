function WorkFlowLine(x,y,x1,y1){
	this.beginX=x;
	this.beginY=y;
	this.endX = x1;
	this.endY = y1;
	this.lineWidth = 8;
	this.arrowWidth = 14;
	this.arrowHeight=18;
	this.fromNode=null;//起始节点的ID
	this.toNode=null;//结束节点的ID
	this.userFilter="";
	/**
	 * 连线属性对象
	 */
	this.lineProp={
		"name":"",
		"id":"",
		"userFilter":"",
		"branchMark":"",
		"filter_paramsJson":""
	};
	this.calcRotateValue=function(x1,y1){
		var tanvalue = Math.abs(y1-this.beginY)/Math.abs(x1-this.beginX);
		var pivalue = Math.atan(tanvalue);
		if(y1>this.beginY&&x1<this.beginX){
			pivalue = Math.PI-pivalue;
		}else if(y1<=this.beginY&&x1<this.beginX){
			pivalue = Math.PI+pivalue;
		}else if(y1<this.beginY&&x1>=this.beginX){
			pivalue = Math.PI*2-pivalue;
		}
		return pivalue;
	};
	this.drawFunc=function(ctx,color){
		ctx.save();
		ctx.beginPath();
		var pivalue = this.calcRotateValue(this.endX,this.endY);
		ctx.translate(this.beginX,this.beginY);
		ctx.rotate(pivalue);
		var ex = Math.sqrt(Math.pow((this.endX-this.beginX),2)+Math.pow((this.endY-this.beginY),2));
		var ey = 0;
		var bx = 0;
		var by = 0;
		ctx.fillStyle=color;
		ctx.moveTo(bx,by+this.lineWidth*0.5);
		ctx.lineTo(ex-this.arrowHeight,by+this.lineWidth*0.5);
		ctx.lineTo(ex-this.arrowHeight,by+this.arrowWidth);
		ctx.lineTo(ex,by);
		ctx.lineTo(ex-this.arrowHeight,by-this.arrowWidth);
		ctx.lineTo(ex-this.arrowHeight,by-this.lineWidth*0.5);
		ctx.lineTo(bx,by-this.lineWidth*0.5);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	};
	this.drawLine = function(ctx,selected){
		var color1 = $("#lineSelected").css("color");
		var color2 = $("#lineDefault").css("color");
		var color = selected?color1:color2;
		this.drawFunc(ctx,color);
	};
	this.isPointOnLine = function(pointx,pointy){
		var pivalue1 = this.calcRotateValue(this.endX,this.endY);
		var pivalue2 = this.calcRotateValue(pointx,pointy);
		if(this.beginX<this.endX){
			if(pointx<this.beginX||pointx>this.endX){
				return false;
			}
		}else{
			if(pointx<this.endX||pointx>this.beginX){
				return false;
			}
		}
		if(this.beginY<this.endY){
			if(pointy<this.beginY||pointy>this.endY){
				return false;
			}
		}else{
			if(pointy<this.endY||pointy>this.beginY){
				return false;
			}
		}
		if(Math.abs(pivalue2-pivalue1)<=0.1){
			return true;
		}
		return false;
	};
}
