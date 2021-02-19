//---include---
//---Author: Weng, Xuebin---
//运行类型: 单行纯数字Picross
//Picross type: only numbers
const Picross = require('./Picross');
const SpaceCalculation = require('./SpaceCalculation');
const {calculateArrayTotalCount, calculateOverlayArray, calculateNotMatchedAvailable} = require('./utils');
let rows_length = 0;
let columns_length = 0;
let rows_numbers= [];
let columns_numbers = [];
//---init---
//初始问题答案为Momon(不死者之王)
//The initial question's answer is Momon(from Overlord)
rows_length = 15;
columns_length = 20;
rows_numbers = [
  [2,4,1],
  [1,2,5,1],
  [1,3,5,1],
  [2,1,3,3,1],
  [2,2,2,2,1],
  [2,1,2,4,1],
  [2,7,2],
  [2,1,2,1,1],
  [2,3,3,1],
  [2,3,5,3],
  [2,2,1,6],
  [3,4,5],
  [2,1,7,1],
  [1,2,3],
  [5,4],
]
columns_numbers = [
  [5,2],
  [6,1],
  [6],
  [3,1],
  [4],
  [1,2],
  [1,1,1],
  [2,2,1,1,1],
  [5,4,2],
  [1,2,2,5],
  [1,2,1,2],
  [1,2,1,1],
  [5,2,4],
  [4,2,5],
  [4,2,5],
  [3,2,5,1],
  [2,2,2,1],
  [1,1,5,2],
  [2,3,1,2],
  [1,2],
]
const picross_result = new Picross(rows_length, columns_length);
//计算每行的初始穷举值
//start create the exhaustion array of every row
rows_numbers.forEach((row_numbers, row_index)=>{
  let init_location_array = [0];
  for(let i=1;i<row_numbers.length;i++){
    init_location_array.push(init_location_array[i-1]+row_numbers[i-1]+1);
  }
  let min_value = calculateArrayTotalCount(row_numbers);
  let row_space_calculation = new SpaceCalculation(row_numbers.length, columns_length-min_value+1);
  let exhaustion_total_array = new Array();
  let row_space_value = row_space_calculation.getValue();
  while(row_space_value!==undefined){
    let exhaustion_array = new Array(columns_length).fill(0);
    for(let i=0;i<row_numbers[0];i++){
      exhaustion_array[row_space_value[0]+i] = 1;
    }
    for(let i=1;i<row_numbers.length;i++){
      for(let j=0;j<row_numbers[i];j++){
        exhaustion_array[init_location_array[i]+row_space_value[i]+j] = 1;
      }
    }
    if(exhaustion_array.length<columns_length) exhaustion_array = exhaustion_array.concat(new Array(columns_length-exhaustion_array.length).fill(0));
    exhaustion_total_array.push(exhaustion_array);
    row_space_value = row_space_calculation.next();
  }
  picross_result.setRowAvailable(row_index, exhaustion_total_array);
})
//计算每列的初始穷举值
//start create the exhaustion array of every column
columns_numbers.forEach((column_numbers, column_index)=>{
  let init_location_array = [0];
  for(let i=1;i<column_numbers.length;i++){
    init_location_array.push(init_location_array[i-1]+column_numbers[i-1]+1);
  }
  let min_value = calculateArrayTotalCount(column_numbers);
  let column_space_calculation = new SpaceCalculation(column_numbers.length, rows_length-min_value+1);
  let exhaustion_total_array = new Array();
  let column_space_value = column_space_calculation.getValue();
  while(column_space_value!==undefined){
    let exhaustion_array = new Array(rows_length).fill(0);
    for(let i=0;i<column_numbers[0];i++){
      exhaustion_array[column_space_value[0]+i] = 1;
    }
    for(let i=1;i<column_numbers.length;i++){
      for(let j=0;j<column_numbers[i];j++){
        exhaustion_array[init_location_array[i]+column_space_value[i]+j] = 1;
      }
    }
    if(exhaustion_array.length<rows_length) exhaustion_array = exhaustion_array.concat(new Array(rows_length-exhaustion_array.length).fill(0));
    exhaustion_total_array.push(exhaustion_array);
    column_space_value = column_space_calculation.next();
  }
  picross_result.setColumnAvailable(column_index, exhaustion_total_array);
})
//---running---
//每轮循环会从行开始, 然后是列, 为一轮
//Every round will start from rows and then columns
let round = 1;
let all_complete=false;
while(!all_complete){
  console.log(`The ${round} round`);
  //开始计算行
  //calculating rows
  let rows = picross_result.getRows();
  //删除所有已设置的答案与穷举项不符合的穷举项
  //ready to remove the exhaustion that not matched with the answer
  rows.forEach((row_array, row_index)=>{
    if(row_array.indexOf(-1)<0){
      //该行已完成, 跳过
      //completed. skip
      return;
    }
    let row_available_array = picross_result.getRowAvailable(row_index);
    row_available_array = calculateNotMatchedAvailable(row_array, row_available_array);
    //删除完成, 开始计算可能项
    //removed. start to calculate the overlay answer

    //如果没有穷举项, 报错
    //if there are no exhaustion. Throw exception
    if(row_available_array.length===0){
      console.log(picross_result.getRows());
      throw 'This row have no available row. Exit! row index: '+row_index;
    }
    //如果只有一个穷举项, 那就直接套用
    //if there is only one exhaustion. use it.
    else if(row_available_array.length===1){
      picross_result.setRow(row_index, row_available_array[0]);
    }
    //如果存在多个穷举项, 开始计算所有重叠值
    //if there are multiple exhaustion. calculate the overlay answer.
    else{
      //放入答案
      //put answer into the picross
      picross_result.setRow(row_index, calculateOverlayArray(columns_length, row_available_array));
    }
    picross_result.setRowAvailable(row_index, row_available_array);
  })
  //开始计算列
  let columns = picross_result.getColumns();
  columns.forEach((column_array, column_index)=>{
    if(column_array.indexOf(-1)<0){
      //该行已完成, 跳过
      return;
    }
    let column_available_array = picross_result.getColumnAvailable(column_index);
    column_available_array = calculateNotMatchedAvailable(column_array, column_available_array);
    //2. 删除完成, 开始计算可能项
    //如果没有穷举项, 报错
    if(column_available_array.length===0){
      console.log(picross_result.getColumns());
      throw 'This column have no available row. Exit! column index: '+column_index;
    }
    //如果只有一个穷举项, 那就直接套用
    else if(column_available_array.length===1){
      picross_result.setColumn(column_index, column_available_array[0]);
    }
    //如果存在多个穷举项, 开始计算所有重叠值
    else{
      //放入答案
      let overlay = calculateOverlayArray(rows_length, column_available_array);
      picross_result.setColumn(column_index, overlay);
    }
    picross_result.setColumnAvailable(column_index, column_available_array);
  })
  //输出一次答案, 确认进度
  //output the answer and confirm the progress
  picross_result.getRows().forEach((row, index)=>{
    console.log((index+1)+':'+JSON.stringify(row));
  });
  //行列计算完毕, 查看是否还有缺漏
  //if the picross has been completed
  all_complete = JSON.stringify(picross_result.getRows()).indexOf(-1)<0;
  round++;
  //防止无限循环的断路器
  //circuit breaker
  if(round>20){
    console.log('over running!');
    all_complete = true;
  }
}
console.log('Done!');
process.exit();