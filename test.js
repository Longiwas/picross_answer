const SpaceCalculation = require('./SpaceCalculation');
let test = new SpaceCalculation(4, 3);
let value = test.getValue();
while(value!==undefined){
  console.log(value);
  value = test.next();
}