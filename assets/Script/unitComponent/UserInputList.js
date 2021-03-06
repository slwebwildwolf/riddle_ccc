cc.Class({
    extends: cc.Component,

    properties: {
        inputArray:{
            visible:false,
            default:[],
        },
        currentIndex:{
            visible:false,
            default:0,
        },
    },

    // use this for initialization
    onLoad: function () {
        this.inputArray=[];
    },

    add:function(inputObject){
        this.inputArray.push(inputObject);
    },
    shift:function(){
        if(this.currentIndex>=this.inputArray.length){
            this.inputArray=[];
            return null;
        }else{
            return this.inputArray[this.currentIndex++];
        }
    },
    clear:function(){
        this.inputArray=[];
        this.currentIndex=0;
    },
    isFinished:function(){
        return this.currentIndex>=this.inputArray.length;
    },
    getCurrentInput:function(){
        return this.inputArray[this.currentIndex]
    },
    getNextInput:function(){
        return this.inputArray[this.currentIndex+1];
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
