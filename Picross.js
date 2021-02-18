function Picross(rows, columns){
  this.rows = rows;
  this.columns = columns;
  //初始化
  //设置行的现有值
  //this.rows_array = new Array(rows).fill(new Array(columns).fill(-1));
  //fill传递的是引用, 所以无论多少个rows使用的都是同一个Array对象
  this.rows_array = new Array();
  for(let i=0;i<rows;i++){
    let row = new Array(columns).fill(-1);
    this.rows_array.push(row);
  }
  //设置行与列的所有穷举
  this.rows_available_array = [];
  this.columns_available_array = [];
  this.setRowAvailable = function(index, row_available_array){
    this.rows_available_array[index] = row_available_array;
  }
  this.getRowAvailable = function(index){
    return this.rows_available_array[index];
  }
  this.getRowsAvailable = function(){
    return this.rows_available_array;
  }
  this.setColumnAvailable = function(index, column_available_array){
    this.columns_available_array[index] = column_available_array;
  }
  this.getColumnAvailable = function(index){
    return this.columns_available_array[index];
  }
  this.getColumnsAvailable = function(){
    return this.columns_available_array;
  }
  //设置行与列的是否改动的标记位
  this.rows_modified = new Array(columns).fill(false);
  this.columns_modified = new Array(rows).fill(false);
  //行设置
  this.setRow = function(index, row_array){
    this.rows_array[index] = row_array;
  }
  //列设置
  this.setColumn = function(index, column_array){
    column_array.forEach((column_number, column_index)=>{
      this.rows_array[column_index][index] = column_number;
    })
  }
  //获取行
  this.getRow = function(index){
    return this.rows_array[index];
  }
  //获取列
  this.getColumn = function(index){
    let column = new Array(this.rows);
    this.rows_array.forEach(row_array=>{
      column.push(row_array[index]);
    });
    return column;
  }
  //返回全行
  this.getRows = function(){
    return this.rows_array;
  }
  //返回全列
  this.getColumns = function(){
    let columns = new Array();
    for(let i=0;i<this.columns;i++){
      columns.push(new Array(this.rows).fill(-1));
    }
    this.rows_array.forEach((row_array, row_index)=>{
      columns.forEach((column, column_index)=>{
        column[row_index] = row_array[column_index];
      })
    });
    return columns;
  }
}
module.exports=Picross;