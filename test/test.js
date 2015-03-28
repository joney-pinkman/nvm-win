/**
 * Created by Administrator on 15-3-19.
 */
var assert = require('assert');
var fs = require('fs'),
    fsExt = require('../util/fsExt');
var path = require('path');
var nvm = require('../util/func');

// add fs extend function
for(var i in fsExt){
    if(!fs[i]){
        fs[i] = fsExt[i];
    }
}

describe('nvm-win',function(){

    describe('initial',function(){

        it('should create a folder named \'version\', a config json file recorded the nodeJs execute path and current version.',function(done){
             nvm.init(function(e){
                 if(e) return done(e);
                 try{
                     var existsPath = fs.existsSync('../version');
                     var existsConfig = fs.existsSync('../config.json');
                     var config = require('../config.json');

                     if(existsPath && existsConfig &&
                         config.node_path == process.execPath &&
                         config.node_curr == process.version.slice(1)){

                         done();
                     }
                 }catch(e){
                     done(e);
                 }


             })
        });

    });
    var version = (function(){
        var minor = (process.version.slice(1).split('.'))[1];
        if(Number(minor) < 9 || Number(minor) == 12){
            return '0.10.0'
        }else{
            return '0.'+ (Number(minor) + 1) + '.0'
        }
    })();

    describe('install',function(){
        //2 minitues for download
        this.timeout(120000);
        it('should be install success and the file is downloaded under the version path,the test case maybe fail if your internet environment is not well',function(done){
            nvm.install(version,done)
        });

    });
    describe('list',function(){
        it('should be list the versions you installed',function(done){
            nvm.list(done);
        });
    });

    /*
    describe('use',function(){
        it('should be transform the nodeJs version if you need',function(done){
            nvm.use(version,function(e){
                if(e) return done(e);
                var child = require('child_process').spawn('node',['-v']);

                child.stdout.on('data',function(data){
                    if(version == data.toString().slice(1)){
                        done();
                    }else{
                        done(new Error('node version is '+ data.toString().slice(1)));
                    }
                });
            })
        })
    });
    */

    describe('uninstall',function(){
        it('should be uninstall the version you install recently',function(done){
            nvm.uninstall(version,done);
        })
    });

    after(function(done){
        try{
            if(fs.existsSync('../config.json')){
                fs.unlinkSync('../config.json');
            }
            if(fs.existsSync('../nodeTmp.exe')){
                fs.unlinkSync('../nodeTmp.exe');
            }
            fs.deleteFolder('./version',done);
        }catch(e){
            done(e);
        }
    });
});

