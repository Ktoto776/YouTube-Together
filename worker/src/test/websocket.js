const WebSocket = require('ws');

const roomname = "idk"
const thisWSVerion = "1";

// >UserJoined - пользователь зашел
// >UserdataChanged - пользователь изменил данные
// >UserLeft - Пользователь вышел
// >AuthEnded - Успешный вход
// >UnvaliableKey - +newData с новым ключём(Auth, не нужно заного посылать)

// <Auth - Смена данных/При входе
// <kick - targetID - id пользователя кого кикнуть + reason - причина

// ><ChangeVideo

// kicker - кикает раз через 10 сек
const type = ""
const datas = [
    [26,"c74634a34eac3367"],
    [27,"d8a5cc1981407c19"]
]

function wsConnect(i){
    const ws = new WebSocket('ws://localhost:8787/'+roomname)
    const udata = datas[i];
    const id = udata[0];
    const key = udata[1];

    let running = true;
    let count = 0;
    function getAuthData(){
        return {
            type:"Auth",
            id:id,
            key:key,
            name:"tester_"+i+"-"+count,
            version:thisWSVerion,
        }
    }

    ws.on('open', () => {
        console.log('Connected');
        ws.send(JSON.stringify(getAuthData()));
    });
    function counter(){
        setTimeout(()=>{
            if (running){
                count = count+1;
                ws.send(JSON.stringify(getAuthData()));
                counter();
            }
        },5000)
    }
    counter();
    let ownerID = 0;
    ws.on('message', (data) => {
        console.log('Received:', data.toString());
        const json = JSON.parse(data);
        if (json.type==="AuthEnded"){
            ownerID=json.ownerID;
        }else if(json.type==="UserLeft"){
            ownerID=json.newOwner;
        }else{
            if (json.type=="UserJoined"&&type==="kicker"){
                setTimeout(()=>{
                    ws.send(JSON.stringify({
                        type:"kick",
                        targetID:json.id,
                        reason:"bye-bye "+json.name
                    }))
                },10000)
            }
        }
    });

    ws.on("close",(code)=>{
        running=false;
        if (code===1003){
            wsConnect(i+1);
        }else{
            console.log('Close:', code.toString());
        }
    })
}
wsConnect(0);