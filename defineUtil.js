$(document).ready(function(){
	var startNode = new WorkFlowStartNode({
		"canvas" : $("#designer")[0]
	});
	startNode.show($("#designerBoard"), 50, 50,
			true);

	var endNode = new WorkFlowEndNode({
		"canvas" : $("#designer")[0]
	});
	endNode.show($("#designerBoard"), 500, 500,
			true);
});
function createAddNodeDiv(isModify) {
	//confirm($("#newnode_div").html())
	var nodeNormal = new WorkFlowProcNode({
		"name" : "新增节点",
		"type" : "3",
		"id" : (new Date().getTime()),
		"canvas" : $("#designer")[0]
	});
	nodeNormal.show($("#designerBoard"), 150, 150,
			true);
}