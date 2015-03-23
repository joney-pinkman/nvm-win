#!/usr/bin/env node

var program = require('commander'),
    fs = require('fs'),
    path = require('path'),
    func = require('./util/func'),
    package = require('./package.json');

var config = {};
if(fs.existsSync(path.join(__dirname,'config.json'))){
    config = require(path.join(__dirname,'config.json'));
}

program
    .version(package.version);

program
    .command('initial')
    .alias('init')
    .description('initial this program execute environment.')
    .action(function(){
        func.init(function(e){
            callback(e,'initial success');
        })
    });
program
    .command('install <version>')
    .description('input a nodeJs version number you need to install,input \'latest\',you can install the latest version of nodeJs.')
    .action(function(version){
        //if not initial
        if(!config['node_path']){
            return callback(new Error('you have not initial this program,please execute command \'initial\'.'));
        }
        var cb  =function(e){
            callback(e,'install success');
        }
        //latest
        func.install(version,cb);
    });

program
    .command('uninstall <version>')
    .description('uninstall a nodeJs version you have given or all of these. input \'all\', you can remove all of them.')
    .action(function(version){
        //if not initial
        if(!config['node_path']){
            return callback(new Error('you have not initial this program,please execute command \'initial\' '));
        }
        version = version || '';
        if(!version){
            return callback(new Error('you are not input a version of nodeJs.'));
        }
        var cb = function(e){
            callback(e,'uninstall success');
        }
        func.uninstall(version,cb);

    });

program
    .command('list')
    .alias('ls')
    .description('list all of nodeJs version you have installed.')
    .action(function(){
        if(!config['node_path']){
            return callback(new Error('you have not initial this program,please execute command \'initial\'.'));
        }
        var cb = function(e,versions){
            if(e) return callback(e);
            var msg = [];
            versions.forEach(function(version){
                if(config['node_curr'] == version){
                    msg.push(' * '+ version);
                }else{
                    msg.push('   '+ version);
                }
            });
            callback(null,msg);

        }
        func.list(cb);
    });

program
    .command('use <version>')
    .description('use the nodeJs version you have givenned.')
    .option('-a,--auto','if the version you have givenned is not exists,it will try to install this version if the version is existed.')
    .action(function(version,options){
        options.auto = options.auto || false;
        if(!config['node_path']){
            return callback(new Error('you have not initial this program,please execute command \'initial\' '));
        }
        var cb = function(e){
            callback(e,'transform version success.');
        }
        func.use(version,options.auto,cb);
    });

program.parse(process.argv);
if(!program.args.length) program.help();


function callback(e,msg){
    var tip = [''];
    if(e) tip.push(e.toString());
    else if(typeof msg == 'string') tip.push(msg|| '');
    else if(msg instanceof Array){
        msg.forEach(function(item){
            tip.push(item);
        });
    }
    tip.forEach(function(item){
        console.log('\t%s',item);
    });
}

