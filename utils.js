function calculateArrayTotal1Count(row_array){
  let count = 0;
  row_array.forEach(node => {
    if(node>0) count++;
  });
  return count;
}
function calculateArrayTotalCount(row_array){
  let count = 0;
  row_array.forEach(node => count=count+node+1);
  return count-1;
}
function calculateNotMatchedAvailable(node_array, node_available_array){
  let node_available_return = [];
  let removed_index_set = new Set();
  for(let node_index=0;node_index<node_array.length;node_index++){
    let node = node_array[node_index];
    if(node === -1){
      continue;
    }else{
      for(let i=0;i<node_available_array.length;i++){
        if(node_available_array[i][node_index] !== node){
          removed_index_set.add(i);
        }
      }
    }
  }
  let removed_index_array = Array.from(removed_index_set);
  for(let node_available_index=0;node_available_index<node_available_array.length;node_available_index++){
    if(removed_index_array.indexOf(node_available_index)<0){
      node_available_return.push(node_available_array[node_available_index]);
    }
  }
  return node_available_return;
}
function calculateOverlayArray(length, node_available_array){
  let node_overlay_array = new Array(length).fill(-1);
  for(let i=0;i<length;i++){
    let index_value = -1;
    let index_flag = true;
    for(let j=0;j<node_available_array.length;j++){
      let node_available = node_available_array[j];
      if(index_value === -1){
        index_value = node_available[i];
      }else if(index_value !== node_available[i]){
        index_flag = false;
        break;
      }
    }
    if(index_flag && index_value>-1){
      node_overlay_array[i] = index_value;
    }
  }
  return node_overlay_array;
}
module.exports={
  calculateArrayTotal1Count,
  calculateArrayTotalCount,
  calculateNotMatchedAvailable,
  calculateOverlayArray,
}