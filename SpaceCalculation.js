function SpaceCalculation(length, max){
  this.value = new Array(length).fill(0);
  this.max = max;
  this.getValue=function(){
    return this.value;
  };
  this.next = function(){
    let set = new Set(this.value)
    if(set.size === 1 && set.has(this.max-1)){
      return undefined;
    }
    for(let i=this.value.length-1;i>=0;i--){
      if(this.value[i]+1>=this.max){
        //进位
        continue;
      }else{
        //+1
        this.value[i]++;
        for(let j=i+1;j<=this.value.length-1;j++){
          this.value[j] = this.value[i];
        }
        break;
      }
    }
    return this.value;
  }
}
module.exports=SpaceCalculation;