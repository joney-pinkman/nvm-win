/**
 * Created by Administrator on 15-3-20.
 */
var request = require('request'),
    fs = require('fs'),
    path = require('path'),
    fsExt = require('./fsExt');


// add fs extend function
for(var i in fsExt){
    if(!fs[i]){
        fs[i] = fsExt[i];
    }
}

var nodeTmpPath = path.join(__dirname,'..','nodeTmp.exe'),
    configPath = path.join(__dirname,'..','config.json'),
    versionPath = path.join(__dirname,'..','version'),
    getVersionPath = function(version){
        return path.join(versionPath,version +'.exe');
    };

var config = {};
if(fs.existsSync(configPath)){
    config = require(configPath);
}
module.exports = {
    init:init,
    use:use,
    list:list,
    install:install,
    uninstall:uninstall
};

function init(cb){
    var versionCurr = process.version.slice(1),
        nodePath = process.execPath;
    //edit for git bash
    fs.copyFile(path.join(__dirname,'../bash/nvm-win'),path.join(__dirname,'../../../'),true,function(e){
        if(e) return cb(e);
        //edit for windows cmd shell
        fs.copyFile(path.join(__dirname,'../bash/nvm-win.cmd'),path.join(__dirname,'../../../'),true,function(e){
            if(e) return cb(e);
            fs.copyFile(nodePath,getVersionPath(versionCurr),true,function(e1){
                if(e1) return cb(e1);
                fs.exists(nodeTmpPath,function(exists){
                    if(exists) return cb();

                    fs.copyFile(nodePath,nodeTmpPath,true,function(e2){
                        if(e2) return cb(e2);
                        config['node_path'] = nodePath;
                        config['node_curr'] = versionCurr;
                        fs.writeFile(configPath,JSON.stringify(config),{flag:'w+'},cb);
                    });
                });

            });
        });
    });

}

function versionParse(version){
    if(!version) return false;
    if(version.indexOf('.') <= 0){
        version = parseInt(version);
        if(isNaN(version) || version > 12){
            return false;
        }else{
            return '0.'+version+'.0';
        }
    }else{
        var verArr = version.split('.');

        for(var i =0; i < verArr.length; i++){
            verArr[i] = parseInt(verArr[i]);
            if(isNaN(verArr[i])){
                return false;
            }
        }
        if(verArr.length == 2){
            return '0.' + verArr[0] + '.' + verArr[1];
        }else{
            return verArr[0] + '.' + verArr[1] + '.' + verArr[2];
        }

    }
}

function uninstall(version,cb){

    if(version !== 'all'){

        version = versionParse(version);
        if(!version){
            return cb(new Error('can\'t parse the version you input'));
        }
        var path = getVersionPath(version);
        fs.exists(path,function(exists){
            if(!exists){
                return cb(new Error('you are not install this version.'));
            }
            fs.unlink(path,cb);

        })
    }else{
        fs.readdir(versionPath,function(e,files){
            if(e) return cb(e);
            if(files.length == 0) return cb(null);
            process.stdout.write('\tAre you sure ? (y/n)');
            process.stdin.on('data',function(data){
                var matchY = data.toString().match(/^y/i),
                    matchN = data.toString().match(/^n/i);
                if(matchY){
                    var count = 0;
                    files.forEach(function(file){
                        fs.unlink(path.join(versionPath,file),function(e){
                            if(e) return cb(e);
                            count++;
                            if(count == files.length){
                                cb(null);
                                process.exit(0);
                            }
                        });
                    });
                }else if(matchN){
                    process.exit(0);
                }else{
                    process.stdout.write('\n\ty/n')
                }

            });
        });

    }
}
function list(cb){
    fs.readdir(versionPath,function(e,files){
        if(e) cb(e);
        cb(null,files.map(function(file){
            return file.slice(0,-4);
        }));
    });
}
function use(version,isAuto,cb){

    version = versionParse(version);
    if(!version){
        return cb(new Error('can\'t parse the version you input'));
    }
    fs.exists(getVersionPath(version),function(exists){
        if(!exists){
            if(!isAuto){
                cb(new Error('your input version is not installed , please add a option -a to install and use this version auto.'));
            }else{
                process.write('\tthe version is not installed.\n\t');
                download(version,cb);
            }
        }else{
            fs.copyFile(getVersionPath(version),config.node_path,true,function(e){
                if(e) return cb(new Error('you perhaps execute the node with the current version,please close the process and try it again.'));
                config['node_curr'] = version;
                fs.writeFile(configPath,JSON.stringify(config),function(e){
                    if(e) return cb(e);
                    cb(null)
                });

            });
        }

    })
}

function install(version,cb){

    if(version == 'latest'){
        getLatest(function(e,version){
            if(e) return cb(e);

            fs.exists(getVersionPath(version),function(exists){
                if(exists){
                    return cb(new Error('the latest version '+ version+' has been installed'));
                }else{
                    download(version,cb);
                }
            });
        });
    }else{
        version = versionParse(version);
        if(!version){
            return cb(new Error('can\'t parse the version you input'));
        }

        fs.exists(getVersionPath(version),function(exists){
            if(exists){
                return cb(new Error('the version '+ version +' has been installed.'));
            }else{
                download(version,cb);
            }
        });
    }
}

function getLatest(cb){
    request('https://nodejs.org',function(e,res,body){
        if(e) return cb(e);
        if(res.statusCode !== 200){
            return cb(new Error('the statusCode of request https://nodejs.org is ' + res.statusCode + ',please check the Internet environment'));
        }
        // get latest version from https://nodejs.org
        var matches = body.match(/Current Version:\sv([0-9\.]+)/m);
        if(matches && matches.length > 1){
            fs.exists(getVersionPath(matches[1]),function(exists){
                if(exists){
                    return cb(new Error('the version '+ matches[1] + ' has been installed.'));
                }
                cb(null,matches[1]);
            });
        }else{
            cb(new Error('can\'t find the latest version from https://nodejs.org , please check it by yourself.'));
        }

    });
}
function download(version,cb){

    var requestUrl =  'http://nodejs.org/dist/v'+version;
    var rStream,fileSize = 0,bytesAccept = 0;
    if(process.arch.toLowerCase() == 'x64'){
        requestUrl += '/x64'
    }
    requestUrl += '/node.exe';
    var progress = 0,showTagNum = 0,
        src = path.join(process.env.TEMP,version+'.exe'),
        dist = getVersionPath(version),
        interval = 0 ;

    rStream = request.get(requestUrl)
        .on('response',function(res){
            if(res.statusCode !== 200){
                return cb(new Error('the version of nodeJs ' + version + ' is not found.'));

            }
            fileSize = res['headers']['content-length'];
            rStream.pipe(fs.createWriteStream(src));
            process.stdout.write('\tdownload start\n');
            process.stdout.write('\t--------------------\n\t');
            interval = setInterval(function(){
                for(var i = showTagNum, length = Math.floor(progress/5) ; i < length;i++){
                    process.stdout.write('#');
                }
                showTagNum = Math.floor(progress/5);
            },1000);
        }).on('error',function(e){
            cb(e)
        }).on('data',function(buffer){
            bytesAccept += buffer.length;
            progress = Number(bytesAccept / fileSize * 100).toFixed(2);
        }).on('end',function(){
            clearInterval(interval);
            fs.copyFile(src,dist,true,function(e){
                if(e) return cb(e)
                cb(null);
            });
        });
}