const CellManager=require("CellManager");
const UnitManager=require("UnitManager");
const UserInputList=require("UserInputList");
const InputObject=require("UserInput").InputObject;
const InputType=require("UserInput").InputType;
const _=require("underscore");
const COLOR_CHOOSE=cc.color(111,111,0);
const COLOR_IDLE=cc.color(255,255,255);
var OperContext=cc.Class({
    name:"OperContext",
    properties:{
        startFlag:false,
        ctrl:null,
        unit:null,
        unitInter:null,
    },
    ctor:function(){
        this.ctrl=arguments[0];
        this.startFlag=false;
        this.unit=null;
    },
    start:function(unit){
        this.startFlag=true;
        this.unit=unit;
        this.unitInter=unit.getComponent("UnitInter");
        this.unit.getComponent("UnitMove").onStartOper(this);
    },
    oper:function(input){
        this.unit.getComponent("UserInputList").add(input);
    },
    onCtrlCancel:function(){
        if(_.isObject(this.unit)){
            this.unit.getComponent("UnitMove").cancelOper();
        }
        this.startFlag=false;
        this.unit=null;
    },
    onUnitCancel:function(){
        this.ctrl.cancelOper();
        this.startFlag=false;
        this.unit=null;
    },
    teamSame:function(unitTeam){
        return this.unit.getComponent("UnitInter").team==unitTeam;
    },
    idSame:function(unitId){
        return this.unit.getComponent("UnitBase").unitId==unitId;
    }
});
cc.Class({
    extends: cc.Component,

    properties: {
        cellManager:{
            type:CellManager,
            default:null,
        },
        unitManager:{
            type:UnitManager,
            default:null,
        },
        focusItem:{
            type:cc.Node,
            default:null,
        },
        preCell:{
            default:new cc.Vec2(-1,-1),
        },
        oper:{
            type:OperContext,
            default:null,
        },
        stayTime:0,
        staySlice:0.7,
        stayFlag:false,
        overItemCounter:0,
    },

    // use this for initialization
    onLoad: function () {
        this.bindMouseListener();
        this.oper=new OperContext(this);
    },

    /********************
    * operation on cell *
    *********************/
    isStart:function(){
        return this.oper.startFlag;
    },
    startCell:function(cell){
        this.stayTime=0;
        this.stayFlag=false;
        var startUnit=this.unitManager.unit$(cell);
        if(_.isObject(startUnit)){
            if(startUnit.getComponent("UnitInter").canOper()){
                this.oper.start(startUnit);
                this.preCell=cell;
                this.focusItem.color=COLOR_CHOOSE;
            }
        }
    },
    overCell:function(cell){
        if(!this.isStart()){
            return ;
        }
        if(cell.x==this.preCell.x&&cell.y==this.preCell.y){
            return ;
        }else{
            this.stayFlag=false;
            this.stayTime=0;
        }
        console.log("over cell : ",cell.x,cell.y);
        
        var preCell=this.preCell;
        this.preCell=cell;
        
        var unit=this.unitManager.unit$(cell);
        if(_.isObject(unit)){
            this.overItemCounter=0;
            var unitInter=unit.getComponent("UnitInter");
            if(this.oper.idSame(unitInter.getUnitId())){
                var input=new InputObject(InputType.MOVE,cell);
                this.oper.oper(input);
            }else{
                // over a enemy unit
                var input=new InputObject(InputType.OPER,cell,unitInter);
                this.oper.oper(input);
            }
        }else if(this.cellManager.canMove(cell)){
            // over a empty cell
            this.overItemCounter=0;
            var input=new InputObject(InputType.MOVE,cell);
            this.oper.oper(input);
        }else{
            if(this.cellManager.isItem(cell)){
                if(this.overItemCounter<=1){
                    this.overItemCounter+=1;
                }else if(this.overItemCounter>=2){
                    this.cancel();
                }
            }else{
                // over a unmovable cell
                this.cancel();
            }
        }
    },
    stayCell:function(){
        if(!this.isStart()){
            return ;
        }
        var targetUnit=this.unitManager.unit$(this.preCell);
        if(_.isObject(targetUnit)){
            var targetInter=targetUnit.getComponent("UnitInter");
            if(this.oper.idSame(targetInter.getUnitId())){
                return ;
            }else{
                if(this.oper.unitInter.isMoving()){
                    return ;
                }else{
                    // continue hit when stand
                    var input=new InputObject(InputType.OPER,this.preCell,targetInter);
                    this.oper.oper(input);
                }
            }
        }else{
            if(this.oper.unitInter.isMoving()){
                return ;
            }else {
                // continue move when stand
                var input=new InputObject(InputType.MOVE,this.preCell);
                this.oper.oper(input);
                return ;
            }
        }
    },
    cancel:function(){
        this.oper.onCtrlCancel();
        this.cancelOper();
    },
    // call by oper
    cancelOper:function(){
        this.stayTime=0;
        this.stayFlag=false;
        this.preCell=cc.p(-1,-1);
        this.focusItem.color=COLOR_IDLE;
        this.overItemCounter=0;
    },

    /****************
    * bind listener *
    *****************/
    bindTouchListener:function(){
        //TODO
    },
    bindMouseListener:function(){
        var thisVar=this;
        var mapNode=this.node;
        mapNode.on(cc.Node.EventType.MOUSE_DOWN,function(event){
            if(event.getButton()==cc.Event.EventMouse.BUTTON_LEFT){
                var cell=thisVar.locationToCell(event.getLocation());
                /*
                console.log("move listener:",cell.x,cell.y);*/
                if(!thisVar.isStart()){
                    thisVar.startCell(cell);
                }else{
                    thisVar.cancel()
                }
            }
        });
        var focusItem=this.focusItem;
        mapNode.on(cc.Node.EventType.MOUSE_MOVE,function(event){
            var cell=thisVar.locationToCell(event.getLocation());
            var center=thisVar.cellManager.cellToPositionAR(cell);
            focusItem.attr({
                x:center.x,
                y:center.y,
                active:true
            });
            thisVar.overCell(cell);
        });
        mapNode.on(cc.Node.EventType.MOUSE_LEAVE,function(event){
            thisVar.cancel();
            focusItem.active=false;
        });
    },
    bindTouchListener:function(){
        var thisVar=this;
        var mapNode=this.node;
        mapNode.on(cc.Node.EventType.TOUCH_START,function(event){
            var cell=thisVar.locationToCell(event.getLocation());
            if(!thisVar.isStart()){
                thisVar.startCell(cell);
            }else{
                thisVar.cancel()
            }
        });
        var focusItem=this.focusItem;
        mapNode.on(cc.Node.EventType.TOUCH_MOVE,function(event){
            var cell=thisVar.locationToCell(event.getLocation());
            var center=thisVar.cellManager.cellToPositionAR(cell);
            focusItem.attr({
                x:center.x,
                y:center.y,
                active:true
            });
            thisVar.overCell(cell);
        });
        mapNode.on(cc.Node.EventType.TOUCH_END,function(event){
            thisVar.cancel();
            focusItem.active=false;
        });
    },

    // event location to cell
    locationToCell:function(eventLocation){
        var point=this.node.convertToNodeSpace(eventLocation);
        return this.cellManager.positionToCell(point);
    },
    update:function(dt){
        if(this.stayFlag){
            this.stayTime+=dt;
            if(this.stayTime>=this.staySlice){
                this.stayCell();
                this.stayTime=0;
            }
        }
        if(this.isStart()){
            this.stayFlag=true;
        }
    }

});
