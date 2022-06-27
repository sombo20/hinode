const axios = require("axios");
import { Manga } from "../manga";
import * as FileSystem from "expo-file-system";
import { useDispatch } from "react-redux";
import { updateDownloadCount } from "../../../redux/features/download";
import * as MediaLibrary from "expo-media-library";
export class MangaTube extends Manga{
    async connect(){
        let client = await axios.default.get(this.site);
        if(client.status == 200) return true;
        else return false;
    }

    async getReleases(){
        let client = await axios.default.post(this.site + "jsons/news/chapters.json", new URLSearchParams({
            pagina : 1
        }));

        let data = await client.data;

        let list = Object(data);
        for(const item in list){
            if(item == "releases"){
                let releaseList = list[item];
                releaseList.map((element)=> console.log(element))
            }
        }
    }

    async search(name){
        let searchList = Array();
        let client = await axios.default.get(encodeURI(this.site + `wp-json/site/search/?keyword=${name}&type=undefined&nonce=5e74532793`),{
            headers : {
                "Accept" : "application/json"
            }
        });
        let data = await Object(client.data);
        for(let x in data){
            searchList.push({
                "title" : data[x].title,
                "img" : data[x].img,
                "url" : data[x].url,
                "autor" : data[x].autor,
                "address" : x
            });
        }
        return searchList;
    }

    async getChapterList(manga, address, page, callback){
        let list = [];
        let client = await axios.default.get(encodeURI(manga + `jsons/series/chapters_list.json?page=${page}&order=asc&id_s=${address}`),{
            headers : {
                "Accept" : "application/json"
            },
            timeout : 2000
        });
        let data = await Object(client.data);
        for(const x in data){
            if(x == "chapters"){
                data[x].map((element)=>{
                    list.push(element)
                })
            }
        }
        callback(list);
    }

    download(manga, index, page){
        function nameParser(mangaToParse){
            return mangaToParse.split("/")[4];
        }
    
        function chapterParser(mangaToParse){
            return mangaToParse.split("/")[7].match(/capitulo-([0-9]{1,})/)[0].split("-")[1];
        }

        function createFolder(mangaName, chapter, callback){
            FileSystem.getInfoAsync(FileSystem.documentDirectory + `Hinode/downloads/${mangaName}/${parseInt(chapter)}`).then((result)=>{
                if(result.isDirectory){
                    callback(true);
                }
                else FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + `Hinode/downloads/${mangaName}/${parseInt(chapter)}`,{
                    intermediates : true
                }).then((result)=>{
                    callback(true);
                })
            })
            /*
            FileSystem.getInfoAsync(FileSystem.documentDirectory + `Hinode/downloads/${mangaName}`).then((exists)=>{
                if(exists.exists){
                    console.log(`Existe : Hinode/downloads/${mangaName}`)
                    FileSystem.getInfoAsync(FileSystem.documentDirectory + `Hinode/downloads/${mangaName}/${parseInt(chapter)}`).then((mangaFolderExists)=>{
                        if(mangaFolderExists.exists) { 
                            console.log(`Ja existe a pasta do manga : Hinode/downloads/${mangaName}/${parseInt(chapter)}`)
                            callback(true); 
                        }
                        else {
                            // last check : does the manga chapter folder exists?
                            FileSystem.getInfoAsync(FileSystem.documentDirectory + `Hinode/downloads/${mangaName}/${parseInt(chapter)}`).then((result)=>{
                                if(result.exists){
                                    callback(true);
                                }else{
                                    FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + `Hinode/downloads/${mangaName}/${parseInt(chapter)}`).then((result)=>{
                                        callback(true);
                                    }).catch((err)=>{
                                        callback(true)
                                    });
                                }
                            }).catch((err)=>{
                                callback(true);
                            });
                        } 
                    });
                }
                else {
                    FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + `Hinode/downloads/${mangaName}`).then((result)=>{
                        callback(true);
                    }).catch((err)=> {
                        callback(true)
                    });
                    
                    //return exists.exists ? true : false;
                }
            })*/
        }

        let name = nameParser(manga);
        let chapter = chapterParser(manga);
        let siteImageSource = "https://cdn.mangatube.site/image/";

        createFolder(name,chapter,exists => {
            if(exists){
                let downloadLink = `${siteImageSource}${name}/${parseInt(chapter)}/${page}.jpg`;
                console.log("fuc2k")
                axios.get(downloadLink).then((testLink)=>{
                    if(testLink.status == 200){
                        FileSystem.downloadAsync(downloadLink,FileSystem.documentDirectory + `Hinode/downloads/${name}/${parseInt(chapter)}/${page}.jpg`).then((result)=>{
                             //useDispatch(updateDownloadCount({
                             //    index : index
                             //}));
                            console.log("Baixou finalmente, movendo para pasta publica agora...");
                            MediaLibrary.createAssetAsync(FileSystem.documentDirectory + `Hinode/downloads/${name}/${parseInt(chapter)}/${page}.jpg`).then((asset)=>{
                            MediaLibrary.getAlbumAsync("Hinode").then((album)=>{
                                if(album ===  null){
                                    console.log("Hinode folder exists");
                                    MediaLibrary.createAlbumAsync(`Hinode/downloads/${name}/${parseInt(chapter)}`,asset,false).then((created)=>{
                                        if(created){
                                            console.log("Album created");
                                        }else{
                                            console.log("Error creating folder");
                                        }
                                    }).catch((err)=> console.log)
                                }
                            });
                            });
                        }).catch((err)=> console.log(err))
                        // FileSystem.downloadAsync(downloadLink,
                        //     FileSystem.documentDirectory + `Hinode/downloads/${name}/${parseInt(chapter)}/${page}.jpg`
                        // ).then(data=>{
                        //     useDispatch(updateDownloadCount({
                        //         index : index
                        //     }))
                        //     console.log("Baixado");
                        // }).catch((err)=> console.log);
                    }else{
                        console.log("Link não resultou...");
                    }
               }).catch((err)=> console.log)
            }else{
                console.log("fuckkk")
            }
        });

    }
}