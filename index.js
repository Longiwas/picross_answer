// http server
const Koa = require('koa');
const Router = require('@koa/router');
const koaBody = require('koa-body');
//axios
const axios = require('axios');
const {readFileSync, writeFileSync, statSync} = require('fs');
//progress
const ProgressBar = require('progress');
//cron
const CronJob = require('cron').CronJob;
const uuid = require('uuid');
//MariaDB
const mariadb = require('mariadb');
//yaml
const YAML = require('yaml');
const {getCityName, getUsageAreaName, checkName} = require("./utils");
//---initialize---
axios.defaults.timeout=1000*60*10;
const gmp_axios = axios.create({
  baseURL: 'https://gmp.wdf.sap.corp/cgi-bin/rest/rest.pl'
});
const app = new Koa();
const router = new Router();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const calculation = {
  'default': {
    'too_many_spare': true,
    'spare': [{
      type: 'model',
      name: 'hot_spare',
      value: 'eq',
      count: 1
    }, {
      type: 'model',
      name: 'spare',
      value: 'eq',
      count: 10
    }, {
      type: 'model',
      name: 'live',
      value: 'gt',
      count: 0
    }]
  },
  'default2': {
    'too_many_spare': true,
    'spare': [{
      type: 'model',
      name: 'spare',
      value: 'eq',
      count: 10
    }, {
      type: 'model',
      name: 'live',
      value: 'gt',
      count: 0
    }]
  }
};
const yaml_filename = 'mysql';
let yaml_filedata = null;
const yaml_filepath = `${__dirname}/${yaml_filename}.yaml`;
let yaml_data = null;
try{
  statSync(yaml_filepath);
}catch(error){
  console.error(`Error! No mysql connection YAML file found!\nYou can create a mysql.yaml file in the directory of index.js.\nThis is an example of mysql.yaml:\nmysql:\n  host: 127.0.0.1\n  port: 3306\n  database: bios\n  username: root\n  password: root`);
  process.exit();
}
try{
  yaml_filedata = readFileSync(yaml_filepath, 'utf8');
}catch(error){
  console.error(`Error! Cannot read the mysql yaml file! Below is the error detail.`);
  console.error(error);
  process.exit();
}
try{
  yaml_data = YAML.parse(yaml_filedata);
}catch(error){
  console.error(`Error! Cannot read the mysql yaml file! Below is the error detail.`);
  console.error(error);
  process.exit();
}
if(yaml_data === null || Object.keys(yaml_data).length === 0){
  console.error(`Error! The mysql yaml file is empty.`);
  process.exit();
}
let {host='127.0.0.1', port=3306, database='bios', username="root", password="root"} = yaml_data["mysql"];
const pool = mariadb.createPool({
  host, port, database,
  user: username,
  password
});
const spare_array = ['Spare', 'Hot Spare'];
const disable_array = ['Currently being disassembled', 'In decommission', 'Waiting for disassembling'];
const decommission_model_array = ['BL490c G6', 'BL490c G7'];
//---router---
/*
(
  async()=>{
    let response_machines = await axios.get('https://gmp.wdf.sap.corp/cgi-bin/rest/rest.pl/cqa/v1/query/attributes/?query=BladeServers&attributes=hostname', {
      auth: {
        username: 'gmp_guest',
        password: 'guest'
      }
    }, {
      responseType: 'json'
    });
    if(response_machines.status !== 200){
      console.error('get machines error! '+response_machines.status);
      console.log(response_machines.data);
      return;
    }
    let hostnames = Object.keys(response_machines.data['BladeServer']);
    let hostnames = ['rsa6305', 'rsa6321'];
    for(let i=6306;i<=6320;i++){
      hostnames.push(`rsa${i}`);
    }
    for(let i=6322;i<=6336;i++){
      hostnames.push(`rsa${i}`);
    }
    for(let i=0;i<hostnames.length;i++){
      let hostname = hostnames[i];
      try{
        let response_machine = await axios.get(`https://gmp.wdf.sap.corp/cgi-bin/rest/rest.pl/Inventory/Blade Server/${hostname}`, {
          headers: {
            "Accept": 'application/json'
          },
          auth: {
            username: 'gmp_guest',
            password: 'guest'
          }
        });
        let remote_board_array = response_machine.data.split('REMOTE_BOARD')[1].split('\'');
        if(remote_board_array[0].indexOf(']')>=0){
          writeFileSync(`${__dirname}/hpe_data.txt`, `${new Date().toISOString()}:${hostname} is unreachable(no remote board) \n`, {flag: 'a'})
          continue;
        }
        let remote_board = remote_board_array[1];
        let ipaddr = remote_board.split(':/')[1];
        let model = response_machine.data.split('Model')[1].split('\'')[1];
        console.log(`${hostname}:${ipaddr}:${model}`);
        if(model.indexOf('Gen9')>=0){
          try{
            let data = await getGen9BIOS(ipaddr);
            let bios_data = data['Current']['SystemRomActive'][0];
            writeFileSync(`${__dirname}/hpe_data.txt`, `${new Date().toISOString()}: hostname:${hostname}\n`, {flag: 'a'})
            Object.keys(bios_data).forEach(key=>{
              writeFileSync(`${__dirname}/hpe_data.txt`, `${new Date().toISOString()}: ${key}: ${bios_data[key]}\n`, {flag: 'a'})
            })
          }catch(error){
            writeFileSync(`${__dirname}/hpe_data.txt`, `${new Date().toISOString()}:${hostname} is unreachable(connection refused) \n`, {flag: 'a'})
          }
        }else if(model.indexOf('Gen10')>0){
          try{
            let data = await getGen10BIOS(ipaddr);
            console.log(data);
            console.log(hostname+' BIOS version: '+data['Version']);
            break;
          }catch(error){
            writeFileSync(`${__dirname}/hpe_data.txt`, `${new Date().toISOString()}:${hostname} is unreachable(connection refused) \n`, {flag: 'a'})
          }
        }
      }catch(error){
        console.log(error);
        return;
      }finally{

      }*/
      /*let {model, url, ip_address} = hpe_data_list[hostname];
      if(model.indexOf('Gen9')>0){
        try{
          let data = await getGen9BIOS(url);
          console.log(hostname+' BIOS version: '+data['Current']['SystemRomActive'][0]['VersionString']);
          break;
        }catch(error){
          console.log(hostname+' is unreachable');
        }
      }else if(model.indexOf('Gen10')>0){
        try{
          let data = await getGen10BIOS(url);
          console.log(data);
          console.log(hostname+' BIOS version: '+data['Version']);
          break;
        }catch(error){
          console.log(hostname+' is unreachable');
        }
      }
    }*/
    //process.exit();
    /*
    const bar = new ProgressBar('Machines Progress: :bar :current / :total', { total: hostname_list.length });
    for(let i=0;i<hostname_list.length;i++){
      let hostname = hostname_list[i];
      try{
        let response = await axios.get(`https://gmp.wdf.sap.corp/cgi-bin/rest/rest.pl/Inventory/Blade%20Server/${hostname}`, {
          headers: {
            "Accept": 'application/json'
          },
          auth: {
            username: 'gmp_guest',
            password: 'guest'
          }
        });
        let host_info = response.data;
        let model = host_info.split('Model => ')[1].split("'")[1].split("'")[0];
        let remote_board = host_info.split('REMOTE_BOARD => ')[1].split("'")[1].split("'")[0].split(':/');
        let url = remote_board[0];
        let ip_address = remote_board[1];
        hpe_data_list[hostname] = {
          model, url, ip_address
        };
      }catch(error){
        console.log('hostname: '+hostname);
      }finally{
        bar.tick();
      }
    }
    writeFileSync(`${__dirname}/hpe_data.json`, JSON.stringify(hpe_data_list));*/
  //}
//)();
router.get('/machine', async(ctx, next)=>{
  let {query} = ctx;
  let connection;
  let page = ctx.get('page') || 0;
  let limit = ctx.get('limit') || 20;
  try{
    connection = await pool.getConnection();
    let get_machines_result = await connection.query(`select * from machine limit ${limit} offset ${page*limit}`);
    if(get_machines_result.length===0){
      ctx.status = 204;
    }else{
      ctx.status = 200;
      ctx.body = get_machines_result;
    }
  }catch(error){
    console.log(error);
    ctx.status = 500;
    ctx.body = error;
  }finally{
    if(connection) connection.release();
    await next();
  }
})

/**
 * [{
 *   key: 'Shanghai',
 *   name: 'Shanghai',
 *   type: 'city',
 *   enough_spare: 11,
 *   not_enough_spare: 20,
 *   children:[{
 *     name: 'NGJP',
 *     type: 'lob',
 *     enough_spare: 11,
 *     not_enough_spare: 20,
 *     children[{
 *       name: 'PROD-SHA1',
 *       type: 'pool',
 *       total: 23,
 *       live: 23,
 *       spare: {
 *         "ProLiant DL360 Gen10": {
 *           spare: 2,
 *           hot_spare: 1,
 *           live: 20,
 *           enough_spare: true
 *         }
 *       }
 *       children: [
 *         {
 *           name: 'rsa1234',
 *           state: 'Spare',
 *           model: 'HPE 12345 Gen10',
 *           memory: 123456789,
 *           desc: 'HPE 12345 Gen10, Last update date: 2020-01-01 08:04',
 *           type: 'machine',
 *         }
 *       ]
 *     }]
 *   }]
 * 
 * }]
 * 
 * 
 */
.get('/machine/overview', async(ctx, next)=>{
  let {calc} = ctx.query;
  let connection;
  let current_calculation = calculation[calc];
  ctx.set('currentCalculation', calc);
  if(current_calculation === undefined){
    current_calculation = calculation['default'];
    ctx.set('currentCalculation', 'default');
  }
  try{
    connection = await pool.getConnection();
    let get_machines_result = await connection.query('select id, pool, state, model, host, memory, city, usageAreas, last_update_time from machine where model is not null and location is not null and pool is not null and city is not null and usageAreas is not null');
    let overview_data = [];
    get_machines_result.forEach(machine=>{
      //get key info and save it.
      let {pool, state, model, host, memory, city, usageAreas, last_update_time} = machine;
      //First, put and combine all data to an object
      //city
      //console.log(overview_data);
      let city_data = getNameMatchedItem(overview_data, city);
      if(city_data === null){
        city_data = {
          key: uuid.v1(),
          name: city,
          type: 'city',
          enough_spare: 0,
          not_enough_spare: 0,
          children: [],
        }
        overview_data.push(city_data);
      }
      //lob
      let lob = getNameMatchedItem(city_data.children, usageAreas);
      if(lob === null){
        lob = {
          key: uuid.v1(),
          name: usageAreas,
          type: 'lob',
          enough_spare: 0,
          not_enough_spare: 0,
          children: [],
        };
        city_data.children.push(lob);
      }
      //pool
      let pool_current = getNameMatchedItem(lob.children, pool);
      if(pool_current === null){
        pool_current = {
          key: uuid.v1(),
          name: pool,
          type: 'pool',
          total: 0,
          live: 0,
          spare: {},
          children: [],
        };
        lob.children.push(pool_current);
      }
      //machine
      let machine_data = getNameMatchedItem(pool_current.children, host);
      let {spare, children} = pool_current;
      if(machine_data === null){
        pool_current.total++;
        children.push({
          name: host,
          state,
          model,
          memory,
          enough_spare: false,
          type: 'machine',
        });
        //if this model has been decommissioned, return
        let decommission_flag = decommission_model_array.every(item=>{
          return model.indexOf(item)<0;
        });
        if(!decommission_flag) return;
        if(spare[model]){
          let spare_item = spare[model];
          if(state === 'Hot Spare'){
            spare_item.hot_spare++;
          }else if(state === 'Spare'){
            spare_item.spare++;
          }else if(disable_array.indexOf(state)<0){
            spare_item.live++;
            pool_current.live++;
          }
        }else{
          //add a new spare info for this model in this pool
          let default_spare = {
            spare: 0,
            hot_spare: 0,
            live: 0
          };
          if(state === 'Hot Spare'){
            default_spare.hot_spare++;
          }else if(state === 'Spare'){
            default_spare.spare++;
          }else if(disable_array.indexOf(state)<0){
            default_spare.live++;
            pool_current.live++;
          }
          spare[model] = default_spare
        }
      }
      /*
      //pool
      let pool_array = city_data.children;
      //check if the machine's pool is exist in the city
      let pool_notexist = pool_array.every(item=>{
        //pool is exist
        if(item.name === pool){
          //add machine to the pool
          item.children.push({
            key: host,
            name: host,
            state,
            type: 'machine',
            memory,
            model,
            desc: `${model}, Last update date: ${last_update_time.toISOString().slice(0, 19).replace(/T/g, " ")}`
          });
          pool.total++;
          //calculate the count
          //count of this model is exist in this pool
          if(item.spare[model]){
            let spare = item.spare[model];
            if(spare_array.indexOf(state)>0){
              if(state === 'Hot Spare') spare.hot_spare++;
              else spare.spare++;
            }else if(disable_array.indexOf(state)<0){
              spare.live++;
            }
          }else{
            //add a new spare info for this model in this pool
            let default_spare = {
              spare: 0,
              hot_spare: 0,
              live: 0
            };
            if(spare_array.indexOf(state)>0){
              if(state === 'Hot Spare') default_spare.hot_spare++;
              else default_spare.spare++;
            }else if(disable_array.indexOf(state)<0){
              default_spare.live++;
            }
            item.spare[model] = default_spare
          }
          return false;
        }else return true;
      });
      //if pool is not exist. add it.
      if(pool_notexist){
        //if this model has been decommissioned, return
        let decommission_flag = decommission_model_array.every(item=>{
          return model.indexOf(item)<0;
        });
        if(!decommission_flag){
          city_data.children.push({
            key: pool,
            name: pool,
            enough_spare: false,
            type: 'pool',
            total: 1,
            spare: {
              [model]: {
                spare: 0,
                hot_spare: 0,
                live: 0
              }
            },
            children: [{
              key: host,
              name: host,
              state,
              type: 'machine',
              model,
              memory,
              desc: `${model}, Last update date: ${last_update_time.toISOString().slice(0, 19).replace(/T/g, " ")}`
            }],
          });
        }else{
          city_data.children.push({
            key: pool,
            name: pool,
            total: 1,
            spare: {
              [model]: {
                spare: state==='Spare'?1:0,
                hot_spare: state==='Hot Spare'?1:0,
                live: (spare_array.indexOf(state)<0 && disable_array.indexOf(state)<0)?1:0
              }
            },
            type: 'pool',
            children: [{
              key: host,
              name: host,
              state,
              type: 'machine',
              model,
              memory,
              desc: `${model}, Last update date: ${last_update_time.toISOString().slice(0, 19).replace(/T/g, " ")}`
            }],
            enough_spare: false,
          });
        }
      }*/
    });
    //Second, calculate the status of every pool & city
    overview_data.forEach(city=>{
      let lob_array = city.children;
      for(let i=0;i<lob_array.length;i++){
        let lob = lob_array[i];
        let pool_array = lob.children;
        for(let j=0;j<pool_array.length;j++){
          let pool = pool_array[j];
          let pool_status = new Array();
          current_calculation.spare.forEach(item=>{
            if(item.type === 'model'){
              let models = Object.keys(pool.spare);
              for(let i=0;i<models.length;i++){
                let model = models[i];
                let model_spare = pool.spare[model];
                pool_status.push(checkName(item, model_spare));
              }
            }
          })
          /*Object.keys(pool.spare).forEach(model=>{
            let {spare, hot_spare, live} = pool.spare[model];
            let enough_spare = spare>0 && hot_spare>0 && live>0 && spare*10>=live
            pool.spare[model].enough_spare = enough_spare;
            pool.live+=live;
            pool_status.push(enough_spare);
          })
          Object.keys(pool.spare).every(model=>{
            let {spare, hot_spare, live} = pool.spare[model];
            pool.spare[model].enough_spare = spare>0 && hot_spare>0 && live>0 && spare*10>=live;
            return pool.spare[model].enough_spare;
          })*/
          if(pool_status.length>0 && pool_status.indexOf(false)<0){
            lob.enough_spare++;
            city.enough_spare++;
            pool.enough_spare = true;
          }
          else{
            lob.not_enough_spare++;
            city.not_enough_spare++;
          }
          pool.children.sort((a, b)=>{
            if(a.model > b.model){
              return -1;
            }else if(a.model === b.model){
              if(spare_array.indexOf(a.state)>=0 && spare_array.indexOf(b.state)<0){
                return -1;
              }else if(spare_array.indexOf(a.state)<0 && spare_array.indexOf(b.state)>=0){
                return 1;
              }else if(disable_array.indexOf(a.state)<0 && disable_array.indexOf(b.state)>=0){
                return -1;
              }else if(disable_array.indexOf(a.state)>=0 && disable_array.indexOf(b.state)<0){
                return 1;
              }else if(spare_array.indexOf(a.state)===1 && spare_array.indexOf(b.state)===0){
                return -1;
              }else if(spare_array.indexOf(a.state)===0 && spare_array.indexOf(b.state)===1){
                return 1;
              }else if(disable_array.indexOf(a.state)>=0 && disable_array.indexOf(b.state)>=0){
                if(a.state>b.state) return -1;
                else return 1;
              }else if(a.state === b.state){
                if(a.name>b.name) return -1;
                else return 1;
              }
            }else return 1;
          });
        }
        lob.children.sort((a, b)=>{
          if(a.enough_spare && !b.enough_spare) return -1;
          else if(!a.enough_spare && b.enough_spare) return 1;
          else if(a.live>b.live) return -1;
          else if(a.live<b.live) return 1;
          else{
            if(a.name>b.name) return 1;
            else return -1;
          }
        });
      }
    })
    /*overview_data.forEach(city=>{
      let enough_spare = 0;
      let not_enough_spare = 0;
      let city_children = city.children;
      for(let i=0;i<city_children.length;i++){
        let pool = city_children[i];
        let pool_status = Object.keys(pool.spare).every(model=>{
          let {spare, hot_spare, live} = pool.spare[model];
          pool.spare[model].enough_spare = spare*10>=live && hot_spare>0;
          return pool.spare[model].enough_spare;
        })
        if(pool_status){
          enough_spare++;
          pool.enough_spare = true;
        }
        else if(pool.total_memory>0){
          not_enough_spare++;
        }
        pool.children.sort((a, b)=>{
          if(a.model > b.model){
            return -1;
          }else if(a.model === b.model){
            if(spare_array.indexOf(a.state)>=0 && spare_array.indexOf(b.state)<0){
              return -1;
            }else if(spare_array.indexOf(a.state)<0 && spare_array.indexOf(b.state)>=0){
              return 1;
            }else if(disable_array.indexOf(a.state)<0 && disable_array.indexOf(b.state)>=0){
              return -1;
            }else if(disable_array.indexOf(a.state)>=0 && disable_array.indexOf(b.state)<0){
              return 1;
            }else if(spare_array.indexOf(a.state)===1 && spare_array.indexOf(b.state)===0){
              return -1;
            }else if(spare_array.indexOf(a.state)===0 && spare_array.indexOf(b.state)===1){
              return 1;
            }else if(disable_array.indexOf(a.state)>=0 && disable_array.indexOf(b.state)>=0){
              if(a.state>b.state) return -1;
              else return 1;
            }else if(a.state === b.state){
              if(a.name>b.name) return -1;
              else return 1;
            }
          }else return 1;
        });
      }
      city_children.sort((a, b)=>{
        if(a.enough_spare && !b.enough_spare) return -1;
        else if(!a.enough_spare && b.enough_spare) return 1;
        else if(a.total_memory>b.total_memory) return -1;
        else if(a.total_memory<b.total_memory) return 1;
        else{
          if(a.name>b.name) return 1;
          else return -1;
        }
      });
      city.enough_spare = enough_spare;
      city.not_enough_spare = not_enough_spare;
    });*/
    overview_data.sort((a, b)=>{
      if(a.name>b.name) return 1;
      else return -1;
    })
    ctx.body = overview_data;
  }catch(error){
    console.error(error);
    ctx.status = 500;
    ctx.body = error;
  }finally{
    if(connection){
      connection.release();
    }
    await next();
  }
})
.get('/machine/list', async(ctx, next)=>{
  connection = await pool.getConnection();
  let get_machines_result = await connection.query('select * from machine where model is not null and location is not null and pool is not null and city is not null and usageAreas is not null');
  if(get_machines_result.length>0){
    ctx.body = get_machines_result;
  }else{
    ctx.status = 204;
  }
  await next();
})
.get('/machine/data/refresh', async(ctx, next)=>{
  getGMPData(full_data_url);
  ctx.status = 204;
  await next();
})
.get('/machine/status', async(ctx, next)=>{
  ctx.status = 200;
  await next();
})
.get('/machine/calculation/list', async(ctx, next)=>{
  ctx.body=[{
    key: 'default',
    value: 'Default'
  }, {
    key: 'default2',
    value: 'NoHotSpare'
  }];
  await next();
})
.get(`/machine/calculation`, async(ctx, next)=>{
  let {query: {id}} = ctx;
  ctx.body = calculation[id];
  await next();
})
//---utils functions---
const full_data_url = `https://gmp.wdf.sap.corp/cgi-bin/rest/rest.pl/cqa/v1/query/attributes/
?query=BladeServers
&attributes=model
&attributes=memory
&attributes=buildingBlock
&attributes=biosrevision
&attributes=firmware
&attributes=firmwarerevision
&attributes=location
&attributes=usageAreas.linesOfBusiness
&attributes=pool
&attributes=state`;

const status_data_url = `https://gmp.wdf.sap.corp/cgi-bin/rest/rest.pl/cqa/v1/query/attributes/
?query=BladeServers
&attributes=location
&attributes=pool
&attributes=state`;
async function getGMPData(url){
  console.log(new Date().toISOString()+':update data start');
  let response_machines = await axios.get(url, {
    auth: {
      username: 'gmp_guest',
      password: 'guest'
    }
  }, {
    responseType: 'json'
  });
  console.log(new Date().toISOString()+':GMP data received.');
  let bladeservers = response_machines.data['BladeServer'];
  let hosts = Object.keys(bladeservers);
  let connection;
  try{
    connection = await pool.getConnection();
    for(let i=0;i<hosts.length;i++){
      let host = hosts[i];
      let data = bladeservers[host];
      let select_host_result = await connection.query('select id from machine where host = ?', [host]);
      try{
        data = setRealKey(data);
      }catch(error){
        console.log(data);
        throw error;
      }
      if(select_host_result.length===0){
        await insertMachine({connection, host, data});
      }else{
        let machine_id = select_host_result[0].id
        await updateMachine({connection, machine_id, data});
      }
      if(i%500==0){
        console.log(`${new Date().toISOString()}:${i}/${hosts.length}`);
      }
    }
  }catch(error){
    console.error(error);
    return;
  }finally{
    if(connection){
      connection.release();
    }
    console.log(new Date().toISOString()+':update data complete');
  }
}
async function insertMachine({connection, host, data}){
  let {model, memory, buildingBlock, biosrevision, firmware, firmwarerevision, location, pool, state} = data;
  let id = uuid.v1().replace(/-/g, '');
  let city = getCityName(location);
  let usageArea = getUsageAreaName(data['usageAreas.linesOfBusiness']);
  try{
    await connection.query(`insert into machine values(?, ?, null, null, ?, ?, ?, ?, ?, ?, ?, ?, ?, false, ?, ?, now())`,[id, host, model, memory, buildingBlock, biosrevision, firmware, firmwarerevision, location, pool, state, city, usageArea]);
  }catch(error){
    console.error(`insert into machine values('${id}', '${host}', null, null, '${model}', ${memory}, '${buildingBlock}', '${biosrevision}', '${firmware}', '${firmwarerevision}', '${location}', '${pool}', '${state}', false)`);
  }
}
async function updateMachine({connection, machine_id, data}){
  let conditions = [];
  let values = [];
  ['model', 'memory', 'buildingBlock', 'biosrevision', 'firmware', 'firmwarerevision', 'location', 'pool', 'state'].forEach(key=>{
    let value = data[key];
    conditions.push(`${key} = ?`);
    values.push(value);
  });
  conditions.push(`city = ?`);
  values.push(getCityName(data['location']));
  conditions.push(`usageAreas = ?`);
  values.push(getUsageAreaName(data['usageAreas.linesOfBusiness']));
  values.push(machine_id);
  try{
    await connection.query(`update machine set last_update_time = now() ,${conditions.join(' , ')} where id = ?`, values);
  }catch(error){
    console.error(error);
    console.error(`update machine set ${conditions.join(' , ')} where id = ?`);
    console.error(values);
    return;
  }
}
function getNameMatchedItem(lob_array, lob_name){
  let item = null;
  lob_array.some(lob=>{
    if(lob.name === lob_name){
      item = lob;
      return true;
    }else return false;
  });
  return item;
}
function setRealKey(data){
  Object.keys(data).forEach(key=>{
    let realkey = key.replace(/\n/g, '').replace(/ /g, '');
    if(data[key] === "" || data[key] === null){
      data[realkey] = null;
    }else if(data[key] && typeof(data[key]) === 'string'){
      data[realkey] = data[key].replace(/\//g, '\\').replace(/%/g, '\%').replace(/_/g, '\_').replace(/"/g, '\"').replace(/'/g, '\'');
    }else{
      data[realkey] = data[key];
    }
  })
  return data;
}
function getGen9BIOS(hostname){
  return new Promise(async (yes, no)=>{
    try{
      let response_bios = await axios.get(`https://${hostname}/redfish/v1/systems/1/FirmwareInventory?$expand=.`, {
        auth: {
          "username": "support",
          "password": "remote4SAP"
        },
        responseType: 'json'
      });
      yes(response_bios.data)
    }catch(error){
      no(error);
    }
  })
}
function getGen10BIOS(hostname){
  return new Promise(async (yes, no)=>{
    try{
      let response_bios = await axios.get(`https://${hostname}/redfish/v1/UpdateService/FirmwareInventory/2`, {
        auth: {
          "username": "support",
          "password": "remote4SAP"
        },
        responseType: 'json'
      });
      yes(response_bios.data)
    }catch(error){
      no(error);
    }
  })
}

//---final---
app.use(router.routes());
app.on('error', (err, ctx)=>{
  logs.error(`Error: ${ctx.path} ;status: ${err.status} ;body: ${err.body}`);
})
app.listen(8080);
console.log('KOA running on 8080');
const read_gmp_data_cron = new CronJob({
  cronTime: '0 0 * * *',
  timeZone: 'Europe/Berlin',
  onTick: function(){
    getGMPData(full_data_url);
  }
});
read_gmp_data_cron.start();
