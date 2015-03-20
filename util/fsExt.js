/**
 * Created by Administrator on 15-3-12.
 */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

// extend fs module's api
module.exports = {
    deleteFolder:deleteFolder,
    copyFile:copyFile,
    copyFolder:copyFolder
}
function _deepCreateFolder(folder,cb){
    var pathArr = path.normalize(folder).split(/\\/);
    var pathCurr;
    var handle = function(index){
        if(pathCurr) pathCurr = path.join(pathCurr,pathArr[index]);
        else pathCurr = pathArr[index];
        fs.exists(pathCurr,function(exists){
            if(exists){
                fs.stat(pathCurr,function(e,stat){
                    if(e) return cb(e);
                    if(stat.isDirectory() && index !== pathArr.length - 1){
                        handle(index + 1);
                    }else if(stat.isDirectory() && index == pathArr.length - 1){
                        cb(null);
                    }else{
                        return cb(new Error('the path name you gived' + file + ' is conflicted with your file.'));
                    }
                });
            }else{
                fs.mkdir(pathCurr,function(e){
                    if(e) return cb(e);
                    if(index == pathArr.length - 1){
                        cb(null);
                    }else{
                        handle(index + 1);
                    }
                })
            }

        })

    }
    handle(0);
}
function _deepCreateFile(file,cb){
    file = path.normalize(file);
    var folderName = path.dirname(file);
    fs.exists(folderName,function(exists){
         if(exists){
             fs.writeFile(file,'',{encoding:'binary',flag:'w+'},function(e){
                 if(e) return cb(e);
                 cb(null);
             });
         }else{
             _deepCreateFolder(folderName,function(e){
                if(e) return cb(e);
                 fs.writeFile(file,'',{encoding:'binary',flag:'w+'},function(e){
                     if(e) return cb(e);
                     cb(null);
                 });
             });
         }
    });
}

function copyFile(src,dist,isOverWrite,cb){
    if(arguments.length == 3){
        cb = isOverWrite;
        isOverWrite = false;
    }
    var validate = function(cb){
        fs.exists(src,function(exists){
            if(!exists) return cb(new Error('this file '+ src+' is not exists.'));

            fs.stat(src,function(e,stat){
                if(e) return cb(e);
                if(stat.isDirectory()){
                    return cb(new Error('this file '+ src +' is not a file.'));
                }
                fs.exists(dist,function(existsDist){
                    if(existsDist){
                        fs.stat(dist,function(e,statDist){
                            if(e) return cb(e);
                            if(statDist.isDirectory()){
                                fs.exists(path.join(dist,path.basename(src)),function(exists){
                                    if(exists && !isOverWrite){
                                        return cb(new Error('this folder'+ dist +' has the same file named' + fileName));
                                    }
                                    dist = path.join(dist,path.basename(src));
                                    cb(null);
                                });


                            }else{
                                if(statDist.size && !isOverWrite){
                                    var md5Src,md5Dist;
                                    var callback = function(){
                                        if(md5Src && md5Dist){
                                            if(md5Src == md5Dist){
                                                return cb(null,true);
                                            }
                                            cb(new Error('the file '+ dist + ' is different from your source file.'));

                                        }
                                    }
                                    fs.readFile(dist,function(e,buffer){
                                        if(e) return cb(e);
                                        var md5 = crypto.createHash('md5');
                                        md5Src = md5.update(buffer,'binary').digest('hex');
                                        callback();
                                    });
                                    fs.readFile(src,function(e,buffer){
                                        if(e) return cb(e);
                                        var md5 = crypto.createHash('md5');
                                        md5Dist = md5.update(buffer,'binary').digest('hex');
                                        callback();
                                    });
                                }else{
                                    cb(null);
                                }

                            }

                        })
                    }else{
                        dist = path.normalize(dist);
                        if(dist[dist.length-1] == path.sep){
                            dist = path.join(dist,path.basename(src));
                        }
                        _deepCreateFile(dist,function(e){
                            if(e) return cb(e);
                            cb(null);
                        });
                    }
                })
            });

        });
    }
    var copy = function(cb){
        fs.readFile(src,{encoding:'binary'},function(e,data){
            if(e) return cb(e);
            fs.writeFile(dist,data,{encoding:'binary',flag:'w+'},function(e){
                if(e) return cb(e);
                cb(null);
            });
        })
    }
    validate(function(e,isNeedNoCopy){
        if(isNeedNoCopy == undefined) isNeedNoCopy = false;
        if(e) return cb(e);
        if(isNeedNoCopy) return cb(null);
        copy(cb);
    });
}

function copyFolder(src,dist,cb){
    var validate = function(src,dist,cb){
        fs.exists(src,function(exists){
            if(!exists) return cb(new Error('the folder'+ src + ' is not exists.'));
            fs.stat(src,function(e,statSrc){
                if(e) return cb(e);
                if(!statSrc.isDirectory()){
                    return cb(new Error('the path '+ src + 'is a file'));
                }
                fs.exists(dist,function(exists){
                    if(!exists){
                        return _deepCreateFolder(dist,function(e){
                            if(e) return cb(e);
                            cb(null);
                        });
                    }

                    fs.stat(dist,function(e,statDist){
                        if(e) return cb(e);
                        if(!statDist.isDirectory()){
                            return cb(new Error('the path '+ src + 'is a file'));
                        }
                        cb(null);

                    })
                });

            })
        })
    }

    var copy = function(src,dist,cb){
        fs.readdir(src,function(e,files){
            if(e) return cb(e);
            if(!files.length) return cb(null);
            var fileNum = 0,folderNum = 0;
            for(var i = 0, length = files.length; i < length; i++){
                (function(index){
                    var item = files[index];
                    var tmpPath = path.join(src,item);
                    fs.stat( tmpPath,function(e,stat){
                        if(e) return cb(e);
                        if(stat.isDirectory()){
                            var pathDist = path.join(dist,item);
                            fs.exists(pathDist,function(exists){
                                var callBack = function(cb){
                                    copy(tmpPath,pathDist,
                                        function(e){
                                        if(e) return cb(e);
                                        folderNum++;
                                        if(folderNum + fileNum == files.length){
                                            cb(null);
                                        }
                                    });
                                }
                                if(!exists){
                                    fs.mkdir(pathDist,function(e){
                                        if(e) return cb(e);
                                         callBack(cb);
                                    });
                                }else{
                                    fs.stat(pathDist,function(e,statDist){
                                        if(e) return cb(e);
                                        if(statDist.isFile()){
                                            return cb(new Error('the path ' + pathList + ' is not a folder.'));
                                        }
                                        callBack(cb);
                                    });

                                }
                            });

                        }else{
                            copyFile(tmpPath,dist,true,function(e){
                                if(e) return cb(e);
                                fileNum++;
                                if(folderNum + fileNum == files.length){
                                    cb(null);
                                }

                            });
                        }
                    });
                })(i)
            }
        });
    }
    validate(src,dist,function(e){
        if(e) return cb(e);
        copy(src,dist,cb);
    });
}
function deleteFolder(folder,cb){
    var validate = function(dist,cb){
        fs.exists(dist,function(exists){
            if(!exists) return cb(null,true);
            fs.stat(dist,function(e,stat){
                if(e) return cb(e);
                if(stat.isFile()){
                    return cb(new Error('the path '+ path + ' is not a folder.'));
                }
                cb(null);
            })
        });
    }
    var deletePath = function(dist,cb){
        fs.readdir(dist,function(e,files){
            if(e) return cb(e);
            if(!files.length) return cb(null);
            var fileNum = 0,folderNum = 0;

            for(var i = 0, length = files.length; i < length; i++){
                (function(index){
                    var item = files[index];
                    var tmpPath = path.join(dist,item);

                    fs.stat( tmpPath,function(e,stat){
                        if(e) return cb(e);
                        if(stat.isDirectory()){
                            fs.readdir(tmpPath,function(e,tmpFiles){
                                if(e) return cb(e);
                                if(tmpFiles.length){
                                    deletePath(tmpPath,function(e){
                                        if(e) return cb(e);
                                        fs.rmdir(tmpPath,function(e){
                                            if(e) return cb(e);
                                            folderNum++;
                                            if(folderNum + fileNum == files.length){
                                                cb(null);
                                            }
                                        });
                                    });
                                }else{
                                    fs.rmdir(tmpPath,function(e){
                                        if(e) return cb(e);
                                        folderNum++;
                                        if(folderNum + fileNum == files.length){
                                            cb(null);
                                        }
                                    });
                                }
                            });
                        }else{
                            fs.unlink(tmpPath,function(e){
                                if(e) return cb(e);
                                fileNum++;
                                if(folderNum + fileNum == files.length){
                                    cb(null);
                                }
                            });
                        }
                    });
                })(i)
            }
        })
    }
    validate(folder,function(e,isNotNeedDelete){
        if(e) return cb(e);
        if(isNotNeedDelete) return cb(null);
        deletePath(folder,function(e){
            if(e) return cb(e);
            fs.exists(folder,function(exists){
                if(exists){
                    fs.rmdir(folder,function(e){
                        if(e) return cb(e);
                        cb(null);
                    })
                }else{
                    cb(null);
                }
            })
        });
    });

}

